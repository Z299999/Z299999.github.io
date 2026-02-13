/**
 * Simulation step logic for the eco-evo model.
 * Implements the exact step order specified in the model.
 */

import { getInputValue } from './input.js';

// Fixed constants that are not currently exposed in the UI
const EPS_DEFAULT = 1e-3;   // default near-zero threshold

// Bridge-specific constant: sqrt(2) / 2, used for the canonical 2-cycle
// and the xi -> z1 fan-in weight.
const BRIDGE_BASE = Math.SQRT1_2;

/** Standard normal via Box-Muller transform. */
function randn() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-30)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Recursively prune internal sink nodes (nodes with out-degree 0).
 * Starting from `startId`, any internal node with no outgoing edges is
 * removed together with all its incoming edges. Predecessors of a
 * removed node are re-checked, propagating the pruning upstream.
 */
function pruneSinkCascade(graph, startId, events) {
  const queue = [startId];
  const visited = new Set();

  while (queue.length > 0) {
    const nodeId = queue.pop();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = graph.nodes.get(nodeId);
    if (!node) continue;
    if (node.type === 'input' || node.type === 'output') continue;

    if (graph.outDegree(nodeId) > 0) continue;

    const inEdges = graph.adjIn.get(nodeId)
      ? Array.from(graph.adjIn.get(nodeId))
      : [];
    const predecessors = [];
    for (const eid of inEdges) {
      const e = graph.edges.get(eid);
      if (e) predecessors.push(e.src);
    }

    graph.removeNode(nodeId);
    events.removedNodes++;

    for (const srcId of predecessors) {
      queue.push(srcId);
    }
  }
}

/**
 * Apply the structural deletion rules for a near-zero internal edge
 * z1 -> z2 with weight w12:
 *  - First remove the edge.
 *  - If z2 becomes a source (deg-(z2)=0, deg+(z2)>0), rewire all
 *    outgoing edges z2 -> y to z1 -> y with
 *      w_new = epsZero * w_{z2y} * sign(w12),
 *    then delete z2.
 *  - Otherwise, treat z1 as a potential sink and prune sinks recursively.
 */
function deleteInternalEdgeWithStructure(graph, edgeId, edge, epsZero, events) {
  const z1Id = edge.src;
  const z2Id = edge.dst;
  const w12 = edge.w;

  graph.removeEdge(edgeId);
  events.removedEdges++;

  const z1 = graph.nodes.get(z1Id);
  const z2 = graph.nodes.get(z2Id);
  if (!z1 || !z2) return;

  const degIn2 = graph.inDegree(z2Id);
  const degOut2 = graph.outDegree(z2Id);

  // Case 1: z2 becomes a source (no incoming edges, but has outgoing edges)
  if (degIn2 === 0 && degOut2 > 0) {
    const outEdges = graph.adjOut.get(z2Id)
      ? Array.from(graph.adjOut.get(z2Id))
      : [];
    const signW12 = Math.sign(w12) || (Math.random() < 0.5 ? 1 : -1);
    for (const oeid of outEdges) {
      const e = graph.edges.get(oeid);
      if (!e) continue;
      const newW = epsZero * e.w * signW12;
      graph.addEdge(z1Id, e.dst, newW);
    }
    graph.removeNode(z2Id);
    events.removedNodes++;
    return;
  }

  // Case 2: z2 does not become a source — prune sinks starting from z1.
  pruneSinkCascade(graph, z1Id, events);
}

/**
 * Execute one simulation step.
 * @param {Graph} graph
 * @param {number} t - current step counter
 * @param {object} params - {
 *   mu, pFlip, tBridge, sigma, omega, epsilon, K, theta,
 *   inputSource, m, activation,
 *   weightTanh, useOU, ouMean
 * }
 * @returns {object} events - { bridged: [], removedEdges: number, removedNodes: number }
 */
