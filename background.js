function setMissingDefaults(storageArea, defaults) {
    const keys = Object.keys(defaults);

    storageArea.get(keys, (storedValues) => {
        if (chrome.runtime.lastError) {
            console.error('Could not read extension defaults:', chrome.runtime.lastError.message);
            return;
        }

        const missingValues = {};
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(storedValues, key)) {
                missingValues[key] = defaults[key];
            }
        }

        if (Object.keys(missingValues).length === 0) {
            return;
        }

        storageArea.set(missingValues, () => {
            if (chrome.runtime.lastError) {
                console.error('Could not initialize extension defaults:', chrome.runtime.lastError.message);
            }
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    setMissingDefaults(chrome.storage.sync, {
        enabled: false,
        interval: 5,
        active: true,
        customColor: '#bb86fc',
        colorIndex: 4
    });

    setMissingDefaults(chrome.storage.local, {
        videoPositions: {},
        blacklistedVideos: {}
    });
});
