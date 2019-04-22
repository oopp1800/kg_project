module.exports = {
    tMaterial: {
        // 暂时使用默认 _id
        // _id: {type: String, required: true}, // MongoDB 默认生成 _id
        userId: {type: String, required: true},
        type: {type: String, required: true},
        keyword: {type: String},
        url: {type: String},
        size: {type: String},
        description: {type: String},
        thumbnailUrl: {type: String, required: true},
        uniqueData: {type: Object},
        learningTime: {type: String},
        title: {type: String, required: true},
        format: {type: String},
        comments: {type: Object},
        language: {type: String},
        applicableObject: {type: Object},
        duration: {type: Number},
        quiz: {type: Object},
    },
    tProject: {
        _id: {type: String, required: true},
        projectName: {type: String, required: true},
        userName: {type: String, required: true},
        userId: {type: String, required: true},
        thumbnailUrl: {type: String},
        data: {type: Object, required: true},
        publishStatus: {type: String, required: true},
        startPosition: {type: Object},
        createDate: {type: String},
        updateDate: {type: String},
        description: {type: String},
        segmentationDict: {type: Array},
    }
};
