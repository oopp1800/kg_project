import React, { Component } from 'react';
import Graph from 'react-graph-vis';
// import { VizulyWeightedTree } from '../utils/Vizuly';

import './index.css'

class CourseContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            course: null,
            graphConfig: {
                nodeHighlightBehavior: true,
                node: {
                    labelProperty: 'title',
                    symbolType: 'square',
                },
                link: {
                },
            }
        };

        this.courseToData = this.courseToData.bind(this);
    }

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

    getData = (data,callback) => {
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
                    return res.data;
                    // this.props.onInit(res.data, this.initialize)
                }
            })
            .then(this.pSetCourse)
            .then(this.props.updateCurrentLesson)
            .catch(err => console.log(err));

    };

    parseCourse = course => {
        if (!course) return null;

        const data = course.data;
        let graphData = {
            nodes: [],
            edges: [],
        };

        data.forEach(node => {
            graphData.nodes.push({ id: node._id, label: node.title });

            if (node.hasChildNode.length > 0) {
                node.hasChildNode.forEach(childId =>
                    graphData.edges.push({
                        from: node._id,
                        to: data.filter(node => node._id === childId)[0]._id,
                    })
                )
            }
        });

        return graphData;
    };

    handleNodeClick = nodeId => {
        alert(`clicked ${nodeId}!`);
    };

    componentDidMount() {
        this.getData();
    }

    render() {
        let graphData = this.parseCourse(this.state.course);
        console.log(graphData);

        return (
            <div id={'graph-container'}
                 style={{ height: '100%', width: '100%' }}
                 ref={dom => this.container=dom}
            >
                {graphData
                    ? <Graph graph={graphData}
                             events={{click: this.handleNodeClick}}
                    />
                    : <h1>等待载入课程...</h1>
                }
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