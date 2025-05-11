// Popup script that runs when extension popup is opened
document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    const elements = {
        inputText: document.getElementById('inputText'),
        outputText: document.getElementById('outputText'),
        convertBtn: document.getElementById('convert'),
        copyButton: document.getElementById('copyButton'),
        colorPicker: document.getElementById('colorPicker'),
        sizeSlider: document.getElementById('sizeSlider'),
        sizeValue: document.getElementById('sizeValue'),
        checkboxes: document.querySelectorAll('input[name="bbStyle"]'),
        cssToggle: document.getElementById('cssToggle'),
        cssInput: document.getElementById('cssInput'),
        saveAsPresetBtn: document.getElementById('saveAsPreset'),
        presetList: document.getElementById('presetList')
    };

    // Load settings from JSON
    async function loadSettings() {
        try {
            const response = await fetch(chrome.runtime.getURL('settings.json'));
            const settings = await response.json();
            
            if (elements.cssToggle && elements.cssInput) {
                elements.cssInput.value = settings.cssSettings.styles || '';
                elements.cssToggle.checked = settings.cssSettings.enabled || false;
                
                if (settings.cssSettings.enabled) {
                    applyCSS(settings.cssSettings.styles);
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    // Save settings to JSON
    async function saveSettings(css, enabled) {
        try {
            const settings = {
                cssSettings: {
                    enabled: enabled,
                    styles: css,
                    lastUpdated: new Date().toISOString()
                }
            };

            const response = await fetch(chrome.runtime.getURL('settings.json'), {
                method: 'PUT',
                body: JSON.stringify(settings, null, 2)
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Initialize settings
    loadSettings();

    // Handle toggle changes
    if (elements.cssToggle && elements.cssInput) {
        elements.cssToggle.addEventListener('change', function() {
            const css = elements.cssInput.value;
            const isEnabled = this.checked;
            
            saveSettings(css, isEnabled);
            applyCSS(isEnabled ? css : '');
        });

        elements.cssInput.addEventListener('input', function() {
            if (elements.cssToggle.checked) {
                saveSettings(this.value, true);
                applyCSS(this.value);
            }
        });
    }

    function applyCSS(css) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) return;
            
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'applyCSS',
                css: css
            }, function(response) {
                console.log('CSS application response:', response);
            });
        });
    }

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Re-check CSS toggle state after tab switch
            if (elements.cssToggle) {
                chrome.storage.local.get(['cssEnabled'], function(result) {
                    elements.cssToggle.checked = result.cssEnabled || false;
                });
            }
        });
    });

    // BB Code Converter
    elements.colorPicker.style.display = 'none';
    elements.sizeSlider.parentElement.style.display = 'none';

    // BB Code Event Listeners
    document.querySelector('input[value="color"]')?.addEventListener('change', function() {
        elements.colorPicker.style.display = this.checked ? 'block' : 'none';
    });

    document.querySelector('input[value="size"]')?.addEventListener('change', function() {
        elements.sizeSlider.parentElement.style.display = this.checked ? 'flex' : 'none';
    });

    elements.sizeSlider?.addEventListener('input', function() {
        elements.sizeValue.textContent = this.value;
    });

    elements.convertBtn?.addEventListener('click', function() {
        let text = elements.inputText.value;
        const selectedStyles = Array.from(elements.checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        selectedStyles.forEach(style => {
            switch(style) {
                case 'b': text = `[b]${text}[/b]`; break;
                case 'i': text = `[i]${text}[/i]`; break;
                case 'u': text = `[u]${text}[/u]`; break;
                case 's': text = `[s]${text}[/s]`; break;
                case 'color': text = `[color=${elements.colorPicker.value}]${text}[/color]`; break;
                case 'size': text = `[size=${elements.sizeSlider.value}]${text}[/size]`; break;
            }
        });

        elements.outputText.value = text;
    });

    elements.copyButton?.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(elements.outputText.value);
            this.textContent = 'Copied!';
            setTimeout(() => {
                this.textContent = 'Copy to Clipboard';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    // CSS Toggle functionality
    if (elements.cssToggle && elements.cssInput) {
        // Load initial state
        chrome.storage.local.get(['cssSettings'], function(result) {
            if (result.cssSettings) {
                elements.cssInput.value = result.cssSettings.styles || '';
                elements.cssToggle.checked = result.cssSettings.enabled || false;
                if (result.cssSettings.enabled) {
                    applyCSS(result.cssSettings.styles);
                }
            }
        });

        // Handle toggle changes
        elements.cssToggle.addEventListener('change', function() {
            const settings = {
                cssSettings: {
                    enabled: this.checked,
                    styles: elements.cssInput.value,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            chrome.storage.local.set(settings, function() {
                if (settings.cssSettings.enabled) {
                    applyCSS(settings.cssSettings.styles);
                } else {
                    applyCSS('');
                }
            });
        });

        // Handle CSS input changes
        elements.cssInput.addEventListener('input', function() {
            if (elements.cssToggle.checked) {
                const settings = {
                    cssSettings: {
                        enabled: true,
                        styles: this.value,
                        lastUpdated: new Date().toISOString()
                    }
                };
                
                chrome.storage.local.set(settings, function() {
                    applyCSS(settings.cssSettings.styles);
                });
            }
        });
    }

    // Load saved settings
    chrome.storage.local.get(['cssSettings'], function(result) {
        if (result.cssSettings) {
            elements.cssInput.value = result.cssSettings.styles || '';
            elements.cssToggle.checked = result.cssSettings.enabled || false;
        }
    });

    // Handle toggle changes
    if (elements.cssToggle && elements.cssInput) {
        elements.cssToggle.addEventListener('change', function() {
            const settings = {
                cssSettings: {
                    enabled: this.checked,
                    styles: elements.cssInput.value,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            chrome.storage.local.set(settings, function() {
                applyCSS(settings.cssSettings.enabled ? settings.cssSettings.styles : '');
            });
        });

        elements.cssInput.addEventListener('input', function() {
            if (elements.cssToggle.checked) {
                const settings = {
                    cssSettings: {
                        enabled: true,
                        styles: this.value,
                        lastUpdated: new Date().toISOString()
                    }
                };
                
                chrome.storage.local.set(settings, function() {
                    applyCSS(settings.cssSettings.styles);
                });
            }
        });
    }

    // CSS Subtabs
    const cssSubtabs = document.querySelectorAll('.css-subtab');
    const cssSubtabContents = document.querySelectorAll('.css-subtab-content');

    cssSubtabs.forEach(tab => {
        tab.addEventListener('click', () => {
            cssSubtabs.forEach(t => t.classList.remove('active'));
            cssSubtabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const subtabId = tab.getAttribute('data-subtab');
            document.getElementById(subtabId).classList.add('active');
        });
    });

    // Save as Preset
    const saveAsPresetBtn = document.getElementById('saveAsPreset');
    saveAsPresetBtn?.addEventListener('click', async () => {
        const name = prompt('Enter a name for this preset:');
        if (!name) return;

        const preset = {
            name,
            css: elements.cssInput.value,
            date: new Date().toISOString()
        };

        chrome.storage.local.get(['cssPresets'], function(result) {
            const presets = result.cssPresets || [];
            presets.push(preset);
            chrome.storage.local.set({ cssPresets: presets }, function() {
                updatePresetList();
            });
        });
    });

    // Load and display presets
    function updatePresetList() {
        const presetList = document.getElementById('presetList');
        chrome.storage.local.get(['cssPresets'], function(result) {
            const presets = result.cssPresets || [];
            presetList.innerHTML = presets.length ? '' : '<p>No presets saved yet</p>';

            presets.forEach((preset, index) => {
                const presetEl = document.createElement('div');
                presetEl.className = 'preset-item';
                presetEl.innerHTML = `
                    <div class="preset-info">
                        <div class="preset-name">${preset.name}</div>
                        <div class="preset-date">${new Date(preset.date).toLocaleDateString()}</div>
                    </div>
                    <div class="preset-actions">
                        <button class="apply-preset" data-index="${index}">Apply</button>
                        <button class="delete-preset" data-index="${index}">Delete</button>
                    </div>
                `;
                presetList.appendChild(presetEl);
            });

            // Add event listeners for preset actions
            document.querySelectorAll('.apply-preset').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    const preset = presets[index];
                    
                    // Update input and toggle
                    elements.cssInput.value = preset.css;
                    elements.cssToggle.checked = true;
                    
                    // Save to storage and apply CSS
                    const settings = {
                        cssSettings: {
                            enabled: true,
                            styles: preset.css,
                            lastUpdated: new Date().toISOString()
                        }
                    };
                    
                    // Save both preset state and CSS settings
                    chrome.storage.local.set({ 
                        cssSettings: settings.cssSettings,
                        currentPreset: index
                    }, function() {
                        applyCSS(preset.css);
                    });
                });
            });

            document.querySelectorAll('.delete-preset').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    presets.splice(index, 1);
                    chrome.storage.local.set({ cssPresets: presets }, function() {
                        updatePresetList();
                    });
                });
            });
        });
    }

    // Initial load of presets
    updatePresetList();

    // Add initial load of current preset
    chrome.storage.local.get(['cssSettings', 'currentPreset', 'cssPresets'], function(result) {
        if (result.cssSettings && result.cssSettings.enabled) {
            elements.cssInput.value = result.cssSettings.styles || '';
            elements.cssToggle.checked = true;
            applyCSS(result.cssSettings.styles);
        }
        
        if (result.currentPreset !== undefined && result.cssPresets) {
            const preset = result.cssPresets[result.currentPreset];
            if (preset) {
                elements.cssInput.value = preset.css;
                elements.cssToggle.checked = true;
                applyCSS(preset.css);
            }
        }
    });

    // Load all settings
    chrome.storage.local.get(['settings', 'cssSettings'], function(result) {
        // Restore CSS settings
        if (result.cssSettings) {
            elements.cssInput.value = result.cssSettings.styles || '';
            elements.cssToggle.checked = result.cssSettings.enabled || false;
        }

        // Restore other settings
        if (result.settings) {
            document.querySelector('input[name="darkMode"]').checked = result.settings.darkMode;
            document.querySelector('input[name="autoSave"]').checked = result.settings.autoSave;
            document.querySelector('select[name="defaultSize"]').value = result.settings.defaultSize;
        }
    });

    // Save settings when changed
    document.querySelectorAll('.setting-item input, .setting-item select').forEach(input => {
        input.addEventListener('change', function() {
            chrome.storage.local.get(['settings'], function(result) {
                const settings = result.settings || {};
                settings[input.name] = input.type === 'checkbox' ? input.checked : input.value;
                chrome.storage.local.set({ settings });
            });
        });
    });

    // Single source of truth for settings
    function saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ settings }, resolve);
        });
    }

    // Load settings once at startup
    chrome.storage.local.get(['settings'], function(result) {
        const settings = result.settings || {
            darkMode: false,
            autoSave: true,
            defaultSize: '14'
        };

        // Apply settings to UI
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });

        // Save initial settings if they don't exist
        if (!result.settings) {
            saveSettings(settings);
        }
    });

    // Handle setting changes
    document.querySelectorAll('.setting-item input, .setting-item select').forEach(input => {
        input.addEventListener('change', async function() {
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};
            settings[input.name] = input.type === 'checkbox' ? input.checked : input.value;
            await saveSettings(settings);
        });
    });

    // Inside your DOMContentLoaded event listener
    if (elements.cssToggle && elements.cssInput) {
        // Load state
        chrome.storage.local.get(['cssSettings'], function(result) {
            if (result.cssSettings) {
                elements.cssInput.value = result.cssSettings.styles || '';
                elements.cssToggle.checked = result.cssSettings.enabled;
                if (result.cssSettings.enabled && result.cssSettings.styles) {
                    applyCSS(result.cssSettings.styles);
                }
            }
        });

        // Handle changes
        elements.cssToggle.addEventListener('change', function() {
            const settings = {
                cssSettings: {
                    enabled: this.checked,
                    styles: elements.cssInput.value,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            chrome.storage.local.set(settings);
            if (this.checked) {
                applyCSS(elements.cssInput.value);
            } else {
                applyCSS('');
            }
        });
    }

    // Timer toggle functionality
    const timerToggle = document.getElementById('timerToggle');
    if (timerToggle) {
        // Load initial state
        chrome.storage.local.get(['timerEnabled'], function(result) {
            timerToggle.checked = result.timerEnabled || false;
        });

        // Handle toggle changes
        timerToggle.addEventListener('change', function() {
            chrome.storage.local.set({ timerEnabled: this.checked });
        });
    }

    // Timer controls
    const timeElements = {
        timerToggle: document.getElementById('timerToggle'),
        timeTrackingToggle: document.getElementById('timeTrackingToggle'),
        todayTime: document.getElementById('todayTime'),
        totalTime: document.getElementById('totalTime'),
        timePopup: document.getElementById('timePopup'),
        minimizeTimePopup: document.getElementById('minimizeTimePopup'),
        popupTodayTime: document.getElementById('popupTodayTime'),
        popupTotalTime: document.getElementById('popupTotalTime')
    };

    // Load timer state
    chrome.storage.local.get(['timerEnabled', 'timeTracking'], function(result) {
        if (timeElements.timerToggle) {
            timeElements.timerToggle.checked = result.timerEnabled || false;
            timeElements.timeTrackingToggle.checked = result.timeTracking?.isTracking || false;
            
            // Update time displays
            if (result.timeTracking) {
                updateTimeDisplays(result.timeTracking);
            }
        }
    });

    // Handle timer toggle
    if (timeElements.timerToggle) {
        timeElements.timerToggle.addEventListener('change', function() {
            const isEnabled = this.checked;
            chrome.storage.local.set({ timerEnabled: isEnabled }, function() {
                // Send message to show/hide timer in content script
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'toggleTimer',
                            enabled: isEnabled
                        });
                    }
                });
            });
        });
    }

    // Handle time tracking toggle
    if (timeElements.timeTrackingToggle) {
        timeElements.timeTrackingToggle.addEventListener('change', function() {
            chrome.storage.local.set({
                timeTracking: {
                    isTracking: this.checked,
                    todayTime: 0,
                    totalTime: 0,
                    lastUpdate: new Date().toISOString()
                }
            });
        });
    }

    // Update time displays
    function updateTimeDisplays(timeData) {
        const formatTime = (ms) => {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / (1000 * 60)) % 60);
            const hours = Math.floor(ms / (1000 * 60 * 60));
            return `${hours}h ${minutes}m ${seconds}s`;
        };

        if (timeElements.todayTime) {
            timeElements.todayTime.textContent = formatTime(timeData.todayTime);
        }
        if (timeElements.totalTime) {
            timeElements.totalTime.textContent = formatTime(timeData.totalTime);
        }
        if (timeElements.popupTodayTime) {
            timeElements.popupTodayTime.textContent = formatTime(timeData.todayTime);
        }
        if (timeElements.popupTotalTime) {
            timeElements.popupTotalTime.textContent = formatTime(timeData.totalTime);
        }
    }

    // Update time displays every second
    setInterval(() => {
        chrome.storage.local.get(['timeTracking'], function(result) {
            if (result.timeTracking) {
                updateTimeDisplays(result.timeTracking);
            }
        });
    }, 1000);

    // Handle minimize button
    if (timeElements.minimizeTimePopup) {
        timeElements.minimizeTimePopup.addEventListener('click', () => {
            timeElements.timePopup.classList.toggle('minimized');
            chrome.storage.local.set({ 
                timerMinimized: timeElements.timePopup.classList.contains('minimized') 
            });
        });
    }

    // Time tracking toggle
    const timeTrackingToggle = document.getElementById('timeTrackingToggle');
    if (timeTrackingToggle) {
        // Load initial state
        chrome.storage.local.get(['timeTracking'], (result) => {
            timeTrackingToggle.checked = result.timeTracking?.isTracking || false;
        });

        // Handle toggle changes
        timeTrackingToggle.addEventListener('change', function() {
            chrome.storage.local.set({
                timeTracking: {
                    isTracking: this.checked,
                    todayTime: 0,
                    totalTime: 0,
                    lastUpdate: new Date().toISOString()
                }
            });

            // Update timer display
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'updateTimer',
                        enabled: this.checked
                    });
                }
            });
        });
    }

    // Initialize analytics
    initializeAnalytics();

    // Add this inside your DOMContentLoaded event listener
    const analyticsBtn = document.createElement('button');
    analyticsBtn.textContent = 'View Detailed Analytics';
    analyticsBtn.className = 'analytics-btn';
    analyticsBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('pages/analytics.html')
        });
    });

    // Add the button to your settings section
    document.querySelector('.settings-section').appendChild(analyticsBtn);
});

