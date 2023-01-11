/**
 * 扩展初始化测试用例
 * @jest-environment jsdom
 */

import { initFancytree } from '../utils';
import { SINGLE_TAB_WINDOW } from './mock-data';

describe('create tab', () => {
    let fancytree: Fancytree.Fancytree;
    beforeEach(() => {
        fancytree = initFancytree(SINGLE_TAB_WINDOW);
    });

    it('ext page open', () => {
        expect(1).toEqual(1);
    });
});
