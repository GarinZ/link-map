import log from 'loglevel';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './features/App';

const container = document.querySelector('#root');
const root = createRoot(container!);
log.setLevel(__ENV__ === 'development' ? 'debug' : 'silent');
try {
    root.render(
        <HashRouter>
            <App />
        </HashRouter>,
    );
} catch (error) {
    log.error(error);
}
