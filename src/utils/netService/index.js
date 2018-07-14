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
};

export default netService;