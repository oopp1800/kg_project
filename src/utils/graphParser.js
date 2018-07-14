const NODE_RECOMMEND_THRESHOLD = 50;
const PATH_RECOMMEND_THRESHOLD = 50;

export default {
    parseLesson: (lesson = null, options = {}) => {
        const SHOW_RECOMMENDATION = options.recommendation || false;

        let recommendationNodeMap = new Map(),
            recommendationPathMap = new Map(),
            graph = {
                nodes: [],
                edges: [],
            };

        if (!lesson || !lesson.data) return graph;

        const data = lesson.data;

        if (SHOW_RECOMMENDATION && lesson.recommendation) {
            recommendationNodeMap = new Map(lesson.recommendation.nodes.map(node => [node._id, node.recommendedDegree]));
            recommendationPathMap = new Map(
                lesson.recommendation.paths.map(node => [
                    node.from + node.to,
                    node.recommendedDegree,
                ])
            );
        }

        data.forEach(node => {
            let graphNode = {
                id: node._id,
                label: `${node.title}\n学习进度：${node.learningProcess}` ,
                shape: 'image',
                image: node.thumbnailUrl || null,
            };
            let recommendedDegree = recommendationNodeMap.get(node._id);

            if (recommendedDegree && recommendedDegree > NODE_RECOMMEND_THRESHOLD) {
                graphNode.color = 'red';
                graphNode.title = `推荐度：${recommendedDegree}`;
            }
            graph.nodes.push(graphNode);

            if (node.hasChildNode.length > 0) {
                node.hasChildNode.forEach(childId => {
                    let graphPath = {
                        from: node._id,
                        to: childId,
                    };
                    let recommendedDegree = recommendationPathMap.get(node._id + childId);

                    if (recommendedDegree && recommendedDegree > PATH_RECOMMEND_THRESHOLD) {
                        graphPath.label = `推荐度：${recommendedDegree}`;
                        graphPath.color = { color: 'red', highlight: 'red' };
                        graphPath.font = { color: 'red' };
                    }
                    else {
                        graphPath.color = { inherit: 'to' };
                    }
                    graph.edges.push(graphPath);
                });
            }
        });

        return graph;
    },
    parseKnowledge: (knowledge = null, options = {}) => {
        console.log(knowledge);
    },
};