import React from 'react';

import { authUI, uiConfig } from '../../../service/auth';

class Login extends React.Component {
    componentDidMount() {
        authUI.start('#firebaseui-auth-container', uiConfig);
    }

    async componentWillUnmount() {
        await authUI.delete();
    }

    render() {
        return (
            <div className="login">
                <div className="login-form" id="firebaseui-auth-container" />
            </div>
        );
    }
}

export default Login;
