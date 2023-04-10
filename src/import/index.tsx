import log from 'loglevel';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App';

const container = document.querySelector('#root');
const root = createRoot(container!);
log.setLevel(__ENV__ === 'development' ? 'debug' : 'silent');
root.render(
    <HashRouter>
        <App />
    </HashRouter>,
);
