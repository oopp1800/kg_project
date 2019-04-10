import React from 'react';
import { Document, Page } from 'react-pdf';
import { Button, Radio, Checkbox, Row, Col, Form } from 'antd';
import RichTextEditor from "../publicComponents/RichTextEditor";


class PDFMaterialDisplay extends React.Component {
    state = {
        numPages: null,
        pageNumber: 1,
    };

    DEFAULT_PDF = '../searchManager/test.pdf';

    onDocumentLoad = ({numPages}) => {
        this.setState({numPages});
    };

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

    render() {
        const {pageNumber, numPages} = this.state;
        const url = this.props.url;
        return (
            <div>
                <Button onClick={this.prevPage}>上一页</Button>
                <Button onClick={this.nextPage}>下一页</Button>
                <Document
                    file={url || this.DEFAULT_PDF}
                    onLoadSuccess={this.onDocumentLoad}
                >
                    <Page pageNumber={pageNumber}/>
                </Document>
                <p>Page {pageNumber} of {numPages}</p>
            </div>
        );
    }
}

const ImageMaterialDisplay = ({ url }) => (
    <img
        style={{width: '100%', height: '100%'}}
        src={url}
    />
);

const VideoMaterialDisplay = ({ url }) => (
    <video
        controls="controls"
        style={{width: '100%', height: '100%'}}
        src={url}
    />
);

const Stem = ({content}) => (
    <div dangerouslySetInnerHTML={{ __html: content }} />
);
const AnswerArea = ({form, type, choices, answer}) => {
    const { getFieldDecorator } = form;
    let quizAnswer;

    switch(type) {
        case 'single':
            quizAnswer = (
                <Radio.Group>
                    {
                        choices.map((choice, index) => (
                            <Radio key={choice}
                                   value={index}>
                                <div dangerouslySetInnerHTML={{__html: choice}}/>
                            </Radio>
                        ))
                    }
                </Radio.Group>
            );
            break;
        case 'multiple':
            quizAnswer = (
                <Checkbox.Group>
                    {
                        choices.map((choice, index) => (
                            <Checkbox key={choice}
                                      value={index}>
                                <div style={{ display: 'inline-block' }}
                                     dangerouslySetInnerHTML={{__html: choice}}/>
                            </Checkbox>
                        ))
                    }
                </Checkbox.Group>
            );
            break;
        case 'judgement':
            quizAnswer = (
                <Radio.Group>
                    <Radio value={true}>正确</Radio>
                    <Radio value={false}>错误</Radio>
                </Radio.Group>
            );
            break;
        case 'fill':
            quizAnswer = (
                <div>
                    {
                        answer.map((_, index) => (
                            getFieldDecorator(`answer[${index}]`, {
                                rules: [{ required: true }]
                            })( <RichTextEditor key={index}/> )
                        ))
                    }
                </div>
            );
            break;
        case 'open-response':
            quizAnswer = (
                <RichTextEditor/>
            );
            break;
    }

    if (!quizAnswer) {
        console.error('Unsupported quiz type: ', type);
        return (
            <div>不支持当前试题种类！</div>
        );
    }

    return (
        <Form.Item label={'回答'}>
            {
                type !== 'fill'
                    ? getFieldDecorator('answer', {
                        rules: [{ required: true }]
                    })(quizAnswer)
                    : quizAnswer
            }
        </Form.Item>
    );
};
const Analysis = ({ difficulty, content }) => (
    <div>
        {
            difficulty && (<Form.Item label={'难度'}
                                      style={{ marginBottom: 0 }}>
                { difficulty }
            </Form.Item>)
        }
        {
            content && <Form.Item label={'解析'}>
                <div dangerouslySetInnerHTML={{__html: content}}/>
            </Form.Item>
        }
    </div>
);
class QuizMaterialDisplayForm extends React.Component {
    state = {
        answerCorrect: null,
        showAnalysis: false,
    };

    resetState = () => {
        this.setState({
            answerCorrect: null,
            showAnalysis: false,
        });
    };

    checkAnswer = (answer) => {
        const {
            answer: correctAnswer,
            type,
        } = this.props.quiz;

        if (type === 'single' || type === 'judgement') return answer === correctAnswer;
        if (type === 'multiple' && Array.isArray(answer) && Array.isArray(correctAnswer)) {
            return  answer.length === correctAnswer.length && answer.every(a => correctAnswer.indexOf(a) !== -1);
        }
        if (type === 'fill' && Array.isArray(answer)) return answer.every((a, index) => a === correctAnswer[index]);
        return null;
    };

    handleSubmit = (event) => {
        event.preventDefault();

        const { form, afterLearning } = this.props;

        form.validateFields((err, values) => {
            if (err) {
                return console.log(err)
            }

            const result = this.checkAnswer(values.answer);
            if (result === null) {
                return;
            }

            afterLearning(result);
            if (result) {
                this.setState({
                    answerCorrect: true,
                    showAnalysis: true,
                });
            } else {
                this.setState({
                    answerCorrect: false,
                    showAnalysis: true,
                })
            }
        })
    };

    componentWillReceiveProps(nextProps, nextContext) {
        if (this.props.materialId !== nextProps.materialId) {
            this.props.form.resetFields();
            this.resetState();
        }
    }

    render() {
        const { form, quiz } = this.props;
        const {
            question,
            type,
            choices,
            answer,
            difficulty,
            analysis,
        } = quiz;

        const formItemLayout = {
            labelAlign: 'left',
            labelCol: {
                xs: {span: 24},
                sm: {span: 4},
            },
            wrapperCol: {
                xs: {span: 24},
                sm: {span: 20},
            },
        };

        return (
            <Form style={{
                overflow: "auto",
                height: "100%",
                padding: "15px 20px",
            }}
                  {...formItemLayout}
                onSubmit={this.handleSubmit}
            >
                <Stem content={question} />
                <AnswerArea type={type}
                            choices={choices}
                            answer={answer}
                            form={form} />
                <Row>
                    <Col span={20}>
                        <div>
                            { this.state.showAnalysis && (this.state.answerCorrect? '回答正确！': '回答错误！')}
                        </div>
                    </Col>
                    <Col span={4}>
                        <Button type="primary"
                                htmlType="submit"
                        >
                            提交
                        </Button>
                    </Col>
                </Row>
                {this.state.showAnalysis && <Analysis difficulty={difficulty}
                                           content={analysis}/>
                }
            </Form>
        )
    }
}
const QuizMaterialDisplay = Form.create({ name: 'quiz'})(QuizMaterialDisplayForm);


export {
    PDFMaterialDisplay,
    ImageMaterialDisplay,
    VideoMaterialDisplay,
    QuizMaterialDisplay,
}