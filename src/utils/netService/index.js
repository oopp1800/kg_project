import request from './request';

const _getResourse = (url = null, id = null) => {
    return request.get(url, { query: { id } });
};

const netService = {
    getResourse: _getResourse,
    getCourse: id => {
        return _getResourse('/getCourse', id);
    },
    getKnowledge: id => {
        return _getResourse('/getKnowledge', id);
    },
    getKunit: id => {
        return _getResourse('/getKunit', id);
    },
    getMcourse: id => {
        return _getResourse('/getMcourse', id);
    },
    getAcourse: id => {
        return _getResourse('/getAcourse', id);
    },
    getKnowledgeV1: (courseId, knowledgeId) => {
        return request.get(`/api/v1/courses/${courseId}/knowledge-points/${knowledgeId}`);
    },
    answerKnowledge: (courseId, knowledgeId, correct) => {
        return request.post(`/api/v1/courses/${courseId}/knowledge-points/${knowledgeId}/answer`, {
            body: {
                currentLearning: {
                    correct,
                }
            }
        });
    },
    recommendKnowledge: (courseId) => {
        return request.get(`/api/v1/courses/${courseId}/learning-path-recommendation`);
    },
};

export default netService;