/**
 * Chart.js histograms used in the right-hand side panel:
 *  - degree distribution
 *  - node activation distribution
 *  - edge weight distribution
 */

/* global Chart */

// Degree distribution: { k: count }
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

  update(histogram) {
    const keys = Object.keys(histogram).map(Number).sort((a, b) => a - b);
    this.chart.data.labels = keys.map(String);
    this.chart.data.datasets[0].data = keys.map(k => histogram[k]);
    this.chart.update();
  }
}

// Node activation histogram: { centers: number[], counts: number[] }
export class ActivationView {
  constructor(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Node count',
          data: [],
          backgroundColor: 'rgba(217, 74, 74, 0.7)',
          borderColor: 'rgba(217, 74, 74, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: {
            title: { display: true, text: 'Activation value', color: '#ccc' },
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

// Edge weight histogram: { centers: number[], counts: number[] }
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

