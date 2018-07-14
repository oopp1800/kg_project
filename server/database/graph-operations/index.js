const graphOptions = require('./graph-request');

module.exports = {
    getKnowledge: id => {
        return graphOptions.getKnowledge;
    },
};