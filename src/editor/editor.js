import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {withRouter} from 'react-router-dom';
import queryString from 'query-string';
import $ from 'jquery';
import './editor.css';
import {KnowledgeUnit} from './componentConstructor';
import {createElement, path_container_construct} from '../utils/utils';
import fetch from 'isomorphic-fetch';

import KnowledgeEditor from './knowledge-editor';
import 'jquery-mousewheel'

import {Input, Button, Modal, Form, Select} from 'antd';

const FormItem = Form.Item;
const Option = Select.Option;
const OptGroup = Select.OptGroup;

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            knowledgeUnitList: [],
            projectId: '',
            username: '',
            projectName: '',
            thumbnailUrl: '',
            description: '',
            startPosition: {
                x: 250,
                y: 300
            },
            projectDataFetched: false,
            path_container: [],
            visible: false
        };
        this.canvasConstructor = this.canvasConstructor.bind(this);
        this.getKnowledgeObjectById = this.getKnowledgeObjectById.bind(this);
        this.buttonEdit = this.buttonEdit.bind(this);
        this.onTeachUnitChanged = this.onTeachUnitChanged.bind(this);
        this.updateKnowledgeUnit = this.updateKnowledgeUnit.bind(this);
        this.onUpdateUrlAndName = this.onUpdateUrlAndName.bind(this);
        this.getProjectData = this.getProjectData.bind(this);
        this.updateProjectName = this.updateProjectName.bind(this);
        this.saveProject = this.saveProject.bind(this);
    }

    showModal = () => {
        this.setState({
            visible: true,
        });
    }

    handleCreate = () => {
        console.log('handleCreate')
        let updateOptions = {}
        const form = this.formRef.props.form;
        form.validateFields((err, values) => {
            console.log(values)
            if (err) {
                return;
            }
            updateOptions.projectName = values.title || '';
            updateOptions.description = values.description || '';
            updateOptions.thumbnailUrl = values.thumbnailUrl || '';
            updateOptions.visible = false;
            console.log(updateOptions);

            form.resetFields();
            this.setState(updateOptions);
        });
    }
    handleCancel = (e) => {
        console.log('handleCancel');
        this.setState({
            visible: false,
        });
    }

    saveFormRef = (formRef) => {
        this.formRef = formRef;
    }

    canvasConstructor(canvas, dragBox, options, callback) {
        let control = {};
        let basicOptions = {
            imgClassOnList: 'canvas-api-img-main',
            imgClassOnCanvas: 'canvas-api-img-main',
            // imgBoxClass: 'canvas-api-imgbox',
            imgBoxClass: 'imgbox',
            imgBoxClassOnCanvas: 'canvas-api-imgbox',
            startClass: 'canvas-api-start',
            pathCollect: 'canvas-api-path-collect',
            butnEditorId: 'editBtn',
            removeButtonClass: 'canvas-api-remove-butn',
            removeButtonPosition: null,
            removeButnColor: '#1890ff',
            circle: 'canvas-api-circle',
            circleSize: [20, 20],
            floatImgOpacity: 0.7,
            hightLightColor: '#34a3cf',
            pathAboveColor: '#000',
            pathBottomColor: '#fff',
            pathAboveWidth: 2,
            pathHighLight: 'black',
            pathBottomWidth: 3,
            arrowBottom: 4,
            arrowHeight: 6
        };

        let targetUrl = null;
        let scale = 1;
        let path_container = this.state.path_container;
        let path_from = null;
        let _this = this;

        function updateBasicOptions(options) {
            for (let item in options) {
                basicOptions[item] = options[item];
            }
        }

        function createCanvas(canvas, dragBox) {
            if (typeof (canvas) === 'string' && typeof (dragBox) === 'string' && canvas !== null && dragBox !== null) {
                initCanvas(canvas, dragBox);
            } else {
                console.log('error,canvas/dragBox undefined');
            }
        }

        function initCanvas(canvas, dragBox) {
            let transform = createElement('div').addClass('canvasTransform').attr('id', 'canvasTransform');
            let start = createElement('div').addClass(basicOptions.startClass).attr('id', 'transStart').text('Thing');
            let imgContainer = createElement('div').addClass('canvasTransform').attr('id', 'trans-img-cont');
            let svgContainer = createElement('div').addClass('canvasTransform').attr('id', 'trans-svg-cont');

            let remove = $('#deleteBtn').addClass(basicOptions.removeButtonClass);
            $(canvas).append(transform.append(start, imgContainer, svgContainer)).css('overflow', 'hidden');
            //basicOptions.removeButtonPosition ? $('#' + basicOptions.removeButtonPosition).append(remove) : $(canvas).append(remove);
            getElementsCtrl(canvas, transform, svgContainer, imgContainer, start, dragBox, remove);
            control.remove.attr('disabled', 'disabled');
            control.butnEditor.attr('disabled', 'disabled');
        }

        function getInitPositionOfStart(start) {
            let initPositionOfStart = {
                x: parseInt(start.css('left').match(/[^px]+/)),
                y: parseInt(start.css('top').match(/[^px]+/))
            };
            console.log(initPositionOfStart);
            return initPositionOfStart;
        }

        function getElementsCtrl(canvas, trans, svgCont, imgCont, start, dragBox, remove) {
            control.canvas = $(canvas);
            control.dragBox = $(dragBox);
            control.trans = trans;
            control.svgCont = svgCont;
            control.imgCont = imgCont;
            control.start = start;
            control.remove = remove;
            control.butnEditor = $('#' + basicOptions.butnEditorId);
        }

        function setEvent(canvas, dragBox, canv, info, callback) {

            let css_trans_origin = $(control.trans).css('transform-origin').match(/\d+/g);
            let css_trans_offset = $(control.trans).offset();
            let fn = new func(control, basicOptions);

            fn.init();

            fn.hover(control.svgCont);

            fn.dragBox.bind({
                'mousedown': function (e) {
                    if (e.button !== 0) return;
                    let ele = fn.getTarget(e);
                    if (ele.attr('id') === "dragBox") {
                        let dragBoxGhost = addDragBoxGhost(e, ele);
                        $(document).bind({
                            'mousemove': function (e) {
                                e.preventDefault();
                                let dragBoxSize = getELemSize(control.dragBox);
                                dragBoxGhost.offset({
                                    left: e.clientX - dragBoxSize[0] * scale,
                                    top: e.clientY - dragBoxSize[1] * scale
                                });
                            },
                            'mouseup': function (e) {

                                let newElementInfo = fn.createBoxOnCanvas(e, dragBoxGhost);
                                if (newElementInfo) {
                                    let knowledgeUnitList = _this.state.knowledgeUnitList;
                                    knowledgeUnitList.push(newElementInfo);
                                    _this.setState({
                                        knowledgeUnitList: knowledgeUnitList
                                    });
                                }
                                $(document).unbind();
                            }
                        });
                    }
                }
            });

            fn.canvas.bind({
                'mousedown': function (e) {
                    if (e.button !== 0) return;
                    let ele = fn.getTarget(e);
                    let trans_position = fn.trans.offset();
                    let click_position = fn.get_click_position(e);
                    let click_position_on_img = fn.get_click_position_on_img(e, ele);
                    if (ele.hasClass(basicOptions.imgBoxClass) || ele.attr('id') === control.start.attr('id')) {
                        //开始按钮绑定的事件
                        fn.canvas_input_disabled($(this), ele);
                        $(document).bind({
                            'mousemove': function (e) {
                                e.preventDefault();
                                fn.move_canvas_ele(e, ele, click_position_on_img);
                            },
                            'mouseup': function (e) {
                                //No.2 发送元素移动信息，发送元素移动后的新位置信息 position{x: , y: };
                                let newPositionInfo = fn.canvas_input_abled(control.imgCont, ele);
                                if (ele.attr('id') === control.start.attr('id')) {
                                    _this.setState({
                                        startPosition: newPositionInfo.position
                                    })
                                } else {
                                    let kUnit = _this.getKnowledgeObjectById(newPositionInfo._id)
                                    kUnit.position = newPositionInfo.position;
                                    //callback ? callback('pushNewPosition', newPositionInfo) : '';
                                }
                                $(document).unbind();
                            }
                        });
                    } else if (ele.attr('id') === control.canvas.attr('id')) {
                        //画布绑定的事件
                        fn.canvas_input_disabled($(this));
                        $(document).bind({
                            'mousemove': function (e) {
                                e.preventDefault();
                                fn.move_canvas(e, click_position, trans_position, css_trans_origin, css_trans_offset);
                            },
                            'mouseup': function (e) {
                                fn.canvas_input_abled(control.imgCont);
                                $(document).unbind();
                            }
                        });
                    }

                },
                'click': function (e) {
                    let ele = fn.getTarget(e);
                    if (ele.attr('class') === basicOptions.imgBoxClass) {
                        fn.ele_highLight(ele, this);
                        removeButnHighLight(true);
                        editorButnHighLight(true);
                        path_highLight_ended();
                    } else if (ele.hasClass(basicOptions.circle) || ele.parents('.' + basicOptions.circle)[0]) {
                        let svgobj;
                        ele = fn.search_ele(ele.parents('.' + basicOptions.circle));
                        svgobj = fn.ready_for_path(ele);
                        removeButnHighLight(false);
                        editorButnHighLight(false);
                        path_highLight_ended();
                        $(document).bind({
                            'mousemove': function (e) {
                                e.preventDefault();
                                fn.path_moving(e, svgobj, ele);
                            }
                        });
                    } else if (ele.attr('class') === basicOptions.pathCollect) {
                        //No.3 发送添加新路径请求，发送新路径的 fromId 和 targetId
                        fn.staticed_path(ele.parent());
                        //callback ? callback('pushNewPath', newPathInfo) : '';
                        $(document).unbind();
                    } else if (ele[0].tagName === 'path') {
                        cancle_img_highLight(fn);
                        fn.path_highLight(ele.parent());
                        removeButnHighLight(true);
                        editorButnHighLight(false);
                    } else {
                        fn.recover_canvas();
                        removeButnHighLight(false);
                        editorButnHighLight(false);
                        path_highLight_ended();
                    }
                },
                'mousewheel': function (e, delta) {
                    fn.zoom(delta);
                }
            });

            fn.removeButn.bind('click', function (e) {
                let type = '';
                let elmId = '';
                let butnId = '';
                let butnArray = [];
                e.stopPropagation();
                if ($(this).hasClass('remove-active')) {
                    let ele = fn.canvas.find('.chosen');
                    if (ele.hasClass(fn.imgBox)) {
                        type = 'delElement';
                    } else if (ele[0].tagName === 'svg') {
                        type = 'delPath';
                    }
                    path_container.map(function (c) {
                        if (c.from === ele[0]) {
                            remove_ele(c, fn);
                        } else if (c.to === ele[0]) {
                            if (c.from.id === fn.start.attr('id')) {
                                butnArray.push({elmId: 'isStart', butnId: c.to.id});
                            } else {
                                butnArray.push({elmId: c.from.id, butnId: c.to.id});
                            }
                            remove_ele(c, fn);
                        } else if (c.path === ele[0]) {
                            console.log(c)
                            butnId = c.to.id;
                            if (c.from.id === fn.start.attr('id')) {
                                elmId = 'isStart';
                            } else {
                                elmId = c.from.id;
                            }
                            deletePath(c);
                            remove_ele(c, fn);
                        }
                    });
                    console.log(path_container)
                    //No.4 发送删除元素或路径的信息，发送要删除元素的id，或要删除路径的目标id，type='delElement'为删除元素，type='delPath'为删除路径
                    if (type === 'delElement') {
                        ele.remove();
                        $(ele[0].circle).remove();
                        callback ? callback(type, {elmId: ele.attr('id'), butn: butnArray}) : '';
                        let kUnit = _this.getKnowledgeObjectById(ele.attr('id'));
                        deleteKnowledgeUnit(kUnit);

                    } else if (type === 'delPath') {
                        callback ? callback(type, {butn: [{elmId: elmId, butnId: butnId}]}) : '';
                    } else {
                        console.log('error! no such element!');
                    }
                    removeButnHighLight(false);
                    editorButnHighLight(false);
                }
            });

        }

        function deletePath(pathObject) {
            let pathFrom, pathTo;

            pathFrom = _this.getKnowledgeObjectById(pathObject.from.id);
            pathTo = _this.getKnowledgeObjectById(pathObject.to.id);

            unlink(pathFrom, pathObject.to.id, 'hasChildNode');
            unlink(pathTo, pathObject.from.id, 'hasParentNode');
            _this.updateKnowledgeUnit(pathFrom);
            _this.updateKnowledgeUnit(pathTo);

        }

        function unlink(kUnit, targetId, type) {
            for (let idx in kUnit[type]) {
                if (kUnit[type][idx]._id === targetId) {
                    kUnit[type].splice(idx, 1);
                }
            }
            return kUnit
        }

        function deleteKnowledgeUnit(kUnit) {
            let tempUnit;
            let KnowledgeObjects = _this.state.knowledgeUnitList;
            if (kUnit.hasParentNode.length !== 0) {
                for (let index in kUnit.hasParentNode) {
                    tempUnit = _this.getKnowledgeObjectById(kUnit.hasParentNode[index]._id);
                    _this.updateKnowledgeUnit(unlink(tempUnit, kUnit._id, 'hasChildNode'))
                }
            }
            if (kUnit.hasChildNode.length !== 0) {
                for (let index in kUnit.hasChildNode) {
                    tempUnit = _this.getKnowledgeObjectById(kUnit.hasChildNode[index]._id);
                    _this.updateKnowledgeUnit(unlink(tempUnit, kUnit._id, 'hasParentNode'))
                }
            }
            for (let index in KnowledgeObjects) {
                if (KnowledgeObjects[index]._id === kUnit._id) {
                    KnowledgeObjects.splice(parseInt(index), 1);
                    _this.setState({
                        knowledgeUnitList: KnowledgeObjects
                    });
                }
            }
        }

        function func(ctrl, basicOptions) {
            this.trans = ctrl.trans;
            this.canvas = ctrl.canvas;
            this.svgContainer = ctrl.svgCont;
            this.imgContainer = ctrl.imgCont;
            this.dragBox = ctrl.dragBox;
            this.removeButn = ctrl.remove;

            this.circleCover = basicOptions.circle;
            this.start = ctrl.start;
            this.imgBox = basicOptions.imgBoxClass;
            this.pathCollect = basicOptions.pathCollect;
        }

        func.prototype.getTarget = function (e) {
            e = e || window.event;
            return $(e.srcElement || e.target);
        }

        func.prototype.stop_broswer = function (e) {
            e = e || window.event;
            if (e.preventDefault) {
                e.preventDefault();
            }
            else {
                e.returnValue = false;
            }
        }

        func.prototype.get_click_position = function (e) {
            e = e || window.event;
            return {
                left: e.clientX,
                top: e.clientY
            };
        }

        func.prototype.init = function () {
            const fun = this;
            let info = _this.state.knowledgeUnitList;
            fun.start[0].circle = create_circle(fun.start, fun);
            fun.start.css({
                'left': _this.state.startPosition.x + 'px',
                'top': _this.state.startPosition.y + 'px'
            });
            circle_comewith_ele(fun.start);

            info.map(function (elm) {
                let div = createNewElement(fun, elm._id, elm.thumbnailUrl, elm.videoUrl);
                div.css({
                    'left': elm.position.x + 'px',
                    'top': elm.position.y + 'px'
                });
                div[0].circle = create_circle(div, fun);
                div.children('input').attr('value', elm.title);
            });
            info.map(function (elm) {
                for (let item in elm) {
                    if (item === 'root' && elm[item] === true) {
                        add_path($('#transStart'), fun);
                        static_path($('#' + elm._id), $('#transStart'), fun, 'init');
                    }
                    if (item === 'hasChildNode') {
                        for (let idx in elm[item]) {
                            add_path($('#' + elm._id), fun);
                            static_path($('#' + elm[item][idx]._id), $('#' + elm._id), fun, 'init');
                        }

                    }
                }
                // if (elm.isStart) {
                //     var svg = add_path(fun.start, fun);
                //     static_path($('#' + elm.id), fun.start, fun);
                // }
            });

        }

        func.prototype.get_click_position_on_img = function (e, ele) {
            var click_position = this.get_click_position(e);
            var ele_position = get_ele_position_of_window(ele);
            return {
                left: click_position.left - ele_position.left,
                top: click_position.top - ele_position.top
            };
        }

        /*
        func.prototype.add_float_img = function (e, _this) {
            var float_img = createElement('div');
            this.dragBox.append(float_img);
            targetUrl = set_floatImg_css(e, float_img, this, _this);
            return float_img;
        }
        */

        func.prototype.move_floatImg = function (e, floatImg) {
            var imgSize = get_img_size();
            floatImg.offset({
                left: e.clientX - imgSize[0] * scale,
                top: e.clientY - imgSize[1] * scale
            });
        }

        func.prototype.createBoxOnCanvas = function (e, dragBoxGhost) {
            if (this.getTarget(e).attr('id') === this.canvas.attr('id')) {
                dragBoxGhost.remove();
                return addImgOnCanvas(dragBoxGhost, e, this);
            }
            /*
            else if (typeof(animation) === 'object') {
                console.log('what')
                animation.displacementAnimation(dragBoxGhost.offset().left, dragBoxGhost.offset().top, img_ori_position.left, img_ori_position.top, dragBoxGhost, 0.8, true, scale);
                dragBoxGhost.remove();
                return null;
            }
            */
            else {
                dragBoxGhost.remove();
                return null;
            }
        };

        func.prototype.move_canvas_ele = function (e, ele, click_position_on_img) {
            var mouse_position = this.get_click_position(e);
            var trans_position = get_ele_position_of_window(this.trans);
            ele.css({
                'left': (mouse_position.left - trans_position.left - click_position_on_img.left) / scale,
                'top': (mouse_position.top - trans_position.top - click_position_on_img.top) / scale
            });
            for (var i in path_container) {
                if (ele[0] == path_container[i].from || ele[0] == path_container[i].to) {
                    path_move_with_img($(path_container[i].from), $(path_container[i].to), $(path_container[i].path));
                }
            }
            circle_comewith_ele(ele);
        };

        func.prototype.release_canvas_ele = function (e, _this) {
            unBind($(_this));
        };

        func.prototype.move_canvas = function (e, old_client_position, trans_position, css_trans_origin, css_trans_offset) {
            var originX, originY, trans_offset;
            var mouse_position = this.get_click_position(e);
            this.trans.offset(function (index, oldoffset) {
                return {
                    left: trans_position.left + mouse_position.left - old_client_position.left,
                    top: trans_position.top + mouse_position.top - old_client_position.top
                };
            });
            trans_offset = get_ele_position_of_window(this.trans);
            originX = (parseInt(css_trans_origin[0]) + css_trans_offset.left - trans_offset.left) / scale;
            originY = (parseInt(css_trans_origin[1]) + css_trans_offset.top - trans_offset.top) / scale;
            this.trans.css('transform-origin', originX + 'px ' + originY + 'px 0');
        }

        func.prototype.release_canvas = function (_this) {
            unBind($(_this));
        }

        func.prototype.ele_highLight = function (ele, _this) {
            $(_this).find('.' + this.imgBox).css({
                'box-shadow': '0 0 3px #000',
                'z-index': '10'
            }).removeClass('chosen');
            ele.css({
                'box-shadow': '0 0 0 5px #34a3cf',
                'z-index': '1000'
            }).addClass('chosen');
        }

        func.prototype.recover_canvas = function () {
            cancle_img_highLight(this);
            clear_path(this);
            recover_pointer_path_ended(this);
            path_from = null;
        }

        func.prototype.ready_for_path = function (ele) {
            var svg_ori_position = get_path_from_position(ele);
            var svg = add_path(ele, this);
            path_from = ele;
            add_mask(this);
            ele_block($('.' + this.pathCollect));
            ignore_pointer_during_path(this);
            return {
                svg: svg,
                svg_ori_position: svg_ori_position
            };
        }

        func.prototype.search_ele = function (ele) {
            if (this.start[0].circle == ele[0]) {
                return this.start;
            } else {
                var allImg = this.imgContainer.children(this.imgBoxClass);
                for (var i in allImg) {
                    if (allImg[i].circle == ele[0]) {
                        return $(allImg[i]);
                    }
                }
            }
        }

        func.prototype.path_moving = function (e, svgobj, ele) {
            var start_point = {
                left: ele.offset().left + ele.width() * scale,
                top: ele.offset().top + ele.height() / 2 * scale
            };
            var deltaX = (e.clientX - parseInt(start_point.left)) / scale;
            var deltaY = (e.clientY - parseInt(start_point.top)) / scale;
            makeSvg(deltaX, deltaY, svgobj.svg, svgobj.svg_ori_position.left, svgobj.svg_ori_position.top);
            makePath(deltaX, deltaY, svgobj.svg.children('.path'), svgobj.svg.children('.arrow'));
        }

        func.prototype.staticed_path = function (ele) {
            var pathInfo = static_path(ele, path_from, this);
            recover_pointer_path_ended(this);
            cancle_img_highLight(this);
            ele_none($('.' + this.pathCollect));
            path_from = null;
            return pathInfo;
        }

        func.prototype.path_highLight = function (svg) {
            path_highLight_ended();
            svg.children('path').map(function (index) {
                svg.children('path')[index].setAttribute('stroke', basicOptions.pathHighLight);
            });
            svg.children('.arrow')[0].setAttribute('fill', basicOptions.pathHighLight);
            svg[0].setAttribute('class', 'chosen');
        }

        func.prototype.canvas_input_disabled = function (_this, ele) {
            input_disabled(_this);
        }

        func.prototype.canvas_input_abled = function (_this, ele) {
            input_abled(_this);
            if (ele) {
                return {
                    _id: ele.attr('id'),
                    position: {
                        x: parseInt(ele.css('left').match(/[^px]+/)),
                        y: parseInt(ele.css('top').match(/[^px]+/))
                    }
                }
            }
        }

        func.prototype.zoom = function (delta) {
            scale = delta > 0 ? zoomIn(this) : zoomOut(this);
        }

        func.prototype.hover = function (eventobj) {
            var _this = this;
            eventobj.hover(
                function (e) {
                    if (_this.getTarget(e).hasClass(_this.circleCover)) {
                        _this.getTarget(e).children('svg')[0].setAttribute('display', 'block');
                        _this.svgContainer.find('.path').css('pointer-events', 'none');
                    }
                }, function (e) {
                    if (_this.getTarget(e).parents('.' + _this.circleCover)[0]) {
                        _this.getTarget(e).parents('.' + _this.circleCover).children('svg')[0].setAttribute('display', 'none');
                        !path_from ? _this.svgContainer.find('.path').css('pointer-events', 'auto') : '';
                    }
                });
        }


        function unBind(_this, ev, f) {
            _this.unbind(ev, f);
        }

        function ele_block(ele) {
            ele.css('display', 'block');
        }

        function ele_none(ele) {
            ele.css('display', 'none');
        }

        function get_ele_position_of_window(ele) {
            return {
                left: ele.offset().left,
                top: ele.offset().top
            };
        }

        function removeButnHighLight(bool) {
            if (bool) {
                control.remove.removeAttr('disabled');
                control.remove.addClass('ant-btn-primary').addClass('remove-active');
                //control.remove.css('background', basicOptions.removeButnColor).addClass('remove-active');
            } else {
                control.remove.attr("disabled", "disabled");
                control.remove.removeClass('ant-btn-primary').removeClass('remove-active');
                //control.remove.css('background', '#ccc').removeClass('remove-active');
            }
        }

        function editorButnHighLight(bool) {
            if (bool) {
                control.butnEditor.removeAttr('disabled');
                control.butnEditor.addClass('ant-btn-primary')
            } else {
                control.butnEditor.attr("disabled", "disabled");
                control.butnEditor.removeClass('ant-btn-primary')
                //control.butnEditor.css({'background': 'rgba(204,204,204,0.7)', 'pointer-events': 'none'});
            }
        }

        function path_highLight_ended() {

            path_container.map(function (c) {
                if (c.path) {
                    $(c.path).children('path')[0].setAttribute('stroke', basicOptions.pathBottomColor);
                    $(c.path).children('path')[1].setAttribute('stroke', basicOptions.pathAboveColor);
                    $(c.path).children('.arrow')[0].setAttribute('stroke', basicOptions.pathAboveColor);
                    $(c.path).children('.arrow')[0].setAttribute('fill', basicOptions.pathAboveColor);
                    c.path.setAttribute('class', 'path-static');
                }
            });
        }

        function start_active(from, fun) {
            if (from.id === fun.start.attr('id')) {
                $(fun.start[0].circle).css('display', 'block');
            }
        }

        function remove_ele(c, fun) {
            $(c.path).remove();
            start_active(c.from, fun);
            c.from = c.to = c.path = null;
        }

        function input_disabled(_this) {
            _this.find('input').attr('disabled', 'disabled');
        }

        function input_abled(_this) {
            _this.find('input').attr('disabled', false);
        }

        function get_img_size() {
            return [control.dragBox.children('.' + basicOptions.imgBoxClass).innerWidth() / 2,
                control.dragBox.children('.' + basicOptions.imgBoxClass).innerHeight() / 2];
        }

        function getELemSize(elem) {
            return [elem.innerWidth() / 2, elem.innerHeight() / 2];
        }

        function addDragBoxGhost(e, ele) {
            let dragBoxGhost = createElement('div');
            control.dragBox.append(dragBoxGhost);
            dragBoxGhost.addClass('canvas-api-floatImg')
                .css({
                    'width': ele.innerWidth(),
                    'height': ele.innerHeight(),
                    'background-color': 'gainsboro',
                    'transform': 'scale(' + scale + ')',
                    'border-radius': '4px',
                    //'transform-origin': e.innerWidth()/2 + 'px ' + e.innerHeight()/2 + 'px 0'
                })
            dragBoxGhost.offset({
                left: e.clientX - ele.innerWidth() / 2,
                top: e.clientY - ele.innerHeight() / 2
            });
            return dragBoxGhost;
        }

        function uuid() {
            let s = [];
            let hexDigits = "0123456789abcdef";
            for (let i = 0; i < 36; i++) {
                s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
            }
            s[14] = "4";
            s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
            s[8] = s[13] = s[18] = s[23] = "-";
            let uuid = s.join("");
            return uuid;
        }


        function newElement(element, videoUrl, imgUrl) {
            let name = element.children('input').attr('value');
            let id = element.attr('id');
            let x = element.css('left').match(/\d+/)[0];
            let y = element.css('top').match(/\d+/)[0];
            return new KnowledgeUnit(name, id, x, y, imgUrl);
        }

        /*
        function set_floatImg_css(e, floatImg, fun, _this) {
            let img = _this.children('img');
            let video = _this.children('span');
            let imgSize = get_img_size();
            floatImg.addClass('canvas-api-floatImg')
                .css({
                    'width': imgSize[0] * 2,
                    'height': imgSize[1] * 2,
                    'background-image': 'url(' + img.attr('src') + ')',
                    'transform': 'scale(' + scale + ')',
                    'transform-origin': imgSize[0] + 'px ' + imgSize[1] + 'px 0'
                })
                .offset({
                    left: e.clientX - imgSize[0],
                    top: e.clientY - imgSize[1]
                });
            if (basicOptions.floatImgOpacity) {
                floatImg.css('opacity', basicOptions.floatImgOpacity)
            }
            img_ori_position = {
                left: _this.offset().left,
                top: _this.offset().top
            };
            return {
                imgUrl: img.attr('src'),
                videoUrl: video.text()
            };
        }
        */
        function createNewElement(fun, id, imgUrl, videoUrl) {
            let img, collect, newBox, title;
            let defaultUrl = "./defaultImg.jpg";
            newBox = createElement('div').addClass(basicOptions.imgBoxClass).css({
                'position': 'absolute',
                'margin': '0'
            }).attr('id', id);
            img = !imgUrl ? createElement('img').attr("src", "/defaultImg.jpg") : createElement('img').attr('src', imgUrl)
            newBox.append(img);
            if (videoUrl) {
                newBox[0].videoUrl = videoUrl;
            }
            collect = layout_path_collect();
            title = layout_title(fun);
            fun.imgContainer.append(newBox.append(title, collect));
            newBox.bind('dragstart', function (e) {
                fun.stop_broswer(e)
            });

            return newBox;
        }

        function addImgOnCanvas(floatImg, e, fun) {
            let id = uuid();
            targetUrl = {
                videoUrl: "",
                imgUrl: "/defaultImg.jpg"
            }
            let div = createNewElement(fun, id, targetUrl.imgUrl, targetUrl.videoUrl);
            let imgSize = getELemSize(control.dragBox);
            let left = (e.clientX - fun.trans.offset().left) / scale - imgSize[0];
            let top = (e.clientY - fun.trans.offset().top) / scale - imgSize[1];
            div.css({
                'left': left,
                'top': top
            });
            div[0].circle = create_circle(div, fun);
            return newElement(div, targetUrl.videoUrl, targetUrl.imgUrl);
        }

        function create_circle(ele, fun) {
            let cover = createElement('div').addClass('img-box-circle-cover ' + fun.circleCover);
            let svg = layout_circle();
            fun.svgContainer.append(cover.append(svg));
            circle_comewith_ele(ele, cover);
            return cover[0];
        }

        function layout_circle() {
            let svg = createElement('svg');
            let path = createElement('path');
            let rect = createElement('rect');
            svg[0].setAttribute('display', 'none');
            svg.attr({
                'height': '20',
                'width': '20'
            });
            rect.attr({
                'width': '18',
                'height': '18',
                'y': '1',
                'x': '1',
                'ry': '9',
                'rx': '9',
                'fill': '#fff',
                'stroke': '#000',
                'stroke-width': '1px'
            });
            path.attr({
                'fill': '#000',
                'd': 'M 1 9 L 10 9 L 10 1 L 19 10 L 10 19 L 10 11 L 1 11 Z'
            });
            svg.append(rect, path);
            return svg;
        }

        function layout_title(fun) {
            let input = createElement('input');
            let imgSize = getELemSize(control.dragBox);
            // let imgSize = get_img_size();
            let node = fun.imgContainer.children('.' + basicOptions.imgBoxClass).length;
            input.attr({
                'type': 'text',
                'value': 'Node ' + node
            })
                .addClass('canvas-api-img-title no-border-input')
                .css('width', imgSize[0] * 2);
            input.change((e) => {
                let kUnit = _this.getKnowledgeObjectById(e.target.parentNode.id);
                kUnit.title = e.target.value;
                _this.updateKnowledgeUnit(kUnit);
            });

            return input;
        }

        function layout_path_collect() {
            let collect = createElement('div');
            collect.addClass(basicOptions.pathCollect);
            return collect;
        }

        function circle_comewith_ele(ele, circl) {
            let circle = circl ? circl : $(ele[0].circle);
            circle.css({
                'left': parseInt(ele.css('left')) + ele.innerWidth() - circle.width() / 2,
                'top': parseInt(ele.css('top')) + ele.innerHeight() / 2 - circle.height() / 2
            });
        }

        function clear_path(_this) {
            _this.svgContainer.find('.path-active') ? _this.svgContainer.find('.path-active').remove() : '';
            recover_pointer_path_ended(_this);
        }

        function cancle_img_highLight(_this) {
            _this.imgContainer.find('.' + _this.imgBox).css({
                'box-shadow': '0 0 3px #000',
                'z-index': '10',
                'cursor': 'pointer'
            }).removeClass('chosen');
            _this.imgContainer.find('.imgbox').css({
                '-webkit-mask-image': 'none',
                'background-color': ''
            });
        }

        function recover_pointer_path_ended(fun) {
            input_abled(fun.imgContainer);
            $('body').css('pointer-events', 'auto');
            $('.' + fun.circleCover).css('pointer-events', 'auto');
            $('.' + fun.imgBox).css({
                'pointer-events': 'auto',
                'cursor': 'pointer'
            });
            $('path').css('pointer-events', 'auto');
            $('.' + fun.pathCollect).css('display', 'none');
        }

        function ignore_pointer_during_path(fun) {
            input_disabled(fun.imgContainer);
            fun.canvas.css('pointer-events', 'auto');
            $('body').css('pointer-events', 'none');
            $('.' + fun.circleCover).css('pointer-events', 'none');
            $('.' + fun.imgBox).css({
                'pointer-events': 'none'
            });
            $('.' + fun.pathCollect).css('pointer-events', 'auto');
            $('path').css('pointer-events', 'none');
        }

        function add_path(ele, fun) {
            let svg = createElement('svg');
            let path = createElement('path');
            let path_back = createElement('path');
            let arrow = createElement('path');
            fun.svgContainer.prepend(svg.append(path_back, path, arrow));
            set_path_cssAndAttr(svg, path, path_back, arrow);
            set_path_position(ele, svg);
            return svg;
        }

        function set_path_cssAndAttr(svg, path, path_back, arrow) {
            svg[0].style.cssText = 'pointer-events:none;position:absolute;overflow:visible;';
            arrow[0].style.cssText = path_back[0].style.cssText = path[0].style.cssText = 'pointer-events:auto;cursor:pointer';
            path[0].setAttribute('class', 'path');
            path_back[0].setAttribute('class', 'path');
            arrow[0].setAttribute('class', 'arrow');
            svg[0].setAttribute('class', 'path-active');
            svg.attr({
                'width': '90',
                'height': '90'
            });
            path_back.attr({
                'stroke-width': basicOptions.pathBottomWidth,
                'fill': 'none',
                'stroke': basicOptions.pathBottomColor
            });
            path.attr({
                'stroke-width': basicOptions.pathAboveWidth,
                'fill': 'none',
                'stroke': basicOptions.pathAboveColor
            });
            arrow.attr({
                'stroke-width': '2px',
                'fill': basicOptions.pathAboveColor,
                'stroke': basicOptions.pathAboveColor
            });
        }

        function set_path_position(ele, svg) {
            let svgPosition = get_path_from_position(ele);
            svg.offset({
                left: svgPosition.left,
                top: svgPosition.top
            });
        }

        function get_path_from_position(ele) {
            return {
                left: parseInt(ele.css('left')) + ele.innerWidth(),
                top: parseInt(ele.css('top')) - (90 - ele.innerHeight()) / 2
            };
        }

        function add_mask(that) {
            that.imgContainer.find('.' + that.imgBox).css({

                'box-shadow': '0 0 3px #000',
                'z-index': '1000'
            });
            //改
            that.imgContainer.find('.imgbox').css({
                '-webkit-mask-image': 'url(http://localhost:3000/mask.png)'
            });
        }

        function static_path(ele, path_from, that, sign) {
            let isStart = false;
            let tagSvg = $('.path-active');
            tagSvg[0].moving = path_move_with_img;
            tagSvg[0].setAttribute('class', 'path-static');
            path_move_with_img(path_from, ele, tagSvg);
            path_container.push(new path_container_construct(path_from, tagSvg, ele));
            if (path_from.attr('id') === that.start.attr('id')) {
                $(that.start[0].circle).css('display', 'none');
                isStart = true;
            }
            if (sign === 'init') {
                return
            }
            let kUnitAId = path_from.attr('id');
            let kUnitBId = ele.attr('id');
            let kUnitA = _this.getKnowledgeObjectById(kUnitAId);
            let kUnitB = _this.getKnowledgeObjectById(kUnitBId);
            // console.log(kUnitA);
            if (kUnitAId === 'transStart') {
                connectObjects(kUnitA, kUnitB, 'start');
            } else {
                connectObjects(kUnitA, kUnitB);
            }

        }

        function connectObjects(kUnitA, kUnitB, relation) {
            let _relation = relation || 'hasChildNode';
            if (relation === 'start') {
                kUnitB.root = true;
                _this.updateKnowledgeUnit(kUnitB);
            }
            if (kUnitA && kUnitB) {
                if (_relation === 'hasChildNode') {
                    kUnitA.hasChildNode.push(kUnitB);//id好还是对象好???
                    kUnitB.hasParentNode.push(kUnitA);
                }
                _this.updateKnowledgeUnit(kUnitA);
                _this.updateKnowledgeUnit(kUnitB);
            }
        }

        function path_move_with_img(from, to, path) {
            let path_from_position = get_path_from_position(from);
            let delta = get_deltaXY(from, to);
            makeSvg(delta.deltaX, delta.deltaY, path, path_from_position.left, path_from_position.top);
            makePath(delta.deltaX, delta.deltaY, path.children('.path'), path.children('.arrow'));
        }

        function get_deltaXY(from, to) {
            let deltaX = parseInt(to.css('left')) - parseInt(from.css('left')) - from.width();
            let deltaY = parseInt(to.css('top')) + to.height() / 2 - parseInt(from.css('top')) - from.height() / 2;
            return {
                deltaX: deltaX,
                deltaY: deltaY
            };
        }

        function zoomIn(fun) {
            scale < 1.95 ? scale += 0.05 : '';
            fun.trans.css('transform', 'scale(' + scale + ')');
            return scale;
        }

        function zoomOut(fun) {
            scale > 0.6 ? scale -= 0.05 : '';
            fun.trans.css('transform', 'scale(' + scale + ')');
            return scale;
        }

        function path_container_construct(_from, _path, _to) {
            this.from = _from[0];
            this.path = _path[0];
            this.to = _to[0];
        }

        function makeSvg(deltaX, deltaY, tagSvg, X, Y) {
            if (deltaY <= 45 && deltaY >= -45) {
                tagSvg.css('top', Y);
            }
            if (deltaY < -45) {
                tagSvg.css('top', Y + deltaY + 45);
                if (deltaY < -90) {
                    tagSvg.height((-deltaY));
                }
            }
            else if (deltaY > 45) {
                tagSvg.css('top', Y + deltaY - 45);
                if (deltaY > 90) {
                    tagSvg.css('top', Y + 45);
                    tagSvg.height(deltaY);
                }
            }
            if (deltaX > 21) {
                tagSvg.css('left', X);
                if (deltaX > 90) {
                    tagSvg.width(deltaX);
                }
            }
            else if (deltaX >= 0 && deltaX <= 21) {
                tagSvg.css('left', X - 21 + deltaX);
            }
            else if (deltaX < 0) {
                tagSvg.css('left', X + deltaX - 21);
                if (deltaX < -48) {
                    tagSvg.width((-deltaX) + 42);
                }
            }
        }

        function makePath(deltaX, deltaY, path, arrow) {
            let ax = 6, ay = basicOptions.arrowBottom;
            if (deltaX > 42) {
                if (deltaY < -12 && deltaY >= -45) {
                    path.attr('d', 'M 0 45 L ' + (deltaX - 12) / 2 + ' 45 A 6 6,0 0 0,' + deltaX / 2 + ' 39 L ' + deltaX / 2 + ' ' + (51 + deltaY) + ' A 6 6,0 0 1,' + (deltaX / 2 + 6) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY < -45) {
                    path.attr('d', 'M 0 ' + (-deltaY) + ' L ' + (deltaX - 12) / 2 + ' ' + (-deltaY) + ' A 6 6,0 0 0,' + deltaX / 2 + ' ' + -(deltaY + 6) + ' L ' + deltaX / 2 + ' 6 A 6 6,0 0 1,' + (deltaX / 2 + 6) + ' ' + 0 + ' L ' + deltaX + ' ' + 0);
                    arrow.attr('d', 'M ' + deltaX + ' 0 L ' + (deltaX - ax) + ' ' + ay + ' L ' + (deltaX - ax) + ' ' + (-ay) + ' Z');
                }
                else if (deltaY <= 0 && deltaY > -12) {
                    path.attr('d', 'M 0 45 L ' + (deltaX + deltaY) / 2 + ' 45 A ' + (-deltaY / 2) + ' ' + (-deltaY / 2) + ',0 0 0,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 2) + ' ' + (-deltaY / 2) + ',0 0 1,' + (deltaX / 2 - deltaY / 2) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 0 && deltaY < 12) {
                    path.attr('d', 'M 0 45 L ' + (deltaX - deltaY) / 2 + ' 45 A ' + deltaY / 2 + ' ' + deltaY / 2 + ',0 0 1,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + ' A ' + deltaY / 2 + ' ' + deltaY / 2 + ',0 0 0,' + (deltaX / 2 + deltaY / 2) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + ((deltaX - ax)) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 12 && deltaY < 45) {
                    path.attr('d', 'M 0 45 L ' + (deltaX - 12) / 2 + ' 45 A 6 6,0 0 1,' + deltaX / 2 + ' 51 L ' + deltaX / 2 + ' ' + (39 + deltaY) + ' A 6 6,0 0 0,' + (deltaX / 2 + 6) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 45 && deltaY < 90) {
                    path.attr('d', 'M 0 ' + (90 - deltaY) + ' L ' + (deltaX - 12) / 2 + ' ' + (90 - deltaY) + ' A 6 6,0 0 1,' + deltaX / 2 + ' ' + (96 - deltaY) + ' L ' + deltaX / 2 + ' 84 A 6 6,0 0 0,' + (deltaX / 2 + 6) + ' ' + 90 + ' L ' + deltaX + ' ' + 90);
                    arrow.attr('d', 'M ' + deltaX + ' 90 L ' + (deltaX - ax) + ' ' + (90 + ay) + ' L ' + (deltaX - ax) + ' ' + (90 - ay) + ' Z');
                }
                else if (deltaY >= 90) {
                    path.attr('d', 'M 0 0 L ' + (deltaX - 12) / 2 + ' 0 A 6 6,0 0 1,' + deltaX / 2 + ' 6 L ' + deltaX / 2 + ' ' + (deltaY - 6) + ' A 6 6,0 0 0,' + (deltaX / 2 + 6) + ' ' + deltaY + ' L ' + deltaX + ' ' + deltaY);
                    arrow.attr('d', 'M ' + deltaX + ' ' + deltaY + ' L ' + (deltaX - ax) + ' ' + (deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (deltaY - ay) + ' Z');
                }
            }
            else if (deltaX <= 42) {
                if (deltaX > 29) {
                    if (deltaY < -24 && deltaY > -45) {
                        path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 0,21 39 L 21 ' + (66 - deltaX / 2 + deltaY / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 0,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + 'A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 1,' + (deltaX - 21) + ' ' + (24 + deltaY / 2 + deltaX / 2) + ' L ' + (deltaX - 21) + ' ' + (51 + deltaY) + 'A 6 6,0 0 1,' + (deltaX - 15) + ' ' + (45 + deltaY) + 'L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY <= -45) {
                        path.attr('d', 'M 0 ' + (-deltaY) + ' L 15 ' + (-deltaY) + ' A 6 6,0 0 0,21 ' + (-deltaY - 6) + ' L 21 ' + (21 - deltaY / 2 - deltaX / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 0,' + deltaX / 2 + ' ' + (-deltaY / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 1,' + (deltaX - 21) + ' ' + (deltaX / 2 - deltaY / 2 - 21) + ' L ' + (deltaX - 21) + ' 6 A 6 6,0 0 1' + (deltaX - 15) + ' 0 L ' + deltaX + ' 0');
                        arrow.attr('d', 'M ' + deltaX + ' 0 L ' + (deltaX - ax) + ' ' + ay + ' L ' + (deltaX - ax) + ' ' + (-ay) + ' Z');
                    }
                    else if (deltaY <= 0 && deltaY > -24) {
                        path.attr('d', 'M 0 45 L 15 45 A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 0,' + 15 + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 1,' + (15 - deltaY / 4) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 0 && deltaY < 24) {
                        path.attr('d', 'M 0 45 L 15 45 A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 1,15 ' + (45 + deltaY / 2) + ' A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 0,' + (15 + deltaY / 4) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 24 && deltaY < 45) {
                        path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 1,21 51 L 21 ' + (24 + deltaY / 2 + deltaX / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 1,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 0,' + (deltaX - 21) + ' ' + (66 + deltaY / 2 - deltaX / 2) + ' L ' + (deltaX - 21) + ' ' + (39 + deltaY) + ' A 6 6 ,0 0 0,' + (deltaX - 15) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 45 && deltaY < 90) {
                        path.attr('d', 'M 0 ' + (90 - deltaY) + ' L 15 ' + (90 - deltaY) + ' A 6 6,0 0 1,21 ' + (96 - deltaY) + ' L 21 ' + (69 - deltaY / 2 + deltaX / 2) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 1,' + deltaX / 2 + ' ' + (90 - deltaY / 2) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 0,' + (deltaX - 21) + ' ' + (111 - deltaY / 2 - deltaX / 2) + ' L ' + (deltaX - 21) + ' 86 A 6 6,0 0 0,' + (deltaX - 15) + ' 90 L ' + deltaX + ' 90');
                        arrow.attr('d', 'M ' + deltaX + ' 90 L ' + (deltaX - ax) + ' ' + (90 + ay) + ' L ' + (deltaX - ax) + ' ' + (90 - ay) + ' Z');
                    }
                    else if (deltaY >= 90) {
                        path.attr('d', 'M 0 0 L 15 0 A 6 6,0 0 1,21 6 L 21 ' + (deltaY / 2 + deltaX / 2 - 21) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 1,' + deltaX / 2 + ' ' + deltaY / 2 + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 0,' + (deltaX - 21) + ' ' + (deltaY / 2 - deltaX / 2 + 21) + ' L ' + (deltaX - 21) + ' ' + (deltaY - 6) + ' A 6 6,0 0 0,' + (deltaX - 15) + ' ' + deltaY + ' L ' + deltaX + ' ' + deltaY);
                        arrow.attr('d', 'M ' + deltaX + ' ' + deltaY + ' L ' + (deltaX - ax) + ' ' + (deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (deltaY - ay) + ' Z');
                    }
                }
                else if (deltaX > 20) {
                    if (deltaY < -24 && deltaY > -45) {
                        path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 0,21 39 L 21 ' + (51 + deltaY / 2) + ' A 6 6,0 0 0,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (45 + deltaY / 2) + ' A 6 6,0 0 1,' + (deltaX - 21) + ' ' + (39 + deltaY / 2) + ' L ' + (deltaX - 21) + ' ' + (51 + deltaY) + 'A 6 6,0 0 1,' + (deltaX - 15) + ' ' + (45 + deltaY) + 'L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY <= -45) {
                        path.attr('d', 'M 0 ' + (-deltaY) + ' L 15 ' + (-deltaY) + ' A 6 6,0 0 0,21 ' + (-deltaY - 6) + ' L 21 ' + (6 - deltaY / 2) + ' A 6 6,0 0 0,15 ' + (-deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (-deltaY / 2) + ' A 6 6,0 0 1,' + (deltaX - 21) + ' ' + (-deltaY / 2 - 6) + ' L ' + (deltaX - 21) + ' 6 A 6 6,0 0 1,' + (deltaX - 15) + ' 0 L ' + deltaX + ' 0');
                        arrow.attr('d', 'M ' + deltaX + ' 0 L ' + (deltaX - ax) + ' ' + ay + ' L ' + (deltaX - ax) + ' ' + (-ay) + ' Z');
                    }
                    else if (deltaY <= 0 && deltaY > -24) {
                        path.attr('d', 'M 0 45 L 15 45 A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 0,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX - deltaY / 2 - 27) + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 1,' + (deltaX - deltaY / 2 - 27) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 0 && deltaY < 24) {
                        path.attr('d', 'M 0 45 L 15 45 A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 1,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX + deltaY / 2 - 27) + ' ' + (45 + deltaY / 2) + ' A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 0,' + (deltaX + deltaY / 2 - 27) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 24 && deltaY < 45) {
                        path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 1,21 51 L 21 ' + (39 + deltaY / 2) + ' A 6 6,0 0 1,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (45 + deltaY / 2) + ' A 6 6,0 0 0,' + (deltaX - 21) + ' ' + (51 + deltaY / 2) + ' L ' + (deltaX - 21) + ' ' + (39 + deltaY) + ' A 6 6 ,0 0 0,' + (deltaX - 15) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 45 && deltaY < 90) {
                        path.attr('d', 'M 0 ' + (90 - deltaY) + ' L 15 ' + (90 - deltaY) + ' A 6 6,0 0 1,21 ' + (96 - deltaY) + ' L 21 ' + (84 - deltaY / 2) + ' A 6 6,0 0 1,15 ' + (90 - deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (90 - deltaY / 2) + ' A 6 6,0 0 0,' + (deltaX - 21) + ' ' + (96 - deltaY / 2) + ' L ' + (deltaX - 21) + ' 86 A 6 6,0 0 0,' + (deltaX - 15) + ' 90 L ' + deltaX + ' 90');
                        arrow.attr('d', 'M ' + deltaX + ' 90 L ' + (deltaX - ax) + ' ' + (90 + ay) + ' L ' + (deltaX - ax) + ' ' + (90 - ay) + ' Z');
                    }
                    else if (deltaY >= 90) {
                        path.attr('d', 'M 0 0 L 15 0 A 6 6,0 0 1,21 6 L 21 ' + (deltaY / 2 - 6) + ' A 6 6,0 0 1,15 ' + deltaY / 2 + ' L ' + (deltaX - 15) + ' ' + (deltaY / 2) + ' A 6 6,0 0 0,' + (deltaX - 21) + ' ' + (deltaY / 2 + 6) + ' L ' + (deltaX - 21) + ' ' + (deltaY - 6) + ' A 6 6,0 0 0,' + (deltaX - 15) + ' ' + deltaY + ' L ' + deltaX + ' ' + deltaY);
                        arrow.attr('d', 'M ' + deltaX + ' ' + deltaY + ' L ' + (deltaX - ax) + ' ' + (deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (deltaY - ay) + ' Z');
                    }
                }
                else {
                    if (deltaY < -24 && deltaY > -45) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A 6 6,0 0 0,' + (42 - deltaX) + ' 39 L ' + (42 - deltaX) + ' ' + (51 + deltaY / 2) + ' A 6 6,0 0 0,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L 6 ' + (45 + deltaY / 2) + ' A 6 6,0 0 1,0 ' + (39 + deltaY / 2) + ' L 0 ' + (51 + deltaY) + ' A 6 6,0 0 1,6 ' + (45 + deltaY) + 'L 21 ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY <= -45) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' ' + (-deltaY) + ' L ' + (36 - deltaX) + ' ' + (-deltaY) + ' A 6 6,0 0 0,' + (42 - deltaX) + ' ' + (-deltaY - 6) + ' L ' + (42 - deltaX) + ' ' + (6 - deltaY / 2) + ' A 6 6,0 0 0,' + (36 - deltaX) + ' ' + (-deltaY / 2) + ' L 6 ' + (-deltaY / 2) + ' A 6 6,0 0 1,0 ' + (-deltaY / 2 - 6) + ' L 0 6 A 6 6,0 0 1,6 0 L 21 0');
                        arrow.attr('d', 'M ' + ' 21 0 L ' + (21 - ax) + ' ' + ay + ' L ' + (21 - ax) + ' ' + (-ay) + ' Z');
                    }
                    else if (deltaY <= 0 && deltaY > -24) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 0,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L ' + (-deltaY / 4) + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 1,' + (-deltaY / 4) + ' ' + (45 + deltaY) + ' L 21 ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 0 && deltaY < 24) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 1,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L ' + (deltaY / 4) + ' ' + (45 + deltaY / 2) + ' A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 0,' + (deltaY / 4) + ' ' + (45 + deltaY) + ' L 21 ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 24 && deltaY < 45) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A 6 6,0 0 1,' + (42 - deltaX) + ' 51 L ' + (42 - deltaX) + ' ' + (39 + deltaY / 2) + ' A 6 6,0 0 1,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L 6 ' + (45 + deltaY / 2) + ' A 6 6,0 0 0,0 ' + (51 + deltaY / 2) + ' L 0 ' + (39 + deltaY) + ' A 6 6 ,0 0 0,6 ' + (45 + deltaY) + ' L 21 ' + (45 + deltaY));
                        arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                    }
                    else if (deltaY > 45 && deltaY < 90) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' ' + (90 - deltaY) + ' L ' + (36 - deltaX) + ' ' + (90 - deltaY) + ' A 6 6,0 0 1,' + (42 - deltaX) + ' ' + (96 - deltaY) + ' L ' + (42 - deltaX) + ' ' + (84 - deltaY / 2) + ' A 6 6,0 0 1,' + (36 - deltaX) + ' ' + (90 - deltaY / 2) + ' L 6 ' + (90 - deltaY / 2) + ' A 6 6,0 0 0,0 ' + (96 - deltaY / 2) + ' L 0 86 A 6 6,0 0 0,6 90 L 21 90');
                        arrow.attr('d', 'M ' + ' 21 90 L ' + (21 - ax) + ' ' + (90 - ay) + ' L ' + (21 - ax) + ' ' + (90 + ay) + ' Z');
                    }
                    else if (deltaY >= 90) {
                        path.attr('d', 'M ' + (21 - deltaX) + ' 0 L ' + (36 - deltaX) + ' 0 A 6 6,0 0 1,' + (42 - deltaX) + ' 6 L ' + (42 - deltaX) + ' ' + (deltaY / 2 - 6) + ' A 6 6,0 0 1,' + (36 - deltaX) + ' ' + deltaY / 2 + ' L 6 ' + (deltaY / 2) + ' A 6 6,0 0 0,0 ' + (deltaY / 2 + 6) + ' L 0 ' + (deltaY - 6) + ' A 6 6,0 0 0,6 ' + deltaY + ' L 21 ' + deltaY);
                        arrow.attr('d', 'M ' + ' 21 ' + deltaY + ' L ' + (21 - ax) + ' ' + (deltaY + ay) + ' L ' + (21 - ax) + ' ' + (deltaY - ay) + ' Z');
                    }
                }
            }
        }

        if (arguments.length === 4) {
            updateBasicOptions(options);
            createCanvas(canvas, dragBox);
            setEvent(canvas, dragBox, this, options.info, callback);
        } else if (typeof (options) === 'function') {
            callback = options;
            updateBasicOptions({});
            createCanvas(canvas, dragBox);
            setEvent(canvas, dragBox, this, null, callback);
        } else if (typeof (options) === 'object') {
            updateBasicOptions(options);
            createCanvas(canvas, dragBox);
            setEvent(canvas, dragBox, this, options.info);
        }
    }

    getKnowledgeObjectById(kUnitId) {
        let KnowledgeObjects = this.state.knowledgeUnitList;
        for (let index in KnowledgeObjects) {
            if (KnowledgeObjects[index]._id === kUnitId) {
                return KnowledgeObjects[index];
            }
        }
        return null
    }

    saveProject() {
        const _this = this;
        let startPosition;
        if (_this.state.startPosition === undefined) {
            startPosition = {
                x: parseInt($('#transStart').css('left').match(/[^px]+/)),
                y: parseInt($('#transStart').css('top').match(/[^px]+/))
            };
        } else {
            startPosition = _this.state.startPosition;
        }
        let data = {
            _id: _this.state.projectId,
            projectName: _this.state.projectName,
            userName: _this.state.username,
            description: _this.state.description,
            thumbnailUrl: this.state.thumbnailUrl,
            publishStatus: 'unPublish',
            data: _this.convertStructure(_this.state.knowledgeUnitList),
            startPosition: startPosition
        };
        _this.request('/saveProjectData', {username: _this.state.username, projectData: data}, function () {
            _this.props.onSaveClick()
        })
    }

    reConvertStructure = (kList) => {
        let result = [];
        for (let idx in kList) {
            let kUnit = kList[idx];
            let k = new KnowledgeUnit();
            for (let i in kUnit) {
                if (typeof(kUnit[i]) !== 'object' || i === 'teachUnit' || i === 'position'||i ==='synonym') {
                    k[i] = kUnit[i]
                } else {
                    if (k[i] === undefined) {
                        k[i] = []
                    }
                }
            }
            result.push(k)
        }
        for (let idx in kList) {
            let kUnit = kList[idx];
            for (let i in kUnit) {
                if (typeof(kUnit[i]) !== 'object' || i === 'teachUnit' || i === 'position'||i ==='synonym') {

                } else {
                    for (let j in kUnit[i]) {
                        let id = kUnit[i][j];
                        for (let index in result) {
                            if (result[index]._id === id) {
                                result[idx][i].push(result[index])
                            }
                        }
                    }
                }
            }
        }
        return result
    };


    convertStructure = (kList) => {
        let result = [];
        for (let idx in kList) {
            let kUnit = kList[idx];
            let temp = {};
            for (let i in kUnit) {
                if (typeof(kUnit[i]) !== 'object' || i === 'teachUnit' || i === 'position'||i ==='synonym') {
                    temp[i] = kUnit[i]
                } else {
                    if (temp[i] === undefined) {
                        temp[i] = []
                    }
                    for (let j in kUnit[i]) {
                        temp[i].push(kUnit[i][j]._id)
                    }
                }
            }
            result.push(temp)
        }
        return result
    };


    updateProjectName(e) {
        this.setState({
            projectName: e.target.value
        });
    }

    updateKnowledgeUnit(kUnit) {
        let KnowledgeObjects = this.state.knowledgeUnitList;
        for (let index in KnowledgeObjects) {
            if (KnowledgeObjects[index]._id === kUnit._id) {
                KnowledgeObjects.splice(parseInt(index), 1, kUnit);
                this.setState({
                    knowledgeUnitList: KnowledgeObjects
                });
            }
        }
    }

    onTeachUnitChanged(tUnit) {
        let kUnit = this.getKnowledgeObjectById(tUnit.knowledgeUnitId);
        if (kUnit) {
            this.updateKnowledgeUnit(kUnit);
        }

    }

    //这种写法好烂......
    onUpdateUrlAndName(kUnitId, type, value) {
        console.log(value)
        let kUnitDOM = document.getElementById(kUnitId);
        if (type === 'title') {
            console.log(kUnitDOM.childNodes[1].value)
            kUnitDOM.childNodes[1].value = value;
        } else {
            kUnitDOM.childNodes[0].src = value;
        }

    }

    //从这往后蠢得一批.............................


    remove_ele = (c) => {
        $(c.path).remove();
        c.from = c.to = c.path = null;
    }


    path_container_construct = (_from, _path, _to) => {
        this.from = _from[0];
        this.path = _path[0];
        this.to = _to[0];
    }

    makeSvg = (deltaX, deltaY, tagSvg, X, Y) => {
        if (deltaY <= 45 && deltaY >= -45) {
            tagSvg.css('top', Y);
        }
        if (deltaY < -45) {
            tagSvg.css('top', Y + deltaY + 45);
            if (deltaY < -90) {
                tagSvg.height((-deltaY));
            }
        }
        else if (deltaY > 45) {
            tagSvg.css('top', Y + deltaY - 45);
            if (deltaY > 90) {
                tagSvg.css('top', Y + 45);
                tagSvg.height(deltaY);
            }
        }
        if (deltaX > 21) {
            tagSvg.css('left', X);
            if (deltaX > 90) {
                tagSvg.width(deltaX);
            }
        }
        else if (deltaX >= 0 && deltaX <= 21) {
            tagSvg.css('left', X - 21 + deltaX);
        }
        else if (deltaX < 0) {
            tagSvg.css('left', X + deltaX - 21);
            if (deltaX < -48) {
                tagSvg.width((-deltaX) + 42);
            }
        }
    };

    makePath = (deltaX, deltaY, path, arrow) => {
        let ax = 6, ay = 3;
        if (deltaX > 42) {
            if (deltaY < -12 && deltaY >= -45) {
                path.attr('d', 'M 0 45 L ' + (deltaX - 12) / 2 + ' 45 A 6 6,0 0 0,' + deltaX / 2 + ' 39 L ' + deltaX / 2 + ' ' + (51 + deltaY) + ' A 6 6,0 0 1,' + (deltaX / 2 + 6) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
            }
            else if (deltaY < -45) {
                path.attr('d', 'M 0 ' + (-deltaY) + ' L ' + (deltaX - 12) / 2 + ' ' + (-deltaY) + ' A 6 6,0 0 0,' + deltaX / 2 + ' ' + -(deltaY + 6) + ' L ' + deltaX / 2 + ' 6 A 6 6,0 0 1,' + (deltaX / 2 + 6) + ' ' + 0 + ' L ' + deltaX + ' ' + 0);
                arrow.attr('d', 'M ' + deltaX + ' 0 L ' + (deltaX - ax) + ' ' + ay + ' L ' + (deltaX - ax) + ' ' + (-ay) + ' Z');
            }
            else if (deltaY <= 0 && deltaY > -12) {
                path.attr('d', 'M 0 45 L ' + (deltaX + deltaY) / 2 + ' 45 A ' + (-deltaY / 2) + ' ' + (-deltaY / 2) + ',0 0 0,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 2) + ' ' + (-deltaY / 2) + ',0 0 1,' + (deltaX / 2 - deltaY / 2) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
            }
            else if (deltaY > 0 && deltaY < 12) {
                path.attr('d', 'M 0 45 L ' + (deltaX - deltaY) / 2 + ' 45 A ' + deltaY / 2 + ' ' + deltaY / 2 + ',0 0 1,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + ' A ' + deltaY / 2 + ' ' + deltaY / 2 + ',0 0 0,' + (deltaX / 2 + deltaY / 2) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + ((deltaX - ax)) + ' ' + (45 + deltaY - ay) + ' Z');
            }
            else if (deltaY > 12 && deltaY < 45) {
                path.attr('d', 'M 0 45 L ' + (deltaX - 12) / 2 + ' 45 A 6 6,0 0 1,' + deltaX / 2 + ' 51 L ' + deltaX / 2 + ' ' + (39 + deltaY) + ' A 6 6,0 0 0,' + (deltaX / 2 + 6) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
            }
            else if (deltaY > 45 && deltaY < 90) {
                path.attr('d', 'M 0 ' + (90 - deltaY) + ' L ' + (deltaX - 12) / 2 + ' ' + (90 - deltaY) + ' A 6 6,0 0 1,' + deltaX / 2 + ' ' + (96 - deltaY) + ' L ' + deltaX / 2 + ' 84 A 6 6,0 0 0,' + (deltaX / 2 + 6) + ' ' + 90 + ' L ' + deltaX + ' ' + 90);
                arrow.attr('d', 'M ' + deltaX + ' 90 L ' + (deltaX - ax) + ' ' + (90 + ay) + ' L ' + (deltaX - ax) + ' ' + (90 - ay) + ' Z');
            }
            else if (deltaY >= 90) {
                path.attr('d', 'M 0 0 L ' + (deltaX - 12) / 2 + ' 0 A 6 6,0 0 1,' + deltaX / 2 + ' 6 L ' + deltaX / 2 + ' ' + (deltaY - 6) + ' A 6 6,0 0 0,' + (deltaX / 2 + 6) + ' ' + deltaY + ' L ' + deltaX + ' ' + deltaY);
                arrow.attr('d', 'M ' + deltaX + ' ' + deltaY + ' L ' + (deltaX - ax) + ' ' + (deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (deltaY - ay) + ' Z');
            }
        }
        else if (deltaX <= 42) {
            if (deltaX > 29) {
                if (deltaY < -24 && deltaY > -45) {
                    path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 0,21 39 L 21 ' + (66 - deltaX / 2 + deltaY / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 0,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + 'A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 1,' + (deltaX - 21) + ' ' + (24 + deltaY / 2 + deltaX / 2) + ' L ' + (deltaX - 21) + ' ' + (51 + deltaY) + 'A 6 6,0 0 1,' + (deltaX - 15) + ' ' + (45 + deltaY) + 'L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY <= -45) {
                    path.attr('d', 'M 0 ' + (-deltaY) + ' L 15 ' + (-deltaY) + ' A 6 6,0 0 0,21 ' + (-deltaY - 6) + ' L 21 ' + (21 - deltaY / 2 - deltaX / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 0,' + deltaX / 2 + ' ' + (-deltaY / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 1,' + (deltaX - 21) + ' ' + (deltaX / 2 - deltaY / 2 - 21) + ' L ' + (deltaX - 21) + ' 6 A 6 6,0 0 1' + (deltaX - 15) + ' 0 L ' + deltaX + ' 0');
                    arrow.attr('d', 'M ' + deltaX + ' 0 L ' + (deltaX - ax) + ' ' + ay + ' L ' + (deltaX - ax) + ' ' + (-ay) + ' Z');
                }
                else if (deltaY <= 0 && deltaY > -24) {
                    path.attr('d', 'M 0 45 L 15 45 A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 0,' + 15 + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 1,' + (15 - deltaY / 4) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 0 && deltaY < 24) {
                    path.attr('d', 'M 0 45 L 15 45 A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 1,15 ' + (45 + deltaY / 2) + ' A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 0,' + (15 + deltaY / 4) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 24 && deltaY < 45) {
                    path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 1,21 51 L 21 ' + (24 + deltaY / 2 + deltaX / 2) + ' A ' + (42 - deltaX) / 2 + ' ' + (42 - deltaX) / 2 + ',0 0 1,' + deltaX / 2 + ' ' + (45 + deltaY / 2) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 0,' + (deltaX - 21) + ' ' + (66 + deltaY / 2 - deltaX / 2) + ' L ' + (deltaX - 21) + ' ' + (39 + deltaY) + ' A 6 6 ,0 0 0,' + (deltaX - 15) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 45 && deltaY < 90) {
                    path.attr('d', 'M 0 ' + (90 - deltaY) + ' L 15 ' + (90 - deltaY) + ' A 6 6,0 0 1,21 ' + (96 - deltaY) + ' L 21 ' + (69 - deltaY / 2 + deltaX / 2) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 1,' + deltaX / 2 + ' ' + (90 - deltaY / 2) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 0,' + (deltaX - 21) + ' ' + (111 - deltaY / 2 - deltaX / 2) + ' L ' + (deltaX - 21) + ' 86 A 6 6,0 0 0,' + (deltaX - 15) + ' 90 L ' + deltaX + ' 90');
                    arrow.attr('d', 'M ' + deltaX + ' 90 L ' + (deltaX - ax) + ' ' + (90 + ay) + ' L ' + (deltaX - ax) + ' ' + (90 - ay) + ' Z');
                }
                else if (deltaY >= 90) {
                    path.attr('d', 'M 0 0 L 15 0 A 6 6,0 0 1,21 6 L 21 ' + (deltaY / 2 + deltaX / 2 - 21) + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 1,' + deltaX / 2 + ' ' + deltaY / 2 + ' A ' + (21 - deltaX / 2) + ' ' + (21 - deltaX / 2) + ',0 0 0,' + (deltaX - 21) + ' ' + (deltaY / 2 - deltaX / 2 + 21) + ' L ' + (deltaX - 21) + ' ' + (deltaY - 6) + ' A 6 6,0 0 0,' + (deltaX - 15) + ' ' + deltaY + ' L ' + deltaX + ' ' + deltaY);
                    arrow.attr('d', 'M ' + deltaX + ' ' + deltaY + ' L ' + (deltaX - ax) + ' ' + (deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (deltaY - ay) + ' Z');
                }
            }
            else if (deltaX > 20) {
                if (deltaY < -24 && deltaY > -45) {
                    path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 0,21 39 L 21 ' + (51 + deltaY / 2) + ' A 6 6,0 0 0,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (45 + deltaY / 2) + ' A 6 6,0 0 1,' + (deltaX - 21) + ' ' + (39 + deltaY / 2) + ' L ' + (deltaX - 21) + ' ' + (51 + deltaY) + 'A 6 6,0 0 1,' + (deltaX - 15) + ' ' + (45 + deltaY) + 'L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY <= -45) {
                    path.attr('d', 'M 0 ' + (-deltaY) + ' L 15 ' + (-deltaY) + ' A 6 6,0 0 0,21 ' + (-deltaY - 6) + ' L 21 ' + (6 - deltaY / 2) + ' A 6 6,0 0 0,15 ' + (-deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (-deltaY / 2) + ' A 6 6,0 0 1,' + (deltaX - 21) + ' ' + (-deltaY / 2 - 6) + ' L ' + (deltaX - 21) + ' 6 A 6 6,0 0 1,' + (deltaX - 15) + ' 0 L ' + deltaX + ' 0');
                    arrow.attr('d', 'M ' + deltaX + ' 0 L ' + (deltaX - ax) + ' ' + ay + ' L ' + (deltaX - ax) + ' ' + (-ay) + ' Z');
                }
                else if (deltaY <= 0 && deltaY > -24) {
                    path.attr('d', 'M 0 45 L 15 45 A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 0,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX - deltaY / 2 - 27) + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 1,' + (deltaX - deltaY / 2 - 27) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 0 && deltaY < 24) {
                    path.attr('d', 'M 0 45 L 15 45 A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 1,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX + deltaY / 2 - 27) + ' ' + (45 + deltaY / 2) + ' A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 0,' + (deltaX + deltaY / 2 - 27) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 24 && deltaY < 45) {
                    path.attr('d', 'M 0 45 L 15 45 A 6 6,0 0 1,21 51 L 21 ' + (39 + deltaY / 2) + ' A 6 6,0 0 1,15 ' + (45 + deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (45 + deltaY / 2) + ' A 6 6,0 0 0,' + (deltaX - 21) + ' ' + (51 + deltaY / 2) + ' L ' + (deltaX - 21) + ' ' + (39 + deltaY) + ' A 6 6 ,0 0 0,' + (deltaX - 15) + ' ' + (45 + deltaY) + ' L ' + deltaX + ' ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + deltaX + ' ' + (45 + deltaY) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 45 && deltaY < 90) {
                    path.attr('d', 'M 0 ' + (90 - deltaY) + ' L 15 ' + (90 - deltaY) + ' A 6 6,0 0 1,21 ' + (96 - deltaY) + ' L 21 ' + (84 - deltaY / 2) + ' A 6 6,0 0 1,15 ' + (90 - deltaY / 2) + ' L ' + (deltaX - 15) + ' ' + (90 - deltaY / 2) + ' A 6 6,0 0 0,' + (deltaX - 21) + ' ' + (96 - deltaY / 2) + ' L ' + (deltaX - 21) + ' 86 A 6 6,0 0 0,' + (deltaX - 15) + ' 90 L ' + deltaX + ' 90');
                    arrow.attr('d', 'M ' + deltaX + ' 90 L ' + (deltaX - ax) + ' ' + (90 + ay) + ' L ' + (deltaX - ax) + ' ' + (90 - ay) + ' Z');
                }
                else if (deltaY >= 90) {
                    path.attr('d', 'M 0 0 L 15 0 A 6 6,0 0 1,21 6 L 21 ' + (deltaY / 2 - 6) + ' A 6 6,0 0 1,15 ' + deltaY / 2 + ' L ' + (deltaX - 15) + ' ' + (deltaY / 2) + ' A 6 6,0 0 0,' + (deltaX - 21) + ' ' + (deltaY / 2 + 6) + ' L ' + (deltaX - 21) + ' ' + (deltaY - 6) + ' A 6 6,0 0 0,' + (deltaX - 15) + ' ' + deltaY + ' L ' + deltaX + ' ' + deltaY);
                    arrow.attr('d', 'M ' + deltaX + ' ' + deltaY + ' L ' + (deltaX - ax) + ' ' + (deltaY + ay) + ' L ' + (deltaX - ax) + ' ' + (deltaY - ay) + ' Z');
                }
            }
            else {
                if (deltaY < -24 && deltaY > -45) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A 6 6,0 0 0,' + (42 - deltaX) + ' 39 L ' + (42 - deltaX) + ' ' + (51 + deltaY / 2) + ' A 6 6,0 0 0,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L 6 ' + (45 + deltaY / 2) + ' A 6 6,0 0 1,0 ' + (39 + deltaY / 2) + ' L 0 ' + (51 + deltaY) + ' A 6 6,0 0 1,6 ' + (45 + deltaY) + 'L 21 ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY <= -45) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' ' + (-deltaY) + ' L ' + (36 - deltaX) + ' ' + (-deltaY) + ' A 6 6,0 0 0,' + (42 - deltaX) + ' ' + (-deltaY - 6) + ' L ' + (42 - deltaX) + ' ' + (6 - deltaY / 2) + ' A 6 6,0 0 0,' + (36 - deltaX) + ' ' + (-deltaY / 2) + ' L 6 ' + (-deltaY / 2) + ' A 6 6,0 0 1,0 ' + (-deltaY / 2 - 6) + ' L 0 6 A 6 6,0 0 1,6 0 L 21 0');
                    arrow.attr('d', 'M ' + ' 21 0 L ' + (21 - ax) + ' ' + ay + ' L ' + (21 - ax) + ' ' + (-ay) + ' Z');
                }
                else if (deltaY <= 0 && deltaY > -24) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 0,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L ' + (-deltaY / 4) + ' ' + (45 + deltaY / 2) + ' A ' + (-deltaY / 4) + ' ' + (-deltaY / 4) + ',0 0 1,' + (-deltaY / 4) + ' ' + (45 + deltaY) + ' L 21 ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 0 && deltaY < 24) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 1,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L ' + (deltaY / 4) + ' ' + (45 + deltaY / 2) + ' A ' + deltaY / 4 + ' ' + deltaY / 4 + ',0 0 0,' + (deltaY / 4) + ' ' + (45 + deltaY) + ' L 21 ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 24 && deltaY < 45) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' 45 L ' + (36 - deltaX) + ' 45 A 6 6,0 0 1,' + (42 - deltaX) + ' 51 L ' + (42 - deltaX) + ' ' + (39 + deltaY / 2) + ' A 6 6,0 0 1,' + (36 - deltaX) + ' ' + (45 + deltaY / 2) + ' L 6 ' + (45 + deltaY / 2) + ' A 6 6,0 0 0,0 ' + (51 + deltaY / 2) + ' L 0 ' + (39 + deltaY) + ' A 6 6 ,0 0 0,6 ' + (45 + deltaY) + ' L 21 ' + (45 + deltaY));
                    arrow.attr('d', 'M ' + ' 21 ' + (45 + deltaY) + ' L ' + (21 - ax) + ' ' + (45 + deltaY + ay) + ' L ' + (21 - ax) + ' ' + (45 + deltaY - ay) + ' Z');
                }
                else if (deltaY > 45 && deltaY < 90) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' ' + (90 - deltaY) + ' L ' + (36 - deltaX) + ' ' + (90 - deltaY) + ' A 6 6,0 0 1,' + (42 - deltaX) + ' ' + (96 - deltaY) + ' L ' + (42 - deltaX) + ' ' + (84 - deltaY / 2) + ' A 6 6,0 0 1,' + (36 - deltaX) + ' ' + (90 - deltaY / 2) + ' L 6 ' + (90 - deltaY / 2) + ' A 6 6,0 0 0,0 ' + (96 - deltaY / 2) + ' L 0 86 A 6 6,0 0 0,6 90 L 21 90');
                    arrow.attr('d', 'M ' + ' 21 90 L ' + (21 - ax) + ' ' + (90 - ay) + ' L ' + (21 - ax) + ' ' + (90 + ay) + ' Z');
                }
                else if (deltaY >= 90) {
                    path.attr('d', 'M ' + (21 - deltaX) + ' 0 L ' + (36 - deltaX) + ' 0 A 6 6,0 0 1,' + (42 - deltaX) + ' 6 L ' + (42 - deltaX) + ' ' + (deltaY / 2 - 6) + ' A 6 6,0 0 1,' + (36 - deltaX) + ' ' + deltaY / 2 + ' L 6 ' + (deltaY / 2) + ' A 6 6,0 0 0,0 ' + (deltaY / 2 + 6) + ' L 0 ' + (deltaY - 6) + ' A 6 6,0 0 0,6 ' + deltaY + ' L 21 ' + deltaY);
                    arrow.attr('d', 'M ' + ' 21 ' + deltaY + ' L ' + (21 - ax) + ' ' + (deltaY + ay) + ' L ' + (21 - ax) + ' ' + (deltaY - ay) + ' Z');
                }
            }
        }
    };

    get_deltaXY = (from, to) => {
        let deltaX = parseInt(to.css('left')) - parseInt(from.css('left')) - from.width();
        let deltaY = parseInt(to.css('top')) + to.height() / 2 - parseInt(from.css('top')) - from.height() / 2;
        return {
            deltaX: deltaX,
            deltaY: deltaY
        };
    };


    path_move_with_img = (from, to, path) => {
        let path_from_position = this.get_path_from_position(from);
        let delta = this.get_deltaXY(from, to);
        this.makeSvg(delta.deltaX, delta.deltaY, path, path_from_position.left, path_from_position.top);
        this.makePath(delta.deltaX, delta.deltaY, path.children('.path'), path.children('.arrow'));
    };

    set_path_cssAndAttr = (svg, path, path_back, arrow) => {
        svg[0].style.cssText = 'pointer-events:none;position:absolute;overflow:visible;';
        arrow[0].style.cssText = path_back[0].style.cssText = path[0].style.cssText = 'pointer-events:auto;cursor:pointer';
        path[0].setAttribute('class', 'path');
        path_back[0].setAttribute('class', 'path');
        arrow[0].setAttribute('class', 'arrow');
        svg[0].setAttribute('class', 'path-active');
        svg.attr({
            'width': '90',
            'height': '90'
        });
        path_back.attr({
            'stroke-width': 0,
            'fill': 'none',
            'stroke': '#fff'
        });
        path.attr({
            'stroke-width': 1,
            'fill': 'none',
            'stroke': '#ca910a'
        });
        arrow.attr({
            'stroke-width': '2px',
            'fill': '#ca910a',
            'stroke': '#ca910a'
        });
    }

    set_path_position = (ele, svg) => {
        let svgPosition = this.get_path_from_position(ele);
        svg.offset({
            left: svgPosition.left,
            top: svgPosition.top
        });
    }
    get_path_from_position = (ele) => {
        return {
            left: parseInt(ele.css('left')) + ele.innerWidth(),
            top: parseInt(ele.css('top')) - (90 - ele.innerHeight()) / 2
        };
    }

    add_path = (ele, svgContainer) => {
        let svg = createElement('svg');
        let path = createElement('path');
        let path_back = createElement('path');
        let arrow = createElement('path');
        svgContainer.prepend(svg.append(path_back, path, arrow));
        this.set_path_cssAndAttr(svg, path, path_back, arrow);
        this.set_path_position(ele, svg);
        return svg;
    }


    static_path = (ele, path_from) => {
        let isStart = false;
        let tagSvg = $('.path-active');
        tagSvg[0].moving = this.path_move_with_img;
        tagSvg[0].setAttribute('class', 'path-static');
        this.path_move_with_img(path_from, ele, tagSvg);
        this.state.path_container.push(new path_container_construct(path_from, tagSvg, ele));
    };

    updatePath = (from_id, to_id, type) => {
        let transSvgCont = $('#trans-svg-cont');
        let from_ele = $('#' + from_id);
        let to_ele = $('#' + to_id);
        if (type === 'add') {
            this.add_path(from_ele, transSvgCont);
            this.static_path(to_ele, from_ele);
        } else {
            let currentPath;
            this.state.path_container.forEach(item => {
                if (item.from === from_ele[0] && item.to === to_ele[0]) {
                    currentPath = item;
                }
            });
            let idx = this.state.path_container.indexOf(currentPath);
            this.remove_ele(currentPath);
            this.state.path_container.splice(idx, 1)
        }
    };


    buttonEdit(e) {
        let kUnitData = this.getKnowledgeObjectById($('.chosen').attr('id'));

        ReactDOM.render(
            <KnowledgeEditor
                updatePath={this.updatePath}
                kUnitData={kUnitData}
                knowledgeUnitList={this.state.knowledgeUnitList}
                onUpdatekUnit={this.updateKnowledgeUnit}
                onUpdateUrlAndName={this.onUpdateUrlAndName}
                username={this.state.username}
            />
            , document.getElementById('unitEdit')
        )
    }

    request(url, data, callback) {
        let token = localStorage.getItem('token');
        fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then(res => {
            if (res.status === 'success') {
                let options = res.data;
                callback(options);
            } else {
                alert("验证失败，请重新登录");
                this.props.history.push('/login');
            }

        })
    }

    getProjectData(callback) {
        const _this = this;
        if (!this.state.projectId) return;

        _this.request('/getProjectData', {
            projectId: _this.state.projectId,
            username: _this.props.username
        }, function (data) {
            _this.setState({
                projectName: data[0].projectName,
                description: data[0].description,
                thumbnailUrl: data[0].thumbnailUrl,
                projectDataFetched: true,
                username: _this.props.username,
                knowledgeUnitList: _this.reConvertStructure(data[0].data) || [],
                startPosition: data[0].startPosition
            }, () => {
                callback()
            });

        })
    }


    componentDidMount() {
        const {location} = this.props;
        const projectId = queryString.parse(location.search).courseid;

        this.setState({projectId, projectDataFetched: false});
    }

    render() {
        const {projectFetched} = this.props;
        const {projectDataFetched} = this.state;
        if (projectFetched && !projectDataFetched) {
            this.getProjectData(() => {
                const options = {
                    'info': this.state.knowledgeUnitList,
                    'imgBoxClass': 'imgbox',
                    'arrowBottom': 3,
                    'arrowHeight': 6,
                    'pathBottomWidth': 0,
                    'pathAboveWidth': 1,
                    'pathAboveColor': '#ca910a'
                };
                this.canvasConstructor('#mainCanvas', '#dragBox', options, null);
            });

        }
        const visible = this.state.visible

        return (
            <div id="editorArea">
                <div id="toolBar">
                    <div id="dragBox" className="dragBox">知识单元</div>
                    <Button onClick={this.buttonEdit}
                            id="editBtn"
                            className="editBtn editorBtn ant-btn-primary"
                    >编辑</Button>
                    <Button id="deleteBtn"
                            className="editBtn editorBtn ant-btn-primary"
                    >删除</Button>
                    {/*<Button id="previewBtn"*/}
                    {/*className="previewBtn editorBtn">预览</Button>*/}
                    <Button id="saveBtn"
                            onClick={this.saveProject}
                            className="saveBtn editorBtn">保存</Button>
                    <Button id="backBtn"
                            type="dashed"
                            className="backBtn editorBtn"
                            onClick={this.props.onBack}>后退</Button>
                    <Button id="settingBtn"
                            type="dashed"
                            className="backBtn editorBtn"
                            onClick={this.showModal}>设置</Button>
                    <UpdateSettingForm
                        username={this.state.username}
                        wrappedComponentRef={this.saveFormRef}
                        visible={visible}
                        onCancel={this.handleCancel}
                        onCreate={this.handleCreate}
                        projectName={this.state.projectName}
                        thumbnailUrl={this.state.thumbnailUrl}
                        description={this.state.description}
                    />
                </div>
                <div id="mainCanvas"/>
                <div id="unitEdit"/>
                <div id="tUnitEdit"/>
            </div>
        )
    }
}


class UpdateSetting extends Component {
    state = {
        materialList: []
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
        const {visible, onCancel, onCreate, form} = this.props;
        const {getFieldDecorator} = form;
        const {projectName, description} = this.props;
        const materialList = this.state.materialList;
        const children = [];
        for (let index in materialList) {
            if (materialList[index]) {
                if (materialList[index].type === '图片') {
                    children.push(<Option key={materialList[index].url}>{materialList[index].title}</Option>);
                }

            }
        }


        return (
            <Modal
                title="修改课程信息"
                visible={visible}
                onCancel={onCancel}
                onOk={onCreate}
            >
                <Form layout="vertical">
                    <FormItem label="课程名称">
                        {getFieldDecorator('title')(
                            <Input
                                placeholder={projectName}
                            />
                        )}
                    </FormItem>
                    <FormItem label="课程描述">
                        {getFieldDecorator('description')(
                            <Input
                                placeholder={description}
                                type="textarea"/>
                        )}
                    </FormItem>
                    <FormItem label="课程缩略图">
                        {getFieldDecorator('thumbnailUrl')(
                            <Select
                                combobox={false}
                                size="default"
                                className='thumbnailUrlSelect'
                                id="material"
                            >
                                <OptGroup label="图片">
                                    {children}
                                </OptGroup>
                            </Select>
                        )}
                    </FormItem>
                </Form>
            </Modal>
        )
    }
}

const UpdateSettingForm = Form.create()(UpdateSetting)


export default withRouter(Editor);