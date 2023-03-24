import browser from 'webextension-polyfill';

function pad(number: number) {
    return number.toString().padStart(2, '0');
}

export const getFormattedData = (): string => {
    const currentDate = new Date();
    return `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(
        currentDate.getDate(),
    )} ${pad(currentDate.getHours())}_${pad(currentDate.getMinutes())}_${pad(
        currentDate.getSeconds(),
    )}`;
};

export const downloadJsonWithExtensionAPI = (
    content: Object,
    fileName: string,
): Promise<number> => {
    const jsonData = JSON.stringify(content);
    const mimeType = 'application/json';
    const fileContent = new Blob([jsonData], { type: mimeType });
    // 调用 chrome.downloads.download 方法下载文件
    return browser.downloads.download({
        url: URL.createObjectURL(fileContent),
        filename: fileName,
    });
};

export const generateKeyByTime = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

export const getOS = (): 'Win' | 'MacOS' | 'Other' => {
    if (navigator.platform.includes('Win')) {
        return 'Win';
    } else if (navigator.platform.includes('Mac')) {
        return 'MacOS';
    } else {
        return 'Other';
    }
};
