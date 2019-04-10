import React, {Component} from 'react';
import $ from 'jquery';

import {Form, Input, Tooltip, Icon, Cascader, Select, Row, Col, Checkbox, Button, AutoComplete} from 'antd';
import {Upload, message} from 'antd';

import QuizFormItems from '../material/QuizFormItems';

const FormItem = Form.Item;
const Option = Select.Option;

let uuid = 0;


class FileUpload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fileList: [],
            uploading: false,
            inputValue:'',
            materialType: '试题',
        }
    }

    getToken = () => ( localStorage.getItem('token') );

    handleStartUpload = () => {
        this.props.onStart();
    };

    handleFinishUpload = (res) => {
        res.status === 'error'
            ? message.error(res.message)
            : message.success('上传成功！');

        this.props.onFinish(res.material);
    };

    handleSelectChange = (newMaterialType) => {
        return this.setState({
            materialType: newMaterialType
        });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.handleStartUpload();

        //文件上传
        const {fileList} = this.state;
        let formData = new FormData();
        fileList.forEach((file) => {
            formData.append('upfile', file);
        });
        this.setState({
            uploading: true,
        });

        //校验表单信息
        this.props.form.validateFieldsAndScroll((err, values) => {
            const token = this.getToken();

            if (!err) {
                $.ajax({
                    url: '/upload',
                    data: JSON.stringify(values),
                    type: "POST",
                    headers: {
                        'Authorization': token,
                    },
                    contentType: "application/json; charset=utf-8",
                    processData: false,
                    cache: false,
                    success: (res) => {
                        this.setState({
                            fileList: [],
                            uploading: false
                        });
                        this.props.form.resetFields();
                        this.handleFinishUpload(res);
                    },
                    error: (res) => {
                        this.handleFinishUpload(res);
                    }
                })
            }
        });
    };

    render() {
        const { getFieldDecorator, getFieldValue } = this.props.form;
        const { uploading, materialType } = this.state;

        const formItemLayout = {
            labelCol: {
                xs: {span: 24},
                sm: {span: 4},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 20},
            },
        };
        const formItemLayoutWithOutLabel = {
            wrapperCol: {
                xs: { span: 24, offset: 0 },
                sm: { span: 20, offset: 4 },
            },
        };
        const tailFormItemLayout = {
            wrapperCol: {
                xs: {
                    span: 24,
                    offset: 0,
                },
                sm: {
                    span: 16,
                    offset: 8,
                },
            },
        };

        const props = {
            onRemove: (file) => {
                this.setState(({fileList}) => {
                    const index = fileList.indexOf(file);
                    const newFileList = fileList.slice();
                    newFileList.splice(index, 1);
                    return {
                        fileList: newFileList,
                    };
                });
            },
            beforeUpload: (file) => {
                this.setState(({fileList}) => ({
                    fileList: [...fileList, file],
                }));
                return false;
            },
            fileList: this.state.fileList,
            listType: 'picture',
            className: 'upload-list-inline',
        };

        const materialFormItemGenerator = (attribute) => {
            switch (attribute) {
                case 'name':
                    return (
                        <FormItem
                            {...formItemLayout}
                            key='name'
                            label="资源名称"
                        >
                            {getFieldDecorator('materialName', {
                                rules: [{
                                    type: 'string', message: '请输入上传的素材的名称',
                                }, {
                                    required: true, message: '请输入上传的素材的名称',
                                }],
                            })(
                                <Input/>
                            )}
                        </FormItem>
                    );
                case 'type':
                    return (
                        <FormItem
                            {...formItemLayout}
                            key='type'
                            label="资源类别"
                        >
                            {getFieldDecorator('materialType', {
                                rules: [{
                                    type: 'string', message: '请输入上传的素材的类别',
                                }, {
                                    required: true, message: '请输入上传的素材的类别' +
                                        '',
                                }],
                                initialValue: materialType,
                            })(
                                <Select
                                    onChange={this.handleSelectChange}
                                >
                                    <Option value="动画">动画</Option>
                                    <Option value="图片">图片</Option>
                                    <Option value="文本">文本</Option>
                                    <Option value="视频">视频</Option>
                                    <Option value="试题">试题</Option>
                                    <Option value="课件">课件</Option>
                                    <Option value="音频">音频</Option>
                                </Select>
                            )}

                        </FormItem>
                    );
                case 'description':
                    return (
                        <FormItem
                            {...formItemLayout}
                            key='description'
                            label="资源描述"
                        >
                            {getFieldDecorator('description', {
                                rules: [{
                                    type: 'string', message: '请输入资源的描述信息',
                                }],
                            })(
                                <Input type="string"/>
                            )}
                        </FormItem>
                    );
                case 'keyword':
                    return (
                        <FormItem
                            {...formItemLayout}
                            key='keyword'
                            label="资源关键字"
                        >
                            {getFieldDecorator('keyword')(
                                <Input type="string"/>
                            )}
                        </FormItem>
                    );
                case 'language':
                    return (
                        <FormItem
                            {...formItemLayout}
                            key='language'
                            label="资源语种"
                        >
                            {getFieldDecorator('language', {
                                rules: [{
                                    type: 'string', message: '请输入资源的语种',
                                }, {
                                    required: true, message: '请输入资源的语种',
                                }],
                            })(
                                <Input type="string"/>
                            )}
                        </FormItem>
                    );
                case 'file':
                    return (
                        <div
                            key='file'
                        >
                            <FormItem
                                {...formItemLayout}
                                label="上传文件"
                            >
                                <Upload {...props} >
                                    <Button>
                                        <Icon type="upload"/> 选择文件
                                    </Button>
                                </Upload>
                            </FormItem>
                            <FormItem {...tailFormItemLayout}>
                                <Button type="primary"
                                        htmlType="submit"
                                        className="uploadStart"
                                        disabled={this.state.fileList.length === 0}
                                        loading={uploading}
                                >
                                    {uploading ? '等待上传' : '开始上传'}
                                </Button>
                            </FormItem>
                        </div>
                    );
                case 'quiz':
                    return (
                        <QuizFormItems
                            key='quiz'
                            form={this.props.form}
                            formItemLayoutWithOutLabel={formItemLayoutWithOutLabel}
                        />
                    );
                case 'save':
                    return (
                        <FormItem
                            key='save'
                            wrapperCol={{
                                sm: {
                                    offset: 9,
                                    span: 6,
                                },
                                xs: {
                                    offset: 0,
                                    span: 24,
                                },
                            }}>
                            <Button type="primary"
                                    htmlType="submit"
                                    className="uploadStart"
                                    block
                            >
                                保存
                            </Button>
                        </FormItem>
                    )
            }
        };

        const materialAttributesConfigs = {
            '图片': ['name', 'description', 'keyword', 'language', 'file'],
            '视频': ['name', 'description', 'keyword', 'language', 'file'],
            '音频': ['name', 'description', 'keyword', 'language', 'file'],
            '试题': ['name', 'description', 'keyword', 'quiz', 'save'],
            default: ['name', 'description', 'keyword', 'language', 'file'],
        };

        const configKey = materialAttributesConfigs[materialType]? materialType: 'default';
        const materialAttributes = materialAttributesConfigs[configKey];

        return (
            <Form
                onSubmit={this.handleSubmit}
                {...formItemLayout}
            >
                {materialFormItemGenerator('type')}
                {
                    materialAttributes.map(attribute => materialFormItemGenerator(attribute))
                }
            </Form>
        )
    }
}

const WrappedRegistrationForm = Form.create()(FileUpload);
export default WrappedRegistrationForm


