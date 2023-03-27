import { Popover } from 'antd';
import type { RenderFunction } from 'antd/es/tooltip';
import { groupBy, sortBy } from 'lodash';
import React, { useState } from 'react';
import browser from 'webextension-polyfill';

import {
    getDisplayName,
    getShortCutMap,
    ShortcutMap,
    shortcutTypesOrder,
} from '../shortcuts/config';

import './help.less';

const defaultGroupedShortcutMap = groupBy(Object.values(ShortcutMap), 'type');
const openShortcutSettingPage = (url: string | undefined) => {
    if (!url) return;
    browser.tabs.create({ url }).then((tab) => {
        if (!tab.windowId) return;
        browser.windows.update(tab.windowId, { focused: true });
    });
};
const ShortcutsDoc: RenderFunction = () => {
    const [groupedShortcutMap, setGroupedShortcutMap] = useState(defaultGroupedShortcutMap);
    getShortCutMap().then((shortcutMap) => {
        setGroupedShortcutMap(groupBy(Object.values(shortcutMap), 'type'));
    });

    return (
        <div className={'shortcuts-doc'}>
            {shortcutTypesOrder.map((type) => {
                const shortcuts = groupedShortcutMap[type.type];
                return (
                    <div className={'shortcuts-doc-section'} key={type.type}>
                        <div className={'shortcuts-doc-type'}>{type.name}</div>
                        <div className={'shortcuts-doc-content'}>
                            {sortBy(shortcuts, 'index').map((shortcut) => {
                                return (
                                    <div className={'shortcuts-doc-item'} key={shortcut.index}>
                                        <span className={'shortcuts-doc-name'}>
                                            {shortcut.name}
                                        </span>
                                        <span className={'shortcuts-doc-key'}>
                                            {shortcut.setUrl ? (
                                                <a
                                                    href={shortcut.setUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={() =>
                                                        openShortcutSettingPage(shortcut.setUrl)
                                                    }
                                                >
                                                    {getDisplayName(shortcut.key)}
                                                </a>
                                            ) : (
                                                getDisplayName(shortcut.key)
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Help: React.FC = () => {
    return (
        <Popover
            overlayClassName={'help-popover'}
            content={ShortcutsDoc}
            title={browser.i18n.getMessage('shortcut')}
        >
            <div className={'help-float-btn'}>
                <i className="iconfont icon-keyboard" />
            </div>
        </Popover>
    );
};

export default Help;
