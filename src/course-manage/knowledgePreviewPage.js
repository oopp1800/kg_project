import React from 'react';
import ReactDOM from 'react-dom';

import InfiniteScroll from 'react-infinite-scroller';

import { Layout, Breadcrumb, Row, Col, List, Card, Button, Timeline, Icon, Radio } from 'antd';
import { Link, withRouter } from 'react-router-dom';

import netService from '../utils/netService';
import { PDFMaterialDisplay, ImageMaterialDisplay, VideoMaterialDisplay, QuizMaterialDisplay } from "./materialDisplayComponents";


const DEFAULT_MATERIAL = {
    'img': 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=2486531409,3348270894&fm=27&gp=0.jpg',
    'video': 'http://cuc-richmedia.oss-cn-beijing.aliyuncs.com/media/new_aliyun0731/P5kn52ss5n.mp4?butteruid=1527400149022'
};
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
};


class KnowledgePreviewPage extends React.Component {
    state = {
        course: null,
        knowledge: null,
        kUnit: null,
        mCourse: null,
        aCourses: null,
    };

    componentDidMount() {
        const { courseId, knowledgeId } = this.props.match.params;
        this.refreshState(courseId, knowledgeId);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        const { courseId, knowledgeId } = nextProps.match.params;
        this.refreshState(courseId, knowledgeId);
    }

    refreshState(courseId, knowledgeId) {
        netService.getKnowledgeV1(courseId, knowledgeId)
            .then(knowledge => {
                const {
                    course,
                    teachUnit: kUnit,
                } = knowledge;
                const {
                    mCourseUnit: mCourse,
                    aCourseUnit: aCourses,
                } = kUnit;

                if (courseId !== course._id) throw Error(`获取到的课程信息与 URL 中的不同！URL: ${courseId}, 获取: ${course._id}`);

                this.setState({
                    course,
                    knowledge,
                    kUnit,
                    mCourse,
                    aCourses,
                });
            })
            .catch(err => console.error(err));
    }

    render() {
        const { courseId, knowledgeId } = this.props.match.params;
        if (!courseId) return <div>课程不存在!</div>;
        if (!knowledgeId) return <div>知识点不存在!</div>;

        const { course, knowledge, kUnit, mCourse, aCourses } = this.state;

        if (!course || !knowledge) return <div>获取相关信息中...</div>;
        if (!course.title || !knowledge.title) return <div>获取信息错误！</div>;

        return (
            <Layout style={{ padding: '0 24px 24px' }}>
                <Breadcrumb style={{ margin: '16px 0'}}>
                    <Breadcrumb.Item>
                        <Link to={`/learning-page/courses/${courseId}`}>
                            { course.title }
                        </Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        { knowledge.title }
                    </Breadcrumb.Item>
                </Breadcrumb>
                <KnowledgePreview
                    course={course}
                    knowledge={knowledge}
                    kUnit={kUnit}
                    mCourse={mCourse}
                    aCourses={aCourses}
                />
            </Layout>
        );
    }
}

class KnowledgePreview extends React.Component {
    state = {
        currentCourseUnit: this.props.mCourse || {},
        recommendationKnowledge: null,
    };

    changeCourseUnit = (courseUnit) => {
        this.setState({
            currentCourseUnit: courseUnit,
        });
    };

    afterLearning = (correct) => {
        const { course, knowledge } = this.props;

        return netService.answerKnowledge(course._id, knowledge._id, correct)
            .then(data => {
                this.setState({
                    recommendationKnowledge: data.recommendedKnowledge,
                });
            })
            .catch(err => {
                console.error(err);
            });
    };

    refreshState(courseId) {
        return netService.recommendKnowledge(courseId)
            .then(data => {
                this.setState({
                    recommendationKnowledge: data.recommendedKnowledge,
                });
            });
    }

    componentDidMount() {
        const { course } = this.props;
        this.refreshState(course._id);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        const { course } = nextProps;
        this.refreshState(course._id);
    }

    render() {
        const { course, knowledge, kUnit, mCourse, aCourses } = this.props;
        const { currentCourseUnit, recommendationKnowledge } = this.state;

        if (!kUnit) return null;

        return (
            <div id="knowledgePreviewArea" className="knowledgePreviewArea">
                <div id="previewContainer" className="previewContainer">
                    <Row type="flex"
                         justify="start"
                         style={{height: '100%'}}>
                        <Col className="gutter-row" span={14} style={{height: '27rem'}}>
                            <div id="coursePreview"
                                 className="coursePreview"
                            >
                                <DisplayArea displayMaterial={currentCourseUnit.material || {}}
                                             afterLearning={this.afterLearning} />
                            </div>
                        </Col>
                        <Col className="gutter-row" span={10} style={{height: '27rem', background: '#ffffff'}}>
                            <SubCourseList mCourse={mCourse}
                                           aCourses={aCourses}
                                           changeCourseUnit={this.changeCourseUnit} />
                        </Col>
                    </Row>
                    <Row style={{
                        height: '100%',
                        marginTop: '20px',
                    }}>
                        <Col className="gutter-row" span={18} key={1}>
                            <KnowledgeInfoArea
                                knowledgeInfo={knowledge}
                            />
                            <KnowledgeUnitArea
                                kUnitId={knowledge._id}
                                teachInfo={kUnit}
                            />
                        </Col>
                        <Col className="gutter-row" span={6} key={2}>
                            <LearningPathRecommendationArea
                                currentKnowledge={knowledge}
                                recommendationKnowledge={recommendationKnowledge}
                            />
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}

class DisplayArea extends React.Component {
    render() {
        const { displayMaterial, afterLearning } = this.props;

        const emptyView = (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
            }}>
                暂无可显示资源
            </div>
        );

        if (!displayMaterial) return emptyView;

        switch(displayMaterial.type) {
            case '图片': return <ImageMaterialDisplay url={displayMaterial.url}/>;
            case '视频': return <VideoMaterialDisplay url={displayMaterial.url} />;
            case '课件': return <PDFMaterialDisplay url={displayMaterial.url} />;
            case '试题': return <QuizMaterialDisplay quiz={displayMaterial.quiz}
                                                   materialId={displayMaterial._id}
                                                   afterLearning={afterLearning} />;
            case '音频':
            case '动画':
            case '文本':
            default: return emptyView;
        }
    }
}

