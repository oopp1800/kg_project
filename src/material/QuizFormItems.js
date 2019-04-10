import React, { Component } from 'react';
import { Button, Form, Input, Radio, Checkbox, Icon } from 'antd';

import DecimalStep from '../publicComponents/DecimalStep';
import RichTextEditor from '../publicComponents/RichTextEditor';

class QuizFormItems extends Component {
    state = {
        quizType: "single",
    };

    onQuizTypeChange = (event) => {
        this.setState({
            quizType: event.target.value || "",
        });
    };

    render() {
        const { form, formItemLayoutWithOutLabel } = this.props;
        const { getFieldDecorator, getFieldValue } = form;

        const { quizType } = this.state;

        const specificFormItems = ((quizType) => {
            switch (quizType) {
                case 'single': return (
                    <SingleQuizFormItems form={form}
                                         formItemLayoutWithOutLabel={formItemLayoutWithOutLabel}
                    ></SingleQuizFormItems>);
                case 'multiple': return (
                    <MultipleQuizFormItems form={form}
                                           formItemLayoutWithOutLabel={formItemLayoutWithOutLabel}
                    ></MultipleQuizFormItems>);
                case 'judgement': return (
                    <JudgementQuizFormItems form={form}
                                            formItemLayoutWithOutLabel={formItemLayoutWithOutLabel}
                    ></JudgementQuizFormItems>);
                case 'fill': return (
                    <FillQuizFormItems form={form}
                                       formItemLayoutWithOutLabel={formItemLayoutWithOutLabel}
                    ></FillQuizFormItems>);
                case 'open-response': return (
                    <OpenResponseQuizFormItems form={form}
                                               formItemLayoutWithOutLabel={formItemLayoutWithOutLabel}
                    ></OpenResponseQuizFormItems>);
            }
        })(quizType);

        return (
            <div>
                <Form.Item
                    label="题干"
                >
                    {getFieldDecorator('quiz.question', {
                        rules: [{
                            required: true,
                            message: '请编辑题目内容',
                        }],
                    })(
                        <RichTextEditor />
                    )}
                </Form.Item>

                <Form.Item
                    label="题型"
                >
                    {getFieldDecorator('quiz.type', {
                        initialValue: quizType,
                        rules: [{
                            required: true,
                            message: '请选择题型',
                        }],
                    })(
                        <Radio.Group onChange={this.onQuizTypeChange}>
                            <Radio value="single">单选</Radio>
                            <Radio value="multiple">多选</Radio>
                            <Radio value="judgement">判断</Radio>
                            <Radio value="fill">填空</Radio>
                            <Radio value="open-response">简答</Radio>
                        </Radio.Group>
                    )}
                </Form.Item>

                { specificFormItems }

                <Form.Item
                    label="难度"
                >
                    {getFieldDecorator('quiz.difficulty')(
                        <DecimalStep></DecimalStep>
                    )}
                </Form.Item>

                <Form.Item
                    label="解析"
                >
                    {getFieldDecorator('quiz.analysis')(
                        <RichTextEditor />
                    )}
                </Form.Item>
            </div>
        )
    }
}

class SingleQuizFormItems extends Component {
    KEY_VALUES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    remove = (removeKey) => {
        const { form } = this.props;
        const keys = form.getFieldValue('keys');
        const choices = form.getFieldValue('quiz.choices');

        if (keys.length === 1) { return; }

        const removeIndex = keys.indexOf(removeKey);

        form.setFieldsValue({
            keys: keys.filter(key => key !== removeKey),
            'quiz.choices': choices.filter((choice, index) => index !== removeIndex)
        });
    };

    add = () => {
        const { form } = this.props;
        const keys = form.getFieldValue('keys');

        if (keys.length >= this.KEY_VALUES.length) return;

        keys.push(this.KEY_VALUES[keys.length]);

        form.setFieldsValue({
            keys
        });
    };

    render() {
        const { form, formItemLayoutWithOutLabel } = this.props;
        const { getFieldDecorator, getFieldValue } = form;

        getFieldDecorator('keys', { initialValue: ['A'] });
        const keys = getFieldValue('keys');

        return (
            <div>
                {
                    keys.map((key, index) => (
                        <Form.Item
                            label={index === 0? "选项": ''}
                            {...(index === 0? {}: formItemLayoutWithOutLabel)}
                            key={key}
                        >
                            {getFieldDecorator(`quiz.choices[${index}]`, {
                                rules: [{
                                    required: true,
                                    message: '请编辑选项内容',
                                }],
                            })(
                                <RichTextEditor />
                            )}
                            {keys.length > 1
                                ? (
                                    <Icon
                                        type="minus-circle-o"
                                        onClick={() => this.remove(key)}
                                    />
                                )
                                : null}
                        </Form.Item>
                    ))
                }
                <Form.Item
                    {...formItemLayoutWithOutLabel}
                >
                    <Button type="dashed" onClick={this.add}>
                        <Icon type="plus" />添加选项
                    </Button>
                </Form.Item>

                <Form.Item
                    label="答案"
                >
                    {getFieldDecorator('quiz.answer', {
                        rules: [{
                            required: true,
                            message: '请选择对应答案',
                        }],
                    })(
                        <Radio.Group>
                            {
                                keys.map((key, index) => (
                                    <Radio
                                        value={index}
                                        key={key}
                                    >{this.KEY_VALUES[index]}</Radio>
                                ))
                            }
                        </Radio.Group>
                    )}
                </Form.Item>
            </div>
        )
    }
}

