export const getShortcutSettingUrl = () => {
    return __TARGET__ === 'edge' ? 'edge://extensions/shortcuts' : 'chrome://extensions/shortcuts';
};
