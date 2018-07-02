import React, { Component } from 'react';
import Graph from 'react-graph-vis';
import { VizulyWeightedTree } from '../utils/Vizuly';
import { Layout, message } from 'antd';

import './index.css'
import KnowledgePreview from "./knowledgePreview";

const { Content, Footer } = Layout;

const NODE_RECOMMEND_THRESHOLD = 50;
const PATH_RECOMMEND_THRESHOLD = 50;

class CourseContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            course: null,
            currentCourse: null,
            graphConfig: {
                physics: false,
            }
        };
        this.onSetCurrentCourse = this.onSetCurrentCourse.bind(this);
        this.onPrevCourse = this.onPrevCourse.bind(this);
        this.onNextCourse = this.onNextCourse.bind(this);
        this.onShowKnowledgePreview = this.onShowKnowledgePreview.bind(this);
        this.onHideKnowledgePreview = this.onHideKnowledgePreview.bind(this);
        this.courseToData = this.courseToData.bind(this);
    };

    onSetCurrentCourse(course) {
        console.log('setCurrentCourse', course);
        this.setState({ currentCourse: course });
    };

    courseToData(course) {
        if(!course||!course.data){
            return null
        }
        let rootNode = {};
        const createTree = (root) => {
            root.children = [];
            if (!root.hasChildNode || root.hasChildNode.length === 0) return;
            root.hasChildNode.forEach(id => root.children.push(course.data.filter(node => node._id === id)[0]));
            root.children.forEach(item => createTree(item));
            return root;
        };

        course.data.forEach(item => {
            item.value = 0.8;
            if(item.root === true){
                rootNode = item
            }
        });
        //course.data[0].value = 100;
        let data = createTree(rootNode);
        return data;
    }

    pSetCourse = data => {
        return new Promise((resolve, reject) => {
            this.setState({
                course: data
            },()=>{
                resolve(this.props.projectId);
            })
        });
    };

    getData = (data, callback) => {
        const token = localStorage.getItem('token');
        fetch('/getCourse', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({
                projectId: this.props.projectId
            })
        }).then(res => res.json())
            .then(res => {
                if (res && res.status === 'success') {
                    return res.data.project;
                    // this.props.onInit(res.data, this.initialize)
                }
            })
            .then(this.pSetCourse)
            .then(this.props.updateCurrentLesson)
            .catch(err => console.log(err));

    };

    parseCourse = course => {
        if (!course || !course.data) return null;

        const data = course.data;
        let recommendationNodeMap,
            recommendationPathMap,
            graphData = {
                nodes: [],
                edges: [],
            };

        if (course.recommendation) {
            recommendationNodeMap = new Map(course.recommendation.nodes.map(node => [node._id, node.recommendedDegree]));
            recommendationPathMap = new Map(
                course.recommendation.paths.map(node => [
                    node.from + node.to,
                    node.recommendedDegree,
                ])
            );
        }

        data.forEach(node => {
            let graphNode = { id: node._id, label: `${node.title} 学习进度：${node.learningProcess}` };
            let recommendedDegree = recommendationNodeMap.get(node._id);

            if (recommendedDegree && recommendedDegree > NODE_RECOMMEND_THRESHOLD) {
                graphNode.color = 'red';
                graphNode.title = `推荐度：${recommendedDegree}`;
            }
            graphData.nodes.push(graphNode);

            if (node.hasChildNode.length > 0) {
                node.hasChildNode.forEach(childId => {
                    let graphPath = {
                        from: node._id,
                        to: childId,
                    };
                    let recommendedDegree = recommendationPathMap.get(node._id + childId);

                    if (recommendedDegree && recommendedDegree > PATH_RECOMMEND_THRESHOLD) {
                        graphPath.color = { color: 'red' };
                        graphPath.label = `推荐度：${recommendedDegree}`;
                        graphPath.font = { color: 'red' };
                    }
                    graphData.edges.push(graphPath);
                });
            }
        });

        return graphData;
    };

    _getCourseDataById = id => {
        const courseDatas = this.state.course.data;
        if (!Array.isArray(courseDatas) || courseDatas.length <= 0) return;

        return courseDatas.filter(courseData => courseData._id === id)[0];
    };

    onShowKnowledgePreview = () => {
        this.setState({ showPreview: true });
    };

    onHideKnowledgePreview = () => {
        this.setState({ showPreview: false });
    };

    onPrevCourse = id => {
        const currentCourse = this.state.currentCourse;
        console.log('currentCourse: ', currentCourse);
        if (!currentCourse || !currentCourse.hasPrevNode) return;

        const prevCourse = this._getCourseDataById(currentCourse.hasPrevNode[0]);
        console.log('prevCourse: ', prevCourse);
        if (prevCourse) {
            this.onSetCurrentCourse(prevCourse);
        }
    };

    onNextCourse = id => {
        const currentCourse = this.state.currentCourse;
        if (!currentCourse || !currentCourse.hasNextNode) return;

        const nextCourse = this._getCourseDataById(currentCourse.hasNextNode[0]);
        if (nextCourse) {
            this.onSetCurrentCourse(nextCourse);
        }
    };

    handleNodeClick = node => {

        if (!node) return;

        const currentCourse = this.state.course.data.filter(courseData => courseData._id === node.nodes[0])[0];
        this.onSetCurrentCourse(currentCourse);
        this.onShowKnowledgePreview();

        console.log('clicked node', node);
    };

    componentDidMount() {
        this.getData();
    }

    render() {
        let graphData = this.parseCourse(this.state.course);
        console.log(graphData);

        const GRAPH_JSX = (
            <Graph graph={graphData}
                   options={this.state.graphConfig}
                   events={{click: this.handleNodeClick}}
            />
        );
        const TREE_JSX = (
            <VizulyWeightedTree
                projectId={this.props.projectId}
                data={this.courseToData(this.state.course)}
                originData={this.state.course && this.state.course.data}
                onInit={this.getData}
            />
        );

        return (
            <div
                // ref={dom => this.container=dom}
                style={{width: '100%', height: '100%'}}
            >
                <Layout>
                    <Content
                        style={{ width: '800px', height: '700px', position: 'relative', border: '1px solid #000'}}
                    >
                        { graphData ? GRAPH_JSX : <h1>等待载入课程...</h1> }
                        { this.state.showPreview && <KnowledgePreview
                            onNextCourse={this.onNextCourse}
                            onPrevCourse={this.onPrevCourse}
                            onClose={this.onHideKnowledgePreview}
                            kUnit={this.state.currentCourse}
                        />}
                    </Content>
                    <Footer>
                        <p className={'note-text'}>
                            红色结点：当前学习课程/推荐学习课程；<br />
                            红色箭头：推荐路径
                        </p>
                    </Footer>
                </Layout>
            </div>
        );
    }
}

const NoCurrentLesson = () => {
    return (
        <div className='noCurrentLesson'>
            暂无课程
        </div>
    );
}

export {
    NoCurrentLesson,
    CourseContent
}
export default CourseContent;