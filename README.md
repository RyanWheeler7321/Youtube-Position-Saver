# YouTube Position Saver Extension

A Chrome extension that automatically saves and restores your position in YouTube videos with a configurable interval.

## Features

- **Auto-save video positions**: Saves your current position in YouTube videos at configurable intervals (1-30 seconds)
- **Auto-restore on reload**: When you revisit a video, it automatically seeks to your saved position
- **Blacklist videos**: Option to blacklist specific videos from being tracked
- **Dark purple theme**: Beautiful dark grey and purple neon-themed popup interface
- **Local storage**: All data is stored locally using Chrome's storage API (JSON format)

## Installation

### Method 1: Load as Unpacked Extension (Developer Mode)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `YouTube Position Saver Extension` folder
5. The extension should now appear in your extensions list

### Method 2: Create Icons (Optional)

If you want proper icons instead of the default puzzle piece:

1. Install a tool like Inkscape or use an online SVG to PNG converter
2. Convert the included `icon.svg` to PNG files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels) 
   - `icon128.png` (128x128 pixels)
3. Place these PNG files in the extension folder

## Usage

### Basic Setup

1. **Enable the extension**: Click the extension icon and toggle "Enable Auto-Save"
2. **Set save interval**: Use the slider to set how often positions are saved (default: 5 seconds)
3. **Watch YouTube videos**: The extension will automatically save your position

### Controls

- **Save Interval Slider**: Adjusts how frequently your position is saved (1-30 seconds)
- **Enable/Disable Auto-Save**: Main toggle for the extension functionality
- **Blacklist Current Video**: Prevents the current video from being tracked

### How It Works

1. When you're watching a YouTube video with auto-save enabled, your position is saved every N seconds
2. When you return to that video later, it automatically seeks to your saved position
3. Positions are only restored if you were more than 10 seconds into the video
4. Blacklisted videos are ignored completely

## Data Storage

The extension stores data locally using Chrome's storage API in JSON format:

- **Video positions**: `videoPositions` object containing:
  - Video ID as key
  - Object with `time`, `timestamp`, and `title`
- **Blacklisted videos**: `blacklistedVideos` object with video IDs as keys
- **Settings**: `interval` and `enabled` state

## Troubleshooting

### Extension not working?
- Make sure you're on a YouTube video page (`youtube.com/watch`)
- Check that auto-save is enabled in the popup
- Verify the extension has permission to access YouTube

### Position not restoring?
- The extension only restores positions for videos you watched for more than 10 seconds
- Check if the video is blacklisted
- Try refreshing the page

### Can't see the popup?
- Click directly on the extension icon in the toolbar
- If the icon isn't visible, click the puzzle piece icon and pin the extension

## Technical Details

- **Manifest Version**: 3
- **Permissions**: storage, activeTab
- **Host Permissions**: https://www.youtube.com/*
- **Storage**: Chrome storage API (local and sync)
- **Content Script**: Runs on all YouTube pages
- **Background Script**: Service worker for lifecycle management

## Files Structure

```
YouTube Position Saver Extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js              # Popup logic and controls
├── content.js            # YouTube page interaction
├── background.js         # Background service worker
├── icon.svg             # Vector icon source
├── icon16.png           # 16x16 icon (create from SVG)
├── icon48.png           # 48x48 icon (create from SVG)
├── icon128.png          # 128x128 icon (create from SVG)
└── README.md            # This file
```

## Privacy

- All data is stored locally on your device
- No data is sent to external servers
- Only video IDs, timestamps, and positions are stored
- You can clear all data by removing the extension 