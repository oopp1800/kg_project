const graphOperations = require('../../database/graph-operations');
const { findOneInModel } = require('../../database/model-operations');
const { getUserInfoFromReq } = require('../utils/token');

/**
 * 根据 _id 将 learningProcess 合并进 knowledges 中
 *
 * @param learningProcess [{ userId, knowledgeId, learningProcess }, ...]
 * @param knowledges [knowledge]
 */
const _mergeLearningProcessToKnowledges = function (learningProcesses, knowledges) {
    if (!knowledges || knowledges.length < 1) return knowledges;
    knowledges.forEach( knowledge => knowledge.learningProcess = 0);

    //TODO: 时间复杂度较高，可使用 Map 降低复杂度
    learningProcesses.forEach( lp => {
        knowledges.filter( knowledge => knowledge._id === lp.knowledgeId)
            .forEach( knowledge => knowledge.learningProcess = lp.learningProcess);
    });
    return knowledges;
};
const recalculateSimilarityWithLearningProcess = knowledge => {
    const Gauss = (u, sig, x) => Math.exp(-Math.pow(x-u, 2)/(2*sig*sig));
    const lp2Multi = x => Gauss(0.5, 0.5, x);

    let learningProcess = knowledge.learningProcess > 1? knowledge.learningProcess / 100: knowledge.learningProcess;
    let multi = lp2Multi(knowledge.learningProcess);
    return knowledge.similarity *= multi;
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
const parseForReturn = (pyRes, learningProcesses) => {
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
        id: other.id,
        title: other.data.title,
        thumbnailUrl: other.data.thumbnailUrl,
        // 还可以添加其它信息
    });

    let result = [];
    let lessonIds = [];
    if (!pyRes) return result;
    console.log(JSON.stringify(pyRes));

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
            console.log('before: ', learningProcesses, contents);
            contents = _mergeLearningProcessToKnowledges(learningProcesses, contents);

            // 根据学习进度重新计算相似度
            contents.forEach(recalculateSimilarityWithLearningProcess);
            console.log('after: ',contents);
        }

        contents.forEach(other => {
            if (!other[type] || !other.lesson) return;

            result[lessonIds.indexOf(other.lesson.id)].resultsInLesson.push(
                parseOther({...other[type], similarity: other.similarity || 1, type: type})
            );
        });
    }


    return result;
};
const getLearningProcesses = async (knowledges, userId) => {
    if (!knowledges || knowledges.length < 1) return null;

    let batchGetLP = knowledges.map(knowledge =>
        findOneInModel('tLearningProcess', { userId, knowledgeId: knowledge.knowledge.id })
    );

    try {
        let learningProcesses = await Promise.all(batchGetLP);
        return learningProcesses.filter(lp => lp);
    }
    catch (error) {
        console.error(error);
        return null;
    }
};

module.exports = {
    getSearchResult: async function (req, res, next) {
        const searchInput = req.body.searchInput;
        const searchOptions = req.body.searchOptions;

        let searchResultFromGraph,
            learningProcesses,
            searchResult;

        try {
            const user = await getUserInfoFromReq(req);

            searchResultFromGraph = await graphOperations.search({
                searchInput,
                searchOptions,
            });
            if ( searchResultFromGraph.knowledge && searchResultFromGraph.knowledge.length > 0) {
                learningProcesses = await getLearningProcesses(searchResultFromGraph.knowledge, user.id);
            }
            searchResult = parseForReturn(searchResultFromGraph, learningProcesses);

            return res.json({
                status: 'success',
                data: {
                    searchResult,
                    searchInput,
                }
            })
        }
        catch (error) {
            return console.error(error);
        }
    }
};


