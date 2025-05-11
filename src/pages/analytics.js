let weeklyChartInstance = null;
let dailyChartInstance = null;
let cumulativeChartInstance = null;

// Format time function
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
}

// Update stats function
function updateStats() {
    // Check if running in a Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.storage) {
        // Use Chrome storage API
        chrome.storage.local.get(['timeTracking'], function(result) {
            if (result.timeTracking) {
                updateUIWithData(result.timeTracking);
            } else {
                // Initialize with empty data if nothing is stored yet
                initializeEmptyData();
            }
        });
    } else {
        // If not in a Chrome extension or for testing in browser
        useTestData();
    }
}

// Update UI with actual data
function updateUIWithData(timeData) {
    const { todayTime, totalTime, startDate } = timeData;
    
    // Calculate days active
    const start = new Date(startDate || Date.now());
    const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const average = Math.floor(totalTime / days);

    // Update stats
    document.getElementById('todayTime').textContent = formatTime(todayTime);
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('averageTime').textContent = formatTime(average);
    document.getElementById('daysActive').textContent = days;

    // Update charts
    updateCharts(timeData);
}

// Fallback for browser testing with sample data
function useTestData() {
    const testData = {
        todayTime: 2 * 60 * 60 * 1000 + 23 * 60 * 1000 + 45 * 1000, // 2h 23m 45s
        totalTime: 45 * 60 * 60 * 1000 + 30 * 60 * 1000, // 45h 30m
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        weeklyData: [1.5, 2.3, 0.8, 3.1, 2.7, 4.2, 2.5], // in hours
        hourlyData: [
            0.2, 0.1, 0, 0, 0, 0.1, 
            0.5, 1.2, 1.8, 1.5, 1.1, 0.8, 
            1.3, 1.5, 1.2, 0.9, 0.7, 1.1, 
            1.6, 1.9, 1.7, 1.2, 0.8, 0.3
        ] // activity distribution by hour
    };
    
    updateUIWithData(testData);
}

// Initialize with empty data
function initializeEmptyData() {
    updateUIWithData({
        todayTime: 0,
        totalTime: 0,
        startDate: Date.now(),
        weeklyData: Array(7).fill(0),
        hourlyData: Array(24).fill(0)
    });
}

// Safe check if Chart exists before using it
function isChartAvailable() {
    return true; // Replace with actual check if Chart.js is loaded
}

// Helper function to prevent chart duplication - with safety check
function destroyChartIfExists(chartId) {
    if (!isChartAvailable()) return;
    
    const chart = Chart.getChart(chartId);
    if (chart) {
        chart.destroy();
    }
}


// Basic chart rendering with canvas
const charts = {}; // Track all chart instances here

function renderBasicChart(canvasId, data, labels) {
    console.log('Rendering chart with data:', data, 'and labels:', labels);
  const ctx = document.getElementById(canvasId).getContext('2d');

  // If a chart exists on this canvas, destroy it
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  // Create and store the new chart
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Usage per Day',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
  
  // Example usage:
  const usageData = [12, 19, 3, 5, 2, 3, 7];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  

  

// Update charts function
function updateCharts(timeData) {
    // Prepare weekly data (hours per day, Mon-Sun)
    let weeklyData = Array.isArray(timeData.weeklyData) ? timeData.weeklyData : Array(7).fill(0);
    // If data is in ms, convert to hours
    if (weeklyData.some(v => v > 24)) {
        weeklyData = weeklyData.map(v => v / (1000 * 60 * 60));
    }

    // Prepare hourly data (hours per hour, 0-23)
    let hourlyData = Array.isArray(timeData.hourlyData) ? timeData.hourlyData : Array(24).fill(0);
    if (hourlyData.some(v => v > 5)) {
        hourlyData = hourlyData.map(v => v / (1000 * 60 * 60));
    }

    // Destroy old charts if they exist
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    if (dailyChartInstance) dailyChartInstance.destroy();

    // Weekly activity chart
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChartInstance = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Hours',
                data: weeklyData,
                backgroundColor: '#6366f1',
                borderColor: '#4f46e5',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e3e3e3' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#e3e3e3' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#e3e3e3' }
                }
            }
        }
    });

    // Daily distribution chart
    const dailyCtx = document.getElementById('dailyChart').getContext('2d');
    dailyChartInstance = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Activity',
                data: hourlyData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e3e3e3' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#e3e3e3' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#e3e3e3',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // --- Cumulative Total Usage Chart ---
    let dailyTotals = timeData.dailyTotals || {};
    // Sort dates ascending
    const sortedDates = Object.keys(dailyTotals).sort((a, b) => new Date(a) - new Date(b));
    const cumulativeLabels = [...sortedDates];
    let cumulativeData = [];
    let runningTotal = 0;
    for (const date of sortedDates) {
        runningTotal += (dailyTotals[date] || 0);
        cumulativeData.push(runningTotal / (1000 * 60)); // convert ms to minutes
    }

    // Destroy old cumulative chart if exists
    if (cumulativeChartInstance) cumulativeChartInstance.destroy();

    // Render cumulative chart
    const cumulativeCtx = document.getElementById('cumulativeChart').getContext('2d');
    cumulativeChartInstance = new Chart(cumulativeCtx, {
        type: 'line',
        data: {
            labels: cumulativeLabels,
            datasets: [{
                label: 'Cumulative Minutes',
                data: cumulativeData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e3e3e3' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#e3e3e3',
                        callback: function(value) {
                            return Math.round(value).toString(); // integer, no commas
                        }
                    }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#e3e3e3', maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', function() {
    // Initial update
    updateStats();
    
    // Update every second for real-time stats
    setInterval(updateStats, 60000);
});