export function simulationStep(graph, t, params) {
  const {
    mu,
    pFlip,
    tBridge,
    sigma,
    omega,
    epsilon,
    K,
    theta,
    inputSource,
    m,
    activation,
    weightTanh,
    useOU,
    ouMean
  } = params;

  // Defaults if UI values are missing
  const sigmaVal = Number.isFinite(sigma) ? sigma : 0.02;
  const omegaVal = Number.isFinite(omega) ? omega : 0.05;
  const epsZero = Number.isFinite(epsilon) ? epsilon : EPS_DEFAULT;
  const cooldownK = Number.isFinite(K) ? K : 10;
  const events = { bridged: [], removedEdges: 0, removedNodes: 0 };

  // 1) Set input node activations
  for (let i = 0; i < m; i++) {
    const node = graph.nodes.get(`x${i}`);
    if (node) {
      node.activation = getInputValue(inputSource, i, t);
    }
  }

  let actFn;
  const thetaVal = Number.isFinite(theta) ? theta : 0;
  if (activation === 'relu') {
    actFn = x => (x > 0 ? x : 0);
  } else if (activation === 'relu-thresh') {
    actFn = x => {
      const s = x - thetaVal;
      return s > 0 ? s : 0;
    };
  } else if (activation === 'identity') {
    actFn = x => x;
  } else if (activation === 'maxabs') {
    // handled explicitly below; actFn unused
    actFn = null;
  } else {
    actFn = x => Math.tanh(x);
  }

  const weightFn = weightTanh ? w => Math.tanh(w) : w => w;

  // 2) Forward pass for non-input nodes (in creation order)
  const order = graph.getForwardOrder();
  for (const nodeId of order) {
    const node = graph.nodes.get(nodeId);
    if (!node || node.type === 'input') continue;

    const inEdges = graph.adjIn.get(nodeId);
    if (activation === 'maxabs') {
      let best = 0;
      let hasInput = false;
      if (inEdges) {
        for (const eid of inEdges) {
          const edge = graph.edges.get(eid);
          if (!edge) continue;
          const srcNode = graph.nodes.get(edge.src);
          if (!srcNode) continue;
          const contrib = weightFn(edge.w) * srcNode.activation;
          if (!hasInput || Math.abs(contrib) > Math.abs(best)) {
            best = contrib;
            hasInput = true;
          }
        }
      }
      node.activation = hasInput ? best : 0;
    } else {
      let z = 0;
      if (inEdges) {
        for (const eid of inEdges) {
          const edge = graph.edges.get(eid);
          if (!edge) continue;
          const srcNode = graph.nodes.get(edge.src);
          if (!srcNode) continue;
          z += weightFn(edge.w) * srcNode.activation;
        }
      }
      node.activation = actFn(z);
    }
  }

  // 3) Bridging trigger: mark nodes with |activation| > T_bridge.
  // Only internal nodes (z0 and all bridge nodes z1, z2, ...) are allowed to
  // trigger bridges; inputs/outputs are excluded.
  const triggered = [];
  for (const [nodeId, node] of graph.nodes) {
    if (node.type !== 'internal') continue;
    if (Math.abs(node.activation) > tBridge) {
      // Cooldown check
      if (t - node.lastBridge >= cooldownK) {
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
  //   - For each incoming edge xi -> z0 (now weight w_i), add xi -> z1 with
  //     weight (sqrt(2)/2) * w_i
  //   - For each outgoing edge z0 -> yj with weight v_j, add a parallel edge
  //     z2 -> yj with the same weight v_j (keeping the original z0 -> yj)
  //   - Add stabilizing feedback edges: z1 -> z0 = -epsilon, z0 -> z2 = epsilon
  for (const nodeId of triggered) {
    const z0 = graph.nodes.get(nodeId);
    if (!z0) continue;
    z0.lastBridge = t;

    // New internal bridge nodes (closer to inputs / closer to outputs)
    const z1Id = graph.newInternalId();
    const z2Id = graph.newInternalId();
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

    // Incoming edges: 2 w_i -> w_i, and add xi -> z1 with (sqrt(2)/2) * w_i
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

    // Stabilizing feedback edges: z1 -> z0 = -omega, z0 -> z2 = omega
    graph.addEdge(z1Id, nodeId, -omegaVal);
    graph.addEdge(nodeId, z2Id, omegaVal);

    events.bridged.push(nodeId);
  }

  // 5) Weight update for every edge
  if (useOU) {
    // Ornstein–Uhlenbeck update with mean reversion.
    // We interpret ouMean as a magnitude m >= 0 and use
    // a sign-dependent mean: +m for positive edges and
    // -m for negative edges. This gives each sign its own
    // stable position at ±m.
    const gamma = 0.05; // fixed mean-reversion rate for now
    const a = Math.exp(-gamma);
    const b = sigmaVal * Math.sqrt((1 - a * a) / (2 * gamma));
    const mMag = Number.isFinite(ouMean) ? Math.abs(ouMean) : 0;
    for (const [, edge] of graph.edges) {
      const w = edge.w;
      const s = Math.sign(w) || (Math.random() < 0.5 ? 1 : -1);
      const mE = s * mMag;
      edge.w = mE + a * (w - mE) + b * randn();
    }
  } else {
    for (const [, edge] of graph.edges) {
      edge.w += sigmaVal * randn() + mu * Math.sign(edge.w);
    }
  }

  // 6) Near-zero event with structural deletion and rewiring.
  // First collect candidate edges to avoid mutating the map while iterating.
  const nearZeroEdges = [];
  for (const [eid, edge] of graph.edges) {
    if (Math.abs(edge.w) < epsZero) {
      nearZeroEdges.push(eid);
    }
  }

  for (const eid of nearZeroEdges) {
    const edge = graph.edges.get(eid);
    if (!edge) continue;

    // With probability pFlip, perform a small sign-flip and keep the edge.
    if (Math.random() < pFlip) {
      const oldSign = Math.sign(edge.w) || (Math.random() < 0.5 ? 1 : -1);
      const mag = Math.random() * epsZero;
      edge.w = -oldSign * mag;
      continue;
    }

    const srcNode = graph.nodes.get(edge.src);
    const dstNode = graph.nodes.get(edge.dst);

    // Apply the full structural rule only for internal -> internal edges.
    if (srcNode && dstNode &&
        srcNode.type === 'internal' &&
        dstNode.type === 'internal') {
      deleteInternalEdgeWithStructure(graph, eid, edge, epsZero, events);
    } else {
      // For all other edges, simply remove the edge. If the source is an
      // internal node that becomes a sink, prune sinks recursively.
      const srcId = edge.src;
      graph.removeEdge(eid);
      events.removedEdges++;
      const src = graph.nodes.get(srcId);
      if (src && src.type === 'internal') {
        pruneSinkCascade(graph, srcId, events);
      }
    }
  }

  return events;
}
