const NODE_RECOMMEND_THRESHOLD = 50;
const PATH_RECOMMEND_THRESHOLD = 50;

class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];

        this.getData = this.getData.bind(this);
        this.setLesson = this.setLesson.bind(this);
        this.setKnowledge = this.setKnowledge.bind(this);
        this.setKnowledges = this.setKnowledges.bind(this);
        this.setKunit = this.setKunit.bind(this);
        this.setMcourse = this.setMcourse.bind(this);
        this.setAcourses = this.setAcourses.bind(this);
        this.setCurrent = this.setCurrent.bind(this);
        this.addEdge = this.addEdge.bind(this);
    }

    setCurrent(type, id) {
        this.current = id;
    }
    addEdge(id) {
        if (!this.current || !id || this.current === id) return;
        this.edges.push({
            from: this.current,
            to: id,
            color: { inherit: 'to' },
        });
    }
    setLesson(lesson) {
        if (!lesson) return;

        this.nodes.push({
            group: 'lesson',
            id: lesson.id,
            label: lesson.data.title,
            image: lesson.data.thumbnailUrl || '',
            brokenImage: '/default-cover/lesson.png',
        });

        this.addEdge(lesson.id);
    }
    setKnowledge(knowledge = null, options = { current: false }) {
        if (!knowledge || !knowledge.data.title) return;

        let node = {
            group: 'knowledge',
            id: knowledge.id,
            label: knowledge.data.title,
            image: knowledge.data.thumbnailUrl || '',
            brokenImage: '/default-cover/knowledge.png',
        };
        this.nodes.push(node);
        this.addEdge(knowledge.id)
    }
    setKunit(kunit = null, options = {}) {
        if (!kunit || !kunit.data.title) return;

        let node = {
            group: 'kunit',
            id: kunit.id,
            label: kunit.data.title,
            image: '/default-cover/kunit.png',
        };
        this.nodes.push(node);
        this.addEdge(kunit.id);
    }
    setMcourse(mcourse = null, options = {}) {
        if (!mcourse || !mcourse.data.title) return;

        let node = {
            group: 'mcourse',
            id: mcourse.id,
            label: mcourse.data.title,
            image: '/default-cover/mcourse.png',
        };
        this.nodes.push(node);
        this.addEdge(mcourse.id);
    }
    setAcourse(acourse = null, options = {}) {
        if (!acourse || !acourse.data.title) return;
        let node = {
            group: 'acourse',
            id: acourse.id,
            label: acourse.data.title,
            image: '/default-cover/acourse.png',
        };
        this.nodes.push(node);
        this.addEdge(acourse);
    }
    setKnowledges(knowledges = []) {
        if (!Array.isArray(knowledges)) {
            console.warn('单个 knowledge 请使用 setKnowledge 方法!');
            return this.setKnowledge(knowledges);
        }

        if (knowledges.length <= 0)  return null;

        let currentKnowledge = knowledges.filter(knowledge => knowledge.current)[0],
            neighborKnowledges = knowledges.filter(knowledge => !knowledge.current);

        this.setKnowledge(currentKnowledge, { current: true });
        neighborKnowledges.forEach( neighborKnowledge =>
            this.setKnowledge(neighborKnowledge)
        );
    }
    setAcourses(acourses = []) {
        if (!Array.isArray(acourses)) {
            console.warn('单个 acourse 请使用 setAcourse 方法!');
            return this.setAcourse(acourses);
        }

        if (acourses.length <= 0)  return null;

        let currentAcourse = acourses.filter(acourse => acourse.current)[0],
            neighborAcourses = acourses.filter(acourse => !acourse.current);

        this.setAcourse(currentAcourse, { current: true });
        neighborAcourses.forEach( neighborAcourse =>
            this.setAcourse(neighborAcourse)
        );
    }
    getData() {
        if (this.nodes.length === 0) return null;
        let nodes = this.nodes.map(node => {
            if (node.id === this.current) {
                node.borderWidth = 4;
            }
            return node;
        });

        return {
            nodes: this.nodes,
            edges: this.edges,
        }
    }
}

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
    parseKnowledge: (knowledgeDataForGraph = null, options = {}) => {
        let graph = new Graph();

        if (!knowledgeDataForGraph) return graph.getData();

        const {
            lesson,
            knowledge: knowledges,
            kunit,
            mcourse,
            acourse: acourses,
        } =knowledgeDataForGraph;

        if (!knowledges) return graph.getData();

        const currentKnowledge = knowledges.filter(knowledge => knowledge.current)[0];
        graph.setCurrent('knowledge', currentKnowledge.id);

        graph.setLesson(lesson);
        graph.setKnowledges(knowledges);
        graph.setKunit(kunit);
        graph.setMcourse(mcourse);
        graph.setAcourses(acourses);

        return graph.getData();
    },
    parseKunit: (kunitDataForGraph = null, options = {}) => {
        let graph = new Graph();

        if (!kunitDataForGraph) return graph.getData();

        const {
            lesson,
            knowledge,
            kunit,
            mcourse,
            acourse: acourses,
        } = kunitDataForGraph;

        if (!kunit) return graph.getData();

        graph.setCurrent('kunit', kunit.id);

        graph.setLesson(lesson);
        graph.setKnowledge(knowledge);
        graph.setKunit(kunit);
        graph.setMcourse(mcourse);
        graph.setAcourses(acourses);

        return graph.getData();
    },
    parseMcourse: (mcourseDataForGraph = null, options = {}) => {
        let graph = new Graph();

        if (!mcourseDataForGraph) return graph.getData();

        const {
            lesson,
            knowledge,
            kunit,
            mcourse,
            acourse: acourses,
        } = mcourseDataForGraph;

        if (!mcourse) return graph.getData();

        graph.setCurrent('mcourse', mcourse.id);

        graph.setLesson(lesson);
        graph.setKnowledge(knowledge);
        graph.setKunit(kunit);
        graph.setMcourse(mcourse);
        graph.setAcourses(acourses);

        return graph.getData();
    },
    parseAcourse: (acourseDataForGraph = null, options = {}) => {
        let graph = new Graph();

        if (!acourseDataForGraph) return graph.getData();

        const {
            lesson,
            knowledge,
            kunit,
            mcourse,
            acourse: acourses,
        } = acourseDataForGraph;

        if (!acourses) return graph.getData();

        const currentAcourses = acourses.filter(acourse => acourse.current)[0];
        graph.setCurrent('acourse', currentAcourses.id);

        graph.setLesson(lesson);
        graph.setKnowledge(knowledge);
        graph.setKunit(kunit);
        graph.setMcourse(mcourse);
        graph.setAcourses(acourses);

        return graph.getData();
    },
};