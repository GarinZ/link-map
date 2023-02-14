import type { ChangeEventHandler, HTMLInputElement, KeyboardEvent } from 'react';
import { useState } from 'react';

import store from '../store';

import './search.less';

const onSearch = (val: string) => {
    const match: string = val.trim() ?? '';
    if (match.trim() === '') {
        store.tree!.clearFilter();
    } else {
        store.tree!.filterNodes((node) => {
            return node.title?.includes(match) || node.data.alias?.includes(match);
        });
    }
};

export const Search = () => {
    const [value, setValue] = useState('');

    const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e && e.keyCode === $.ui.keyCode.ESCAPE) {
            store.tree!.clearFilter();
            setValue('');
        }
    };

    const onChange = (e: ChangeEventHandler<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearch(e.target.value);
    };

    return (
        <div className={'search-input'}>
            <i className={'iconfont icon-search'} />
            <input
                className={'search'}
                name={'search'}
                autoComplete={'off'}
                onKeyUp={onKeyUp}
                value={value}
                onChange={onChange}
                placeholder={'Search...'}
            />
        </div>
    );
};
