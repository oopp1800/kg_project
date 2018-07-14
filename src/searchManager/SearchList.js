import React, { Component } from 'react';
import {
    Row,
    Col,
    List,
    Progress,
    Button,
} from 'antd';
import {
    Link,
    withRouter,
} from 'react-router-dom';
import Graph from 'react-graph-vis';
import graphParser from '../utils/graphParser';
import netService from '../utils/netService';

import './SearchList.css';

const TYPE_MAPPING_TABLE = {
    "lesson": "课程",
    "knowledge": "知识点",
    "kunit": "教学单元",
    "mcourse": "主课时",
    "acourse": "辅课时",
};

const MOCK_PROPS_NONE = {
    hasSearched: true,
    searchResult: [],
};
const MOCK_PROPS = {
    hasSearched: true,
    searchResult: [{
        lessonName: '信息论',
        lessonId: '42ed20d0-bcd3-4175-a3a9-a8f4e3e41d35',
        teacherName: [],
        thumbnailUrl: '',
        resultsInLesson: [{
            type: 'knowledge',
            similarity: 0.8,
            id: '321-xxx',
            title: '离散信道',
            thumbnailUrl: '',
        }, {
            type: 'kunit',
            similarity: 0.6,
            id: '322-xxx',
            title: '连续信道',
            thumbnailUrl: '',
        }, {
            type: 'kunit',
            similarity: 0.6,
            id: '323-xxx',
            title: '连续信道',
            thumbnailUrl: '',
        }, {
            type: 'kunit',
            similarity: 0.6,
            id: '324-xxx',
            title: '连续信道',
            thumbnailUrl: '',
        }]
    }, {
        lessonName: '通信原理',
        lessonId: 'c8e01d1d-8026-45d1-b39a-ffa6b71ed0e1',
        teacherName: [],
        thumbnailUrl: '',
        resultsInLesson: [{
            type: 'knowledge',
            similarity: 0.8,
            id: '321-xxy',
            title: '离散信道',
            thumbnailUrl: '',
        }, {
            type: 'kunit',
            similarity: 0.6,
            id: '322-xxy',
            title: '连续信道',
            thumbnailUrl: '',
        }, {
            type: 'mcourse',
            similarity: 0.6,
            id: '323-xxy',
            title: '连续信道',
            thumbnailUrl: '',
        }, {
            type: 'acourse',
            similarity: 0.6,
            id: '324-xxy',
            title: '连续信道',
            thumbnailUrl: '',
        }]
    }],
};

class SearchList extends Component {
    /**
     * props: {
     *   hasSearched: {Boolean},
     *   searchResult: [{
     *      lessonName: {String},
     *      lessonId: {ObjectId},
     *      teacherName: {Array[String]},
     *      thumbnailUrl: {String},
     *      resultsInLesson: [{
     *          type: {String},
     *          similarity: {Number} 0-1之间,
     *          id: {ObjectId},
     *          title: {String},
     *          thumbnailUrl: {String},
     *       }, ...],
     *   }, ...],
     * }
     */
    constructor(props) {
        super(props);

    }

    render() {
        const {
            hasSearched,
            searchResult,
        } = this.props;

        if (!hasSearched) return <div></div>;
        if (!searchResult || searchResult.length === 0) {
            return <h2>无搜索结果</h2>
        }

        return (
            <div>
                {
                    searchResult.map(lessonWithResults => (
                        <ResultCardInOneLesson
                            key={lessonWithResults.lessonId}
                            result={lessonWithResults}
                        />
                    ))
                }
            </div>
        );
    }
}

class ResultCardInOneLesson extends Component {
    constructor(props) {
        super(props);

        this.state = {
            graph: {
                type: "lesson",
                config: {
                    physics: false,
                    layout: {
                        hierarchical: {
                            levelSeparation: 200,
                            nodeSpacing: 150,
                            treeSpacing: 200,
                            direction: 'LR',
                            // sortMethod: 'directed',
                        },
                    },
                    nodes: {
                        borderWidth: 2,
                        shapeProperties: {
                            useBorderWithImage: true,
                        }
                    }
                },
                data: {
                    nodes: [],
                    edges: [],
                }
            },
        };

        this.changeGraph = this.changeGraph.bind(this);
        this.getLessonGraph = this.getLessonGraph.bind(this);
        this.getSubResultsList = this.getSubResultsList.bind(this);
    }

