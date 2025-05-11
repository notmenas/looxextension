function initCharts() {
    chrome.storage.local.get(['timeTracking', 'weeklyData'], function(result) {
        const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
        
        // Weekly usage chart
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date().getDay();
        const weekDays = days.slice(today + 1).concat(days.slice(0, today + 1));
        
        new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: weekDays,
                datasets: [{
                    label: 'Hours Spent',
                    data: weekDays.map(day => (result.weeklyData?.[day] || 0) / (1000 * 60 * 60)),
                    backgroundColor: '#6366f1',
                    borderColor: '#4f46e5',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e3e3e3' }
                    },
                    x: {
                        ticks: { color: '#e3e3e3' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e3e3e3' }
                    }
                }
            }
        });

        // Daily distribution chart
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Average Usage',
                    data: result.timeTracking?.hourlyData || hours.map(() => 0),
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#e3e3e3' }
                    },
                    x: {
                        ticks: {
                            color: '#e3e3e3',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e3e3e3' }
                    }
                }
            }
        });
    });
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', initCharts);