/**
 * 所有与图数据库通信的方法
 * 以 Promise 形式返回
 */

const request = require('request');
const config = require('config');

const NO_GRAPH_SERVER = config.get('debug') && config.get('debugConfig').noGraphServer;
const GRAPH_SERVER_HOST = config.get('graphServer');
const REQUEST_URL = {
    'publish': GRAPH_SERVER_HOST + '/publishLesson',
    'unPublish': GRAPH_SERVER_HOST + '/unPublishLesson',
    'search': GRAPH_SERVER_HOST + '/search',
    'getKnowledge': GRAPH_SERVER_HOST + '/getKnowledge',
};

const _request = async (data, type) => {
    let option = {
        method: "POST",
        url: REQUEST_URL[type],
        json: true,
        body: data,
        header: {
            'Content-Type': "application/json"
        }
    };

    if (NO_GRAPH_SERVER) { return null; }

    return new Promise((resolve, reject) => {
        request(option, function (err, res) {
            if (err) return console.log(err);

            if (res.body.status === 'success') {
                return resolve(res.body.result);
            }
            else {
                return reject('py服务器未返回 success, res.body: ', res.body);
            }
        });
    });
};

module.exports = {
    getKnowledge: id => {
        try {
            return _request({ id }, 'getKnowledge');
        }
        catch (err) {
            throw new Error(err);
        }
    },
};
