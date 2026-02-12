/**
 * Chart.js edge weight distribution histogram.
 */

/* global Chart */

export class WeightView {
  constructor(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Edge count',
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
            title: { display: true, text: 'Edge weight', color: '#ccc' },
            ticks: { color: '#aaa' },
            grid: { color: 'rgba(255,255,255,0.08)' }
          },
          y: {
            title: { display: true, text: 'Count', color: '#ccc' },
            ticks: { color: '#aaa', stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.08)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  /**
   * Update from a histogram object of the form:
   * { centers: number[], counts: number[] }.
   */
  update(hist) {
    if (!hist || !hist.centers || !hist.counts) {
      this.chart.data.labels = [];
      this.chart.data.datasets[0].data = [];
      this.chart.update('none');
      return;
    }
    this.chart.data.labels = hist.centers.map(v => v.toFixed(2));
    this.chart.data.datasets[0].data = hist.counts;
    this.chart.update('none');
  }
}

