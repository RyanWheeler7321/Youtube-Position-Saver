chrome.runtime.onInstalled.addListener(async () => {
    // Only fill in defaults for missing keys, so updates keep saved positions and settings
    const settings = await chrome.storage.sync.get({ enabled: false, interval: 5 });
    await chrome.storage.sync.set(settings);

    const saved = await chrome.storage.local.get({ videoPositions: {}, blacklistedVideos: {} });
    await chrome.storage.local.set(saved);
    
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