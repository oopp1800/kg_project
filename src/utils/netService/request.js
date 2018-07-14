/**
 * @description 返回一个单例的 request 对象，默认所有返回值为 json 解析后的对象
 * @author Dai
 */
const singletonRequest = function () {

    const _getToken = () => localStorage.getItem('token');

    const _urlWithParams = (url, query) => {
        let queryArr = Object.keys(query).map(key => key + '=' + query[key]);
        return url + '?' + queryArr.join('&');
    };

    const _ajax = (url, options, method) => {
        return new Promise((resolve, reject) => {
            options = options || {};
            options.method = method || options.method || 'GET'; // 传入的 method 优先
            if (!options.headers || !options.headers['Content-Type']) {
                options.headers = Object.assign({
                    "Content-Type": "application/json",
                }, options.headers);
            }
            options.headers = Object.assign({
                "Authorization": _getToken(),
            }, options.headers);
            if (options.query && Object.keys(options.query).length !== 0) {
                url= _urlWithParams(url, options.query);
            }
            options.body = Object.prototype.toString.call(options.body) === '[object Object]'
                ? JSON.stringify(options.body): options.body;
            if (options.method === 'GET' && options.body) { reject('GET 请求无法接收 body 参数'); }

            fetch(url, options)
                .then(res => res.json())
                .then(res => {
                    if (res.status === 'success') {
                        resolve(res.data);
                    } else {
                        reject(res.message);
                        // alert("验证失败，请重新登录");
                        // this.props.history.push('/login');
                    }
                }).catch(err => reject(err));
        });
    };

    let request = {};
    request.ajax = (url, options, method) => _ajax(url, options, method);
    request.get = (url, options) => _ajax(url, options, 'GET');
    request.post = (url, options) => _ajax(url, options, 'POST');
    request.put = (url, options) => _ajax(url, options, 'PUT');
    request.delete= (url, options) => _ajax(url, options, 'DELETE');

    return request;
};

export default singletonRequest();
