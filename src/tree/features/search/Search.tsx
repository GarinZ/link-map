import { escape } from 'lodash';
import Mousetrap from 'mousetrap';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState } from 'react';
import browser from 'webextension-polyfill';

import { getDisplayName, ShortcutMap } from '../shortcuts/config';
import store from '../store';
import { clearHighLightFields } from '../tab-master-tree/plugins/filter';

import './search.less';

// const escapeRegex = (str: string) => {
//     return `${str}`.replace(/([$()*+.?[\\\]^{|}-])/g, '\\$1');
// };

export const clearFilter = (tree?: Fancytree.Fancytree) => {
    const t = tree ?? store.tree!;
    t.visit((node) => {
        clearHighLightFields(node);
    });
    t.clearFilter();
};

const onSearch = (val: string) => {
    const match: string = val.trim() ?? '';
    if (match.trim() === '') {
        clearFilter();
    } else {
        store.tree!.filterNodes((node) => {
            clearHighLightFields(node);
            if (!node.title && !node.data.alias) {
                return false;
            }
            const title = node.title;
            const alias = node.data.alias;
            const re = new RegExp(match, 'i');
            const titleMatches = title?.match(re);
            const aliasMatches = alias?.match(re);
            if (!titleMatches && !aliasMatches) {
                return false;
            }
            if (titleMatches) {
                node.data.titleWithHighlight = escape(title).replace(re, (s) => {
                    return `<mark>${s}</mark>`;
                });
            }
            if (aliasMatches) {
                node.data.aliasWithHighlight = escape(alias).replace(re, (s: string) => {
                    return `<mark>${s}</mark>`;
                });
            }
            return true;
        });
    }
};

let inputRef: HTMLInputElement | null = null;
Mousetrap.bind(ShortcutMap.search.key, (e) => {
    e.preventDefault();
    inputRef!.focus();
});
export const Search = () => {
    const [value, setValue] = useState('');
    const [focus, setFocus] = useState(false);

    const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e && e.keyCode === $.ui.keyCode.ESCAPE) {
            clearFilter();
            setValue('');
            inputRef!.blur();
        }
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearch(e.target.value);
    };

    const focusClass = focus ? 'focus' : '';

    return (
        <div className={`search-input ${focusClass}`}>
            <i className={'iconfont icon-search'} />
            <input
                ref={(el) => (inputRef = el)}
                className={'search'}
                name={'search'}
                autoComplete={'off'}
                onKeyUp={onKeyUp}
                value={value}
                onChange={onChange}
                placeholder={`${browser.i18n.getMessage('search')}`}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
            />
            {focus ? null : (
                <span className={'search-shortcut-info'}>
                    {getDisplayName(ShortcutMap.search.key)}
                </span>
            )}
        </div>
    );
};
