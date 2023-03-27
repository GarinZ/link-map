import { Popover } from 'antd';
import { groupBy, sortBy } from 'lodash';
import React from 'react';
import browser from 'webextension-polyfill';

import { getDisplayName, ShortcutMap, shortcutTypesOrder } from '../shortcuts/config';

import './help.less';

const groupedShortcutMap = groupBy(Object.values(ShortcutMap), 'type');

const shortcutsDoc = () => {
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
                                            {getDisplayName(shortcut.key)}
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
            content={shortcutsDoc}
            title={browser.i18n.getMessage('shortcut')}
        >
            <div className={'help-float-btn'}>
                <i className="iconfont icon-keyboard" />
            </div>
        </Popover>
    );
};

export default Help;
