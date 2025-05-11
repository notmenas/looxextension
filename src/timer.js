// Add this near the top of your file
const DEBUG = true;

function log(...args) {
    if (DEBUG) {
        console.log('[Timer]', ...args);
    }
}

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTimer);
} else {
    initializeTimer();
}

function initializeTimer() {
    // Only run on looksmax.org
    if (!window.location.hostname.includes('looksmax.org')) return;

    createTimerElement();
    startTimeTracking();
}

function createTimerElement() {
    // Find the main nav list
    const navList = document.querySelector('.p-nav-list');
    if (!navList) {
        log('Navbar not found!');
        return;
    }

    // Remove old timer if it exists
    let oldTimer = document.getElementById('time-spent-nav');
    if (oldTimer) oldTimer.remove();

    // Create <li> for timer
    const timerLi = document.createElement('li');
    timerLi.id = 'time-spent-nav';

    // Timer link
    timerLi.innerHTML = `
        
        <a href="#" class="p-navEl-link" id="time-spent-link" title="Time Spent (Today)">
            <i class="far fa-clock" style="font-size: 16px;"></i>
            <span id="todayTimer">${formatTime(0)}</span>
        </a>
    `;

    // Insert as the last nav item (or wherever you want)
    navList.appendChild(timerLi);

    // Add click handler to open analytics
    timerLi.querySelector('#time-spent-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ type: 'openAnalytics' });
    });
}

function startTimeTracking() {
    // Initial update
    updateTimerDisplay();
    
    // Update every second
    setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    chrome.storage.local.get(['timeTracking'], (result) => {
        if (result.timeTracking) {
            const todayTimer = document.getElementById('todayTimer');
            if (todayTimer) {
                todayTimer.textContent = formatTime(result.timeTracking.todayTime);
            }
        }
    });
}

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
}

function initTimer() {
    const timerDiv = document.getElementById('siteTimer');
    if (!timerDiv) return;

    function updateTimerDisplay() {
        chrome.storage.local.get(['timeTracking'], (result) => {
            if (result.timeTracking) {
                const todayTimer = document.getElementById('todayTimer');
                const totalTimer = document.getElementById('totalTimer');
                
                if (todayTimer && totalTimer) {
                    todayTimer.textContent = formatTime(result.timeTracking.todayTime);
                    totalTimer.textContent = formatTime(result.timeTracking.totalTime);
                }
            }
        });
    }

    function formatTime(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    // Update timer every second
    setInterval(updateTimerDisplay, 1000);

    // Initial update
    updateTimerDisplay();
}

// Check if timer should be visible and start it
chrome.storage.local.get(['timerEnabled'], (result) => {
    if (result.timerEnabled) {
        const timerDiv = document.getElementById('siteTimer');
        if (timerDiv) {
            timerDiv.classList.add('visible');
            initTimer();
        }
    }
});