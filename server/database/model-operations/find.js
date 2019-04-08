const { getModel } = require('../dbhandle');

const operations = {
    findInModel: (modelname, ...options) => {
        const model = getModel(modelname);

        return new Promise((resolve, reject) => {
            model.find.apply(model, options)
                .exec(function(err, docs) {
                if (err) return reject(err);
                // if (!docs) return reject('查询 ' + modelname + ' 无返回结果');

                resolve(docs);
            })
        });
    },
    findOneInModel: (modelname, ...options) => {
        const model = getModel(modelname);

        return new Promise((resolve, reject) => {
            model.findOne.apply(model, options)
                .exec(function(err, docs) {
                    if (err) return reject(err);
                    // if (!docs) return reject('查询 ' + modelname + ' 无返回结果');

                    resolve(docs);
                })
        });
    },
};

module.exports = operations;
