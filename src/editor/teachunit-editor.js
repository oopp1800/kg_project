import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './editor.css'

import InfiniteScroll from 'react-infinite-scroller';
import fetch from 'isomorphic-fetch';

import {Course} from './componentConstructor';

import {Row, Col} from 'antd';
import {Tabs, Icon} from 'antd';
import {Input, Select, Button} from 'antd';
import {List, Form} from 'antd';

import FileUpload from '../upload/filesupload'

const TabPane = Tabs.TabPane;
const InputGroup = Input.Group;
const Option = Select.Option;
const OptGroup = Select.OptGroup;

class TeachUnitEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tUnit: this.props.kUnitData,
            username: this.props.username
        };
        this.cancelEditor = this.cancelEditor.bind(this);
        this.onTeachUnitChanged = this.onTeachUnitChanged.bind(this);
        this.onCourseUnitChanged = this.onCourseUnitChanged.bind(this);
    }


    cancelEditor() {
        this.props.teachUnitChanged(this.state.tUnit);
        ReactDOM.unmountComponentAtNode(document.getElementById('tUnitEdit'));
    }

    componentDidMount() {
    }

    //这个写的就超烂了
    onTeachUnitChanged(data) {
        console.log(data);
    }

    onCourseUnitChanged(data) {
        console.log(data);
    }

    render() {
        return (
            <div id="editorContainerArea" className="editorContainerArea">
                <div id="editorContainer" className="editorContainer">
                    <EditorHeader closeBtn={this.cancelEditor}/>
                    <div id="editorBody" className="editorBody">
                        <CourseEdit
                            tUnitData={this.state.tUnit}
                            // tMaterialList={this.state.tMaterialList}
                            onTeachUnitChanged={this.onTeachUnitChanged}
                            onCourseUnitChanged={this.onCourseUnitChanged}
                            username={this.state.username}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

class CourseEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tUnit: this.props.tUnitData,
            mCUnit: this.props.tUnitData.mCourseUnit,
            aCUnit: this.props.tUnitData.aCourseUnit,
            tMList: [],
            viewHeight: '',
            conditionChanged: false,
            conditionUpdate: false,
        };
        this.onBasicInfoChanged = this.onBasicInfoChanged.bind(this);
        this.onMainCourseInfoChanged = this.onMainCourseInfoChanged.bind(this);
        this.onMainCourseMaterialInfoChanged = this.onMainCourseMaterialInfoChanged.bind(this);
    }

    onBasicInfoChanged = (data) => {
        this.props.onTeachUnitChanged(data)
    };

    onMainCourseInfoChanged = (data) => {
        this.setState({
            mCUnit: data
        })
    };

    onMainCourseMaterialInfoChanged = (data) => {
        let materialId = data;
        let mCUnit = this.state.mCUnit;
        let tMList = this.state.tMList;
        for (let index in tMList) {
            if (tMList[index]._id === materialId) {
                mCUnit.material = tMList[index];
                this.setState({
                    mCUnit: mCUnit,
                })
            }
        }
    };

    componentDidMount() {
        this.updateMaterialList().catch(err => console.log(err));
    }

    updateMaterialList() {
        let _this = this;
        const token = localStorage.getItem('token');
        return fetch('/materials?username=' + _this.props.username, {
            method: 'GET',
            headers: {
                "Authorization": token,
            }
        })
            .then(res => res.json())
            .then(res => {
                if (res && res.status === 'success') {
                    return this.setState({
                        tMList: res.data
                    });
                }
            })
    }

    updateViewHeight = (data) => {
        this.setState({
            viewHeight: data
        })
    };

    updateTUnit = (data) => {
        let aCUnit = this.state.aCUnit;
        aCUnit.push(data);
        this.setState({
            aCUnit: aCUnit
        })
    };

    render() {
        return (
            <div id="teachunit" className="teachunit">
                <Row gutter={16}>
                    <Col className="gutter-row" span={24}>
                        <Row gutter={2} style={{marginBottom: '1px'}}>
                            <Col className="gutter-row" span={16} ref="view">
                                <section>
                                    <MainVideoArea
                                        materialData={this.state.mCUnit.material}
                                        updateViewHeight={this.updateViewHeight}
                                        ref="mainVideoArea"
                                    />
                                </section>
                            </Col>
                            <Col className="gutter-row" span={8}>
                                <AidList
                                    aCUnit={this.state.aCUnit}
                                />
                            </Col>
                        </Row>
                        <Row gutter={2}>
                            <Col span={24}>
                                <section id="teachUnitInfo" className="teachUnitInfo">
                                    <Tabs defaultActiveKey="1">
                                        <TabPane tab={<span><Icon type="edit"/>基础设置</span>} key="1">
                                            <BasicInfo
                                                onBasicInfoChanged={this.onBasicInfoChanged}
                                                tUnit={this.state.tUnit}
                                            />
                                        </TabPane>
                                        <TabPane tab={<span><Icon type="file"/>主课时设置</span>} key="2">
                                            <MainCourseInfo
                                                tMaterialList={this.state.tMList}
                                                mCourseUnit={this.state.mCUnit}
                                                onMainCourseInfoChanged={this.onMainCourseInfoChanged}
                                                onMainCourseMaterialInfoChanged={this.onMainCourseMaterialInfoChanged}
                                            />
                                        </TabPane>
                                        <TabPane tab={<span><Icon type="file-text"/>辅课时设置</span>} key="3">
                                            <AidCourseInfo
                                                tMaterialList={this.state.tMList}
                                                mCourseUnit={this.state.mCUnit}
                                                tUnit={this.state.tUnit}
                                                updateTUnit={this.updateTUnit}
                                                afterMaterialUpload={() => this.updateMaterialList()}
                                            />
                                        </TabPane>
                                    </Tabs>
                                </section>
                            </Col>
                        </Row>

                    </Col>
                </Row>
            </div>
        )
    }

}

