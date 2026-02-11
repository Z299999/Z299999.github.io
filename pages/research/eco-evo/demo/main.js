/**
 * Main orchestrator for the eco-evo simulation demo.
 * Wires up simulation logic, UI controls, graph view, and chart.
 */

import { Graph } from './sim/graph.js';
import { simulationStep } from './sim/step.js';
import { Controls } from './ui/controls.js';
import { GraphView } from './ui/graph-view.js';
import { ChartView } from './ui/chart-view.js';
import { OutputView } from './ui/output-view.js';
import { Stats } from './ui/stats.js';

// --- State ---
let graph = null;
let t = 0;
let playing = false;
let lastBridged = new Set();
let genesisM = 3; // track m used at last reset
let mode = 'evolve'; // 'evolve' | 'test'
let testStepIndex = 0;
let currentTest = null; // { inputIndex, amplitude, steps }

// --- UI components (initialized after DOM ready) ---
let controls, graphView, chartView, outputView, stats;

// --- Timing ---
let lastFrameTime = 0;
let accumulator = 0;

/** Compute L2 norm of output activations ‖y(t)‖₂. */
function computeOutputNorm(graph) {
  if (!graph) return 0;
  let sumSq = 0;
  for (const [, node] of graph.nodes) {
    if (node.type === 'output') {
      const a = node.activation || 0;
      sumSq += a * a;
    }
  }
  return Math.sqrt(sumSq);
}

// History of output norms for plotting: [{ t, norm }, ...]
const outputHistory = [];

function updateModeUI() {
  const runtimeFs = document.getElementById('fieldset-runtime');
  const testFs = document.getElementById('fieldset-test');
  const btnTest = document.getElementById('btn-test-toggle');
  const btnPlay = document.getElementById('btn-play');
  const btnStep = document.getElementById('btn-step');
  if (!runtimeFs || !testFs || !btnTest || !btnPlay || !btnStep) return;

  if (mode === 'test') {
    runtimeFs.style.display = 'none';
    testFs.style.display = '';
    btnTest.textContent = 'End test';
    btnPlay.disabled = true;
    btnStep.disabled = true;
  } else {
    runtimeFs.style.display = '';
    testFs.style.display = 'none';
    btnTest.textContent = 'Start test';
    btnPlay.disabled = false;
    btnStep.disabled = false;
  }
}

/** Initialize or re-initialize the simulation. */
function reset() {
  const { m, n } = controls.getStartParams();
  genesisM = Math.max(1, m); // guard against m=0
  const safeN = Math.max(1, n);
  graph = Graph.genesis(genesisM, safeN);
  t = 0;
  lastBridged = new Set();
  outputHistory.length = 0;
  mode = 'evolve';
  testStepIndex = 0;
  currentTest = null;
  updateModeUI();

  graphView.rebuild(graph, lastBridged);
  chartView.update(graph.degreeHistogram());
  const outputNorm = computeOutputNorm(graph);
  outputHistory.push({ t, norm: outputNorm });
  outputView.update(outputHistory);
  stats.update(t, graph.nodeCount, graph.edgeCount, outputNorm);
}

/** Run a single eco-evo evolution step and update the UI. */
function evolveStep() {
  if (!graph) return;

  // Use the m from genesis, not the current slider value
  const runParams = { ...controls.getRunParams(), m: genesisM };

  const events = simulationStep(graph, t, runParams);
  t++;

  // Track bridged nodes for highlighting (clear after a few steps)
  lastBridged = new Set(events.bridged);

  // Incremental graph update
  graphView.update(graph, lastBridged);

  // Update stats every step
  const outputNorm = computeOutputNorm(graph);
  outputHistory.push({ t, norm: outputNorm });
  outputView.update(outputHistory);
  stats.update(t, graph.nodeCount, graph.edgeCount, outputNorm);

  // Update degree chart every 10 steps
  if (t % 10 === 0) {
    chartView.update(graph.degreeHistogram());
  }
}

/** One impulse-response test step with frozen graph (no evolution). */
function impulseTestStep() {
  if (!graph || !currentTest) return;

  const { inputIndex, amplitude, steps } = currentTest;
  if (testStepIndex >= steps) {
    // Auto-stop test playback but stay in test mode until user ends it.
    playing = false;
    document.getElementById('btn-play').textContent = 'Play';
    return;
  }

  // 1) Set input activations: impulse at k=0 on channel inputIndex, else 0.
  for (let i = 0; i < genesisM; i++) {
    const node = graph.nodes.get(`x_${i}`);
    if (!node) continue;
    if (i === inputIndex && testStepIndex === 0) {
      node.activation = amplitude;
    } else {
      node.activation = 0;
    }
  }

  // 2) Forward pass for non-input nodes (same order as simulationStep).
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

  // No bridging / weight updates / cleanup: graph structure is frozen.
  lastBridged = new Set();

  // Update view and statistics. Use local testStepIndex on the time axis.
  graphView.update(graph, lastBridged);

  const outputNorm = computeOutputNorm(graph);
  outputHistory.push({ t: testStepIndex, norm: outputNorm });
  outputView.update(outputHistory);
  stats.update(t, graph.nodeCount, graph.edgeCount, outputNorm);

  testStepIndex++;
}

