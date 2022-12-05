import type { ProtocolWithReturn } from 'webext-bridge';
import { Tabs, Windows } from 'webextension-polyfill';

declare type StyleSheetModule = { [key: string]: string };

declare module '*.scss' {
    const exports: StyleSheetModule;
    export default exports;
}

declare module '*.svg' {
    import * as React from 'react';

    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

    const src: string;
    export default src;
}

declare module '*.bmp' {
    const path: string;
    export default path;
}

declare module '*.gif' {
    const path: string;
    export default path;
}

declare module '*.jpg' {
    const path: string;
    export default path;
}

declare module '*.jpeg' {
    const path: string;
    export default path;
}

declare module '*.png' {
    const path: string;
    export default path;
}

declare type WindowTabIdPair = {
    windowId: number;
    tabId: number;
};

declare module 'webext-bridge' {
    export interface ProtocolMap {
        // define message protocol types
        // see https://github.com/antfu/webext-bridge#type-safe-protocols
        'tab-prev': { title: string | undefined };
        'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>;
        // browser event
        'get-windows-and-tabs': void;
        'add-tab': Tabs.Tab;
        'add-tab-with-index': {
            newTab: Tabs.Tab;
            newWindowId: number;
            toIndex: number;
        };
        'remove-tab': WindowTabIdPair;
        'update-tab': Tabs.Tab;
        'move-tab': {
            windowId: number;
            fromIndex: number;
            toIndex: number;
            tabId: number;
        };
        'activated-tab': WindowTabIdPair;
        'add-window': Windows.Window;
        'remove-window': { windowId: number };
        // tree event
        'get-tree': ProtocolWithReturn<null, { windows: Windows.Window[] }>;
        'focus-node': WindowTabIdPair;
        'remove-node': WindowTabIdPair;
    }
}
