const UpdateGraph = require('../utils/updateGraph');
const graphRequest = require('../../database/graph-operations');
const { getUsernameFromReq } = require('../utils/token');
const { findOneInModel } = require('../../database/model-operations');

const _getUserInfoByUsername = async function (username) {
    try {
        return await findOneInModel('tUser', {name: username});
    }
    catch (err) {
        console.log(err);
    }
};
const _getUserInfoByReq = function (req) {
    const username = getUsernameFromReq(req);
    return _getUserInfoByUsername(username);
};

const _getLearningProcess = function () {
    return [{
        _id: 'eaab6c85-40d6-410c-8802-ab347407b0dc',
        process: 80,
    }, {
        _id: 'e1119a4a-6e0f-432d-8984-1f7aedddd5e0',
        process: 0,
    }];
};

/**
 * 根据 _id 将 learningProcess 合并进 project 中
 *
 * @param learningProcess [{ _id, process }, ...]
 * @param project { ..., data: [{ _id, ... }] }
 */
const _mergeLearningProcessToProject = function (learningProcess, project) {
    project.data.forEach( knowledgeData => knowledgeData.learningProcess = 0);

    //TODO: 时间复杂度较高，可使用 Map 降低复杂度
    learningProcess.forEach( knowledgeLearningProcess => {
        project.data.filter( knowledgeData => knowledgeData._id === knowledgeLearningProcess._id)
            .forEach( knowledgeData => knowledgeData.learningProcess = knowledgeLearningProcess.process);
    });
    return project;
};

const _getRecommendation = function (project) {
    project.recommendation = {
        nodes: [{
            _id: 'eaab6c85-40d6-410c-8802-ab347407b0dc',
            recommendedDegree: 100,
        }, {
            _id: 'f5db4246-10aa-447d-8b29-94095aef195a',
            recommendedDegree: 80,
        }],
        paths: [{
            from: 'eaab6c85-40d6-410c-8802-ab347407b0dc',
            to: 'f5db4246-10aa-447d-8b29-94095aef195a',
            recommendedDegree: 85,
        }],
    };

    return project;
};

module.exports = {
    /**
     * 一共有两种返回情况：
     * 1. 错误返回 404 状态码
     * 2. 成功返回
     *   {
     *     status: 'success',
     *     data: {
     *       project: {
     *         _id, createDate, ...,
     *         data: [{ // 知识点数组
     *           hasBeRelyByNode, hasChildNode, ...,
     *           learningProcess: [0-100], //学习进度
     *         }, {...}, ...], //data
     *         recommendation: {
     *           nodes: [{
     *             _id: xxx, //知识点 id
     *             recommendedDegree: [0-100], //推荐度
     *           }, {...}, ...],
     *           paths: [{
     *             from: xxx,
     *             to: xxx,
     *             recommendedDegree: [0-100], //推荐度
     *           }, {...}, ...],
     *         }, //recommendation
     *       }, //project
     *     }, //data
     *   }
     */
    getCourse: async function (req, res, next) {
        let project = null,
            learningProcess = null,
            user = _getUserInfoByReq(req);

        try {
            project = await findOneInModel('tProject', {_id: req.query.id}, null, { lean: true });
            learningProcess = _getLearningProcess(user, project);
            project = _mergeLearningProcessToProject(learningProcess, project);
            project = _getRecommendation(project);
        }
        catch (err) {
            console.log(err);
        }

        return res.json({
            status: 'success',
            data: {
                project,
            }
        });
    },
    getKnowledge: async function(req, res, next) {
        const id = req.query.id || req.body.id;
        let knowledge = {};

        try {
            knowledge = await graphRequest.getKnowledge(id);

            return res.json({
                status: 'success',
                data: {
                    knowledge,
                }
            });
        }
        catch(err) {
            return res.json({
                status: 'error',
                message: err,
            });
        }
    },
    getKunit: async function (req, res, next) {
        const id = req.query.id || req.body.id;
        let kunit = {};

        try {
            kunit = await graphRequest.getKunit(id);

            return res.json({
                status: 'success',
                data: {
                    kunit,
                }
            });
        }
        catch(err) {
            return res.json({
                status: 'error',
                message: err,
            });
        }
    },
    getMcourse: async function (req, res, next) {
        const id = req.query.id || req.body.id;
        let mcourse = {};

        try {
            mcourse = await graphRequest.getMcourse(id);

            return res.json({
                status: 'success',
                data: {
                    mcourse,
                }
            });
        }
        catch(err) {
            return res.json({
                status: 'error',
                message: err,
            });
        }
    },
    getAcourse: async function (req, res, next) {
        const id = req.query.id || req.body.id;
        let acourse = {};

        try {
            acourse = await graphRequest.getAcourse(id);

            return res.json({
                status: 'success',
                data: {
                    acourse,
                }
            });
        }
        catch(err) {
            return res.json({
                status: 'error',
                message: err,
            });
        }
    },
    publishCourse: function (req, res, next) {
        let tProject = global.dbHandel.getModel('tProject');
        tProject.findOne({_id: req.body.projectId}, function (err, doc) {
            if (err) {
                return res.statusCode(404)
            }
            if (doc.publishStatus === 'unPublish') {
                tProject.findOneAndUpdate({_id: req.body.projectId}, {
                    publishStatus: 'publish',
                    new: true
                }, function (err, projectData) {
                    if (err) {
                        return res.statusCode(404)
                    }

                    UpdateGraph(projectData, 'publish', (e) => {
                        res.json({
                            status: 'success',
                            data: 'publish'
                        })
                    })
                })
            } else {
                tProject.findOneAndUpdate({_id: req.body.projectId}, {
                    publishStatus: 'unPublish',
                    new: true
                }, function (err, projectData) {
                    if (err) {
                        return res.statusCode(404)
                    }
                    UpdateGraph(projectData, 'unPublish', (e) => {
                        res.json({
                            status: 'success',
                            data: 'unPublish'
                        })
                    })
                })
            }
        })
    },
    getAllCourses:function (req, res, next) {
        let tProject = global.dbHandel.getModel('tProject');
        tProject.find({publishStatus:'publish'}, function (err, doc) {
            if (err) {
                return res.statusCode(404)
            }
            doc.map((item)=>item.data = []);
            res.json({
                status: 'success',
                data: doc
            })
        })
    }
};

    
