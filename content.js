// MARK: Global State Management
let saveInterval = null;
let currentVideoId = null;
let isActive = true;
let isEnabled = false;
let intervalTime = 5000;

// MARK: Core Video Functions
function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function getVideoElement() {
    return document.querySelector('video');
}

function getCurrentTime() {
    const video = getVideoElement();
    return video ? video.currentTime : 0;
}

function setCurrentTime(time) {
    const video = getVideoElement();
    if (video && time > 0) {
        video.currentTime = time;
    }
}

function isVideoPlaying() {
    const video = getVideoElement();
    return video && !video.paused && video.currentTime > 0;
}

function waitForVideoReady(callback, maxAttempts = 20, attemptDelay = 100) {
    let attempts = 0;
    
    const checkReady = () => {
        const video = getVideoElement();
        
        if (video && video.readyState >= 2 && video.duration > 0) {
            callback();
            return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            setTimeout(checkReady, attemptDelay);
        } else {
            setTimeout(callback, 500);
        }
    };
    
    checkReady();
}

// MARK: Position Management System
async function savePosition(forceManual = false) {
    if (!currentVideoId || !isActive || (!isEnabled && !forceManual)) return;
    
    const isBlacklisted = await checkIfBlacklisted(currentVideoId);
    if (isBlacklisted) return;
    
    if (!forceManual && !isVideoPlaying()) return;
    
    const currentTime = getCurrentTime();
    if (currentTime > 0) {
        const result = await chrome.storage.local.get('videoPositions');
        const videoPositions = result.videoPositions || {};
        
        videoPositions[currentVideoId] = {
            time: currentTime,
            timestamp: Date.now(),
            title: document.title
        };
        
        await chrome.storage.local.set({ videoPositions: videoPositions });
        return currentTime;
    }
    return 0;
}

async function loadPosition() {
    if (!currentVideoId || !isActive) return;
    
    const isBlacklisted = await checkIfBlacklisted(currentVideoId);
    if (isBlacklisted) return;
    
    const result = await chrome.storage.local.get('videoPositions');
    const videoPositions = result.videoPositions || {};
    
    if (videoPositions[currentVideoId]) {
        const savedTime = videoPositions[currentVideoId].time;
        if (savedTime > 10) {
            waitForVideoReady(() => {
                setCurrentTime(savedTime);
                console.log(`YouTube Position Saver: Restored position to ${Math.floor(savedTime)}s`);
            });
        }
    }
}

async function checkIfBlacklisted(videoId) {
    const result = await chrome.storage.local.get('blacklistedVideos');
    const blacklistedVideos = result.blacklistedVideos || {};
    return blacklistedVideos[videoId] === true;
}

async function blacklistCurrentVideo() {
    if (!currentVideoId) return false;
    
    const [blacklistResult, positionsResult] = await Promise.all([
        chrome.storage.local.get('blacklistedVideos'),
        chrome.storage.local.get('videoPositions')
    ]);
    
    const blacklistedVideos = blacklistResult.blacklistedVideos || {};
    const videoPositions = positionsResult.videoPositions || {};
    
    blacklistedVideos[currentVideoId] = true;
    
    if (videoPositions[currentVideoId]) {
        delete videoPositions[currentVideoId];
    }
    
    await chrome.storage.local.set({ 
        blacklistedVideos: blacklistedVideos,
        videoPositions: videoPositions 
    });
    
    stopSaving();
    
    console.log(`YouTube Position Saver: Video ${currentVideoId} blacklisted`);
    return true;
}

function startSaving() {
    if (saveInterval) clearInterval(saveInterval);
    
    saveInterval = setInterval(() => {
        savePosition();
    }, intervalTime);
}

function stopSaving() {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
}

function handleVideoChange() {
    const newVideoId = getVideoId();
    
    if (newVideoId !== currentVideoId) {
        stopSaving();
        currentVideoId = newVideoId;
        
        if (currentVideoId && isActive) {
            loadPosition();
            if (isEnabled) {
                startSaving();
            }
        }
    }
}

// MARK: Initialization
async function initialize() {
    const settings = await chrome.storage.sync.get({
        enabled: false,
        active: true,
        interval: 5
    });
    
    isEnabled = settings.enabled;
    isActive = settings.active;
    intervalTime = settings.interval * 1000;
    currentVideoId = getVideoId();
    
    if (currentVideoId && isActive) {
        loadPosition();
        if (isEnabled) {
            startSaving();
        }
    }
    
    let mutationTimeout;
    const observer = new MutationObserver((mutations) => {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    handleVideoChange();
                    break;
                }
            }
        }, 50);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    window.addEventListener('popstate', handleVideoChange);
    window.addEventListener('pushstate', handleVideoChange);
    window.addEventListener('replacestate', handleVideoChange);
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        setTimeout(handleVideoChange, 100);
    };
    
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        setTimeout(handleVideoChange, 100);
    };
}

// MARK: Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'setActive':
            isActive = message.active;
            if (!isActive) {
                stopSaving();
            } else if (currentVideoId) {
                loadPosition();
                if (isEnabled) {
                    startSaving();
                }
            }
            break;
            
        case 'toggle':
            isEnabled = message.enabled;
            if (isEnabled && currentVideoId && isActive) {
                startSaving();
            } else {
                stopSaving();
            }
            break;
            
        case 'updateInterval':
            intervalTime = message.interval * 1000;
            if (isEnabled && currentVideoId && isActive) {
                stopSaving();
                startSaving();
            }
            break;
            
        case 'saveNow':
            if (currentVideoId) {
                savePosition(true).then(time => {
                    sendResponse({ 
                        success: time > 0, 
                        time: Math.floor(time) 
                    });
                });
            } else {
                sendResponse({ success: false });
            }
            return true;
            
        case 'blacklist':
            blacklistCurrentVideo().then(success => {
                sendResponse({ success: success });
            });
            return true;
            
        case 'getCurrentVideo':
            sendResponse({ videoId: currentVideoId });
            break;
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 