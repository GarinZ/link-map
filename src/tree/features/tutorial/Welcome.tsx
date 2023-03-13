import React from 'react';
import browser from 'webextension-polyfill';

import './welcome.less';

const Welcome: React.FC = () => {
    return (
        <div className="welcome-content">
            <p>⭐ {browser.i18n.getMessage('welcomeIntro')}</p>
            <p>🏗️ {browser.i18n.getMessage('welcomeIntro2')}</p>
            <p>💡 {browser.i18n.getMessage('welcomeIntro3')}</p>
            <p>{browser.i18n.getMessage('welcomeIntro4')}</p>
        </div>
    );
};

export default Welcome;
