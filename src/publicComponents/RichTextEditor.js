import React from 'react';

// Components
import { Button, Row, Col } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


class RichTextEditor extends React.Component {
    state = {
        isEditing: true,
    };

    modules = {
        formula: true,
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline','strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['image', 'formula'],
            ['clean']
        ],
    };

    stopEdit = (event) => {
        this.setState({
            isEditing: false
        });
    };

    startEdit = (event) => {
        this.setState({
            isEditing: true
        });
    };

    render() {
        const { value, onChange } = this.props;
        const { isEditing } = this.state;

        const editView = (
            <div>
                <ReactQuill
                    defaultValue={value}
                    modules={this.modules}
                    onChange={onChange}
                />
                <Button onClick={this.stopEdit}>预览</Button>
            </div>
        );
        const previewView = (
            <Row>
                <Col span={18}>
                    <div dangerouslySetInnerHTML={{__html: value}} />
                </Col>
                <Col span={6}>
                    <Button type="dashed" onClick={this.startEdit}>修改</Button>
                </Col>
            </Row>
        );

        return isEditing? editView: previewView;
    }
}

export default RichTextEditor;