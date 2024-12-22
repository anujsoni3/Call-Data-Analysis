// Replace with actual pairs of columns you want to visualize
const columnPairs = [
  { name: 'Call Type vs Connected Calls', labels: ['Incoming', 'Outgoing', 'Missed'], data: [30, 40, 30] },
  { name: 'Region vs Connected Calls', labels: ['Asia', 'Europe', 'Australia', 'North America'], data: [20, 12, 28,40] },
  { name: 'Call Type vs Average Duration', labels: ['Incoming', 'Outgoing'], data: [8.5, 7] },
  { name: 'Costumer Feedback vs Call', labels: ['Satisfied','Neutral', 'Dissatisfied'], data: [46,34,20] },
  { name: 'Region vs Dropped Calls', labels: ['Asia', 'Europe', 'Australia', 'North America'], data: [5,3,8,2] },
  { name: 'Call Type vs Succesful call', labels: ['Incoming', 'Outgoing', 'Missed'], data: [37,28,0] },
  { name: 'Call Type vs Unsuccesful call', labels: ['Incoming', 'Outgoing', 'Missed'], data: [9,12,30] },
  { name: 'Porpose of Call vs Total calls', labels: ['Sales', 'Feedback', 'Inquiry'], data: [22,13,30] },
];

// Reference to the column pairs list
const columnPairsList = document.getElementById('column-pairs-list');

// Generate list items dynamically
columnPairs.forEach((pair, index) => {
  const listItem = document.createElement('li');
  listItem.innerHTML = `<a href="#" class="chart-btn" data-index="${index}">${pair.name}</a>`;
  columnPairsList.appendChild(listItem);
});

// Reference to the canvas for charts
const ctxBar = document.getElementById('chart-bar').getContext('2d');
const ctxLine = document.getElementById('chart-line').getContext('2d');
const ctxPie = document.getElementById('chart-pie').getContext('2d');

let barChart, lineChart, pieChart;

// Event listener to handle column pair selection
document.querySelectorAll('.chart-btn').forEach(btn => {
  btn.addEventListener('click', function () {
      const index = this.dataset.index;
      const pair = columnPairs[index];

      // Display all charts based on the selected column pair
      updateCharts(pair);

      // Display analysis
      displayAnalysis(pair.name);
  });
});

// Function to update charts
function updateCharts(pair) {
  const data = {
      labels: pair.labels,
      datasets: [{
          label: pair.name,
          data: pair.data,
          backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
      }]
  };

  // Destroy previous charts if they exist
  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  // Create Bar Chart
  barChart = new Chart(ctxBar, {
      type: 'bar',
      data: data,
      options: {
          responsive: true,
          plugins: { legend: { position: 'top' } },
          animation: {
              duration: 2000,
              easing: ' easeInOutQuart'
          },
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });

  // Create Line Chart
  lineChart = new Chart(ctxLine, {
      type: 'line',
      data: data,
      options: {
          responsive: true,
          plugins: { legend: { position: 'top' } },
          animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
          },
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });

  // Create Pie Chart
  pieChart = new Chart(ctxPie, {
      type: 'pie',
      data: data,
      options: {
          responsive: true,
          plugins: { legend: { position: 'top' } },
          animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
          }
      }
  });

  // Show the charts
  document.getElementById('chart-bar').style.display = 'block';
  document.getElementById('chart-line').style.display = 'block';
  document.getElementById('chart-pie').style.display = 'block';
}

// Function to display analysis text
function displayAnalysis(pairName) {
  const analysisElement = document.getElementById('chart-analysis');
  let analysisText = `You are viewing the comparison for: ${pairName}. Here's a brief analysis: `;

  if (pairName.includes('Connected Calls')) {
      analysisText += 'Connected calls data shows a balanced performance, but more focus is required on missed calls.';
  } else if (pairName.includes('Dropped Calls')) {
      analysisText += 'Dropped calls are minimal, indicating good network performance.';
  } else if (pairName.includes('Total Calls')) {
      analysisText += 'Weekdays show consistent call volumes, but Thursday seems to be higher than usual.';
  } else {
      analysisText += 'Data appears consistent across regions with some spikes in specific areas.';
  }

  analysisElement.innerHTML = analysisText;
}