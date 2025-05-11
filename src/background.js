// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    loadTimeData();
    // Initialize timer settings
    chrome.storage.local.get(['timerEnabled'], function(result) {
        if (result.timerEnabled === undefined) {
            chrome.storage.local.set({ timerEnabled: false });
        }
    });
});

// Load saved time and settings on startup
chrome.runtime.onStartup.addListener(() => {
    loadTimeData();
});

// Listen for tab updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Check if CSS is enabled
        chrome.storage.local.get(['cssSettings'], function(result) {
            if (result.cssSettings && result.cssSettings.enabled) {
                // Apply CSS to the new page
                chrome.tabs.sendMessage(tabId, {
                    type: 'applyCSS',
                    css: result.cssSettings.styles
                });
            }
        });
    }
});

// Listen for tab switching
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['cssSettings'], function(result) {
        if (result.cssSettings && result.cssSettings.enabled) {
            // Apply CSS to the newly activated tab
            chrome.tabs.sendMessage(activeInfo.tabId, {
                type: 'applyCSS',
                css: result.cssSettings.styles
            });
        }
    });
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        chrome.tabs.query({ active: true, windowId: windowId }, function(tabs) {
            if (tabs[0]) {
                chrome.storage.local.get(['cssSettings'], function(result) {
                    if (result.cssSettings && result.cssSettings.enabled) {
                        // Apply CSS to the active tab in the focused window
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'applyCSS',
                            css: result.cssSettings.styles
                        });
                    }
                });
            }
        });
    }
});

let timeTracker = {
    startTime: null,
    todayTime: 0,
    totalTime: 0,
    startDate: new Date().toISOString(),
    isTracking: false,
    lastDate: new Date().toDateString(),
    weeklyData: Array(7).fill(0),   // hours per weekday (Mon-Sun)
    hourlyData: Array(24).fill(0)   // hours per hour (0-23)
};

// Initialize time tracking
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['timeTracking'], (result) => {
        if (!result.timeTracking) {
            chrome.storage.local.set({ timeTracking: timeTracker });
        }
    });
});

// Load saved time and settings on startup
chrome.runtime.onStartup.addListener(() => {
    loadTimeData();
});

chrome.runtime.onInstalled.addListener(() => {
    loadTimeData();
});

function loadTimeData() {
    chrome.storage.local.get(['timeTracking', 'settings'], function(result) {
        if (result.timeTracking) {
            // Check if it's a new day
            const today = new Date().toDateString();
            if (today !== result.timeTracking.lastDate) {
                timeTracker.todayTime = 0;
                timeTracker.lastDate = today;
                // Reset hourlyData for new day
                timeTracker.hourlyData = Array(24).fill(0);
            } else {
                timeTracker = { ...timeTracker, ...result.timeTracking };
            }
        }
        // Initialize settings if they don't exist
        if (!result.settings) {
            chrome.storage.local.set({
                settings: {
                    darkMode: true,
                    autoSave: true,
                    defaultSize: '14'
                }
            });
        }
    });
}

// Track time on looksmax.org
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('looksmax.org')) {
        startTracking();
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    chrome.tabs.query({ url: '*://looksmax.org/*' }, (tabs) => {
        if (tabs.length === 0) {
            stopTracking();
        }
    });
});

function startTracking() {
    if (!timeTracker.isTracking) {
        timeTracker.startTime = Date.now();
        timeTracker.isTracking = true;
        updateTime();
        console.log('Time tracking started');
    }
}

function stopTracking() {
    if (timeTracker.isTracking) {
        updateTotalTime();
        timeTracker.isTracking = false;
        timeTracker.startTime = null;
        saveTimeData();
        console.log('Time tracking stopped');
    }
}

// Continue tracking time regardless of timer visibility
function updateTime() {
    if (timeTracker.isTracking) {
        const now = new Date();
        const nowMs = now.getTime();
        const elapsed = timeTracker.startTime ? nowMs - timeTracker.startTime : 0;

        // Update today/total
        timeTracker.todayTime += elapsed;
        timeTracker.totalTime += elapsed;

        // --- WEEKLY TRACKING ---
        // Get weekday index (0=Mon, 6=Sun)
        const weekday = (now.getDay() + 6) % 7;
        // Store in hours
        timeTracker.weeklyData[weekday] = (timeTracker.weeklyData[weekday] || 0) + (elapsed / (1000 * 60 * 60));

        // --- HOURLY TRACKING ---
        const hour = now.getHours();
        timeTracker.hourlyData[hour] = (timeTracker.hourlyData[hour] || 0) + (elapsed / (1000 * 60 * 60));

        timeTracker.startTime = nowMs;
        timeTracker.lastUpdate = nowMs;

        chrome.storage.local.set({ timeTracking: timeTracker });
        setTimeout(updateTime, 1000);
    }
}

function updateTotalTime() {
    const now = Date.now();
    const elapsed = timeTracker.startTime ? now - timeTracker.startTime : 0;
    
    timeTracker.todayTime += elapsed;
    timeTracker.totalTime += elapsed;
    timeTracker.startTime = now;
    timeTracker.lastUpdate = now;
    
    saveTimeData();
}

function saveTimeData() {
    chrome.storage.local.set({
        timeTracking: {
            todayTime: timeTracker.todayTime,
            totalTime: timeTracker.totalTime,
            isTracking: timeTracker.isTracking,
            lastUpdate: timeTracker.lastUpdate
        }
    });
}

// Persist settings when changed
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.settings) {
        chrome.storage.local.get(['settings'], function(result) {
            const currentSettings = result.settings || {};
            Object.assign(currentSettings, changes.settings.newValue);
            chrome.storage.local.set({ settings: currentSettings });
        });
    }
});

// Reset daily time and hourlyData at midnight, and weeklyData on Monday
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        timeTracker.todayTime = 0;
        timeTracker.hourlyData = Array(24).fill(0);
        timeTracker.lastDate = now.toDateString();
        // Reset weeklyData on Monday
        if (now.getDay() === 1) {
            timeTracker.weeklyData = Array(7).fill(0);
        }
        chrome.storage.local.set({ timeTracking: timeTracker });
    }
}, 60000);

// Add to existing code
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'openGraphs') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('pages/graph.html')
        });
    }
});

// Add this with your other message listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'openAnalytics') {
        chrome.tabs.create({
            url: chrome.runtime.getURL('pages/analytics.html')
        });
    }
});



