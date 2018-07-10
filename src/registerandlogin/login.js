import React, {Component} from 'react';
import { withRouter } from "react-router-dom";
import './login.css';
import fetch from 'isomorphic-fetch';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = { // 初始化state
            username: '',
            password: '',
        };
        this.stateChange = this.stateChange.bind(this);
        this.toRegister = this.toRegister.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }
    stateChange(e) {
        const target = e.target;
        this.setState({
            [target.name]: target.value
        })
    }
    onKeyDown(e) {
        // 只处理 Enter 键功能
        if (e.keyCode !== 13) return;

        const { onLogin } = this.props;
        const {
            username, password
        } = this.state;
        onLogin(username, password);
    }
    toRegister(){
        this.props.history.push('reg')
    }

    render() {
        const { onLogin } = this.props;
        const {
            username, password
        } = this.state;

        return (
            <div>
                <div onChange={(e) => this.stateChange(e)}
                     onKeyDown={(e) => this.onKeyDown(e)}
                >
                    <input name="username" value={username} placeholder="请输入用户名"/>
                    <input name="password" value={password} placeholder="请输入密码"/>
                    <button onClick={()=>{onLogin(username, password)}}>Log in</button>
                    <button onClick={this.toRegister}>Go Register</button>
                </div>
            </div>
        );
    }
}

export default withRouter(Login);