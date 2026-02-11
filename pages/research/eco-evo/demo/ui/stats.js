/**
 * Stats display: read-only counters shown in the UI.
 */

export class Stats {
  constructor() {
    this.elStep = document.getElementById('stat-step');
    this.elNodes = document.getElementById('stat-nodes');
    this.elEdges = document.getElementById('stat-edges');
    this.elOutputNorm = document.getElementById('stat-output-norm');
  }

  update(t, nodeCount, edgeCount, outputNorm) {
    this.elStep.textContent = t;
    this.elNodes.textContent = nodeCount;
    this.elEdges.textContent = edgeCount;
    if (this.elOutputNorm != null && outputNorm != null) {
      this.elOutputNorm.textContent = outputNorm.toFixed(3);
    }
  }
}
