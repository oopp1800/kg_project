var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = {
    tLearningProcess:{
        userId: {type:String,require:true},
        knowledgeId: {type:String,require:true},
        learningProcess: {type: Number, require: true},
    },
    tUserActivity: {
        userId: {type:String, require:true},
        activity: {type: Schema.Types.Mixed, require: true},
        date: {type: Date, default: Date.now(), require: true},
    },
};
