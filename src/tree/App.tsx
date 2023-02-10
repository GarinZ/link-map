import React from 'react';

import { TabMasterTree } from './components/tab-master-tree';

const App = () => (
    <div className="app">
        <div id="header">
            <input name="search" placeholder="search" autoComplete="off" />
            <button id="btnResetSearch">&times;</button>
            <span id="matches" />
        </div>
        <TabMasterTree />
        <div id="footer" />
    </div>
);

export default App;
