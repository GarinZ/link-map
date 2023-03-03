import { Search } from './search/Search';
import Settings from './Settings/Settings';
import { TabMasterTree } from './tab-master-tree/TabMasterTree';

const App = () => (
    <div className="app">
        <div id="header">
            <Search />
            <Settings />
        </div>
        <TabMasterTree />
        <div id="footer" />
    </div>
);

export default App;
