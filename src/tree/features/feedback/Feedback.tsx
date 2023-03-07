import { Button } from 'antd';
import React from 'react';

import './feedback.less';

const MailConfig = {
    to: 'garin@linkmap.cc',
    subject: 'Feedback for Link Map',
    body: `Feel free to write your feedback here. We will reply you as soon as possible.`,
};

const Feedback: React.FC = () => (
    <span className="feedback">
        <Button
            className="feedback-btn"
            size={'small'}
            // type={'link'}
            ghost={true}
            href={`mailto:${MailConfig.to}?subject=${encodeURIComponent(
                MailConfig.subject,
            )}&body=${encodeURIComponent(MailConfig.body)}`}
        >
            <i className={'iconfont icon-Feedback'} />
        </Button>
    </span>
);

export default Feedback;
