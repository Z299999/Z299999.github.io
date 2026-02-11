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
    const node = graph.nodes.get(`in_${i}`);
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

  // 3) Bridging trigger: mark nodes with |activation| > T_bridge
  const triggered = [];
  for (const [nodeId, node] of graph.nodes) {
    if (Math.abs(node.activation) > tBridge) {
      // Cooldown check
      if (t - node.lastBridge >= COOLDOWN_K) {
        triggered.push(nodeId);
      }
    }
  }

  // 4) Bridging action: for each triggered node, add a bridge node
  for (const nodeId of triggered) {
    const node = graph.nodes.get(nodeId);
    if (!node) continue;
    node.lastBridge = t;

    const bId = graph.newInternalId();
    graph.addNode(bId, 'internal');
    const s = Math.sign(node.activation) || 1;

    // i -> b_k
    graph.addEdge(nodeId, bId, s * 1);
    // b_k -> i
    graph.addEdge(bId, nodeId, s * 1);

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
