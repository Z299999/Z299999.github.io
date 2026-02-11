/**
 * Graph data structure for the eco-evo simulation.
 * Manages nodes, edges, adjacency, and degree tracking.
 */

export class Graph {
  constructor() {
    this.nodes = new Map();   // id -> { id, type, activation, lastBridge }
    this.edges = new Map();   // id -> { id, src, dst, w }
    this.adjOut = new Map();  // src -> Set of edge ids
    this.adjIn = new Map();   // dst -> Set of edge ids
    // Counters for bridge nodes z1_k, z2_k and edges
    this._nextBridgeIndex = 0;
    this._nextEdgeId = 0;
  }

  /** Create the genesis graph with m inputs, 1 central node, n outputs. */
  static genesis(m, n) {
    const g = new Graph();

    // Input nodes x_0, ..., x_{m-1}
    const inputs = [];
    for (let i = 0; i < m; i++) {
      const id = `x_${i}`;
      g.addNode(id, 'input');
      inputs.push(id);
    }

    // Central node z0
    g.addNode('z0', 'internal');

    // Output nodes y_0, ..., y_{n-1}
    const outputs = [];
    for (let j = 0; j < n; j++) {
      const id = `y_${j}`;
      g.addNode(id, 'output');
      outputs.push(id);
    }

    // Edges: x_i -> z0 with weight 1/m
    const wIn = 1 / m;
    for (const inId of inputs) {
      g.addEdge(inId, 'z0', wIn);
    }

    // Edges: z0 -> y_j with weight 1
    for (const outId of outputs) {
      g.addEdge('z0', outId, 1);
    }

    return g;
  }

  addNode(id, type) {
    if (this.nodes.has(id)) return;
    this.nodes.set(id, {
      id,
      type,          // 'input' | 'internal' | 'output'
      activation: 0,
      lastBridge: -Infinity  // step when last bridging occurred
    });
    this.adjOut.set(id, new Set());
    this.adjIn.set(id, new Set());
  }

  /** Generate unique ids for bridge nodes z1_k and z2_k. */
  newZ1Id() {
    const id = `z1_${this._nextBridgeIndex++}`;
    return id;
  }

  newZ2Id() {
    const id = `z2_${this._nextBridgeIndex++}`;
    return id;
  }

  /** Generate a unique edge id. */
  newEdgeId() {
    return `e_${this._nextEdgeId++}`;
  }

  addEdge(src, dst, w) {
    const id = this.newEdgeId();
    this.edges.set(id, { id, src, dst, w });
    this.adjOut.get(src).add(id);
    this.adjIn.get(dst).add(id);
    return id;
  }

  removeEdge(edgeId) {
    const e = this.edges.get(edgeId);
    if (!e) return;
    this.adjOut.get(e.src)?.delete(edgeId);
    this.adjIn.get(e.dst)?.delete(edgeId);
    this.edges.delete(edgeId);
  }

  removeNode(nodeId) {
    // Remove all incident edges first
    const outEdges = this.adjOut.get(nodeId);
    if (outEdges) {
      for (const eid of [...outEdges]) this.removeEdge(eid);
    }
    const inEdges = this.adjIn.get(nodeId);
    if (inEdges) {
      for (const eid of [...inEdges]) this.removeEdge(eid);
    }
    this.adjOut.delete(nodeId);
    this.adjIn.delete(nodeId);
    this.nodes.delete(nodeId);
  }

  inDegree(nodeId) {
    return this.adjIn.get(nodeId)?.size ?? 0;
  }

  outDegree(nodeId) {
    return this.adjOut.get(nodeId)?.size ?? 0;
  }

  totalDegree(nodeId) {
    return this.inDegree(nodeId) + this.outDegree(nodeId);
  }

  /** Compute degree histogram: { k: count } */
  degreeHistogram() {
    const hist = {};
    for (const [id] of this.nodes) {
      const k = this.totalDegree(id);
      hist[k] = (hist[k] || 0) + 1;
    }
    return hist;
  }

  /** Get ordered list of node ids for forward sweep (inputs first, then by creation order). */
  getForwardOrder() {
    const inputs = [];
    const rest = [];
    for (const [id, node] of this.nodes) {
      if (node.type === 'input') inputs.push(id);
      else rest.push(id);
    }
    return [...inputs, ...rest];
  }

  get nodeCount() { return this.nodes.size; }
  get edgeCount() { return this.edges.size; }
}
