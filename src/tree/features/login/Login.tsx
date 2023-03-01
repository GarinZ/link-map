import { Button, Modal } from 'antd';
import React, { useState } from 'react';

const Login: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoginWithGoogleLoading, setIsLoginWithGoogleLoading] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = async () => {
        setIsModalOpen(false);
    };

    const handleLoginBtnClick = () => {
        setIsLoginWithGoogleLoading(true);
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
            console.log(token);
            setIsLoginWithGoogleLoading(false);
        });
    };

    return (
        <div className="login">
            <Button type="primary" onClick={showModal}>
                Login
            </Button>
            <Modal
                title="Login"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={null}
            >
                <Button onClick={handleLoginBtnClick} loading={isLoginWithGoogleLoading}>
                    Sign In With Google
                </Button>
            </Modal>
        </div>
    );
};

export default Login;
