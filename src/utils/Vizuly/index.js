import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';


import fetch from 'isomorphic-fetch';
import request from '../netService/request';

import InfiniteScroll from 'react-infinite-scroller';

import {KnowledgePreview} from '../index'

import {List, Avatar, Spin} from 'antd';

import {Row, Col, Button} from 'antd';


import * as d3 from 'd3';
import vizuly from './weightedtree/lib/vizuly_core.min';
import './weightedtree/lib/vizuly_weightedtree.min';

import './lib/styles/vizuly.css';
import './lib/styles/vizuly_weightedtree.css';

import CSVFILE from './weightedtree/data/weightedtree_federal_budget.csv';

class VizulyWeightedTree extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.viz_container = d3.selectAll("#viz_container");
        this.viz = undefined;
        this.theme = undefined;
        // this.data = {
        //     values: props.data,
        // };
        this.data = props.data;
        // stores the currently selected value field
        this.valueField = "Federal";
        this.valueFields = ["Federal", "State", "Local"];

        this.loadData = this.loadData.bind(this);
        this.prepData = this.prepData.bind(this);
        this.initialize = this.initialize.bind(this);
        this.trimLabel = this.trimLabel.bind(this);
        this.onMeasure = this.onMeasure.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onClick = this.onClick.bind(this);
        this.changeSkin = this.changeSkin.bind(this);
        this.changeSize = this.changeSize.bind(this);
        this.changeData = this.changeData.bind(this);
        this.onDBClick = this.onDBClick.bind(this);
    }

    loadData() {
        let {data, initialize, prepData} = this;
        d3.csv(CSVFILE, function (csv) {
            data.values = prepData(csv);
            //console.log(data.values);
            initialize();
        });
    }

    prepData(csv) {
        let values = [];
        let {valueFields} = this;
        //Clean federal budget data and remove all rows where all values are zero or no labels
        csv.forEach(function (d, i) {
            let t = 0;
            for (let i = 0; i < valueFields.length; i++) {
                t += Number(d[valueFields[i]]);
            }
            if (t > 0) {
                values.push(d);
            }
        });

        //Make our data into a nested tree.  If you already have a nested structure you don't need to do this.
        let nest = d3.nest()
            .key(function (d) {
                return d.Level1;
            })
            .key(function (d) {
                return d.Level2;
            })
            .key(function (d) {
                return d.Level3;
            })
            .entries(values);


        //This will be a viz.data function;
        vizuly.core.util.aggregateNest(nest, valueFields, function (a, b) {
            return Number(a) + Number(b);
        });

        //Remove empty child nodes left at end of aggregation and add unqiue ids
        function removeEmptyNodes(node, parentId, childId) {
            if (!node) return;
            node.id = parentId + "_" + childId;
            if (node.values) {
                for (var i = node.values.length - 1; i >= 0; i--) {
                    node.id = parentId + "_" + i;
                    if (!node.values[i].key && !node.values[i].Level4) {
                        node.values.splice(i, 1);
                    }
                    else {
                        removeEmptyNodes(node.values[i], node.id, i)
                    }
                }
            }
        }

        var node = {};
        node.values = nest;
        removeEmptyNodes(node, "0", "0");


        // var blob = JSON.stringify(nest);

        return nest;
    }

    initialize() {
        let {trimLabel, onMeasure, onMouseOver, onMouseOut, onClick, onDBClick} = this;
        const _this = this;
        this.data = this.props.data;
        if (!this.data) {
            return
        }

        _this.viz = vizuly.viz.weighted_tree(document.getElementById("viz_container"));

        //Here we create three vizuly themes for each radial progress component.
        //A theme manages the look and feel of the component output.  You can only have
        //one component active per theme, so we bind each theme to the corresponding component.
        _this.theme = vizuly.theme.weighted_tree(_this.viz).skin(vizuly.skin.WEIGHTED_TREE_AXIIS);

        //Like D3 and jQuery, vizuly uses a function chaining syntax to set component properties
        //Here we set some bases line properties for all three components.
        _this.viz.data(_this.data)                                                      // Expects hierarchical array of objects.
            .width(1000)                                                     // Width of component
            .height(800)                                                    // Height of component
            // .children(d => d.values)
            .children(function (d) {
                return d.children
            })                     // 指定哪个属性是子节点
            .key(function (d) {
                return d._id
            })                              // 唯一值
            // .key(d => d.name)
            // .value(d => d.agg_Local)
            .value((d, i) => d.value)// 指定粗细的属性
            // .value(function (d) { return d.value;})// 指定粗细的属性
            .fixedSpan(-1)                                                  // fixedSpan > 0 will use this pixel value for horizontal spread versus auto size based on viz width
            .branchPadding(.07)
            // .label(function (d) { return trimLabel(d.key || (d['Level' + d.depth]))}) // returns label for each node.
            .label(d => d.title) // 指定显示的浮动标签
            .on("measure", onMeasure)                                        // Make any measurement changes
            .on("mouseover", onMouseOver)                                    // mouseover callback - all viz components issue these events
            .on("mouseout", onMouseOut)                                      // mouseout callback - all viz components issue these events
            .on("click", onClick)                                         // mouseout callback - all viz components issue these events
            .on("dblclick", onDBClick);

        //We use this function to size the components based on the selected value from the RadiaLProgressTest.html page.
        // changeSize(d3.select("#currentDisplay").attr("item_value"));

        _this.viz.update();

        // Open up some of the tree branches.
        // _this.viz.toggleNode(_this.data.values[2]);
        // _this.viz.toggleNode(_this.data.values[2].values[0]);
        // _this.viz.toggleNode(_this.data.values[3]);
    }


    trimLabel(label) {
        return (String(label).length > 20) ? String(label).substr(0, 17) + "..." : label;
    }

    onMeasure() {
        // Allows you to manually override vertical spacing
        // viz.tree().nodeSize([100,0]);
    }

    onMouseOver(e, d, i) {
        let {data, viz, valueField} = this;

        //console.log("mouse over");
        // if (d == data) return;
        // let rect = e.getBoundingClientRect();
        // if (d.target) d = d.target; //This if for link elements
    }

    onMouseOut(e, d, i) {
        d3.selectAll(".vz-weighted_tree-tip").remove();
    }

    //We can capture click events and respond to them
    onClick(g, d, i) {
        this.viz.toggleNode(d);
    }


    onDBClick(e, d, i) {
        let data = this.props.originData;
        for (let index in data) {
            if (data[index]._id === d.vz_tree_id) {
                if (data[index].teachUnit.mCourseUnit.material.url) {
                    let temp = [];
                    for (let i in data[index].teachUnit.aCourseUnit) {
                        temp.push(data[index].teachUnit.aCourseUnit[i])
                    }
                    ReactDOM.render(
                        <KnowledgePreview
                            onNextCourse={this.onNextCourse}
                            onPrevCourse={this.onPrevCourse}
                            kUnit={data[index]}
                        />
                        , document.getElementById('videoArea')
                    )
                } else {
                    alert('当前知识点未设置课程')
                }

            }
        }


    }

    onNextCourse = (id) => {
        let data = this.props.originData;
        for (let index in data) {
            if (data[index]._id === id) {
                console.log(data[index])
                if (data[index].hasNextNode) {
                    console.log('111')
                    let nextid = data[index].hasNextNode[0];
                    for (let k in data) {
                        if (data[k]._id === nextid) {
                            if (true) {//data[k].teachUnit.mCourseUnit.material.url
                                let temp = [];
                                for (let i in data[k].teachUnit.aCourseUnit) {
                                    temp.push(data[k].teachUnit.aCourseUnit[i])
                                }
                                ReactDOM.unmountComponentAtNode(document.getElementById('videoArea'));
                                ReactDOM.render(
                                    <KnowledgePreview
                                        onNextCourse={this.onNextCourse}
                                        onPrevCourse={this.onPrevCourse}
                                        kUnit={data[k]}
                                    />
                                    , document.getElementById('videoArea')
                                )
                            }else{
                               alert('下一节未设置资源')

                            }
                        }
                    }
                }
            }
        }

    };


    onPrevCourse = (id) => {
        let data = this.props.originData;
        for (let index in data) {
            if (data[index]._id === id) {
                if (data[index].hasPrevNode) {
                    let nextid = data[index].hasPrevNode[0];
                    for (let k in data) {
                        if (data[k]._id === nextid) {
                            if (true) {//data[k].teachUnit.mCourseUnit.material.url
                                let temp = [];
                                for (let i in data[k].teachUnit.aCourseUnit) {
                                    temp.push(data[k].teachUnit.aCourseUnit[i])
                                }

                                ReactDOM.unmountComponentAtNode(document.getElementById('videoArea'));
                                ReactDOM.render(
                                    <KnowledgePreview
                                        onNextCourse={this.onNextCourse}
                                        onPrevCourse={this.onPrevCourse}
                                        kUnit={data[k]}
                                    />
                                    , document.getElementById('videoArea')
                                )
                            }
                        }
                    }
                }
            }
        }

    };

    //This function is called when the user selects a different skin.
    changeSkin(val) {
        const {theme, viz} = this;

        if (val == "None") {
            theme.release();
        }
        else {
            theme.viz(viz);
            theme.skin(val);
        }

        viz().update();  //We could use theme.apply() here, but we want to trigger the tween.
    }

    //This changes the size of the component by adjusting the width/height;
    changeSize(val) {
        let {viz_container, viz} = this;

        var s = String(val).split(",");
        viz_container.transition().duration(300).style('width', s[0] + 'px').style('height', s[1] + 'px');
        viz.width(s[0]).height(s[1] * .8).update();
    }

    //This sets the same value for each radial progress
    changeData(val) {
        this.valueField = this.valueFields[Number(val)];
        this.viz.update();
    }

    componentDidMount() {
        // this.loadData();

        const token = localStorage.getItem('token');
        request.get('/getCourse', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            query: {
                id: this.props.projectId
            }
        })
            .then(res => {
                this.props.onInit(res, this.initialize)
            })
            .catch(err => console.log(err));

    }

    render() {
        return (
            <div className="container" style={{width: "100%", height: "100%"}}>
                <div
                    id="viz_container"
                    className="z-depth-3"
                    style={{
                        height: '100%',
                        width: '100%'
                    }}>
                    <div id="videoArea"/>
                </div>

            </div>

        );

    }

}


class TeachUnitEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            videoUrl: this.props.videoUrl,
            adata: this.props.aCUnit,
            tUnitId: this.props.tUnitId,
            tUnit: props.tUnit
        };
        this.cancelEditor = this.cancelEditor.bind(this);
    }

    cancelEditor() {
        ReactDOM.unmountComponentAtNode(document.getElementById('videoArea'));
    }

    componentDidMount() {

    }

    render() {


        return (
            <div id="editorContainerArea" className="editorContainerArea">
                <div id="editorContainer" className="editorContainer" style={{height: '425px', width: '1065px'}}>
                    <EditorHeader closeBtn={this.cancelEditor} title={this.props.title}/>
                    <div id="editorBody" className="editorBody">
                        <Row gutter={16} style={{height: '100%'}}>
                            <Col className="gutter-row" span={16} style={{height: '100%'}}>
                                <div id="videoContainer" className="videoContainer"
                                     style={{height: '100%', textAlign: 'center'}}>
                                    <video style={{height: '100%'}} id="editor-video" src={this.state.videoUrl}
                                           controls="controls" ref="view"/>
                                </div>
                            </Col>
                            <Col className="gutter-row" span={8}>
                                <AidList
                                    adata={this.state.adata}
                                />
                            </Col>
                        </Row>
                        <Row gutter={16} style={{height: '100%'}}>
                            <Col className="gutter-row" span={8}>
                                <Button
                                    onClick={(e) => {
                                        this.props.onPrevCourse(this.state.tUnitId)
                                    }}
                                >上一节</Button>
                                <Button
                                    onClick={(e) => {
                                        this.props.onNextCourse(this.state.tUnitId)
                                    }}
                                >下一节</Button>
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>

        )
    }
}


const PlayArea = (props) => {
    if (props.tUnitId.type === '视频') {
        return (
            <video style={{height: '100%'}} id="editor-video" src={props.videoUrl}
                   controls="controls" ref="view"/>
        )
    } else {
        return (
            <video style={{height: '100%'}} id="editor-video" src={{}}
                   controls="controls" ref="view"/>
        )
    }

}

const EditorHeader = ({closeBtn, title}) => {
    return (
        <div id="editorHeader" className="editorHeader">
            <span style={{fontSize: '17px', position: 'absolute', left: '5px'}}>课程名称：{title}</span>
            <span onClick={closeBtn}>×</span>
        </div>)

};

class AidList extends Component {
    state = {
        aCUnit: this.props.aCUnit,
        loading: false,
        hasMore: true
    };
    handleInfiniteOnLoad = () => {

    };

    render() {
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
                        dataSource={this.props.adata}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    title={<a target="_blank"
                                              href={`http://localhost:3001${item.material.url}`}>{item.title}</a>}
                                />

                            </List.Item>
                        )}
                    />
                </InfiniteScroll>
            </div>
        )
    }

};


export {VizulyWeightedTree};