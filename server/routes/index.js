var express = require('express');
var router = express.Router();

let user = require('./user');
let graph = require('./graph');
let project = require('./project');
let material = require('./material');
let course = require('./course');
let search = require('./search');
let log = require('./log');
let api = require('./api');

let tokenObj = require('./utils/token');

/* 页面获取 */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/* 登录注册验证 */
router.post('/login', user.login);
router.post('/register', user.register);
router.get('/fetchUserInfoWithToken', tokenObj.checkToken, user.fetchUserInfo);

/* 课程 */
router.post('/addProject', tokenObj.checkToken, project.addProject);
router.post('/getProject', tokenObj.checkToken, project.getProject);
router.post('/getProjectData', tokenObj.checkToken, project.getProjectData);
router.post('/saveProjectData', tokenObj.checkToken, project.saveProjectData);
router.post('/deleteProject', tokenObj.checkToken, project.deleteProject);
router.post('/getCourse', tokenObj.checkToken, course.getCourse);
router.post('/publishCourse', tokenObj.checkToken, course.publishCourse);

/* 课程学习（图搜索 API，含图信息） */
router.get('/getCourse', tokenObj.checkToken, course.getCourse);
router.get('/getAllCourses', tokenObj.checkToken, course.getAllCourses);
router.get('/getKnowledge', tokenObj.checkToken, course.getKnowledge);
router.get('/getKunit', tokenObj.checkToken, course.getKunit);
router.get('/getMcourse', tokenObj.checkToken, course.getMcourse);
router.get('/getAcourse', tokenObj.checkToken, course.getAcourse);
/* 课程学习（数据库检索 API） */
router.get('/api/v1/courses/:courseId/knowledge-points/:knowledgeId',
    tokenObj.checkToken,
    api.knowledgePoints.get);
router.post('/api/v1/courses/:courseId/knowledge-points/:knowledgeId/answer',
    tokenObj.checkToken,
    api.knowledgePoints.answer);
router.get('/api/v1/courses/:courseId/learning-path-recommendation',
    tokenObj.checkToken,
    api.service.learningPathRecommendation);
router.get('/api/v1/courses/:courseId/knowledge-demands',
    tokenObj.checkToken,
    api.service.getKnowledgeDemandsRouter);

/* 资源 */
router.post('/upload', tokenObj.checkToken, material.uploadMaterial);
router.get('/materials', tokenObj.checkToken, material.getMaterial);
router.delete('/deleteMaterial', tokenObj.checkToken, material.deleteMaterial);
router.put('/updateMaterial', tokenObj.checkToken, material.updateMaterial);

/* 检索 */
router.post('/search', tokenObj.checkToken, search.getSearchResult);

/* 用户数据记录 */
router.post('/log', tokenObj.checkToken, log.saveLog);


module.exports = router;