class AidList extends Component {
    state = {
        loading: false,
        hasMore: true
    };
    handleInfiniteOnLoad = () => {

    };

    render() {
        const { aCUnit } = this.props;
        let data = [];
        for (let aidCourse of aCUnit) {
            data.push(aidCourse.material.title)
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
                        dataSource={data}
                        renderItem={(item, index) => (
                            <List.Item key={index}>{item}</List.Item>
                        )}
                    />
                </InfiniteScroll>
            </div>
        )
    }

};

const EditorHeader = ({closeBtn}) => {
    return (
        <div id="editorHeader" className="editorHeader">
            <span onClick={closeBtn}>×</span>
        </div>)
};

class MainVideoArea extends Component {
    state = {
        update: true
    };

    componentDidMount() {
        this.props.updateViewHeight(this.refs.viewArea.offsetHeight)
    }

    render() {
        const materialData = this.props.materialData;
        if (!materialData) {
            return (
                <div id="editor-view-area" ref="viewArea">
                    <video id="editor-video" controls="controls"/>
                    <div id="editor-butn-layer"/>
                </div>
            )
        }
        let url = materialData.url;
        let type = materialData.type;
        let playArea;
        if (type === '视频') {
            playArea = <video id="editor-video" src={url} controls="controls" ref="view"/>
        } else if (type === '图片') {
            playArea = <img id="editor-video" src={url} ref="view"/>;
        } else {
            playArea = <video id="editor-video" src={url} controls="controls" ref="view"/>
        }
        return (
            <div id="editor-view-area" ref="viewArea">
                {playArea}
                <div id="editor-butn-layer"/>
            </div>
        )
    }
}

