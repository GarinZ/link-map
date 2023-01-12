/**
 * 初始化jest全局变量
 */

import $ from 'jquery';
import chrome from 'sinon-chrome';

chrome.runtime.id = 'test-id';
Object.assign(global, { chrome });
Object.assign(global, {
    $,
    jQuery: $,
    jquery: $,
});
