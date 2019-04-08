const config = require('config');
const jwt = require('jsonwebtoken');
const superSecret = config.get('secret');
const { findOneInModel } = require('../../database/model-operations');

const _getUserInfoByUsername = async function (username) {
    try {
        return await findOneInModel('tUser', {name: username});
    }
    catch (err) {
        console.log(err);
    }
};
const token = {
    createToken:function (param) {
        return jwt.sign({param: param}, superSecret,{
            expiresIn : 60*60*24
        });
    },
    checkToken:function (req,res,next) {
        const token = req.headers['authorization'] && req.headers['authorization'].split(' ').pop();

        if (token) {
            jwt.verify(token,superSecret,function (err, decoded) {
                if(err){
                    res.json({
                        success: false,
                        message: 'token信息错误.'
                    });
                }else{
                    req.api_user = decoded;
                    next();
                }
            });
        }else{
            return res.status(403).send({
                success: false,
                message: '没有提供token！'
            });
        }


    },
    getUsernameFromReq: function (req) {
        return req.api_user.param;
    },
    getUserInfoFromReq: function (req) {
        const username = token.getUsernameFromReq(req);
        return _getUserInfoByUsername(username);
    }
};

module.exports = token;