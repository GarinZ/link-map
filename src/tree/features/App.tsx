import { Search } from './search/Search';
import { TabMasterTree } from './tab-master-tree/TabMasterTree';

const App = () => (
    <div className="app">
        <div id="header">
            <Search />
        </div>
        <TabMasterTree />
        <div id="footer" />
    </div>
);

export default App;
