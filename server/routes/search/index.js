const graphOperations = require('../../database/graph-operations');
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

        searchResultFromGraph = await graphOperations.search({
            searchInput,
            searchOptions,
            searchDict: customDict,
        });

        if (Array.isArray(searchResultFromGraph.knowledge)) {
            const relativeCourseIds = [...new Set(searchResultFromGraph.knowledge.map(k => k.lesson.id))];
            const relativeCourses = relativeCourseIds.map(courseId => allCourses.filter(course => course._id === courseId)[0]);

            /*
             * knowledgeDemandsArrayInCourses: [{knowledgeName: demand, ...}, ...]
             * knowledgeDemands: { courseId: { knowledgeId: demand, ... }, ... }
             */
            const knowledgeDemandsArrayInCourses = await Promise.all(
                relativeCourses.map(
                    async course => {
                        const learningHistory = await getLearningHistory(user._id, course);
                        return getKnowledgeDemands(learningHistory, course.projectName)
                    }
                )
            );
            let knowledgeDemands = {};
            knowledgeDemandsArrayInCourses.forEach((kds, index) => {
                const courseId = relativeCourseIds[index];
                const course = relativeCourses[index];

                knowledgeDemands[courseId] = {};
                for (let [knowledgeName, demand] of Object.entries(kds)) {
                    const knowledgeId = course.data.filter(knowledge => knowledge.title === knowledgeName)[0]._id;

                    knowledgeDemands[courseId][knowledgeId] = demand;
                }
            });

            searchResult = combineKnowledgeDemandsToSearchResult(searchResultFromGraph, knowledgeDemands);
        }

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