const BasicInfo = (props) => {
    let basicInfoChanged = props.onBasicInfoChanged;
    let tUnit = props.tUnit;
    const children = [];
    for (let index in tUnit.keyword) {
        children.push(<Option key={tUnit.keyword[index]}>{tUnit.keyword[index]}</Option>);
    }

    function handleChange(value) {
        tUnit.keyword = value;
        basicInfoChanged(tUnit);
    }

    function statusChange(value) {
        tUnit.status = value;
        basicInfoChanged(tUnit);
    }

    const basicInfoChange = (e) => {
        let targetId = e.target.id;
        if (targetId === 'keyword') {
            return;
        }
        tUnit[targetId] = e.target.value;
        basicInfoChanged(tUnit);
    };

    return (
        <div>
            <section id="basicInfo" className="basicInfo">
                <div onChange={basicInfoChange}>
                    <InputGroup label="title" size="middle">
                        <Col span={8}>
                            <label>教学单元名称</label>
                            <Input
                                defaultValue={tUnit.title}
                                id="title"
                            />
                        </Col>
                    </InputGroup>
                    <InputGroup label="description" size="middle">
                        <Col span={8}>
                            <label>教学单元描述信息</label>
                            <Input
                                defaultValue={tUnit.description}
                                id="description"
                            />
                        </Col>
                    </InputGroup>
                    <InputGroup label="keyword" size="middle">
                        <Col span={8}>
                            <label>教学单元关键字</label>
                            <Select
                                mode="tags"
                                style={{width: '100%'}}
                                placeholder="教学单元关键字"
                                onChange={handleChange}
                                defaultValue={tUnit.keyword}
                                id="keyword"
                            >
                                {children}
                            </Select>
                        </Col>
                    </InputGroup>
                </div>
            </section>
        </div>
    )
};

