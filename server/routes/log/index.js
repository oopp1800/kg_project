const token = require('../utils/token');
const { createInModel } = require('../../database/model-operations');

module.exports = {
    saveLog: async function (req, res, next) {
        if (!req.body.activity) {
            return req.json({
                status: 'error',
                message: "no activity!",
            });
        }

        try {
            let user = await token.getUserInfoFromReq(req);
            createInModel('tUserActivity', {
                userId: user.id,
                activity: req.body.activity,
            });
            res.json({
                status: 'success',
                data: null,
            });
        }
        catch (err) {
            res.json({
                status: 'error',
                message: err,
            })
        }
    },
};