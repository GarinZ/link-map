import type { Manifest } from 'webextension-polyfill';

import pkg from '../package.json';

const manifest: Manifest.WebExtensionManifest = {
    name: pkg.displayName,
    version: pkg.version,
    description: '__MSG_extDesc__',
    manifest_version: 3,
    minimum_chrome_version: pkg.browserslist.split(' ')[2],
    permissions: ['tabs', 'storage', 'activeTab', 'windows', 'downloads', 'system.display'],
    content_security_policy: {
        extension_pages: "script-src 'self' http://localhost; object-src 'self';",
    },
    web_accessible_resources: [
        {
            matches: ['<all_urls>'],
            resources: ['icons/*', 'images/*', 'fonts/*'],
        },
    ],
    background: {
        service_worker: 'js/background.js',
    },
    default_locale: 'en',
    // content_scripts: [
    //     {
    //         matches: ['https://github.com/*'],
    //         css: ['css/all.css'],
    //         js: ['js/all.js', ...(__DEV__ ? [] : ['js/all.js'])],
    //     },
    // ],
    commands: {
        openLinkMap: {
            suggested_key: {
                default: 'Shift+Ctrl+L',
                mac: 'Shift+Command+L',
            },
            description: '__MSG_commandTriggerLinkMap__',
        },
    },
    action: {
        // default_popup: 'popup.html',
        default_icon: {
            '16': 'icons/x16.png',
            '32': 'icons/x32.png',
            '48': 'icons/x48.png',
            '128': 'icons/x128.png',
        },
    },
    // 实现options页面后使用
    // options_ui: {
    //     page: 'options.html',
    //     open_in_tab: true,
    // },
    icons: {
        '16': 'icons/x16.png',
        '32': 'icons/x32.png',
        '48': 'icons/x48.png',
        '128': 'icons/x128.png',
    },
};

export default manifest;
