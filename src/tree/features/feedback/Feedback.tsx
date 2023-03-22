import { Button } from 'antd';
import React from 'react';

import './feedback.less';

const Feedback: React.FC = () => (
    <span className="feedback">
        <Button
            className="feedback-btn"
            size={'small'}
            ghost={true}
            href="https://github.com/GarinZ/link-map/issues/new?assignees=&template=feedback.md"
            target="_blank"
        >
            <i className={'iconfont icon-Feedback'} />
        </Button>
    </span>
);

export default Feedback;
