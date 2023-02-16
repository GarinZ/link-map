import { sendMessage } from '@garinz/webext-bridge';
import log from 'loglevel';

import './style.scss';

sendMessage('hello-from-content-script', 'hello!', 'background');
log.debug(`Current page's url must be prefixed with https://github.com`);