const MainCourseInfo = (props) => {
    let mCInfo = props.mCourseUnit;
    let mCInfoChanged = props.onMainCourseInfoChanged;
    let tMaterialList = props.tMaterialList;
    const mainCourseInfoChanged = (e, option) => {

    };

    const mainCourseMaterialInfoChanged = (data) => {
        console.log(data)
        props.onMainCourseMaterialInfoChanged(data);
    };

    const mCInfoChange = (e) => {
        let targetId = e.target.id;
        mCInfo[targetId] = e.target.value;
        mCInfoChanged(mCInfo);
    };

    const dHandleChange = (value) => {
        mCInfo.difficulty = value;
        mCInfoChanged(mCInfo);
    };
    const iDHandleChange = (value) => {
        mCInfo.interactionDegree = value;
        mCInfoChanged(mCInfo);
    };

    const iTHandleChange = (value) => {
        mCInfo.interactionType = value;
        mCInfoChanged(mCInfo);
    };

    const lOTHandleChange = (value) => {
        mCInfo.learningObjectType = value;
        mCInfoChanged(mCInfo);
    };
    let children = {};
    let type;
    for (let index in tMaterialList) {
        if (tMaterialList[index]) {
            type = tMaterialList[index].type;
            if (children[type] === undefined) {
                children[type] = [];
            }
            children[type].push(<Option key={tMaterialList[index]._id}>{tMaterialList[index].title}</Option>);
        }
    }
    return (
        <div>
            <Row>
                <Col className="gutter-row" span={8}>
                    <section id="mainCourseBasicInfo" className="mainCourseBasicInfo">
                        <div onChange={mCInfoChange}>
                            <InputGroup label="title" size="middle">
                                <Col>
                                    <label>主课时名称</label>
                                    <Input
                                        defaultValue={mCInfo.title}
                                        id="title"
                                    />
                                </Col>
                            </InputGroup>
                            <InputGroup label="difficulty" size="middle">
                                <Col>
                                    <label>课时难度</label>
                                    <Select
                                        defaultValue={mCInfo.difficulty || '中'}
                                        style={{width: '100%'}}
                                        id="difficulty"
                                        onChange={dHandleChange}
                                    >
                                        <Option value="veryhigh">很高</Option>
                                        <Option value="high">高</Option>
                                        <Option value="middle">中</Option>
                                        <Option value="low">低</Option>
                                        <Option value="verylow">很低</Option>
                                    </Select>
                                </Col>
                            </InputGroup>
                            <InputGroup label="interactionDegree" size="middle">
                                <Col>
                                    <label>交互程度</label>
                                    <Select
                                        defaultValue={mCInfo.interactionDegree || '中'}
                                        style={{width: '100%'}}
                                        id="status"
                                        onChange={iDHandleChange}
                                    >
                                        <Option value="veryhigh">很高</Option>
                                        <Option value="high">高</Option>
                                        <Option value="middle">中</Option>
                                        <Option value="low">低</Option>
                                        <Option value="verylow">很低</Option>
                                    </Select>
                                </Col>
                            </InputGroup>
                            <InputGroup label="interactionType" size="middle">
                                <Col>
                                    <label>交互类型</label>
                                    <Select
                                        defaultValue={mCInfo.interactionType || '未定义'}
                                        style={{width: '100%'}}
                                        id="status"
                                        onChange={iTHandleChange}
                                    >
                                        <Option value="active">主动型</Option>
                                        <Option value="commentary">解说型</Option>
                                        <Option value="mixing">混合型</Option>
                                        <Option value="none">无</Option>
                                    </Select>
                                </Col>
                            </InputGroup>
                            <InputGroup label="learningObjectType" size="middle">
                                <Col>
                                    <label>学习对象类型</label>
                                    <Select
                                        defaultValue={mCInfo.learningObjectType || '未定义'}
                                        style={{width: '100%'}}
                                        id="status"
                                        onChange={lOTHandleChange}
                                    >
                                        <Option value="video">视频</Option>
                                        <Option value="audio">音频</Option>
                                        <Option value="image">图片</Option>
                                        <Option value="word">文字</Option>
                                        <Option value="quiz">试题</Option>
                                        <Option value="webpage">网页链接</Option>
                                        <Option value="richmedia">富媒体作品</Option>
                                    </Select>
                                </Col>
                            </InputGroup>
                        </div>
                    </section>
                </Col>
                <Col className="gutter-row" span={8}>
                    <section id="mainCourseMaterialInfo" className="mainCourseMaterialInfo">
                        <div>
                            <label>请选择主课时素材</label>
                            <br/>
                            <Select
                                defalt
                                style={{width: 200}}
                                defaultValue={mCInfo.material === undefined ? '请选择素材' : mCInfo.material.title}
                                id="material"
                                onChange={mainCourseMaterialInfoChanged}
                            >
                                <OptGroup label="图片">
                                    {children['图片'] !== undefined ? children['图片'] : ''}
                                </OptGroup>
                                <OptGroup label="文字">
                                    {children['文字'] !== undefined ? children['文字'] : ''}
                                </OptGroup>
                                <OptGroup label="音频">
                                    {children['音频'] !== undefined ? children['音频'] : ''}
                                </OptGroup>
                                <OptGroup label="视频">
                                    {children['视频'] !== undefined ? children['视频'] : ''}
                                </OptGroup>
                                <OptGroup label="动画">
                                    {children['动画'] !== undefined ? children['动画'] : ''}
                                </OptGroup>
                                <OptGroup label="链接">
                                    {children['链接'] !== undefined ? children['链接'] : ''}
                                </OptGroup>
                                <OptGroup label="富媒体">
                                    {children['富媒体'] !== undefined ? children['富媒体'] : ''}
                                </OptGroup>
                            </Select>
                        </div>
                    </section>
                </Col>
                <Col className="gutter-row" span={8}>
                    <section id="mainCourseStatInfo" className="mainCourseStatInfo">
                        <div onChange={mainCourseInfoChanged}>
                            <InputGroup label="title" size="middle">
                                <Col>
                                    <section>
                                        <div>
                                            <span>点击人数：</span>{mCInfo.clickNum}
                                        </div>
                                    </section>
                                </Col>
                            </InputGroup>
                            <InputGroup label="difficulty" size="middle">
                                <Col>
                                    <section>
                                        <div>
                                            <span>观看人数：</span>{mCInfo.watchNum}
                                        </div>
                                    </section>
                                </Col>
                            </InputGroup>
                            <InputGroup label="averageRetentionRate" size="middle">
                                <Col>
                                    <section>
                                        <div>
                                            <span>平均滞留率：</span>{mCInfo.averageRetentionRate}
                                        </div>
                                    </section>
                                </Col>
                            </InputGroup>
                            <InputGroup label="semanticDensity" size="middle">
                                <Col>
                                    <section>
                                        <div>
                                            <span>典型学习时间：</span>{mCInfo.semanticDensity}
                                        </div>
                                    </section>
                                </Col>
                            </InputGroup>

                        </div>
                    </section>
                </Col>
            </Row>

        </div>
    )
};

