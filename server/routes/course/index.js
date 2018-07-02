const UpdateGraph = require('../utils/updateGraph');
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
        _id: '7b7fd8d3-75ac-4d37-90ac-5cc0fabc79c0',
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
            _id: '1cfbbeb4-dbc2-46e1-86b5-e706bef948df',
            recommendedDegree: 100,
        }, {
            _id: '7b7fd8d3-75ac-4d37-90ac-5cc0fabc79c0',
            recommendedDegree: 100,
        }],
        paths: [{
            from: '7b7fd8d3-75ac-4d37-90ac-5cc0fabc79c0',
            to: '1cfbbeb4-dbc2-46e1-86b5-e706bef948df',
            recommendedDegree: 0,
        }, {
            from: 'cafbedbd-7dc6-47f7-934c-902cc02443a6',
            to: '7b7fd8d3-75ac-4d37-90ac-5cc0fabc79c0',
            recommendedDegree: 100,
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
            project = await findOneInModel('tProject', {_id: req.body.projectId}, null, { lean: true });
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

    
