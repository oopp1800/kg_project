const request = require('request');
const config = require('config');

const NO_GRAPH_SERVER = config.get('debug') && config.get('debugConfig').noGraphServer;
const REQUEST_URL = {
    'publish': config.get('graphServer') + '/publishLesson',
    'unPublish': config.get('graphServer') + '/unPublishLesson',
    'search': config.get('graphServer') + '/search',
};

const UpdateGraph = function (data, type, callback) {
    let option = {
        method: "POST",
        url: REQUEST_URL[type],
        json: true,
        body: data,
        header: {
            'Content-Type': "application/json"
        }
    };

    if (NO_GRAPH_SERVER) {
        callback && callback();
    }
    else {
        request(option, function (err, res) {
            if (err) {
                return console.log(err);
            }
            if (res.body.status === 'success') {
                return callback && callback(res.body.result);
            }

            return callback && callback();
        });
    }

};
module.exports = UpdateGraph;