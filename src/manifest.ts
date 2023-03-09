import type { Manifest } from 'webextension-polyfill';

import pkg from '../package.json';

const manifest: Manifest.WebExtensionManifest = {
    name: pkg.displayName,
    version: pkg.version,
    description: pkg.description,
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
    // @ts-expect-error type not support
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA14QGB1nbCJbeYguBluEQGQOaeQJ8Tln5VMr8LpQuMKlpfKPiJJYwDMQbf1AaRnUAwaC11/0yrjaX3Fpg+iwQNRju7jvEbYdanvrfGd9qwtzgTpU4lNVY6Vk/3DHlmMKIoq80/a1Mwzi3aPDzLNYppSowwDPjCRbzhdC09Juq7xWrpw5oC8l/fei8gCVYwqEt0Ff30wQHHavz0/hbvDjCLs9Jv3dVgp8ZNY4m87+wsyWPhpwU1IVU/z6NujW87VmUYA+Vo1Tvbe/1vqNN5vdkKlwdKOoBXN+4wPV0EacR8vZ65LSrpiSCkR3gxYTnyDjFKPvOi+FbG0i1jyqEsOUd7wIDAQAB',
    oauth2: {
        client_id: '1043610828782-3ifjhc7442tk3cd3d2rkvpv2qk25b3bj.apps.googleusercontent.com',
        scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
    },
};

export default manifest;
