import React, { Component } from 'react';
import fetch from 'isomorphic-fetch';

import CourseItem from './CourseItem'

import {Row, Col} from 'antd';

class CourseList extends Component {
    constructor(props){
        super(props);
        this.state={
            courseList:[]
        }
    }
    componentDidMount(){
        const token = localStorage.getItem('token');
        fetch('/getAllCourses', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            }
        })
            .then(res => res.json())
            .then(res => {
                if (res && res.status === 'success') {
                    this.setState({
                        courseList:res.data
                    })
                }
            })
            .catch(err => console.log(err));
    }
    render(){
        const {courseList} = this.state;
        const lesson = [];
        courseList.forEach((item)=>{
            let itemInfo = item;
            let itemId = item._id;

            lesson.push(
                <Col span={8} key={itemId}>
                    <CourseItem
                        lessonId={itemId}
                        thumbnailUrl={itemInfo.thumbnailUrl}
                        title={itemInfo.projectName}
                        userName={itemInfo.userName}
                        publishDate={itemInfo.publishDate || ''}
                        description={itemInfo.description || ''}/>
                </Col>
            )
        });

        return(
            <div className="courseList" style={{margin:"0 2rem"}}>
                <Row type="flex" justify="center">
                    <Col>
                        <section className="courseListHeader">
                            <h3>课程列表</h3>
                        </section>

                    </Col>
                </Row>
                <Row>
                    <Col span={20}>
                        <div className="courseListBody">
                            <Row gutter={100}
                                 type="flex"
                                 justify="start">
                                {lesson}
                            </Row>
                        </div>
                    </Col>
                </Row>
            </div>


        )
    }
}

export default CourseList;