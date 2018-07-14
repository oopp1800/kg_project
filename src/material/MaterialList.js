import React, {Component} from 'react';
import {Row, Col, Card, Icon, Modal} from 'antd';
import {Link} from 'react-router-dom';

import MaterialForm from './MaterialForm';
import {formatParser} from '../utils';

import DEFAULT_IMAGE from "../defaultImg.jpg";

const DEFAULT_TYPE = "question-circle-o"; // 默认资源类型对应的图标
const DEFAULT_URL = "#";
const DEFAULT_TITLE = "无标题";
const DEFAULT_DESCRIPTION = "无描述";

const DEFAULT_PATH = 'http://localhost:3001';

const {Meta} = Card;

class MaterialList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            edit: {
                enable: false,
                materialId: '',
            }
        };

        this.handleDelete = this.handleDelete.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.showEditModal = this.showEditModal.bind(this);
        this.closeEditModal = this.closeEditModal.bind(this);
    }

    handleDelete(id) {
        this.props.deleteMaterial(id);
    }

    handleEdit(id, newMaterial) {
        this.props.updateMaterial(id, newMaterial, this.closeEditModal);
    }

    showEditModal(id) {
        this.setState({edit: {enable: true, materialId: id}});
    }

    closeEditModal() {
        this.setState({edit: {enable: false, materialId: ''}});
    }

    render() {
        const {edit} = this.state;
        const {materials} = this.props;

        return (
            <div>
                {edit.enable && <MaterialEditModal visible={edit.enable}
                                                   material={materials.filter(material => material._id === edit.materialId)[0]}
                                                   onClose={this.closeEditModal}
                                                   onEdit={newMaterial => this.handleEdit(edit.materialId, newMaterial)}
                />}
                <Row type="flex">
                    {
                        materials.map(({_id: id, title, description, format, url, thumbnailUrl: thumbnail}) => (
                            <Col key={id} style={{margin: "15px", width: "200px"}}>
                                <MaterialCard
                                    id={id}
                                    title={title}
                                    description={description}
                                    format={format}
                                    url={url}
                                    thumbnail={thumbnail}
                                    onDelete={() => this.handleDelete(id)}
                                    onEdit={() => this.showEditModal(id)}
                                />
                            </Col>
                        ))
                    }
                </Row>
            </div>
        )
    }
}

const MaterialCard = ({title, description, format, url, thumbnail, onDelete, onEdit}) => {
    const type = formatParser.toIcon(format);

    return (
        <Card
            cover={<Link to={url || DEFAULT_URL}>
                <img src={DEFAULT_PATH + thumbnail || DEFAULT_IMAGE} style={{"height": "150px", "width": "100%"}}/>
            </Link>}
            actions={[<div onClick={onEdit}><Icon type="edit"/></div>,
                <div onClick={onDelete}><Icon type="delete"/></div>]}
        >
            <Meta
                avatar={<Icon type={type || DEFAULT_TYPE} style={{fontSize: 48}}/>}
                title={<Link to={url || DEFAULT_URL}>{title || DEFAULT_TITLE}</Link>}
                description={description || DEFAULT_DESCRIPTION}
            />
        </Card>
    );
};

class MaterialEditModal extends Component {
    constructor(props) {
        super(props);

        this.title = "修改资源";
    }

    handleClose = () => {
        const {onClose} = this.props;
        onClose();
    };

    handleSave = res => {
        if (!res.success) return;

        const {onClose, onEdit} = this.props;
        onClose();
        onEdit(res.data);
    };

    render() {
        const {
            _id: materialId,
            title: materialName,
            type: materialType,
            description,
            keyword,
            language,

        } = this.props.material;

        return (
            <Modal
                visible={this.props.visible}
                title={this.title}
                closable={false}
                // onCancel={this.handleClose}
                footer={null}
            >
                <MaterialForm
                    initValues={{
                        materialName,
                        materialType,
                        description,
                        keyword,
                        language,
                    }}
                    materialId={materialId}
                    onFinish={this.handleSave}
                    onCancel={this.handleClose}
                />
            </Modal>
        )
    }
}

export default MaterialList;
