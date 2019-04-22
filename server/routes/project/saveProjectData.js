module.exports = function (req, res, next) {
    const tokenKey = req.api_user;
    const username = req.body.username;
    const projectData = req.body.projectData;
    const projectId = projectData._id;
    if (tokenKey.param !== username) {
        return res.json({
            status: false,
            message: "验证失败"
        });
        res.end();
    }

    const tProject = global.dbHandel.getModel('tProject');
    tProject.findOne({_id: projectId}, function (err, doc) {
        if (err) {
            tProject.create(projectData, function (err, newDoc) {
                if(err){
                    return res.json({
                        status: 'false',
                        message: '工程数据保存失败'
                    })
                }
                res.json({
                    status: 'success',
                    data: {}
                });
            });
        }
        let updateData = projectData;
        updateData['updateDate'] = new Date().toLocaleString();
        tProject.findOneAndUpdate({_id:updateData._id}, updateData, function (err, newDoc) {
            if(err){
                return res.json({
                    status: 'false',
                    message: '工程数据保存失败'
                })
            }

            res.json({
                status: 'success',
                data: {}
            });
        });
    })
};