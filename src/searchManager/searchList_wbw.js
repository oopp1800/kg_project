import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './index.css'

import SearchKnowledgePreview from './searchPreview'

import {Row, Col} from 'antd';
import {Progress} from 'antd';


import {
    Redirect,
    withRouter,
    Link
} from 'react-router-dom';


import 'bootstrap/dist/css/bootstrap.css';

const TYPE_CONVERSE = {
    "视频": "video",
    "图片": "image",
    'high': "高",
    'veryhigh': '很高',
    'middle': '中',
    'low': '低',
    'verylow': '很低',
    'active': '主动型',
    'commentary': '解说型',
    'mixing': '混合型',
    'undefined': '未定义',
    'video':"视频"
};

const DEFAULT_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22288%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20288%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1632b6774d5%20text%20%7B%20fill%3A%23eceeef%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1632b6774d5%22%3E%3Crect%20width%3D%22288%22%20height%3D%22225%22%20fill%3D%22%2355595c%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22102.3359375%22%20y%3D%22118.7484375%22%3EThumbnail%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'

class SearchList_wbw extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expand: false,
        }
    }

    enterLesson = (lessonId) => {
        this.props.history.push({
                pathname:'/learning-page/course/view',
                    state: {lessonId: lessonId}
        })
        // <Redirect to={{
        //     pathname:'/learning-page/course/view',
        //         state: {lessonId: lessonId}
        // }}/>
    };


    checkFullInfoOfKnowledge = (e) => {
        const knowledgeId = e.target.parentNode.dataset.kid;
        const knowledgeList = this.props.searchResult.knowledge;

        let knowledgeData;
        for (let item in knowledgeList) {
            if (knowledgeList[item][0].knowledge.id === knowledgeId) {
                knowledgeData = knowledgeList[item][0]
            }
        }
        console.log(knowledgeData);
        ReactDOM.render(
            <SearchKnowledgePreview
                enterLesson={this.enterLesson}
                knowledgeData={knowledgeData}
            />
            , document.getElementById('searchPreview')
        )
    };


    render() {
        const LessonItemRouter = withRouter(SearchItemOfLesson);
        const {hasSearched, searchResult} = this.props;
        let mention = '';
        const lesson = [];
        const knowledge = [];
        if (searchResult.lesson.length !== 0) {
            searchResult.lesson.forEach((item) => {
                let itemInfo = item.lesson.data;
                let itemId = item.lesson.id;
                lesson.push(
                    <Col span={10} key={itemId}>
                        <LessonItemRouter
                            lessonId={itemId}
                            thumbnailUrl={itemInfo.thumbnailUrl}
                            title={itemInfo.title}
                            userName={itemInfo.teacher}
                            publishDate={itemInfo.publishDate || ''}
                            description={itemInfo.description || ''}/>
                    </Col>
                )
            })
        }
        if (searchResult.knowledge.length !== 0) {
            let i = 0;
            searchResult.knowledge.forEach(knowledges => {
                knowledges.forEach((item) => {
                    i += 1;
                    knowledge.push(
                        <Col span={22} key={i}>
                            <SearchItemOfKnowledge
                                checkFullInfoOfKnowledge={this.checkFullInfoOfKnowledge}
                                knowledgeInfo={item}
                            />
                        </Col>
                    )
                });

            });

        }
        if (!hasSearched) {
            mention = <h2>请输入检索内容</h2>
        } else {
            if (!searchResult.lesson.length && !searchResult.knowledge.length) {
                mention = <h2>未检索到内容</h2>
            }
        }


        return (
            <div id="searchList" className="searchList">
                <Row gutter={100}
                     justify="center"
                     type="flex">
                    {lesson}
                </Row>
                <Row justify="center"
                     type="flex">
                    {knowledge}
                </Row>
                <Row justify="center"
                     type="flex">
                    <Col >
                        {mention}
                    </Col>
                </Row>
            </div>
        );
    }
}


// const SearchItemOfKnowledge = (props) => {
//     const data = [
//         {
//             title: 'Ant Design Title 1',
//         },
//         {
//             title: 'Ant Design Title 2',
//         },
//         {
//             title: 'Ant Design Title 3',
//         },
//         {
//             title: 'Ant Design Title 4',
//         },
//     ];
//     return (
//         <div className="searchItem">
//             <Row
//                 type="flex"
//                 justify="center"
//             >
//                 <Col span={6}>
//                     <Card
//                         style={{width: 300}}
//                         cover={<img alt="example" src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"/>}
//                         actions={[<Icon type="setting"/>, <Icon type="edit"/>, <Icon type="ellipsis"/>]}
//                     >
//                         <Meta
//                             avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}
//                             title="Card title"
//                             description="This is the description"
//                         />
//                     </Card>
//                 </Col>
//                 <Col span={12}>
//                     <List
//                         bordered="true"
//                         itemLayout="horizontal"
//                         dataSource={data}
//                         renderItem={item => (
//                             <List.Item>
//                                 <List.Item.Meta
//                                     avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>}
//                                     title={<a href="https://ant.design">{item.title}</a>}
//                                     description="Ant Design, a design language for background applications, is refined by Ant UED Team"
//                                 />
//                             </List.Item>
//                         )}
//                     />
//                 </Col>
//             </Row>
//
//
//         </div>
//
//     )
// }


