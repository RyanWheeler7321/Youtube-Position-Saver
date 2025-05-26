// MARK: DOM Elements and State
document.addEventListener('DOMContentLoaded', async function() {
    const intervalSlider = document.getElementById('intervalSlider');
    const sliderValue = document.getElementById('sliderValue');
    const toggleButton = document.getElementById('toggleButton');
    const savePositionButton = document.getElementById('savePositionButton');
    const blacklistButton = document.getElementById('blacklistButton');
    const status = document.getElementById('status');
    const colorCycleButton = document.getElementById('colorCycleButton');
    const powerButton = document.getElementById('powerButton');
    const extensionContent = document.getElementById('extensionContent');

    let isActive = true;
    let isEnabled = false;
    let currentVideoId = null;
    let customColor = '#bb86fc';
    let colorIndex = 4;
    
    const colorPalette = [
        '#ff4444',  
        '#4488ff',  
        '#44ff44',  
        '#44ffff',  
        '#bb86fc',  
        '#ff44ff',  
        '#ffffff',  
        '#ffff44',  
        '#ff8844'   
    ];

    let sliderTimeout;

    async function loadSettings() {
        const result = await chrome.storage.sync.get({
            interval: 5,
            enabled: false,
            active: true,
            customColor: '#bb86fc',
            colorIndex: 4
        });
        
        intervalSlider.value = result.interval;
        sliderValue.textContent = `${result.interval} seconds`;
        isEnabled = result.enabled;
        isActive = result.active;
        customColor = result.customColor;
        colorIndex = result.colorIndex;
        updateToggleButton();
        updatePowerButton();
        updateColorDisplay();
    }

    function updateToggleButton() {
        toggleButton.textContent = isEnabled ? 'Auto-Save is Enabled' : 'Auto-Save is Disabled';
        toggleButton.style.background = isEnabled 
            ? `linear-gradient(45deg, ${customColor}, ${customColor}dd)` 
            : 'linear-gradient(45deg, #333, #555)';
    }

    function updatePowerButton() {
        if (isActive) {
            powerButton.classList.add('active');
            powerButton.classList.remove('inactive');
            extensionContent.classList.remove('inactive');
            status.textContent = 'Extension active';
        } else {
            powerButton.classList.remove('active');
            powerButton.classList.add('inactive');
            extensionContent.classList.add('inactive');
            status.textContent = 'Extension inactive';
        }
    }

    // MARK: Color Theme System
    function updateColorDisplay() {
        colorCycleButton.style.borderLeftColor = customColor;
        
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        document.documentElement.style.setProperty('--custom-color', customColor);
        document.documentElement.style.setProperty('--custom-color-glow', hexToRgba(customColor, 0.6));
        
        const style = document.createElement('style');
        style.textContent = `
            .control-group {
                border-color: ${hexToRgba(customColor, 0.2)} !important;
            }
        `;
        
        const existingStyle = document.getElementById('dynamic-colors');
        if (existingStyle) {
            existingStyle.remove();
        }
        style.id = 'dynamic-colors';
        document.head.appendChild(style);
    }

    intervalSlider.addEventListener('input', function() {
        const value = this.value;
        sliderValue.textContent = `${value} seconds`;
        
        clearTimeout(sliderTimeout);
        sliderTimeout = setTimeout(() => {
            chrome.storage.sync.set({ interval: parseInt(value) });
            
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs[0] && tabs[0].url.includes('youtube.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateInterval',
                        interval: parseInt(value)
                    });
                }
            });
        }, 150);
    });

    colorCycleButton.addEventListener('click', function() {
        colorIndex = (colorIndex + 1) % colorPalette.length;
        customColor = colorPalette[colorIndex];
        chrome.storage.sync.set({ 
            customColor: customColor,
            colorIndex: colorIndex 
        });
        updateColorDisplay();
        updateToggleButton();
    });

    powerButton.addEventListener('click', function() {
        isActive = !isActive;
        chrome.storage.sync.set({ active: isActive });
        updatePowerButton();
        
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'setActive',
                    active: isActive
                });
            }
        });
    });

    toggleButton.addEventListener('click', function() {
        isEnabled = !isEnabled;
        chrome.storage.sync.set({ enabled: isEnabled });
        updateToggleButton();
        
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggle',
                    enabled: isEnabled
                });
            }
        });
        
        status.textContent = isEnabled ? 'Auto-save enabled' : 'Auto-save disabled';
    });

    savePositionButton.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'saveNow'
                }, function(response) {
                    if (response && response.success) {
                        savePositionButton.classList.add('saved');
                        savePositionButton.textContent = 'Position Saved!';
                        status.textContent = `Saved at ${response.time}s`;
                        
                        setTimeout(() => {
                            savePositionButton.classList.remove('saved');
                            savePositionButton.textContent = 'Save Current Position';
                            status.textContent = 'Extension ready';
                        }, 1500);
                    } else {
                        status.textContent = 'Save failed - no video';
                    }
                });
            } else {
                status.textContent = 'Not on YouTube';
            }
        });
    });

    blacklistButton.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'blacklist'
                }, function(response) {
                    if (response && response.success) {
                        status.textContent = 'Video blacklisted';
                        setTimeout(() => {
                            status.textContent = 'Extension ready';
                        }, 2000);
                    }
                });
            } else {
                status.textContent = 'Not on YouTube';
            }
        });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'getCurrentVideo'
            }, function(response) {
                if (response && response.videoId) {
                    currentVideoId = response.videoId;
                    status.textContent = 'YouTube video detected';
                } else {
                    status.textContent = 'No video playing';
                }
            });
        } else {
            status.textContent = 'Not on YouTube';
            blacklistButton.disabled = true;
            blacklistButton.style.opacity = '0.5';
        }
    });

    await loadSettings();
}); 