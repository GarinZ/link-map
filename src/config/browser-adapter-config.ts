export const getShortcutSettingUrl = () => {
    return __TARGET__ === 'edge' ? 'edge://extensions/shortcuts' : 'chrome://extensions/shortcuts';
};

export const getReviewUrl = () => {
    return __TARGET__ === 'edge'
        ? 'https://microsoftedge.microsoft.com/addons/detail/link-map/penpmngcolockpbmeeafkmbefjijbaej'
        : 'https://chrome.google.com/webstore/detail/link-map/jappgmhllahigjolfpgbjdfhciabdnde';
};
