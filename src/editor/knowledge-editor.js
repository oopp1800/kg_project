import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './editor.css'

import fetch from 'isomorphic-fetch';

import TeachUnitEditor from './teachunit-editor';

import {Input, Select} from 'antd';
import {Row, Col} from 'antd';
import {Button} from 'antd';

const Option = Select.Option;
const InputGroup = Input.Group;


class KnowledgeEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            kUnit: this.props.kUnitData,
            username: this.props.username,
            materialList: []
        };
        this.cancelHandler = this.cancelHandler.bind(this);
        this.saveHandler = this.saveHandler.bind(this);
        this.kUnitInfoChange = this.kUnitInfoChange.bind(this);
        this.tUnitEdit = this.tUnitEdit.bind(this);
        this.onTeachUnitChanged = this.onTeachUnitChanged.bind(this);

        //不知道有没有什么好方法
        this.parentRelationAdd = this.parentRelationAdd.bind(this);
        this.childRelationAdd = this.childRelationAdd.bind(this);
        this.relateRelationAdd = this.relateRelationAdd.bind(this);


        this.parentRelationDel = this.parentRelationDel.bind(this);
        this.childRelationDel = this.childRelationDel.bind(this);
        this.relateRelationDel = this.relateRelationDel.bind(this);

        this.getkUnitObjectById = this.getkUnitObjectById.bind(this);
        this.kUnitAdd = this.kUnitAdd.bind(this);
        this.kUnitDel = this.kUnitDel.bind(this);

    }

    cancelHandler() {
        ReactDOM.unmountComponentAtNode(document.getElementById('unitEdit'));
    }

    saveHandler() {
        this.props.onUpdatekUnit(this.state.kUnit);
        ReactDOM.unmountComponentAtNode(document.getElementById('unitEdit'));
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    };

    tUnitEdit(e) {
        ReactDOM.render(
            <TeachUnitEditor
                kUnitData={this.state.kUnit.teachUnit}
                teachUnitChanged={this.onTeachUnitChanged}
                username={this.state.username}
            />
            , document.getElementById('tUnitEdit')
        )
    }


    onTeachUnitChanged(tUnit) {
    }


    kUnitInfoChange(e) {
        console.log(e)
        let inputType = e.target.id;
        if (inputType === 'synonym') {
            return
        }
        let inputValue = e.target.value;
        let kUnit = this.state.kUnit;
        kUnit[inputType] = inputValue;
        this.setState({
            kUnit: kUnit
        });
        console.log(inputType)
        if (inputType === 'title' || inputType === 'thumbnailUrl') {
            this.props.onUpdateUrlAndName(kUnit._id, inputType, inputValue);
        }
    }

    parentRelationAdd(value) {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitAdd(kUnit, addNode, 'hasParentNode');
        this.kUnitAdd(addNode, kUnit, 'hasChildNode');
        this.props.updatePath(addNode._id, kUnit._id, 'add');
    }

    childRelationAdd(value) {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitAdd(kUnit, addNode, 'hasChildNode');
        this.kUnitAdd(addNode, kUnit, 'hasParentNode');
        this.props.updatePath(kUnit._id, addNode._id, 'add');
    }

    relyByRelationAdd = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitAdd(kUnit, addNode, 'hasBeRelyByNode');
        this.kUnitAdd(addNode, kUnit, 'hasRelyOnNode');
        console.log(kUnit, addNode)
    }

    relyOnRelationAdd = (value) => {
        console.log(this)
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitAdd(kUnit, addNode, 'hasRelyOnNode');
        this.kUnitAdd(addNode, kUnit, 'hasBeRelyByNode');
    };

    relateRelationAdd(value) {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitAdd(kUnit, addNode, 'hasRelateNode');
        this.kUnitAdd(addNode, kUnit, 'hasRelateNode');
    }


    synonymRelationAdd = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitAdd(kUnit, addNode, 'hasSynonymNode');
        this.kUnitAdd(addNode, kUnit, 'hasSynonymNode');
    }

    onNextLKnowledgeAdd = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        kUnit.hasNextNode.splice(0, 1, addNode);
        addNode.hasPrevNode.splice(0, 1, kUnit)
    };

    onPrevLKnowledgeAdd = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        kUnit.hasPrevNode.splice(0, 1, addNode);
        addNode.hasNextNode.splice(0, 1, kUnit)
    };


    parentRelationDel(value) {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitDel(kUnit, addNode, 'hasParentNode');
        this.kUnitDel(addNode, kUnit, 'hasChildNode');
        this.props.updatePath(addNode._id, kUnit._id, 'del');
    }

    childRelationDel(value) {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitDel(kUnit, addNode, 'hasChildNode');
        this.kUnitDel(addNode, kUnit, 'hasParentNode');
        this.props.updatePath(kUnit._id, addNode._id, 'del');
    }

    relyByRelationDel = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitDel(kUnit, addNode, 'hasBeRelyByNode');
        this.kUnitDel(addNode, kUnit, 'hasRelyOnNode');
        console.log(kUnit, addNode)
    }

    relyOnRelationDel = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitDel(kUnit, addNode, 'hasRelyOnNode');
        this.kUnitDel(addNode, kUnit, 'hasBeRelyByNode');
    }

    relateRelationDel(value) {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitDel(kUnit, addNode, 'hasRelateNode');
        this.kUnitDel(addNode, kUnit, 'hasRelateNode');
    }

    synonymRelationDel = (value) => {
        let kUnit = this.state.kUnit;
        let addNode = this.getkUnitObjectById(value);
        this.kUnitDel(kUnit, addNode, 'hasSynonymNode');
        this.kUnitDel(addNode, kUnit, 'hasSynonymNode');
    }

    getkUnitObjectById = (id) => {
        const kUnits = this.props.knowledgeUnitList;
        for (let index in kUnits) {
            if (kUnits[index]._id === id) {
                return kUnits[index]
            }
        }
    };

    kUnitAdd = (targetNode, addUnit, type) => {
        targetNode[type].push(addUnit);
    };

    kUnitDel = (targetNode, addUnit, type) => {
        let idx = targetNode[type].indexOf(addUnit);
        targetNode[type].splice(idx, 1)
    };


    onSelect = (value) => {

    };

    onKnowledgeSynonymChanged = (data) => {
        console.log(data);
        let kUnit = this.state.kUnit;
        kUnit.synonym = data;
        this.setState({
            kUnit: kUnit
        })
    };

    onThumbnailUrlSelect = (data) => {
        let kUnit = this.state.kUnit;
        kUnit.thumbnailUrl = data
        this.props.onUpdateUrlAndName(kUnit._id, 'thumbnail', data);
        this.setState({
            kUnit: kUnit
        })
    }

    componentDidMount() {
        const token = localStorage.getItem('token');
        fetch('/materials?username=' + this.props.username, {
            method: 'GET',
            headers: {
                "Authorization": token,
            }
        })
            .then(res => res.json())
            .then(res => {
                if (res && res.status === 'success') {
                    this.setState({
                        materialList: res.data
                    });
                }
            })
            .catch(err => console.log(err));

    }

    render() {
        const kUnit = this.state.kUnit;
        const knowledgeUnitList = this.props.knowledgeUnitList;
        const children = [];
        for (let index in knowledgeUnitList) {
            if (knowledgeUnitList[index]._id !== kUnit._id) {
                children.push(<Option key={knowledgeUnitList[index]._id}>{knowledgeUnitList[index].title}</Option>);
            }
        }

        const synonym = [];
        for (let index in kUnit.synonym) {
            synonym.push(<Option key={kUnit.synonym[index]}>{kUnit.synonym[index]}</Option>);
        }


        let defaultChildren = {
            hasParentNode: [],
            hasBeRelyByNode: [],
            hasRelyOnNode: [],
            hasRelateNode: [],
            hasChildNode: [],
            hasSynonymNode: [],
            hasPrevNode: [],
            hasNextNode: []
        };

        for (let item in defaultChildren) {
            if (kUnit[item]) {
                kUnit[item].map((object) => {
                    defaultChildren[item].push(object._id);
                })
            }
        }

        const imageList = []
        const materialList = this.state.materialList;
        for (let index in materialList) {
            if (materialList[index]) {
                if (materialList[index].type === '图片') {
                    imageList.push(<Option key={materialList[index].url}>{materialList[index].title}</Option>);
                }

            }
        }


        return (
            <div id="kEditorContainerArea" className="kEditorContainerArea">
                <div id="kEditorContainer" className="kEditorContainer">
                    <EditorHeader closeBtn={this.cancelHandler}/>
                    <div id="kEditorBody" className="kEditorBody">
                        <Row gutter={16}>
                            <Col className="gutter-row" span={12}>
                                <section id="skUnitInfo" className="skUnitInfo">
                                    <div className="kUnitInfo" onChange={this.kUnitInfoChange}>
                                        <section>
                                            <label>知识点名称</label>
                                            <Input
                                                id="title"
                                                size="small"
                                                defaultValue={kUnit.title}
                                            />
                                        </section>
                                        <section>
                                            <label>知识点缩略图</label>
                                            <Select
                                                label="知识点缩略图"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={kUnit.thumbnailUrl}
                                                onSelect={this.onThumbnailUrlSelect}
                                            >
                                                {imageList}
                                            </Select>
                                            {/*<Input*/}
                                            {/*id="thumbnailUrl"*/}
                                            {/*size="small"*/}
                                            {/*defaultValue={kUnit.thumbnailUrl}*/}
                                            {/*/>*/}
                                        </section>
                                        <section>
                                            <label>知识点大纲要求难度（0-100）</label>
                                            <Input
                                                id="demand"
                                                size="small"
                                                defaultValue={kUnit.demand}
                                            />
                                        </section>
                                        <section>
                                            <label>知识点学生掌握程度（0-100）</label>
                                            <Input
                                                id="achieve"
                                                size="small"
                                                defaultValue={kUnit.achieve}
                                            />
                                        </section>
                                        <section>
                                            <label>知识点同义词</label>
                                            <Select
                                                mode="tags"
                                                style={{width: '100%'}}
                                                placeholder="知识点同义词"
                                                onChange={this.onKnowledgeSynonymChanged}
                                                defaultValue={kUnit.synonym}
                                                id="synonym"
                                            >
                                                {synonym}
                                            </Select>
                                        </section>
                                    </div>
                                </section>
                                <section id="skUnitUrl" className="skUnitUrl">
                                    <div className="kUnitUrl">
                                        <img src={this.state.kUnit.thumbnailUrl}/>
                                    </div>
                                </section>
                            </Col>
                            <Col className="gutter-row" span={12}>
                                <section id="skUnitRelation" className="skUnitRelation">
                                    <div className="kUnitRelation">
                                        <div id="parentNode" className="parentNode">
                                            <label>父知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                label="父知识点"
                                                mode="multiple"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasParentNode}
                                                onSelect={this.parentRelationAdd}
                                                onDeselect={this.parentRelationDel}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="containNode" className="containNode">
                                            <label>子知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                mode="multiple"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasChildNode}
                                                onSelect={this.childRelationAdd}
                                                onDeselect={this.childRelationDel}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="relyNode" className="relyNode">
                                            <label>受依赖知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                mode="multiple"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasBeRelyByNode}
                                                onSelect={this.relyByRelationAdd}
                                                onDeselect={this.relyByRelationDel}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="relyNode" className="relyNode">
                                            <label>依赖的知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                mode="multiple"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasRelyOnNode}
                                                onSelect={this.relyOnRelationAdd}
                                                onDeselect={this.relyOnRelationDel}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="relatedNode" className="relatedNode">
                                            <label>相关知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                mode="multiple"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasRelateNode}
                                                onSelect={this.relateRelationAdd}
                                                onDeselect={this.relateRelationDel}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="synonymNode" className="synonymNode">
                                            <label>同义知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                mode="multiple"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasSynonymNode}
                                                onSelect={this.synonymRelationAdd}
                                                onDeselect={this.synonymRelationDel}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="parallelNode" className="parallelNode">
                                            <label>上一个知识点</label>
                                            <Select

                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasPrevNode}
                                                onSelect={this.onPrevLKnowledgeAdd}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                        <div id="parallelNode" className="parallelNode">
                                            <label>下一个知识点</label>
                                            <Select
                                                showSearch
                                                autoClearSearchValue={false}
                                                optionFilterProp="children"
                                                style={{width: '100%'}}
                                                placeholder="请选择"
                                                defaultValue={defaultChildren.hasNextNode}
                                                onSelect={this.onNextLKnowledgeAdd}
                                            >
                                                {children}
                                            </Select>
                                        </div>
                                    </div>
                                </section>
                                <section id="skUnitBtn" className="skUnitBtn">
                                    <div id="kUnitBtn">
                                        <Button onClick={this.tUnitEdit}>编辑教学单元</Button>
                                        <br/>
                                        <br/>
                                        <Button onClick={this.saveHandler}>保存</Button>


                                    </div>
                                </section>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        )
    }
}


const EditorHeader = ({closeBtn}) => {
    return (
        <div id="editorHeader" className="editorHeader">
            <span onClick={closeBtn}>×</span>
        </div>)

};

export default KnowledgeEditor

