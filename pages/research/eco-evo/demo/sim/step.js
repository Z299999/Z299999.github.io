/**
 * Simulation step logic for the eco-evo model.
 * Implements the exact step order specified in the model.
 */

import { getInputValue } from './input.js';

// Fixed constants
const SIGMA = 0.02;
const EPS = 1e-3;
const W_RESET = 1;
const COOLDOWN_K = 10;

// Bridge-specific constants
// sqrt(2) / 2, used for the canonical 2-cycle and input fan-in
const BRIDGE_BASE = Math.SQRT1_2;
// Small stabilizing feedback weight epsilon > 0
const BRIDGE_EPS = 0.05;

/** Standard normal via Box-Muller transform. */
function randn() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-30)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Execute one simulation step.
 * @param {Graph} graph
 * @param {number} t - current step counter
 * @param {object} params - { mu, pFlip, tBridge, inputSource, m }
 * @returns {object} events - { bridged: [], removedEdges: number, removedNodes: number }
 */
export function simulationStep(graph, t, params) {
  const { mu, pFlip, tBridge, inputSource, m } = params;
  const events = { bridged: [], removedEdges: 0, removedNodes: 0 };

  // 1) Set input node activations
  for (let i = 0; i < m; i++) {
    const node = graph.nodes.get(`x_${i}`);
    if (node) {
      node.activation = getInputValue(inputSource, i, t);
    }
  }

  // 2) Forward pass for non-input nodes (in creation order)
  const order = graph.getForwardOrder();
  for (const nodeId of order) {
    const node = graph.nodes.get(nodeId);
    if (!node || node.type === 'input') continue;

    const inEdges = graph.adjIn.get(nodeId);
    let z = 0;
    if (inEdges) {
      for (const eid of inEdges) {
        const edge = graph.edges.get(eid);
        if (!edge) continue;
        const srcNode = graph.nodes.get(edge.src);
        if (!srcNode) continue;
        z += edge.w * srcNode.activation;
      }
    }
    node.activation = Math.tanh(z);
  }

  // 3) Bridging trigger: mark nodes with |activation| > T_bridge.
  // Only internal nodes (z0 and all bridge nodes z1_k, z2_k) are allowed to
  // trigger bridges; inputs/outputs are excluded.
  const triggered = [];
  for (const [nodeId, node] of graph.nodes) {
    if (node.type !== 'internal') continue;
    if (Math.abs(node.activation) > tBridge) {
      // Cooldown check
      if (t - node.lastBridge >= COOLDOWN_K) {
        triggered.push(nodeId);
      }
    }
  }

  // 4) Bridging action (new bridge mechanism):
  //
  // For each triggered node z0:
  //   - Create two new internal nodes z1, z2
  //   - Add a canonical 2-cycle: z1 -> z2 = sqrt(2)/2, z2 -> z1 = sqrt(2)/2
  //   - Halve all incoming weights into z0: 2 w_i -> w_i (implemented as w_i /= 2)
  //   - For each incoming edge x_i -> z0 (now weight w_i), add x_i -> z1 with
  //     weight (sqrt(2)/2) * w_i
  //   - For each outgoing edge z0 -> y_j with weight v_j, add a parallel edge
  //     z2 -> y_j with the same weight v_j (keeping the original z0 -> y_j)
  //   - Add stabilizing feedback edges: z1 -> z0 = -epsilon, z0 -> z2 = epsilon
  for (const nodeId of triggered) {
    const z0 = graph.nodes.get(nodeId);
    if (!z0) continue;
    z0.lastBridge = t;

    // New internal bridge nodes z1_k (closer to inputs) and z2_k (closer to outputs)
    const z1Id = graph.newZ1Id();
    const z2Id = graph.newZ2Id();
    graph.addNode(z1Id, 'internal');
    graph.addNode(z2Id, 'internal');

    // Canonical 2-cycle between z1 and z2
    graph.addEdge(z1Id, z2Id, BRIDGE_BASE);
    graph.addEdge(z2Id, z1Id, BRIDGE_BASE);

    // Snapshot of incoming and outgoing edges to z0 BEFORE we modify them
    const inEdges = graph.adjIn.get(nodeId)
      ? Array.from(graph.adjIn.get(nodeId))
      : [];
    const outEdges = graph.adjOut.get(nodeId)
      ? Array.from(graph.adjOut.get(nodeId))
      : [];

    // Incoming edges: 2 w_i -> w_i, and add x_i -> z1 with (sqrt(2)/2) * w_i
    for (const eid of inEdges) {
      const edge = graph.edges.get(eid);
      if (!edge || edge.dst !== nodeId) continue;
      // Halve the existing weight
      edge.w *= 0.5;
      const w_i = edge.w;
      const newWeight = BRIDGE_BASE * w_i;
      graph.addEdge(edge.src, z1Id, newWeight);
    }

    // Outgoing edges: duplicate to z2 with the same weight v_j
    for (const eid of outEdges) {
      const edge = graph.edges.get(eid);
      if (!edge || edge.src !== nodeId) continue;
      graph.addEdge(z2Id, edge.dst, edge.w);
    }

    // Stabilizing feedback edges: z1 -> z0 = -epsilon, z0 -> z2 = epsilon
    graph.addEdge(z1Id, nodeId, -BRIDGE_EPS);
    graph.addEdge(nodeId, z2Id, BRIDGE_EPS);

    events.bridged.push(nodeId);
  }

  // 5) Weight update for every edge
  for (const [, edge] of graph.edges) {
    edge.w += SIGMA * randn() + mu * Math.sign(edge.w);
  }

  // 6) Near-zero event
  const edgesToRemove = [];
  for (const [eid, edge] of graph.edges) {
    if (Math.abs(edge.w) < EPS) {
      if (Math.random() < pFlip) {
        edge.w = -W_RESET;
      } else {
        edgesToRemove.push(eid);
      }
    }
  }
  for (const eid of edgesToRemove) {
    graph.removeEdge(eid);
    events.removedEdges++;
  }

  // 7) Node cleanup: remove internal nodes with zero in-degree OR zero out-degree
  const nodesToRemove = [];
  for (const [nodeId, node] of graph.nodes) {
    if (node.type === 'input' || node.type === 'output') continue;
    if (graph.inDegree(nodeId) === 0 || graph.outDegree(nodeId) === 0) {
      nodesToRemove.push(nodeId);
    }
  }
  for (const nodeId of nodesToRemove) {
    graph.removeNode(nodeId);
    events.removedNodes++;
  }

  return events;
}