// Replace all timer-related code with this simplified version
function initializeAnalytics() {
    const elements = {
        analyticsToday: document.getElementById('analyticsToday'),
        analyticsTotal: document.getElementById('analyticsTotal'),
        analyticsAverage: document.getElementById('analyticsAverage'),
        resetStats: document.getElementById('resetStats')
    };

    function formatTime(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    function updateAnalytics() {
        chrome.storage.local.get(['timeTracking'], function(result) {
            if (result.timeTracking) {
                const { todayTime, totalTime, startDate } = result.timeTracking;
                
                // Calculate daily average
                const start = new Date(startDate || Date.now());
                const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const average = Math.floor(totalTime / days);

                // Update displays
                elements.analyticsToday.textContent = formatTime(todayTime);
                elements.analyticsTotal.textContent = formatTime(totalTime);
                elements.analyticsAverage.textContent = formatTime(average);
            }
        });
    }

    // Reset stats button
    elements.resetStats?.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all time statistics?')) {
            chrome.storage.local.set({
                timeTracking: {
                    todayTime: 0,
                    totalTime: 0,
                    startDate: new Date().toISOString(),
                    isTracking: true
                }
            }, updateAnalytics);
        }
    });

    // Update analytics every second when tab is visible
    setInterval(updateAnalytics, 1000);

    // Initial update
    updateAnalytics();
}