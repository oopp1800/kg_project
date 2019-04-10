import React, { Component } from 'react';
import Graph from 'react-graph-vis';
import {Button, Layout, message} from 'antd';
import { Link, Redirect } from 'react-router-dom';
import request from '../utils/netService/request';
import logger from '../utils/logger';
import graphParser from '../utils/graphParser';
import netService from '../utils/netService';

import './index.css'


const NODE_RECOMMEND_THRESHOLD = 50;
const PATH_RECOMMEND_THRESHOLD = 50;

class CourseContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            course: null,
            knowledgeId: null,
            graphConfig: {
                physics: false,
                layout: {
                    hierarchical: {
                        levelSeparation: 200,
                        nodeSpacing: 150,
                        treeSpacing: 200,
                        direction: 'LR',
                        sortMethod: 'directed',
                    },
                },
                nodes: {
                    borderWidth: 2,
                    size: 30,
                    shapeProperties: {
                        useBorderWithImage: true
                    }
                }
            },
            recommendedKnowledge: null,
        };
        this.courseToData = this.courseToData.bind(this);
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

    getData = (courseId) => {
        const token = localStorage.getItem('token');

        request.get('/getCourse', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            query: {
                id: courseId,
            },
        }).then(res => res.project)
            .then(this.pSetCourse)
            .then(this.props.updateCurrentLesson)
            .catch(err => console.log(err));

        netService.recommendKnowledge(courseId)
            .then(data => {
                this.setState({
                    recommendedKnowledge: data.recommendedKnowledge,
                });
            });

    };

    parseCourse = course => graphParser.parseLesson(course, { recommendation: true });

    handleNodeClick = node => {

        if (!node || !Array.isArray(node.nodes) || node.nodes.length < 1) return;
        const knowledgeId = node.nodes[0];

        this.setState({
            knowledgeId,
        });
    };

    componentDidMount() {
        const courseId = this.props.match.params.courseId;

        if (courseId) {
            this.getData(courseId);
        }
    }

    render() {
        const courseId = this.props.match.params.courseId;
        const { knowledgeId } = this.state;

        if (!courseId) return (<NoCurrentLesson/>);

        if (knowledgeId) {
            return (
                <Redirect to={`${this.props.match.url}/knowledge-points/${knowledgeId}`} />
            );
        }


        let graphData = this.parseCourse(this.state.course);

        const GRAPH_JSX = (
            <Graph graph={graphData}
                   options={this.state.graphConfig}
                   events={{click: this.handleNodeClick}}
            />
        );

        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    margin: '20px',
                }}
            >
                <div
                    style={{
                        width: '800px',
                        height: '700px',
                        position: 'relative',
                        border: '1px solid #000',
                    }}
                >
                    { graphData ? GRAPH_JSX : <h1>等待载入课程...</h1> }
                </div>
                <div id="course-info">
                    <h1>课程名：{this.state.course && this.state.course.projectName}</h1>
                    <p style={{
                        display: this.state.recommendedKnowledge? 'block': 'none'
                    }}>
                        推荐学习路径：{this.state.recommendedKnowledge && this.state.recommendedKnowledge.title}
                        <Link to={`/learning-page/courses/${this.state.course && this.state.course._id}/knowledge-points/${this.state.recommendedKnowledge && this.state.recommendedKnowledge._id}`}>
                            <Button type="primary" style={{ marginLeft: '1rem'}}>前往</Button>
                        </Link>
                    </p>
                </div>
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
};

export {
    NoCurrentLesson,
    CourseContent,
}
export default CourseContent;