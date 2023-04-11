import log from 'loglevel';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { setLogLevel } from '../config/log-config';
import App from './features/App';

const container = document.querySelector('#root');
const root = createRoot(container!);
setLogLevel();
try {
    root.render(
        <HashRouter>
            <App />
        </HashRouter>,
    );
} catch (error) {
    // temp fix for tab missing error
    location.reload();
    log.error(error);
}
