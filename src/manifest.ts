import type { Manifest } from 'webextension-polyfill';

import pkg from '../package.json';
import { __DEV__ } from '../server/utils/constants';

const manifest: Manifest.WebExtensionManifest = {
    name: pkg.displayName,
    version: pkg.version,
    manifest_version: 3,
    minimum_chrome_version: pkg.browserslist.split(' ')[2],
    permissions: ['tabs', 'storage', 'activeTab', 'windows'],
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
    // content_scripts: [
    //     {
    //         matches: ['https://github.com/*'],
    //         css: ['css/all.css'],
    //         js: ['js/all.js', ...(__DEV__ ? [] : ['js/all.js'])],
    //     },
    // ],
    action: {
        // default_popup: 'popup.html',
        default_icon: {
            '16': 'icons/icon-x16.png',
            '32': 'icons/icon-x32.png',
            '48': 'icons/icon-x48.png',
            '64': 'icons/icon-x64.png',
            '128': 'icons/icon-x128.png',
        },
    },
    options_ui: {
        page: 'options.html',
        open_in_tab: true,
    },
    icons: {
        '16': 'icons/icon-x16.png',
        '32': 'icons/icon-x32.png',
        '48': 'icons/icon-x48.png',
        '64': 'icons/icon-x64.png',
        '128': 'icons/icon-x128.png',
    },
    // @ts-expect-error not support yet
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA14QGB1nbCJbeYguBluEQGQOaeQJ8Tln5VMr8LpQuMKlpfKPiJJYwDMQbf1AaRnUAwaC11/0yrjaX3Fpg+iwQNRju7jvEbYdanvrfGd9qwtzgTpU4lNVY6Vk/3DHlmMKIoq80/a1Mwzi3aPDzLNYppSowwDPjCRbzhdC09Juq7xWrpw5oC8l/fei8gCVYwqEt0Ff30wQHHavz0/hbvDjCLs9Jv3dVgp8ZNY4m87+wsyWPhpwU1IVU/z6NujW87VmUYA+Vo1Tvbe/1vqNN5vdkKlwdKOoBXN+4wPV0EacR8vZ65LSrpiSCkR3gxYTnyDjFKPvOi+FbG0i1jyqEsOUd7wIDAQAB',
};

export default manifest;