/** Run a full impulse-response experiment in test mode in one shot. */
function runImpulseOnce() {
  if (!graph) return;
  if (mode !== 'test') return;

  const params = controls.getTestParams();
  const { inputIndex, amplitude, steps } = params;
  currentTest = params;
  testStepIndex = 0;

  // Reset activations and history
  for (const [, node] of graph.nodes) {
    node.activation = 0;
  }
  outputHistory.length = 0;

  for (let k = 0; k < steps; k++) {
    // Inputs: impulse at k=0 on selected channel, otherwise 0.
    for (let i = 0; i < genesisM; i++) {
      const node = graph.nodes.get(`x_${i}`);
      if (!node) continue;
      if (i === inputIndex && k === 0) {
        node.activation = amplitude;
      } else {
        node.activation = 0;
      }
    }

    // Forward pass for non-input nodes.
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

    const outputNorm = computeOutputNorm(graph);
    outputHistory.push({ t: k, norm: outputNorm });
  }

  // Final view/state corresponds to the last step.
  lastBridged = new Set();
  graphView.update(graph, lastBridged);
  outputView.update(outputHistory);
  const finalNorm = outputHistory.length
    ? outputHistory[outputHistory.length - 1].norm
    : computeOutputNorm(graph);
  stats.update(t, graph.nodeCount, graph.edgeCount, finalNorm);
}

/** Dispatch a single step depending on mode. */
function step() {
  if (mode === 'test') {
    impulseTestStep();
  } else {
    evolveStep();
  }
}

/** Animation loop using requestAnimationFrame + accumulator. */
function loop(timestamp) {
  if (!playing) return;

  if (lastFrameTime === 0) lastFrameTime = timestamp;
  const dt = (timestamp - lastFrameTime) / 1000; // seconds
  lastFrameTime = timestamp;

  const speed = controls.getSpeed(); // steps per second
  const stepInterval = 1 / speed;

  accumulator += dt;

  // Cap to avoid spiral of death
  const maxStepsPerFrame = Math.min(speed, 50);
  let stepsThisFrame = 0;

  while (accumulator >= stepInterval && stepsThisFrame < maxStepsPerFrame) {
    step();
    accumulator -= stepInterval;
    stepsThisFrame++;
  }

  // Clamp leftover accumulator to avoid runaway catch-up
  if (accumulator > stepInterval) {
    accumulator = stepInterval;
  }

  requestAnimationFrame(loop);
}

function play() {
  if (playing) return;
  playing = true;
  lastFrameTime = 0;
  accumulator = 0;
  document.getElementById('btn-play').textContent = 'Pause';
  requestAnimationFrame(loop);
}

function pause() {
  playing = false;
  document.getElementById('btn-play').textContent = 'Play';
}

function togglePlay() {
  if (playing) pause();
  else play();
}

function startImpulseTest() {
  if (!graph) return;
  pause();
  // Reset activations to zero
  for (const [, node] of graph.nodes) {
    node.activation = 0;
  }
  outputHistory.length = 0;
  outputView.update(outputHistory);
  currentTest = controls.getTestParams();
  testStepIndex = 0;
  mode = 'test';
  updateModeUI();
}

function endImpulseTest() {
  pause();
  mode = 'evolve';
  currentTest = null;
  testStepIndex = 0;
  if (graph) {
    for (const [, node] of graph.nodes) {
      node.activation = 0;
    }
  }
  updateModeUI();
}

// --- Initialize ---
// ES modules are deferred, so the DOM is ready when this runs.
function init() {
  controls = new Controls();
  graphView = new GraphView('cy');
  chartView = new ChartView('degree-chart');
  outputView = new OutputView('output-chart', 'output-window');
  stats = new Stats();

  // Button bindings
  document.getElementById('btn-play').addEventListener('click', togglePlay);
  document.getElementById('btn-step').addEventListener('click', () => {
    if (!playing) step();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    pause();
    reset();
  });

  // Impulse test toggle button
  document.getElementById('btn-test-toggle').addEventListener('click', () => {
    if (mode === 'test') {
      endImpulseTest();
    } else {
      startImpulseTest();
    }
  });

  // Inject impulse once in test mode
  document.getElementById('btn-test-inject').addEventListener('click', () => {
    runImpulseOnce();
  });

  // Handle window resize
  window.addEventListener('resize', () => graphView.resize());

  // Initial reset
  reset();
  updateModeUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
