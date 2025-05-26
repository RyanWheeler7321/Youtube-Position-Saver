chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        enabled: false,
        interval: 5
    });
    
    chrome.storage.local.set({
        videoPositions: {},
        blacklistedVideos: {}
    });
    
    console.log('YouTube Position Saver extension installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
        chrome.tabs.sendMessage(tabId, {
            action: 'pageLoaded'
        }).catch(() => {
        });
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsChanged',
                    changes: changes
                }).catch(() => {
                });
            });
        });
    }
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('youtube.com')) {
        chrome.action.openPopup();
    }
}); 