import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { setLogLevel } from '../config/log-config';
import App from './App';

const container = document.querySelector('#root');
const root = createRoot(container!);
setLogLevel();
root.render(
    <HashRouter>
        <App />
    </HashRouter>,
);
