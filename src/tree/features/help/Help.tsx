import { Popover } from 'antd';
import { groupBy, isEqual, sortBy } from 'lodash';
import React, { useState } from 'react';
import browser from 'webextension-polyfill';

import type { IShortcutMap, ShortcutTypes } from '../shortcuts/config';
import {
    getDisplayName,
    getShortCutMap,
    ShortcutMap,
    shortcutTypesOrder,
} from '../shortcuts/config';

import './help.less';

const openShortcutSettingPage = (url: string | undefined) => {
    if (!url) return;
    browser.tabs.create({ url }).then((tab) => {
        if (!tab.windowId) return;
        browser.windows.update(tab.windowId, { focused: true });
    });
};
type GroupedShortcutMap = { [key in ShortcutTypes]: IShortcutMap };
const shortcutsDoc = (groupedShortcutMap: GroupedShortcutMap) => {
    return (
        <div className={'shortcuts-doc'}>
            {shortcutTypesOrder.map((type) => {
                const shortcuts = groupedShortcutMap[type.type as ShortcutTypes];
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
    const [groupedShortcutMap, setGroupedShortcutMap] = useState(
        groupBy(Object.values(ShortcutMap), 'type'),
    );
    const onOpenChange = async (open: boolean) => {
        if (!open) return;
        const newShortcutMap = await getShortCutMap();
        if (isEqual(newShortcutMap, groupedShortcutMap)) {
            return;
        }
        setGroupedShortcutMap(groupBy(Object.values(newShortcutMap), 'type'));
    };

    return (
        <Popover
            overlayClassName={'help-popover'}
            content={shortcutsDoc(groupedShortcutMap as unknown as GroupedShortcutMap)}
            title={browser.i18n.getMessage('shortcut')}
            onOpenChange={onOpenChange}
        >
            <div className={'help-float-btn'}>
                <i className="iconfont icon-keyboard" />
            </div>
        </Popover>
    );
};

export default Help;