const SubCourseList = ({ mCourse, aCourses, changeCourseUnit}) => (
    <div className="subCoursePreview">
        <MainLessonInfoArea changeCourseUnit={changeCourseUnit}
                            mainCourseInfo={mCourse} />
        <AidList changeCourseUnit={changeCourseUnit}
                 aCourses={aCourses} />
    </div>
);

class AidList extends React.Component {
    render() {
        const { aCourses, changeCourseUnit } = this.props;

        return (
            <div className="infinite-container">
                <List
                    header={<div align="center">辅课时信息</div>}
                    itemLayout="vertical "
                    dataSource={aCourses}
                    renderItem={item => (
                        <List.Item
                            actions={[<div data-aid={item._id}
                                           onClick={() => changeCourseUnit(item)}>
                                播放</div>]}
                        >
                            <List.Item.Meta
                                title={item.title}
                                description={item.description}
                            />
                        </List.Item>
                    )}
                />
            </div>
        )
    }

};

const KnowledgeInfoArea = ({knowledgeInfo}) => {
    return (
        <div className="KnowledgeInfoArea">
            <Card title="知识点信息">
                <p>知识点名称：{knowledgeInfo.title}</p>
                <p>大纲要求难度：{knowledgeInfo.demand}</p>
                <p>学生掌握程度：{knowledgeInfo.achieve}</p>
            </Card>
        </div>
    )
};

const MainLessonInfoArea = ({mainCourseInfo, changeCourseUnit}) => {
    const {
        title,
        difficulty,
        interactionDegree,
        interactionType,
        material,
    } = mainCourseInfo;

    return (
        <div className="mainCourseInfoArea">
            <Card title="主课时信息"
                  extra={[<div data-mid={mainCourseInfo._id}
                               style={{cursor: 'pointer'}}
                               onClick={() => changeCourseUnit(mainCourseInfo)}
                               key='play'>
                      播放</div>]}>
                <p>主课时名称：{title}</p>
                <p>主课时难度：{TYPE_CONVERSE[difficulty]}</p>
                <p>主课时交互程度：{TYPE_CONVERSE[interactionDegree]}</p>
                <p>主课时交互类型：{TYPE_CONVERSE[interactionType]}</p>
            </Card>
        </div>
    )
};

const KnowledgeUnitArea = ({ teachInfo }) => {
    return (
        <div className="teachInfoArea">
            <Card title="教学单元信息"
            >
                <p>教学单元名称：{teachInfo.title}</p>
                <p>教学单元描述：{teachInfo.description}</p>
                <p>教学单元关键字：{teachInfo.keyword}</p>
            </Card>
        </div>
    )
};

class LearningPathRecommendationAreaWithoutRouter extends React.Component {
    render () {
        let { currentKnowledge, recommendationKnowledge } = this.props;
        if (!currentKnowledge) {
            return (
                <Card title="学习路径推荐模块">
                    <div>暂无相关资料</div>
                </Card>
            );
        }
        if (!recommendationKnowledge) {
            recommendationKnowledge = currentKnowledge;
        }

        const linkKnowledgeId = recommendationKnowledge && recommendationKnowledge._id? recommendationKnowledge._id: currentKnowledge._id;
        const currentUrl = this.props.match.url;
        const currentKnowledgeId = this.props.match.params.knowledgeId;
        const linkUrl = currentUrl.replace(currentKnowledgeId, linkKnowledgeId);

        return (
            <Card title="学习路径推荐模块"
                  actions={[ (<Link to={linkUrl} style={{ color: 'red' }}><Icon type="right" /> 跳转到推荐知识点</Link>) ]}
            >
                <Link to={linkUrl}>
                    <Row>
                        <Col span={18}
                             style={{
                                 height: '100%'
                             }}
                        >
                            <Timeline style={{
                                height: '100%'
                            }}>
                                <Timeline.Item>{ currentKnowledge.title }</Timeline.Item>
                                <Timeline.Item color='red'>{ recommendationKnowledge.title }</Timeline.Item>
                            </Timeline>
                        </Col>
                    </Row>
                </Link>
            </Card>
        );
    };
}
const LearningPathRecommendationArea = withRouter(LearningPathRecommendationAreaWithoutRouter);


export default KnowledgePreviewPage
