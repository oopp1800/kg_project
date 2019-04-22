const { getUserInfoFromReq } = require('../../utils/token');
const { createInModel, findInModel, findOneInModel } = require('../../../database/model-operations');
const pyRequest = require('../../utils/pyRequest');
const { getKnowledgeDemands, getLearningHistory } = require('../../service/course');


async function _getLearningActivities(userId, courseId) {
    const docs = await findInModel('tUserActivity', {
        userId,
        'activity.action': 'answer-question',
    });
    return docs.map(doc => doc.activity).filter(activity => activity.courseId === courseId);
}

async function learningPathRecommendation(req, res, next) {
    const { courseId } = req.params;
    let recommendedKnowledge = null;

    try {
        const [course, user] = await Promise.all([
            findOneInModel('tProject', { _id: courseId }),
            getUserInfoFromReq(req),
        ]);

        const activities = await _getLearningActivities(user._id, courseId);
        const learningHistory = activities.map(activity => ({
            name: course.data.filter(knowledge => knowledge._id === activity.knowledgeId)[0].title,
            correct: activity.correct,
        }));

        const recommendedKnowledgeTitle = await pyRequest('/learning-path-recommendation', {
            body: {
                learningHistory,
                course: course.projectName,
            }
        }, 'POST');
        recommendedKnowledge = course.data.filter(knowledge => knowledge.title === recommendedKnowledgeTitle)[0];

        if (!recommendedKnowledge) {
            return res.status(500).json({
                status: 'error',
                message: '找不到推荐知识点！',
            })
        }
    } catch(err) {
        return res.status(500).json({
            status: 'error',
            message: err,
        })
    }


    return res.json({
        status: 'success',
        data: {
            recommendedKnowledge,
        }
    });
}

async function getKnowledgeDemandsRouter(req, res, next) {
    const { courseId } = req.params;
    let knowledgeDemands = null;

    try {
        const [course, user] = await Promise.all([
            findOneInModel('tProject', { _id: courseId }),
            getUserInfoFromReq(req),
        ]);

        const learningHistory = await getLearningHistory(user._id, course);
        knowledgeDemands = await getKnowledgeDemands(learningHistory, course.projectName);
    } catch(err) {
        return res.status(500).json({
            status: 'error',
            message: err,
        })
    }


    return res.json({
        status: 'success',
        data: {
            knowledgeDemands,
        }
    });
}

module.exports = {
    learningPathRecommendation,
    getKnowledgeDemandsRouter,
};