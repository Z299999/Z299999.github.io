/**
 * Chart.js degree distribution histogram.
 */

/* global Chart */

export class ChartView {
  constructor(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Node count',
          data: [],
          backgroundColor: 'rgba(74, 144, 217, 0.7)',
          borderColor: 'rgba(74, 144, 217, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: {
            title: { display: true, text: 'Total Degree (k)', color: '#ccc' },
            ticks: { color: '#aaa' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            title: { display: true, text: 'Count', color: '#ccc' },
            ticks: { color: '#aaa', stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.1)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  /** Update histogram from a degree histogram object { k: count }. */
  update(histogram) {
    const keys = Object.keys(histogram).map(Number).sort((a, b) => a - b);
    this.chart.data.labels = keys.map(String);
    this.chart.data.datasets[0].data = keys.map(k => histogram[k]);
    this.chart.update();
  }
}