class AidCourseInfo extends Component {
    state = {
        aCUnit: new Course('aid', this.props.tUnit.id),
        aidCourseMaterialId: null,
        disableSave: false,
        materialUpload: false,
    };
    aCInfoChange = (e) => {
        const type = e.target.id;
        let aCUnit = this.state.aCUnit;
        aCUnit[type] = e.target.value;
        this.setState({
            aCUnit: aCUnit
        })
    };

    saveACUnit = () => {
        this.props.updateTUnit(this.state.aCUnit);
        this.setState({
            aCUnit: new Course('aid', this.props.tUnit.id)
        })
    };

    dHandleChange = (value) => {
        let aCUnit = this.state.aCUnit;
        aCUnit.difficulty = value;
        this.setState({
            aCUnit: aCUnit
        })
    };

    iDHandleChange = (value) => {
        let aCUnit = this.state.aCUnit;
        aCUnit.interactionDegree = value;
        this.setState({
            aCUnit: aCUnit
        })
    };
    iTHandleChange = (value) => {
        let aCUnit = this.state.aCUnit;
        aCUnit.interactionType = value;
        this.setState({
            aCUnit: aCUnit
        })
    };
    lOTHandleChange = (value) => {
        let aCUnit = this.state.aCUnit;
        aCUnit.learningObjectType = value;
        this.setState({
            aCUnit: aCUnit
        })
    };

    aidCourseMaterialInfoChanged = (materialId) => {
        let aCUnit = this.state.aCUnit;
        let tMList = this.props.tMaterialList;
        for (let index in tMList) {
            if (tMList[index]._id === materialId) {
                aCUnit.material = (tMList[index]);
                this.setState({
                    mCUnit: aCUnit,
                    aidCourseMaterialId: materialId,
                })
            }
        }
    };

    toggleMaterialForm = () => {
        this.setState((state) => {
            return {
                materialUpload: !state.materialUpload,
            };
        });
    };

    handleStartUpload = () => {
        this.setState({
            disableSave: true,
        });
    };

    handleFinishUpload = (material) => {
        if (!material || !material._id) {
            return console.error('找不到保存的 material id, 返回的 material 为: ', material)
        }

        const { afterMaterialUpload } = this.props;

        afterMaterialUpload().then(() => {
            this.setState({
                disableSave: false,
                aidCourseMaterialId: material._id,
            });
        }).then(() => this.aidCourseMaterialInfoChanged(material._id));
    };


