const graphOperations = require('../../database/graph-operations');
const pyRequest = require('../utils/pyRequest');
const { findInModel, findOneInModel } = require('../../database/model-operations');
const { getUserInfoFromReq } = require('../utils/token');
const { getLearningHistory, getKnowledgeDemands } = require('../service/course');
const config = require('config');
const mongoose = require('mongoose');

/**
 * 根据 _id 将 knowledgeDemands 合并进 knowledges 中
 *
 * @param knowledgeDemands { knowledgeName: demand, ...}
 * @param knowledges [knowledge]
 */
const _mergeKnowledgeDemandsToKnowledges = function (knowledgeDemands, knowledges) {
    if (!Array.isArray(knowledges)) return knowledges;

    knowledges.forEach(knowledge => knowledge.knowledgeDemand = knowledgeDemands[knowledge.lesson.id][knowledge.knowledge.id]);
    return knowledges;
};
const calculateRecommendedDegree = knowledge => {
    knowledge.recommendedDegree = knowledge.similarity * (knowledge.knowledgeDemand || 1);
};
/**
 * 从 python 服务器返回的图数据转换为前端需要的返回数据
 * @param {Object} pyRes: {
 *      lesson: [
 *
 *      ] || undefined,
 *      knowledge: [
 *
 *      ] || undefined,
 *      mcourse: [
 *
 *      ] || undefined,
 *      acourse: [
 *
 *      ] || undefined,
 *  }
 *
 * @return {Array} [{
 *      lessonName: {String},
 *      lessonId: {ObjectId},
 *      teacherName: {Array[String]},
 *      thumbnailUrl: {String},
 *      resultsInLesson: [{
 *          type: {String},
 *          similarity: {Number} 0-1之间,
 *          id: {ObjectId},
 *          title: {String},
 *          thumbnailUrl: {String},
 *       }, ...],
 *   }, ...],
 */
const combineKnowledgeDemandsToSearchResult = (pyRes, knowledgeDemands) => {
    const parseLesson = lesson => ({
        lessonId: lesson.id || null,
        lessonName: lesson.data.title || null,
        lessonDescription: lesson.data.description || null,
        teacherName: lesson.teacher_name || null,
        thumbnailUrl: lesson.data.thumbnailUrl || null,
        resultsInLesson: [],
    });
    const parseOther = other => ({
        type: other.type,
        similarity: other.similarity,
        knowledgeDemand: other.knowledgeDemand,
        recommendedDegree: other.recommendedDegree,
        id: other.id,
        title: other.data.title,
        thumbnailUrl: other.data.thumbnailUrl,
        // 还可以添加其它信息
    });

    let result = [];
    let lessonIds = [];
    if (!pyRes) return result;

    // get all lesson
    for (let type in pyRes) {
        let contents = pyRes[type];

        if (type === 'lesson') {
            contents.forEach(lesson => {
                if (!lesson.lesson || !lesson.lesson.data || lessonIds.indexOf(lesson.lesson.id) !== -1) return;

                lessonIds.push(lesson.lesson.id);
                result.push(parseLesson(lesson.lesson));
            });
        }
        else {
            contents.forEach(other => {
                if (!other.lesson || !other.lesson.data || lessonIds.indexOf(other.lesson.id) !== -1) return;

                lessonIds.push(other.lesson.id);
                result.push(parseLesson(other.lesson));
            })
        }
    }

    if (result.length <= 0) return result;

    // add resultsInLesson
    // 把所有其它本体放到对应课程下
    for (let type in pyRes) {
        if (type === 'lesson') continue;

        let contents = pyRes[type];

        if (type === 'knowledge') {
            contents = _mergeKnowledgeDemandsToKnowledges(knowledgeDemands, contents);

            contents.forEach(calculateRecommendedDegree);
        }

        contents.forEach(other => {
            if (!other[type] || !other.lesson) return;

            result[lessonIds.indexOf(other.lesson.id)].resultsInLesson.push(
                parseOther({
                    ...other[type],
                    recommendedDegree: other.recommendedDegree || 0,
                    knowledgeDemand: other.knowledgeDemand || 0,
                    similarity: other.similarity || 0,
                    type: type})
            );
        });
    }

    result.forEach(oneLessonResult => {
        const recommendedDegrees = oneLessonResult.resultsInLesson.filter(resource => resource.type === "knowledge")
            .map(resource => resource.recommendedDegree).sort((a, b) => b - a);
        const AVERAGE_THRESHOLD = config.get('search').courseRecommendationDegreeDependOnKnowledgeNumber;
        const actualNum = Math.min(recommendedDegrees.length, AVERAGE_THRESHOLD);
        const sumDegree = recommendedDegrees.slice(0, actualNum).reduce((prev, curr) => prev + curr, 0);
        
        oneLessonResult.recommendedDegree = sumDegree / actualNum;
    });

    result.sort((courseA, courseB) => courseB.recommendedDegree - courseA.recommendedDegree);

    return result;
};

