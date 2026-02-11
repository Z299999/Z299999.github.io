/**
 * Stats display: read-only counters shown in the UI.
 */

export class Stats {
  constructor() {
    this.elStep = document.getElementById('stat-step');
    this.elNodes = document.getElementById('stat-nodes');
    this.elEdges = document.getElementById('stat-edges');
  }

  update(t, nodeCount, edgeCount) {
    this.elStep.textContent = t;
    this.elNodes.textContent = nodeCount;
    this.elEdges.textContent = edgeCount;
  }
}
