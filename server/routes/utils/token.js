const config = require('config');
const jwt = require('jsonwebtoken');
const superSecret = config.get('secret');

const token = {
    createToken:function (param) {
        return jwt.sign({param: param}, superSecret,{
            expiresIn : 60*60*24
        });
    },
    checkToken:function (req,res,next) {
        const token = req.headers['authorization'];
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
    }
};

module.exports = token;