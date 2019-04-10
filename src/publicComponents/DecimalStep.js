import React from 'react';
import { Row, Col, Slider, InputNumber } from 'antd';

class DecimalStep extends React.Component {
    render() {
        const { min = 0, max = 1, step = 0.1, value = 0 } = this.props;

        return (
            <Row>
                <Col span={12}>
                    <Slider
                        min={min}
                        max={max}
                        onChange={this.props.onChange}
                        value={typeof value === 'number' ? value : 0}
                        step={step}
                    />
                </Col>
                <Col span={4}>
                    <InputNumber
                        min={min}
                        max={max}
                        style={{ marginLeft: 16 }}
                        step={step}
                        value={value}
                        onChange={this.props.onChange}
                    />
                </Col>
            </Row>
        );
    }
}

export default DecimalStep;
