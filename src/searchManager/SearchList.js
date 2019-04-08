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

const COLOR_MAP = {
    lesson: '#595959',
    knowledge: '#d4b106',
    kunit: '#0050b3',
    mcourse: '#a8071a',
    acourse: '#5b8c00'
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
                        shape: 'image',
                        shapeProperties: {
                            useBorderWithImage: true,
                        }
                    },
                    groups: {
                        "lesson": {
                            color: {
                                border: COLOR_MAP.lesson,
                            }
                        },
                        "knowledge": {
                            color: {
                                border: COLOR_MAP.knowledge,
                            }
                        },
                        "kunit": {
                            color: {
                                border: COLOR_MAP.kunit,
                            }
                        },
                        "mcourse": {
                            color: {
                                border: COLOR_MAP.mcourse,
                            }
                        },
                        "acourse": {
                            color: {
                                border: COLOR_MAP.acourse,
                            }
                        },
                    },
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
            graph = graphParserFunction(resourse[type]);

            console.log(graph);
            this.setGraph(graph);
        }
        catch(err) {
            console.error(err);
        }

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
        if (!result || !result.resultsInLesson || !Array.isArray(result.resultsInLesson)
            || result.resultsInLesson.length < 1) {
            return null;
        }

        let resultIdSet = new Set();

        const subResults = result.resultsInLesson.filter(subResult => {
            if (!subResult || resultIdSet.has(subResult.id)) return false;

            resultIdSet.add(subResult.id);
            return true;
        });
        return subResults.sort(
            (resource1, resource2) => resource2.similarity - resource1.similarity
        );
    }

    setGraph(newGraph) {
        const prevState = this.state;
        let graph = prevState.graph;
        graph.data = newGraph;

        console.log(graph);
        // 直接 set 会导致 Graph 数据不对，所以先清空再 set
        this.setState({
            graph: {
                nodes: [],
                edges: [],
            },
        }, () => {
            this.setState({
                graph
            })
        });
    }

    backToLessonGraph() {
        if (!this.lessonGraph) return;
        this.setGraph(this.lessonGraph);
    }

    async componentDidMount() {
        const lessonGraph = await this.getLessonGraph(this.props.result);

        console.log('lessonGraph: ', lessonGraph);
        this.lessonGraph = lessonGraph;

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
                        {/*<p className="graph-notes">*/}
                            {/*双击展开知识点<br />*/}
                            {/*单击进入内容*/}
                        {/*</p>*/}
                        <div className="lesson-meta" onClick={() => this.backToLessonGraph()}>
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
        {props.data.similarity &&
        <Progress className="similarity"
                  type="dashboard"
                  format={percent => `相似度\n${percent.toFixed(1)}%`}
                  percent={props.data.similarity * 100}/>
        }
    </div>
);

export default withRouter(SearchList);
