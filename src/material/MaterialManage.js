import React, { Component } from 'react';
import { Layout, Button, Modal, message } from 'antd';

import {FileUploaderModal} from '../upload';
import MaterialList from './MaterialList';
import { request } from '../utils';

const { Header, Content } = Layout;

class MaterialManage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            materials: []
        };

        this.deleteMaterial = this.deleteMaterial.bind(this);
        this.updateMaterial = this.updateMaterial.bind(this);
        this.reloadMaterial = this.reloadMaterial.bind(this);
    }

    reloadMaterial() {
        request.get('/materials')
            .then(materials => this.setState({materials}));
    }

    componentDidMount() {
        this.reloadMaterial();
    }

    deleteMaterial(materialId) {
        const onSuccess = () => {
            const originMaterials = this.state.materials;
            let materials = originMaterials.filter(({_id}) => _id !== materialId);
            this.setState({ materials });
            message.success('删除资源成功');
        };

        const onError = err => message.error(err.toString());

        request.delete('/deleteMaterial', { query: { materialId: materialId } })
            .then(onSuccess)
            .catch(onError);
    }

    updateMaterial(materialId, newMaterial, callback) {
        const newMaterials = this.state.materials && this.state.materials.map(material => {
            if (material._id === materialId) {
                return Object.assign(material, newMaterial);
            }
            return material;
        });
        this.setState({ materials: newMaterials }, callback);
    }

    render(){
        let { materials } = this.state;

        return(
            <Layout>
                <Header style={{ backgroundColor: 'white' }}>
                    <MaterialUploader onFinish={() => {this.reloadMaterial();}}/>
                </Header>
                <Content style={{ padding: '16px'}}>
                    <MaterialList materials={materials}
                                  updateMaterial={this.updateMaterial}
                                  deleteMaterial={this.deleteMaterial}/>
                </Content>
            </Layout>

        )
    }
}

class MaterialUploader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showModal: false,
        }
    }

    showModal = () => {
        this.setState({
            showModal: true,
        });
    };

    closeModal = () => {
        this.props.onFinish();
        this.setState({
            showModal: false,
        });
    };

    render() {
        return (
            <div>
                <Button
                    type={'primary'}
                    size={'large'}
                    onClick={this.showModal}
                >
                    上传资源
                </Button>
                <FileUploaderModal
                    visible={this.state.showModal}
                    onClose={this.closeModal}
                />
            </div>
        )
    }

}

export default MaterialManage;