    render() {
        const tMaterialList = this.props.tMaterialList;
        let children = {};

        for (let material of tMaterialList) {
            if (!material.type) continue;

            if (!Array.isArray(children[material.type])) {
                children[material.type] = [];
            }

            children[material.type].push(<Option key={material._id}>{material.title}</Option>);
        }

        return (
            <div>
                <Row>
                    <Form>
                        <Col className="gutter-row" span={8}>
                            <section id="aidCourseBasicInfo" className="aidCourseBasicInfo">
                                <div onChange={this.aCInfoChange}>
                                    <InputGroup label="title" size="middle">
                                        <Col>
                                            <label>辅课时名称</label>
                                            <Input
                                                id="title"
                                            />
                                        </Col>
                                    </InputGroup>
                                    <InputGroup label="difficulty" size="middle">
                                        <Col>
                                            <label>课时难度</label>
                                            <Select
                                                defaultValue={'请选择课时难度'}
                                                style={{width: '100%'}}
                                                id="difficulty"
                                                onChange={this.dHandleChange}
                                            >
                                                <Option value="veryhigh">很高</Option>
                                                <Option value="high">高</Option>
                                                <Option value="middle">中</Option>
                                                <Option value="low">低</Option>
                                                <Option value="verylow">很低</Option>
                                            </Select>
                                        </Col>
                                    </InputGroup>
                                    <InputGroup label="interactionDegree" size="middle">
                                        <Col>
                                            <label>交互程度</label>
                                            <Select
                                                defaultValue={'请选择交互程度'}
                                                style={{width: '100%'}}
                                                id="status"
                                                onChange={this.iDHandleChange}
                                            >
                                                <Option value="veryhigh">很高</Option>
                                                <Option value="high">高</Option>
                                                <Option value="middle">中</Option>
                                                <Option value="low">低</Option>
                                                <Option value="verylow">很低</Option>
                                            </Select>
                                        </Col>
                                    </InputGroup>
                                    <InputGroup label="interactionType" size="middle">
                                        <Col>
                                            <label>交互类型</label>
                                            <Select
                                                defaultValue={'请选择交互类型'}
                                                style={{width: '100%'}}
                                                id="status"
                                                onChange={this.iTHandleChange}
                                            >
                                                <Option value="active">主动型</Option>
                                                <Option value="commentary">解说型</Option>
                                                <Option value="mixing">混合型</Option>
                                                <Option value="none">无</Option>
                                            </Select>
                                        </Col>
                                    </InputGroup>
                                    <InputGroup label="learningObjectType" size="middle">
                                        <Col>
                                            <label>学习对象类型</label>
                                            <Select
                                                defaultValue={'请选择学习对象类型'}
                                                style={{width: '100%'}}
                                                id="status"
                                                onChange={this.lOTHandleChange}
                                            >
                                                <Option value="video">视频</Option>
                                                <Option value="audio">音频</Option>
                                                <Option value="image">图片</Option>
                                                <Option value="word">文字</Option>
                                                <Option value="quiz">试题</Option>
                                                <Option value="webpage">网页链接</Option>
                                                <Option value="richmedia">富媒体作品</Option>
                                            </Select>
                                        </Col>
                                    </InputGroup>
                                </div>
                            </section>
                        </Col>
                        <Col className="gutter-row" span={8}>
                            <section id="aidCourseMaterialInfo" className="aidCourseMaterialInfo">
                                <div>
                                    <label>请选择辅课时素材</label>
                                    <br/>
                                    <Select
                                        showSearch
                                        style={{width: 200}}
                                        placeholder={'请选择素材'}
                                        value={this.state.aidCourseMaterialId}
                                        id="material"
                                        onChange={this.aidCourseMaterialInfoChanged}
                                    >
                                        {
                                            Object.keys(children).map(type => (
                                                <OptGroup
                                                    key={type}
                                                    label={type}
                                                >
                                                    {children[type]}
                                                </OptGroup>
                                            ))
                                        }
                                    </Select>
                                    <Icon type="plus-circle"
                                          style={{ marginLeft: '10px' }}
                                          onClick={() => this.toggleMaterialForm()}
                                    />
                                </div>
                                <div>
                                    <InputGroup label="title" size="middle">
                                        <Col>
                                            <Button type="primary"
                                                    style={{margin: '5px 0'}}
                                                    onClick={this.saveACUnit}
                                                    disabled={this.state.disableSave}
                                            >
                                                保存辅课时设置
                                            </Button>
                                        </Col>
                                    </InputGroup>
                                </div>
                            </section>
                        </Col>
                    </Form>
                    <Col className="gutter-row" span={8}
                         style={{ display: this.state.materialUpload? 'block': 'none' }}
                    >
                        <section>
                            <FileUpload
                                onStart={this.handleStartUpload}
                                onFinish={this.handleFinishUpload}
                            />
                        </section>
                    </Col>

                </Row>

            </div>
        )
    }
}


export default TeachUnitEditor;