function _aggregateByLesson(searchResult, lessons, knowledgeDemands, knowledgeResourceMap) {
    function _parseKnowledge(knowledge, {knowledgeDemand}) {
        let similarity, recommendedDegree;

        similarity = knowledge.similarity || 1;
        recommendedDegree = similarity * (knowledgeDemand || 1);

        return {
            type: 'knowledge',
            id: knowledge.id,
            title: knowledge.title,
            thumbnailUrl: knowledge.thumbnailUrl,
            similarity,
            knowledgeDemand,
            recommendedDegree,
        }
    }

    function _parseResource(resource, resourceType, {lessonId, knowledgeResourceMap, parsedKnowledges}) {
        function _findRelativeKnowledgeId() {
            for (let [knowledgeId, resources] of Object.entries(knowledgeResourceMap[lessonId])) {
                if (resources[resourceType] && resources[resourceType].indexOf(resource.id) > -1) {
                    return knowledgeId;
                }
            }
            return null;
        }

        let similarity, recommendedDegree, knowledgeDemand;

        const relativeKnowledgeId = _findRelativeKnowledgeId();
        const relativeKnowledges = parsedKnowledges.filter(knowledge => knowledge.id === relativeKnowledgeId);
        if (relativeKnowledges.length >= 1) {
            const relativeKnowledge = relativeKnowledges[0];

            knowledgeDemand = relativeKnowledge.knowledgeDemand;
            similarity = relativeKnowledge.similarity;
            recommendedDegree = relativeKnowledge.recommendedDegree;
        }

        return {
            type: resourceType.slice(0, -1),
            id: resource.id,
            title: resource.title,
            thumbnailUrl: resource.thumbnailUrl,
            similarity,
            knowledgeDemand,
            recommendedDegree,
        }
    }

    /**
     * searchResultIndexById: {acourses: {id1: acourse, id2: acourse, ...}, ...}
     */
    const searchResultIndexById = {};
    for (let [type, resources] of Object.entries(searchResult)) {
        searchResultIndexById[type] = {};
        resources.forEach(r => searchResultIndexById[type][r.id] = r);
    }

    return lessons.map(lesson => {
        let resourcesResultInThisLesson = [];

        const knowledgeIds = lesson.relatedSearchResources['knowledges'];
        resourcesResultInThisLesson = resourcesResultInThisLesson.concat(knowledgeIds.map(id =>
            _parseKnowledge(searchResultIndexById['knowledges'][id], {
                knowledgeDemand: knowledgeDemands[lesson.id][id],
            })
        ));

        // 将每个 lesson 中的 relatedSearchResources 部分的 id 转换为实际资源信息
        for (let type of Object.keys(lesson.relatedSearchResources)) {
            if (type === 'knowledges') continue;

            const resource_ids = lesson.relatedSearchResources[type];

            resourcesResultInThisLesson = resourcesResultInThisLesson.concat(resource_ids.map(id =>
                _parseResource(searchResultIndexById[type][id], type, {
                    lessonId: lesson.id,
                    knowledgeResourceMap: knowledgeResourceMap,
                    parsedKnowledges: resourcesResultInThisLesson,
                })
            ));
        }

        return {
            lessonId: lesson.id,
            lessonName: lesson.title,
            lessonDescription: lesson.description,
            publishStatus: lesson.publishStatus,
            thumbnailUrl: lesson.thumbnailUrl,
            resultsInLesson: resourcesResultInThisLesson,
        };
    });
}

