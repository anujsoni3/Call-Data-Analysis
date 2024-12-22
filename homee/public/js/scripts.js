$(document).ready(function() {
    // Fetch dashboard data
    fetchDashboardData();
    fetchChartData(); // Call the function to fetch chart data
});

// Function to fetch data from the backend (using jQuery's AJAX)
function fetchDashboardData() {
    // Fetch customer satisfaction
    $.get('/api/customer-satisfaction', function(data) {
        animateNumber('#customerSatisfaction', data.satisfaction + '%');
    }).fail(function(error) {
        console.error('Error fetching customer satisfaction:', error);
    });

    // Fetch total calls and total hours spent
    $.get('/api/calls', function(data) {
        animateNumber('#totalCallTime', data.total_calls + ' / ' + data.total_hours + ' Hrs');
    }).fail(function(error) {
        console.error('Error fetching total calls and hours:', error);
    });

    // Fetch average call duration
    $.get('/api/average-duration', function(data) {
        animateNumber('#avgTimePerCall', data.avg_duration + ' Mins');
    }).fail(function(error) {
        console.error('Error fetching average call duration:', error);
    });
}

// Function to animate the number change (with a smooth transition)
function animateNumber(selector, newValue) {
    const element = $(selector);
    const currentValue = element.text();
    if (currentValue !== newValue) {
        element.fadeOut(400, function() {
            $(this).text(newValue).fadeIn(400);
        });
    }
}

// Fetch call data for the chart and update dynamically
function fetchChartData() {
    fetch('/api/call-data')
        .then(response => response.json())
        .then(data => {
            // Call the function to update the chart with the fetched data
            updateChart(data.labels, data.data);
        })
        .catch(error => {
            console.error('Error fetching call data:', error);
        });
}

// Function to update the chart with dynamic data
function updateChart(labels, data) {
    const ctx = document.getElementById('chart').getContext('2d');
    
    const chart = new Chart(ctx, {
        type: 'bar', // You can change this to 'line', 'pie', etc.
        data: {
            labels: labels, // Employee names as X-axis labels
            datasets: [{
                label: 'Connected Calls',
                data: data, // Connected calls as Y-axis data
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}
