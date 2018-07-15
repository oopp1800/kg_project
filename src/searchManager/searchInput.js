import React, {Component} from 'react';
import fetch from 'isomorphic-fetch';
import { withRouter } from 'react-router-dom';

import {Form, Row, Col, Input, Icon, Button} from 'antd';
import {Checkbox} from 'antd';

const FormItem = Form.Item;
const CheckboxGroup = Checkbox.Group;

const ALL_PLAIN_OPTIONS = ['课程信息', '知识点信息', '教学单元信息', '主课时信息', '辅课时信息'];
const OPTION_MAP_TABLE = {
    '课程信息': 'lesson',
    '知识点信息': 'knowledge',
    '教学单元信息': 'kunit',
    '主课时信息': 'mcourse',
    '辅课时信息': 'acourse',
};

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

        const getSearchOptions = plainOptions => {
            const optionNum = plainOptions.length;
            if (!optionNum) return ALL_PLAIN_OPTIONS.map(option => OPTION_MAP_TABLE[option]);

            return plainOptions.map(option => OPTION_MAP_TABLE[option]);
        };

        this.handleStartLoading();
        this.props.form.validateFields((err, values) => {
            let searchInput = values.searchInput;
            let searchOptions = getSearchOptions(values.plainOptions || []);

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
                    <CheckboxGroup options={ALL_PLAIN_OPTIONS}/>
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