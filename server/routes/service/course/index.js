const pyRequest = require('../../utils/pyRequest');
const { findInModel, findOneInModel } = require('../../../database/model-operations');

async function getKnowledgeDemands(learningHistory, courseName, isNormalized = true) {
    function normalization(knowledgeDemands) {
        let maxKnowledgeDemands = Math.max.apply(Math, Object.values(knowledgeDemands));
        if (maxKnowledgeDemands <= 0) {
            maxKnowledgeDemands = 1;
        }

        for (let key in knowledgeDemands) {
            if (knowledgeDemands.hasOwnProperty(key)) {
                knowledgeDemands[key] /= maxKnowledgeDemands;
            }
        }
        return knowledgeDemands;
    }

    try {
        const knowledgeDemands = await pyRequest('/knowledge-demands', {
            body: {
                learningHistory,
                course: courseName,
            }
        }, 'POST');

        return isNormalized ? normalization(knowledgeDemands) : knowledgeDemands;
    }
    catch (error) {
        console.warn(error);
        return {};
    }
}

async function _getLearningActivities(userId, courseId) {
    const docs = await findInModel('tUserActivity', {
        userId,
        'activity.action': 'answer-question',
    });
    return docs.map(doc => doc.activity).filter(activity => activity.courseId === courseId);
}

async function getLearningHistory(userId, course) {
    const activities = await _getLearningActivities(userId, course.id);
    const learningHistory = activities.map(activity => ({
        name: course.data.filter(knowledge => knowledge._id === activity.knowledgeId)[0].title,
        correct: activity.correct,
    }));
    
    return learningHistory;
}

module.exports = {
    getKnowledgeDemands,
    getLearningHistory,
};