    async changeGraph(type, id) {
        console.log(type, id);

        const RESOURSE_FUNCTION_TABLE = {
            lesson: netService.getCourse,
            knowledge: netService.getKnowledge,
            kunit: netService.getKunit,
            mcourse: netService.getMcourse,
            acourse: netService.getAcourse,
        };
        const GRAPH_PARSE_TABLE = {
            lesson: graphParser.parseLesson,
            knowledge: graphParser.parseKnowledge,
            kunit: graphParser.parseKunit,
            mcourse: graphParser.parseMcourse,
            acourse: graphParser.parseAcourse,
        };

        let resourse = null,
            graph = {
                nodes: [],
                edges: [],
            },
            getResourseFunction = RESOURSE_FUNCTION_TABLE[type],
            graphParserFunction = GRAPH_PARSE_TABLE[type];

        if (!getResourseFunction || !graphParserFunction) return;

        try {
            resourse = await getResourseFunction(id);
            graph = graphParserFunction(resourse);

            this.setGraph(graph);
        }
        catch(err) {
            console.error(err);
        }

        //TODO: graph changing
    }

    async getLessonGraph(result) {
        let lesson = null;

        try {
            lesson = await netService.getCourse(result.lessonId);
        }
        catch (err) {
            console.error(err);
        }
        console.log(lesson);

        return graphParser.parseLesson(lesson && lesson.project);
    }

    getSubResultsList(result) {
        return result && result.resultsInLesson;
    }

    setGraph(newGraph) {
        this.setState(prevState => ({
            graph: {
                ...prevState.graph,
                data: newGraph,
            }
        }));
    }

    async componentDidMount() {
        const lessonGraph = await this.getLessonGraph(this.props.result);

        console.log('lessonGraph: ', lessonGraph);

        this.setGraph(lessonGraph);
    }

    render() {
        if (!this.props.result) return null;

        const { result } = this.props;
        const {
            graph,
            subResultsList,
        } = this.state;

        let graphArea;

        if (graph && graph.data && graph.data.nodes && graph.data.nodes.length > 0) {
            graphArea = (
                <Graph className="lesson-graph"
                       style={{height: "400px"}}
                       graph={graph.data}
                       options={graph.config}
                />
            );
        }
        else {
            graphArea = (
                <p className="lesson-graph-loading">图谱读取中...</p>
            )
        }

        return (
            <div className="result-item">
                <h2>在&nbsp;
                    <Link to={{
                        pathname: "/learning-page/course/view",
                        state: { lessonId: result.lessonId },
                    }}>
                        {result.lessonName}
                    </Link>
                    &nbsp;课程中查询到结果：
                </h2>
                <Row className="result-card">
                    <Col span={16} className="result-card-left">
                        {graphArea}
                        <p className="graph-notes">
                            双击展开知识点<br />
                            单击进入内容
                        </p>
                        <div className="lesson-meta">
                            <div className="lesson-info">
                                <p className="intro intro-lesson">{TYPE_MAPPING_TABLE.lesson}</p>
                                <h3 className="lesson-name">{result.lessonName}</h3>
                            </div>
                            <Link to={{
                                pathname: "/learning-page/course/view",
                                state: { lessonId: result.lessonId },
                            }}>
                                <Button className="enter-lesson-btn">进入课程</Button>
                            </Link>
                        </div>
                    </Col>
                    <Col span={8} className="result-card-right">
                        <List itemLayout="horizontal"
                              dataSource={this.getSubResultsList(this.props.result)}
                              renderItem={item => (
                                  <List.Item key={item.id}>
                                      <SubResultListItem
                                          data={item}
                                          onClick={() => this.changeGraph(item.type, item.id)}
                                      />
                                  </List.Item>
                              )}
                        />
                    </Col>
                </Row>
            </div>
        );
    }
}

const SubResultListItem = props => (
    <div className="sub-result-list-item"
         onClick={props.onClick}
    >
        <div className="lesson-info">
            <p className={`intro intro-${props.data.type}`}>{TYPE_MAPPING_TABLE[props.data.type]}</p>
            <h3 className="sub-result-title">{props.data.title}</h3>
        </div>
        <Progress className="similarity"
                  type="dashboard"
                  format={percent => `相似度\n${percent.toFixed(1)}%`}
                  percent={props.data.similarity * 100}/>
    </div>
);

export default withRouter(SearchList);
