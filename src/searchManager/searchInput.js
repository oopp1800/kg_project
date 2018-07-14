import React, {Component} from 'react';
import fetch from 'isomorphic-fetch';
import { withRouter } from 'react-router-dom';

import {Form, Row, Col, Input, Icon, Button} from 'antd';
import {Checkbox} from 'antd';

const FormItem = Form.Item;
const CheckboxGroup = Checkbox.Group;

const plainOptions = ['课程信息', '知识点信息'];

class SearchInput extends Component {
    constructor(props){
        super(props);
        this.state = {
            expand: false,
            isLoading: false,
        }
    }


    getToken = () => {
        return localStorage.getItem('token');
    };

    request = (url, data, callback) => {
        const token = this.getToken();
        fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then(res => {
            if (res.status === 'success') {
                const options = res.data;
                callback(options);
            } else {
                alert("验证失败，请重新登录");
                this.props.history.push('/login');
            }

        })
    };

    handleStartLoading = () => {
        this.setState({ isLoading: true });
    };
    handleEndLoading = () => {
        this.setState({ isLoading: false });
    };

    handleSearch = (e) => {
        e.preventDefault();

        this.handleStartLoading();
        this.props.form.validateFields((err, values) => {
            let searchInput = values.searchInput;
            let searchOptions = [];
            if(values.plainOptions){
                if (values.plainOptions.length === 1) {
                    searchOptions = values.plainOptions[0] === '课程信息' ? ['Lesson'] : ['Knowledge']
                }
                if (values.plainOptions.length === 2) {
                    searchOptions = ['Lesson', 'Knowledge']
                }
            }
            this.request('/search', {
                searchInput: searchInput,
                searchOptions: searchOptions
            }, (data) => {
                console.log(data);
                this.handleEndLoading();
                this.props.updateSearchList(data)
            })
        });
    };

    toggle = () => {
        const {expand} = this.state;
        this.setState({expand: !expand});
    };

    // To generate mock Form.Item
    getAdvanced() {
        const {getFieldDecorator} = this.props.form;
        if (!this.state.expand) {
            return []
        } else {
            return <FormItem>
                {getFieldDecorator(`plainOptions`)(
                    <CheckboxGroup options={plainOptions}/>
                )}
            </FormItem>
        }
    }

    render() {
        const {getFieldDecorator} = this.props.form;
        const Collapse = !this.state.expand ? '展开' : '收起';
        return (
            <Form
                layout="inline"
                className="ant-advanced-search-form"
                onSubmit={this.handleSearch}
            >
                <Row type="flex" align="middle" justify="center">
                    <FormItem>
                        {getFieldDecorator('searchInput', {
                            rules: [{message: '请输入检索的内容'}],
                        })(
                            <Input
                                size="large"
                                placeholder="请输入检索信息"/>
                        )}
                    </FormItem>
                    <FormItem>
                        <Button type="primary" size="large" htmlType="submit" loading={this.state.isLoading}>搜索</Button>
                    </FormItem>
                    <FormItem>
                        <a onClick={this.toggle}>
                            {Collapse}<Icon type={this.state.expand ? 'up' : 'down'}/>
                        </a>
                    </FormItem>
                </Row>
                <Row type="flex" align="middle" justify="center">
                    {this.getAdvanced()}
                </Row>
            </Form>
        );
    }
}

const WrappedSearchInput = Form.create()(SearchInput);
export default withRouter(WrappedSearchInput);