function _generateKnowledgeResourceMap(lessons) {
    let knowledgeResourceMap = {};

    for (let lesson of lessons) {
        let mapOfOneLesson = {};

        for (let knowledge of lesson.data) {
            mapOfOneLesson[knowledge._id] = {
                kunits: [knowledge.teachUnit._id] || [],
                acourses: [knowledge.teachUnit.aCourseUnit.map(ac => ac._id)],
                mcourses: [knowledge.teachUnit.mCourseUnit._id],
            };
        }
        knowledgeResourceMap[lesson._id] = mapOfOneLesson;
    }
    return knowledgeResourceMap;
}

async function getCustomDict(courses) {
    if (!courses) {
        courses = await findInModel('tProject');
    }

    const segmentationDicts = courses.map(course => course.segmentationDict).filter(_ => _);
    return [].concat(...segmentationDicts);
}

async function getSearchResult(req, res, next) {
    const searchInput = req.body.searchInput;
    const searchOptions = req.body.searchOptions;

    let searchResultFromGraph,
        searchResult;

    try {
        const [user, allCourses] = await Promise.all([
            getUserInfoFromReq(req),
            findInModel('tProject'),
        ]);
        const customDict = await getCustomDict(allCourses);

        const resultByResourceType = await graphOperations.search({
            searchInput,
            resourceTypes: searchOptions,
            searchDict: customDict,
        });

        let resultIdsByResourceType = {};
        Object.keys(resultByResourceType).forEach(resourceType => {
            resultIdsByResourceType[resourceType] = resultByResourceType[resourceType].map(r => r.id)
        });

        /**
         * lessons: 从图数据库返回的数据
         *      [{id, description, ..., relatedSearchResources: {acourses: ['xxx', ...], ...}, ...}]
         *
         * lessonsWithFullInfo: 从 MongoDB 返回的数据
         *      [{_id, projectName, ..., data: [{_id, title, ..., teachUnit: {...}}, ...]}, ...]
         */
        const lessons = await pyRequest('/lessons', { query: resultIdsByResourceType }, 'GET');
        const lessonsWithFullInfo = await findInModel('tProject', { _id: {
                $in: lessons.map(l => l.id)
            }});

        /*
         * knowledgeDemandsArrayInCourses: [{knowledgeName: demand, ...}, ...]
         * knowledgeDemands: { courseId: { knowledgeId: demand, ... }, ... }
         */
        const knowledgeDemandsArrayInCourses = await Promise.all(
            lessonsWithFullInfo.map(
                async lesson => {
                    const learningHistory = await getLearningHistory(user._id, lesson);
                    return getKnowledgeDemands(learningHistory, lesson.projectName)
                }
            )
        );
        let knowledgeDemands = {};
        knowledgeDemandsArrayInCourses.forEach((kds, index) => {
            const lesson = lessonsWithFullInfo[index];

            knowledgeDemands[lesson.id] = {};
            for (let [knowledgeName, demand] of Object.entries(kds)) {
                const knowledgeId = lesson.data.filter(knowledge => knowledge.title === knowledgeName)[0]._id;

                knowledgeDemands[lesson.id][knowledgeId] = demand;
            }
        });

        const knowledgeResourceMap = _generateKnowledgeResourceMap(lessonsWithFullInfo);

        searchResult = _aggregateByLesson(resultByResourceType, lessons, knowledgeDemands, knowledgeResourceMap);

        return res.json({
            status: 'success',
            data: {
                searchResult,
                searchInput,
            }
        })
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            message: error,
        });
    }
}

module.exports = {
    getSearchResult,
};


