import { Button } from 'antd';
import browser from 'webextension-polyfill';

import store from '../store';
import type { WindowData } from '../tab-master-tree/nodes/window-node-operations';

import './locate.less';

const handleLocate = async () => {
    const tree = store.tree;
    if (!tree) {
        return;
    }
    const tabs = await browser.tabs.query({ active: true });
    tabs.forEach((tab) => {
        const activeNode = tree.getNodeByKey(tab.id!.toString());
        if (activeNode.parent && (activeNode.parent.data as WindowData).isBackgroundPage) {
            return;
        }
        activeNode.makeVisible();
        activeNode.setActive();
    });
};

const Locate = () => {
    return (
        <div className="locate">
            <Button
                className="locate-btn"
                type="primary"
                onClick={handleLocate}
                icon={<span className="iconfont icon-md-locate" />}
            />
        </div>
    );
};

export default Locate;
