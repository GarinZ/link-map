import log from 'loglevel';

export const setLogLevel = () => {
    log.setLevel(__ENV__ === 'development' ? 'debug' : 'error');
};
