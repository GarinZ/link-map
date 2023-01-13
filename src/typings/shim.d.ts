import type { ProtocolWithReturn } from '@garinz/webext-bridge';
import { Tabs, Windows } from 'webextension-polyfill';

declare type WindowTabIdPair = {
    windowId: number;
    tabId: number;
};

declare module '@garinz/webext-bridge' {
    export interface ProtocolMap {
        // define message protocol types
        // see https://github.com/antfu/webext-bridge#type-safe-protocols
        'tab-prev': { title: string | undefined };
        'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>;
        // browser event
        'get-windows-and-tabs': void;
        'add-tab': Tabs.Tab;
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
        'focus-node': number;
        'remove-node': WindowTabIdPair;
    }
}
