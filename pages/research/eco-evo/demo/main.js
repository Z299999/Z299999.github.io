/**
 * Main orchestrator for the eco-evo simulation demo.
 * Wires up simulation logic, UI controls, graph view, and chart.
 */

import { Graph } from './sim/graph.js';
import { simulationStep } from './sim/step.js';
import { Controls } from './ui/controls.js';
import { GraphView } from './ui/graph-view.js';
import { ChartView } from './ui/chart-view.js';
import { Stats } from './ui/stats.js';

// --- State ---
let graph = null;
let t = 0;
let playing = false;
let lastBridged = new Set();
let genesisM = 3; // track m used at last reset

// --- UI components (initialized after DOM ready) ---
let controls, graphView, chartView, stats;

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

/** Initialize or re-initialize the simulation. */
function reset() {
  const { m, n } = controls.getStartParams();
  genesisM = Math.max(1, m); // guard against m=0
  const safeN = Math.max(1, n);
  graph = Graph.genesis(genesisM, safeN);
  t = 0;
  lastBridged = new Set();

  graphView.rebuild(graph, lastBridged);
  chartView.update(graph.degreeHistogram());
  const outputNorm = computeOutputNorm(graph);
  stats.update(t, graph.nodeCount, graph.edgeCount, outputNorm);
}

/** Run a single simulation step and update the UI. */
function step() {
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
  stats.update(t, graph.nodeCount, graph.edgeCount, outputNorm);

  // Update degree chart every 10 steps
  if (t % 10 === 0) {
    chartView.update(graph.degreeHistogram());
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

// --- Initialize ---
// ES modules are deferred, so the DOM is ready when this runs.
function init() {
  controls = new Controls();
  graphView = new GraphView('cy');
  chartView = new ChartView('degree-chart');
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

  // Handle window resize
  window.addEventListener('resize', () => graphView.resize());

  // Initial reset
  reset();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
