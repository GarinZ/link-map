import { escape } from 'lodash';
import type { ChangeEventHandler, HTMLInputElement, KeyboardEvent } from 'react';
import { useState } from 'react';

import store from '../store';

import './search.less';

// const escapeRegex = (str: string) => {
//     return `${str}`.replace(/([$()*+.?[\\\]^{|}-])/g, '\\$1');
// };

const clearFilter = () => {
    store.tree!.visit((node) => {
        node.data.titleWithHighlight = null;
        node.data.aliasWithHighlight = null;
    });
    store.tree!.clearFilter();
};

const onSearch = (val: string) => {
    const match: string = val.trim() ?? '';
    if (match.trim() === '') {
        clearFilter();
    } else {
        store.tree!.filterNodes((node) => {
            node.data.titleWithHighlight = null;
            node.data.aliasWithHighlight = null;
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

export const Search = () => {
    const [value, setValue] = useState('');
    const [focus, setFocus] = useState(false);

    let inputRef: HTMLInputElement | null = null;

    const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e && e.keyCode === $.ui.keyCode.ESCAPE) {
            clearFilter();
            setValue('');
            inputRef.blur();
        }
    };

    const onChange = (e: ChangeEventHandler<HTMLInputElement>) => {
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
                placeholder={'Search'}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
            />
            {/* <span className={'matches'}> */}
            {/*     mataches: <span className={'count'} /> */}
            {/* </span> */}
        </div>
    );
};
