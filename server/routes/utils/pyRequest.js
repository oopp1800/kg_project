const request = require('request');
const config = require('config');

const NO_GRAPH_SERVER = config.get('debug') && config.get('debugConfig').noGraphServer;
const PY_HOST = config.get('graphServer');


const _urlWithParams = (url, query) => {
    let queryArr = Object.keys(query).map(key => key + '=' + query[key]);
    return url + '?' + queryArr.join('&');
};
const pyRequest = function (url, options, method) {
    if (NO_GRAPH_SERVER) return Promise.reject('No pyServer! Check the config.');

    options = options || {};
    options.method = method || options.method || 'GET'; // 传入的 method 优先
    if (!options.headers || !options.headers['Content-Type']) {
        options.headers = Object.assign({
            "Content-Type": "application/json",
            "charset": "utf-8",
        }, options.headers);
    }
    url = PY_HOST + url;
    if (options.query && Object.keys(options.query).length !== 0) {
        url= _urlWithParams(url, options.query);
    }
    options.body = Object.prototype.toString.call(options.body) === '[object Object]'
        ? JSON.stringify(options.body): options.body;
    if (options.method === 'GET' && options.body) { reject('GET 请求无法接收 body 参数'); }


    return new Promise((resolve, reject) => {
        request(url, options, function (err, res) {
            if (err) { return reject(err); }

            let body = {};
            try {
                body = JSON.parse(res.body);
            }
            catch(err) {
                return reject(err);
            }

            if (body.status === 'success') {
                return resolve(body.result);
            }

            return reject(body.result)
        });
    });
};

module.exports = {
    pyRequest
};