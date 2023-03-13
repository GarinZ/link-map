import Feedback from './feedback/Feedback';
import Locate from './locate/Locate';
import { Search } from './search/Search';
import Settings from './settings/Settings';
import { TabMasterTree } from './tab-master-tree/TabMasterTree';

const App = () => (
    <div className="app">
        <div id="header">
            <Search />
            <Locate />
            <Settings />
        </div>
        <TabMasterTree />
        <div id="footer">
            <span className={'footer-item'}>
                <Feedback />
            </span>
        </div>
    </div>
);

export default App;
