import { escape } from 'lodash';
import Mousetrap from 'mousetrap';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import browser from 'webextension-polyfill';

import { isContentScriptPage } from '../../../background/event-bus';
import { getPrevFocusWindowId } from '../../../storage/basic';
import { getDisplayName, ShortcutMap } from '../shortcuts/config';
import store from '../store';
import { FancyTabMasterTree } from '../tab-master-tree/fancy-tab-master-tree';
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

const getVisibleNodes = (tree: Fancytree.Fancytree): Fancytree.FancytreeNode[] => {
    const visibleNodes: Fancytree.FancytreeNode[] = [];
    tree.visitRows((node) => {
        visibleNodes.push(node);
        return true;
    }, {});
    return visibleNodes;
};

const getPreferredActiveBrowserTab = async () => {
    const prevFocusWindowId = await getPrevFocusWindowId();
    if (prevFocusWindowId) {
        const preferredTabs = await browser.tabs.query({
            active: true,
            windowId: prevFocusWindowId,
        });
        const preferredTab = preferredTabs[0];
        if (
            preferredTab &&
            !isContentScriptPage(preferredTab.url) &&
            !isContentScriptPage(preferredTab.pendingUrl)
        ) {
            return preferredTab;
        }
    }
    const activeTabs = await browser.tabs.query({ active: true });
    return (
        activeTabs.find(
            (tab) => !isContentScriptPage(tab.url) && !isContentScriptPage(tab.pendingUrl),
        ) ?? null
    );
};

const ensureCurrentFocusedTabActive = async () => {
    const tree = store.tree;
    if (!tree) {
        return null;
    }
    const activeTab = await getPreferredActiveBrowserTab();
    if (!activeTab?.id) {
        return null;
    }
    const activeNode = tree.getNodeByKey(activeTab.id.toString());
    if (!activeNode) {
        return null;
    }
    activeNode.makeVisible({ scrollIntoView: true });
    activeNode.setActive(true);
    return activeNode;
};

let inputRef: HTMLInputElement | null = null;
Mousetrap.bind(ShortcutMap.search.key, (e) => {
    e.preventDefault();
    inputRef!.focus();
});
export const Search = () => {
    const [value, setValue] = useState('');
    const [focus, setFocus] = useState(false);
    const hasStartedKeyboardNavigation = useRef(false);
    const shouldAutoFocus =
        new URLSearchParams(window.location.search).get('display') === 'floating-modal';

    useEffect(() => {
        if (!shouldAutoFocus) {
            return;
        }
        inputRef?.focus();
    }, [shouldAutoFocus]);

    const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e && e.keyCode === $.ui.keyCode.ESCAPE) {
            clearFilter();
            setValue('');
            hasStartedKeyboardNavigation.current = false;
            inputRef!.blur();
        }
    };

    const onKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const activeNode = store.tree?.getActiveNode();
            if (!activeNode || activeNode.data.nodeType === 'note') {
                return;
            }
            e.preventDefault();
            await FancyTabMasterTree.onDbClick(activeNode);
            if (shouldAutoFocus) {
                window.close();
            }
            return;
        }
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
            return;
        }
        e.preventDefault();
        const tree = store.tree;
        if (!tree) {
            return;
        }
        const isFiltered = value.trim() !== '';
        if (isFiltered) {
            const visibleNodes = getVisibleNodes(tree);
            if (visibleNodes.length === 0) {
                return;
            }
            hasStartedKeyboardNavigation.current = true;
            const activeNode = tree.getActiveNode();
            const direction = e.key === 'ArrowUp' ? -1 : 1;
            const activeIndex = activeNode
                ? visibleNodes.findIndex((node) => node.key === activeNode.key)
                : -1;
            const targetIndex =
                activeIndex < 0
                    ? direction > 0
                        ? 0
                        : visibleNodes.length - 1
                    : (activeIndex + direction + visibleNodes.length) % visibleNodes.length;
            const targetNode = visibleNodes[targetIndex];
            targetNode.makeVisible({ scrollIntoView: true });
            targetNode.setActive(true);
            return;
        }
        if (!hasStartedKeyboardNavigation.current) {
            hasStartedKeyboardNavigation.current = true;
            await ensureCurrentFocusedTabActive();
            return;
        }
        const visibleNodes = getVisibleNodes(tree);
        if (visibleNodes.length === 0) {
            return;
        }
        const activeNode = tree.getActiveNode() ?? (await ensureCurrentFocusedTabActive());
        if (!activeNode) {
            return;
        }
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const activeIndex = visibleNodes.findIndex((node) => node.key === activeNode.key);
        const targetIndex =
            activeIndex < 0
                ? direction > 0
                    ? 0
                    : visibleNodes.length - 1
                : (activeIndex + direction + visibleNodes.length) % visibleNodes.length;
        const targetNode = visibleNodes[targetIndex];
        targetNode.makeVisible({ scrollIntoView: true });
        targetNode.setActive(true);
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        hasStartedKeyboardNavigation.current = false;
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
                onKeyDown={onKeyDown}
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