const SearchItemOfKnowledge = (props) => {
    const {knowledgeInfo, checkFullInfoOfKnowledge} = props;
    const similarity = knowledgeInfo.similarity;
    const lessonInfo = knowledgeInfo.lesson.data;
    const teachInfo = knowledgeInfo.teach.data;
    const mCourseInfo = knowledgeInfo.mcourse.data;
    const acourse = [];
    knowledgeInfo.acourse.forEach(item => {
        let aCourseInfo = item.data;
        acourse.push(
            <div key={aCourseInfo._id}>
                <AidCourse
                    key={aCourseInfo._id}
                    title={aCourseInfo.title}
                    difficulty={aCourseInfo.difficulty||'中等'}
                    duration={aCourseInfo.material_data.data.duration || ''}
                    type={aCourseInfo.learningObjectType}
                    description={aCourseInfo.description}
                />
            </div>
        )
    })

    console.log(knowledgeInfo)
    return (
        <div className="d-flex col-md-12 mb-4" style={{height: '26rem'}}>
            <div className="main-course col-md-4">
                <MainCourse
                    knowledgeId={knowledgeInfo.knowledge.id}
                    thumbnailUrl={knowledgeInfo.knowledge.data.thumbnailUrl || DEFAULT_IMG}
                    knowledgeName={knowledgeInfo.knowledge.data.title}
                    title={teachInfo.title}
                    description={teachInfo.description}
                    type={mCourseInfo.learningObjectType}
                    difficulty={mCourseInfo.difficulty}
                    belongToLesson={lessonInfo.title}
                    percent={similarity.toFixed(2) * 100}
                    checkFullInfoOfKnowledge={checkFullInfoOfKnowledge}
                />
            </div>
            <div className="sub-course list-group col-md-8 ">
                {acourse}
            </div>
        </div>
    )
};

const AidCourse = (props) => {
    const {title, difficulty, duration, type, description, key} = props;
    return (
        <a className="list-group-item list-group-item-action flex-column align-items-start" key={key}>
            <div className="d-flex w-100 justify-content-between sub-course-title">
                <h5 className="mb-1">{title}</h5>
                <small>时长：{duration}</small>
            </div>
            <p className="mb-1">{description}</p>
            <small>类型：{TYPE_CONVERSE[type]}</small>
            <small>难度：{TYPE_CONVERSE[difficulty]}</small>
        </a>
    )
};

const MainCourse = (props) => {
    const {thumbnailUrl, title, description, percent, userName, belongToLesson, knowledgeName, knowledgeId} = props;
    const {checkFullInfoOfKnowledge} = props;
    return (
        <div className="card mb-4 box-shadow " key={knowledgeId}>
            <img className="card-img-top"
                 data-src="holder.js/100px225?theme=thumb&amp;bg=55595c&amp;fg=eceeef&amp;text=Thumbnail"
                 style={{height: '12rem', width: '100%', display: 'block'}}
                 src={thumbnailUrl || DEFAULT_IMG}
                 data-holder-rendered="true"/>
            <div className="card-body main-course-body"
                 style={{height: '14rem', width: '100%'}}>
                <div className="d-flex w-100 justify-content-between main-course-title" style={{height: '2rem'}}>
                    <h5 className="mb-1">{title}</h5>
                </div>
                <p className="mb-1 main-course-description"
                   style={{height: '3rem'}}>{description}</p>
                <div className="sim-progress">
                    <label>相似度</label>
                    <Progress
                        percent={percent}
                        showInfo={true}
                        size="small"
                    />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <small>知识点：{knowledgeName}</small>
                </div>
                <div className="d-flex justify-content-between align-items-center" data-kid={knowledgeId}>
                    <small>所属课程：{belongToLesson}</small>
                    <small>教师：{userName}</small>
                    <button
                        onClick={checkFullInfoOfKnowledge}
                        type="button"
                        className="btn btn-sm btn-outline-secondary">查看教学单元
                    </button>
                </div>

            </div>
        </div>
    )
};

const SearchItemOfLesson = (props) => {
    const {thumbnailUrl, title, description, userName, publishDate, lessonId} = props;
    return (
        <div className="card mb-4 box-shadow">
            <img className="card-img-top"
                 data-src="holder.js/100px225?theme=thumb&amp;bg=55595c&amp;fg=eceeef&amp;text=Thumbnail"
                 style={{height: '20rem', width: '100%', display: 'block'}}
                 src={thumbnailUrl || DEFAULT_IMG}
                 data-holder-rendered="true"/>
            <div className="card-body main-course-body"
                 style={{height: '14rem', width: '100%'}}>
                <div className="d-flex w-100 justify-content-between main-course-title" style={{height: '2rem'}}>
                    <h5 className="mb-1">{title}</h5>
                </div>
                <p className="mb-1 main-course-description"
                   style={{height: '7rem'}}>{description}</p>
                <div className="d-flex justify-content-between align-items-center" data-lid={lessonId}>
                    <h6>教师：{userName}</h6>
                    <h6>发布时间：{publishDate}</h6>
                    <Link to={{
                        pathname: '/learning-page/course/view',
                        state: {lessonId: lessonId}
                    }}>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary">
                            进入课程
                        </button>
                    </Link>


                </div>

            </div>
        </div>
    )
}


export default withRouter(SearchList_wbw)