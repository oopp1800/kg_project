const { createInModel, findInModel, findOneInModel } = require('../../../database/model-operations');
const { pyRequest } = require('../../utils/pyRequest');
const { getUserInfoFromReq } = require('../../utils/token');

async function get(req, res, next) {
    const { courseId, knowledgeId } = req.params;
    if (!courseId || !knowledgeId) {
        return res.sendStatus(400);
    }

    try {
        const NecessaryInfo = [getUserInfoFromReq(req), findOneInModel('tProject', {_id: courseId})];
        const [user, course] = await Promise.all(NecessaryInfo);
        if (course.publishStatus !== 'publish' && course.userId !== user._id) {
            return res.sendStatus(401);
        }

        if (!Array.isArray(course.data)) return res.sendStatus(500);
        let knowledgePoint = course.data.filter(k => k._id === knowledgeId)[0];
        knowledgePoint.course = {
            _id: course._id,
            title: course.projectName,
        };

        return res.json({
            status: 'success',
            data: knowledgePoint,
        });
    } catch (error) {
        res.sendStatus(500).send({message: error});
    }
}

async function _getLearningActivities(userId, courseId) {
    const docs = await findInModel('tUserActivity', {
        userId,
        'activity.action': 'answer-question',
    });
    return docs.map(doc => doc.activity).filter(activity => activity.courseId === courseId);
}

async function _insertLearningActivity(userId, courseId, knowledgeId, correct) {
    return createInModel('tUserActivity', {
        userId,
        activity: {
            action: 'answer-question',
            courseId,
            knowledgeId,
            correct,
        },
    });
}

async function answer(req, res, next) {
    const { courseId, knowledgeId } = req.params;
    let recommendedKnowledge = null;

    try {
        const { correct } = req.body.currentLearning;
        const [course, user] = await Promise.all([
            findOneInModel('tProject', { _id: courseId }),
            getUserInfoFromReq(req),
        ]);

        await _insertLearningActivity(user._id, courseId, knowledgeId, correct);
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

module.exports = {
    get,
    answer,
};