class MultipleQuizFormItems extends Component {
    KEY_VALUES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    remove = (removeKey) => {
        const { form } = this.props;
        const keys = form.getFieldValue('keys');
        const choices = form.getFieldValue('quiz.choices');

        if (keys.length === 1) { return; }

        const removeIndex = keys.indexOf(removeKey);

        form.setFieldsValue({
            keys: keys.filter(key => key !== removeKey),
            'quiz.choices': choices.filter((choice, index) => index !== removeIndex)
        });
    };

    add = () => {
        const { form } = this.props;
        const keys = form.getFieldValue('keys');

        if (keys.length >= this.KEY_VALUES.length) return;

        keys.push(this.KEY_VALUES[keys.length]);

        form.setFieldsValue({
            keys
        });
    };

    render() {
        const { form, formItemLayoutWithOutLabel } = this.props;
        const { getFieldDecorator, getFieldValue } = form;

        getFieldDecorator('keys', { initialValue: ['A'] });
        const keys = getFieldValue('keys');

        return (
            <div>
                {
                    keys.map((key, index) => (
                        <Form.Item
                            label={index === 0? "选项": ''}
                            {...(index === 0? {}: formItemLayoutWithOutLabel)}
                            key={key}
                        >
                            {getFieldDecorator(`quiz.choices[${index}]`, {
                                rules: [{
                                    required: true,
                                    message: '请编辑选项内容',
                                }],
                                initialValue: '',
                            })(
                                <RichTextEditor />
                            )}
                            {keys.length > 1
                                ? (
                                    <Icon
                                        type="minus-circle-o"
                                        onClick={() => this.remove(key)}
                                    />
                                )
                                : null}
                        </Form.Item>
                    ))
                }
                <Form.Item
                    {...formItemLayoutWithOutLabel}
                >
                    <Button type="dashed" onClick={this.add}>
                        <Icon type="plus" />添加选项
                    </Button>
                </Form.Item>

                <Form.Item
                    label="答案"
                >
                    {getFieldDecorator('quiz.answer', {
                        rules: [{
                            required: true,
                            message: '请选择对应答案',
                        }],
                    })(
                        <Checkbox.Group>
                            {
                                keys.map((key, index) => (
                                    <Checkbox
                                        value={index}
                                        key={key}
                                    >{this.KEY_VALUES[index]}</Checkbox>
                                ))
                            }
                        </Checkbox.Group>
                    )}
                </Form.Item>
            </div>
        )
    }
}

class JudgementQuizFormItems extends Component {
    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Form.Item
                label="答案"
            >
            {getFieldDecorator('quiz.answer', {
                rules: [{
                    required: true,
                    message: '请选择对应答案',
                }],
            })(
            <Radio.Group>
                <Radio value={true}>正确</Radio>
                <Radio value={false}>错误</Radio>
            </Radio.Group>
        )}
    </Form.Item>
        )
    }
}

class FillQuizFormItems extends Component {
    id = 1;

    remove = (removeKey) => {
        const { form } = this.props;
        const keys = form.getFieldValue('keys');
        const answer = form.getFieldValue('quiz.answer');

        if (keys.length === 1) { return; }

        const removeIndex = keys.indexOf(removeKey);

        form.setFieldsValue({
            keys: keys.filter(key => key !== removeKey),
            'quiz.answer': answer.filter((_, index) => index !== removeIndex)
        });
    };

    add = () => {
        const { form } = this.props;
        const keys = form.getFieldValue('keys');

        keys.push(this.id++);

        form.setFieldsValue({
            keys
        });
    };

    render() {
        const { form, formItemLayoutWithOutLabel } = this.props;
        const { getFieldDecorator, getFieldValue } = form;

        getFieldDecorator('keys', { initialValue: [0] });
        const keys = getFieldValue('keys');

        return (
            <div>
                {
                    keys.map((key, index) => (
                        <Form.Item
                            label={index === 0? "答案": ''}
                            {...(index === 0? {}: formItemLayoutWithOutLabel)}
                            key={key}
                        >
                            {getFieldDecorator(`quiz.answer[${index}]`, {
                                rules: [{
                                    required: true,
                                    message: '请编辑答案内容',
                                }],
                            })(
                                <RichTextEditor />
                            )}
                            {keys.length > 1
                                ? (
                                    <Icon
                                        type="minus-circle-o"
                                        onClick={() => this.remove(key)}
                                    />
                                )
                                : null}
                        </Form.Item>
                    ))
                }
                <Form.Item
                    {...formItemLayoutWithOutLabel}
                >
                    <Button type="dashed" onClick={this.add}>
                        <Icon type="plus" />第 {keys.length + 1} 个空位答案
                    </Button>
                </Form.Item>
            </div>
        )
    }
}

class OpenResponseQuizFormItems extends Component {
    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Form.Item
                label="答案"
            >
                {getFieldDecorator('quiz.answer', {
                    rules: [{
                        required: true,
                        message: '请编辑答案内容',
                    }],
                })(
                    <RichTextEditor />
                )}
            </Form.Item>
        )
    }
}

export default QuizFormItems;
