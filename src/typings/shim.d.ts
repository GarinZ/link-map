import type { ProtocolWithReturn } from '@garinz/webext-bridge';
import { Tabs, Windows } from 'webextension-polyfill';

declare module '@garinz/webext-bridge' {
    export interface ProtocolMap {
        // define message protocol types
        // see https://github.com/antfu/webext-bridge#type-safe-protocols
        'tab-prev': { title: string | undefined };
        'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>;
        // browser event
        'get-windows-and-tabs': null;
        'add-tab': Tabs.Tab;
        'remove-tab': {
            windowId: number;
            tabId: number;
        };
        'update-tab': Tabs.Tab;
        'move-tab': {
            windowId: number;
            fromIndex: number;
            toIndex: number;
            tabId: number;
        };
        'activated-tab': {
            windowId: number;
            tabId: number;
        };
        'attach-tab': { windowId: number; tabId: number; newIndex: number };
        'detach-tab': { tabId: number };
        'add-window': Windows.Window;
        'remove-window': { windowId: number };
        'window-focus': { windowId: number };
        // tree event
        'focus-node': number;
        'remove-node': {
            windowId: number;
            tabId: number;
        };
    }
}
