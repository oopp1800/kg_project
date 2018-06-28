import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import InfiniteScroll from 'react-infinite-scroller';

import {Document, Page} from 'react-pdf'
import {Row, Col, List, Card, Button} from 'antd';

import DEFAULT_PDF from '../searchManager/test.pdf'

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


class KnowledgePreview extends Component {
    state = {
        currentUrl: (this.props.kUnit && this.props.kUnit.teachUnit.mCourseUnit.material.url) || null,
        currentType: TYPE_CONVERSE[(this.props.kUnit && this.props.kUnit.teachUnit.mCourseUnit.material.type) || undefined],
    };

    cancelEditor = () => {
        this.props.onClose();
        // ReactDOM.unmountComponentAtNode(document.getElementById('videoArea'));
    };

    onDocumentLoad = ({numPages}) => {
        this.setState({numPages});
    };

    onItemClick = ({pageNumber}) => alert('Clicked an item from page ' + pageNumber + '!')

    unfoldPDFView = (url) => {
        ReactDOM.render(
            <PDFViewer
                url={url}
            />
            , document.getElementById('pdfView')
        )

    };


    changeAidCourseMedia = (e) => {
        let pendingId = e.target.dataset.aid;
        const aidCourseInfo = this.props.kUnit.teachUnit.aCourseUnit;

        aidCourseInfo.map(item => {
            if (pendingId === item._id) {
                let type = item.learningObjectType;
                if (type === '') {
                    type = TYPE_CONVERSE[item.material.type]
                }
                this.setState({
                    currentUrl: item.material.url,
                    currentType: type
                })
            }
        })

    };


    changeMainCourseMedia = (e) => {
        let pendingId = e.target.dataset.mid;
        const mainCourseInfo = this.props.kUnit.teachUnit.mCourseUnit;
        if (pendingId === mainCourseInfo._id) {
            let type = mainCourseInfo.learningObjectType;
            if (type === '') {
                type = TYPE_CONVERSE[mainCourseInfo.material.type]
            }
            this.setState({
                currentUrl: mainCourseInfo.material.url,
                currentType: type
            })
        }
    };

    render() {
        const {kUnit} = this.props;
        if (!kUnit) return null;
        const knowledgeInfo = kUnit;
        const teachInfo = knowledgeInfo.teachUnit;
        const aidCourseInfo = teachInfo.aCourseUnit;
        const mainCourseInfo = teachInfo.mCourseUnit;
        return (
            <div id="knowledgePreviewArea" className="knowledgePreviewArea">
                <div id="previewContainer" className="previewContainer">
                    <Row>
                        <Col span={24}>
                            <EditorHeader closeBtn={this.cancelEditor} title={'123'}/>
                        </Col>
                    </Row>
                    <div id="previewBody" className="previewBody">
                        <Row
                            type="flex"
                            justify="start"
                            style={{height: '100%'}}>
                            <Col className="gutter-row" span={14} style={{height: '27rem'}}>
                                <div id="coursePreview"
                                     className="coursePreview"
                                >
                                    <DisplayArea
                                        unfoldPDFView={this.unfoldPDFView}
                                        type={this.state.currentType}
                                        url={this.state.currentUrl || DEFAULT_MATERIAL.video}
                                    />
                                </div>
                            </Col>
                            <Col className="gutter-row" span={10} style={{height: '27rem', background: '#ffffff'}}>
                                <div className="subCoursePreview"
                                >
                                    <AidList
                                        changeAidCourseMedia={this.changeAidCourseMedia}
                                        aidCourseInfo={aidCourseInfo}
                                    />
                                </div>
                            </Col>

                        </Row>
                        <Row gutter={1} style={{height: '100%'}}>
                            <Col className="gutter-row" span={6} key={1}>
                                <KnowledgeInfoArea
                                    knowledgeInfo={knowledgeInfo}
                                />
                            </Col>
                            <Col className="gutter-row" span={8} key={2}>
                                <TeachInfoArea
                                    kUnitId={knowledgeInfo._id}
                                    onNextCourse={this.props.onNextCourse}
                                    onPrevCourse={this.props.onPrevCourse}
                                    enterLesson={this.props.enterLesson}
                                    teachInfo={teachInfo}
                                />
                            </Col>
                            <Col className="gutter-row" span={10} key={3}>
                                <MainLessonInfoArea
                                    changeMainCourseMedia={this.changeMainCourseMedia}
                                    mainCourseInfo={mainCourseInfo}
                                />
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        )
    }
}

const DisplayArea = ({type, url, unfoldPDFView}) => {
    console.log(type);
    if (type === 'pdf') {
        return (
            <div style={{height: '100%'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'

                }}
                     onClick={() => unfoldPDFView(url)}
                >
                    <span style={{cursor: 'pointer'}}>点击显示</span>
                </div>
                <div id="pdfView"/>
            </div>

        )
    }
    else if (type === 'video') {
        return (
            <video
                controls="controls"
                style={{width: '100%', height: '100%'}}
                src={url}
            />
        )
    }
    else if (type === 'image') {
        return (
            <img
                style={{width: '100%', height: '100%'}}
                src={url}
            />
        )
    }
    else {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%'
            }}>
                <span>未设置资源</span>
            </div>
        )
    }

};


