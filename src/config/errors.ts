import log from 'loglevel';

export const setLogLevel = () => {
    log.setLevel(__ENV__ === 'development' ? 'debug' : 'error');
};

export const isNoTabIdError = (error: Error): boolean => {
    return error.message.includes('No tab with id');
};