const EditorHeader = ({closeBtn, title}) => {
    return (
        <div id="editorHeader" className="editorHeader">
            <span style={{fontSize: '17px', position: 'absolute', left: '5px'}}>课程名称：{title}</span>
            <span onClick={closeBtn}>×</span>
        </div>)

};


class AidList extends Component {
    state = {
        aidCourseInfo: this.props.aidCourseInfo,
        loading: false,
        hasMore: true
    };
    handleInfiniteOnLoad = () => {

    };

    render() {

        let data = [];
        const adiCourseInfo = this.state.aidCourseInfo;
        console.log(adiCourseInfo)
        for (let index in adiCourseInfo) {
            data.push({
                courseId: adiCourseInfo[index]._id,
                title: adiCourseInfo[index].title,
                description: adiCourseInfo[index].description || ''
            })
        }
        return (
            <div className="infinite-container">
                <InfiniteScroll
                    initialLoad={false}
                    pageStart={0}
                    loadMore={this.handleInfiniteOnLoad}
                    hasMore={!this.state.loading && this.state.hasMore}
                    useWindow={false}
                >
                    <List
                        header={<div align="center">辅课时信息</div>}
                        itemLayout="vertical "
                        dataSource={data}
                        renderItem={item => (
                            <List.Item
                                actions={[<div data-aid={item.courseId} onClick={this.props.changeAidCourseMedia}>
                                    播放</div>]}
                            >
                                <List.Item.Meta
                                    title={item.title}
                                    description={item.description}
                                />
                            </List.Item>
                        )}
                    />
                </InfiniteScroll>
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
                <p style={{visibility: 'hidden'}}> 1 </p>
            </Card>
        </div>
    )
}

const MainLessonInfoArea = ({mainCourseInfo, changeMainCourseMedia}) => {
    return (
        <div className="mainCourseInfoArea">
            <Card title="主课时信息"
                  extra={[<div data-mid={mainCourseInfo._id} style={{cursor: 'pointer'}}
                               onClick={changeMainCourseMedia}>
                      播放</div>]}>
                <p>主课时名称：{mainCourseInfo.title}</p>
                <p>主课时难度：{TYPE_CONVERSE[mainCourseInfo.difficulty]}</p>
                <p>主课时交互程度：{TYPE_CONVERSE[mainCourseInfo.interactionDegree]}</p>
                <p>主课时交互类型：{TYPE_CONVERSE[mainCourseInfo.interactionType]}</p>
            </Card>
        </div>
    )
}


const TeachInfoArea = (props) => {
    const {teachInfo, onNextCourse, onPrevCourse, kUnitId} = props;
    return (
        <div className="teachInfoArea">
            <Card title="教学单元信息"
            >
                <p>教学单元名称：{teachInfo.title}</p>
                <p>教学单元描述：{teachInfo.description}</p>
                <p>教学单元关键字：{teachInfo.keyword}</p>
                <Button
                    style={{marginTop: '0.4rem'}}
                    onClick={(e) => {
                        onPrevCourse(kUnitId)
                    }}
                >上一节</Button>
                <Button
                    style={{marginTop: '0.4rem'}}
                    onClick={(e) => {
                        onNextCourse(kUnitId)
                    }}
                >下一节</Button>
            </Card>
        </div>
    )
}

class PDFViewer extends Component {
    state = {
        numPages: null,
        pageNumber: 1,
    }
    onDocumentLoad = ({numPages}) => {
        this.setState({numPages});
    }


    prevPage = () => {
        this.setState(prev => {
            let newPage = prev.pageNumber <= 1 ? 1 : prev.pageNumber - 1;
            return {pageNumber: newPage};
        });
    };

    nextPage = () => {
        this.setState(prev => {
            let newPage = prev.pageNumber >= prev.numPages ? prev.numPages : prev.pageNumber + 1;
            return {pageNumber: newPage};
        });
    };

    closePage = () => {
        ReactDOM.unmountComponentAtNode(document.getElementById('pdfView'));
    }

    render() {
        const {pageNumber, numPages} = this.state;
        const url = this.props.url;
        return (
            <div>
                <Button onClick={this.prevPage}>上一页</Button>
                <Button onClick={this.nextPage}>下一页</Button>
                <Button onClick={this.closePage}>关闭</Button>
                <Document
                    onItemClick={() => alert('oh')}
                    file={DEFAULT_PDF || url}
                    onLoadSuccess={this.onDocumentLoad}
                >
                    <Page pageNumber={pageNumber}/>
                </Document>
                <p>Page {pageNumber} of {numPages}</p>
            </div>
        );
    }
}


export default KnowledgePreview
