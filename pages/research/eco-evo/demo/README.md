# Eco-Evo Graph Simulation Demo

Interactive browser demo of a directed weighted graph simulation with tanh activations, stochastic weight dynamics, and bridging growth.

## How to Open

Open `index.html` directly in a modern browser (Chrome, Firefox, Safari, Edge). No build step or server required.

> **Note:** Some browsers block ES module imports from `file://`. If the demo doesn't load, serve it with a local server:
> ```bash
> python3 -m http.server 8000
> # then open http://localhost:8000/pages/research/eco-evo/demo/
> ```

## Layout

- **Left panel** — Parameter controls (genesis and runtime)
- **Center** — Interactive graph (Cytoscape.js) with zoom/pan
- **Right panel** — Live degree distribution histogram (Chart.js)
- **Top toolbar** — Play/Pause, Step, Reset, Speed slider, live stats

## Parameters

### Genesis (applied on Reset)

| Parameter | Range | Description |
|-----------|-------|-------------|
| `m` | 1–50 | Number of input nodes |
| `n` | 1–50 | Number of output nodes |
| Input source | noise / sine | Input signal generator |

### Runtime (applied immediately)

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `μ` (mu) | 0–0.1 | 0.01 | Weight drift magnitude toward sign(w) |
| `p_flip` | 0–1 | 0.3 | Probability of flipping (vs deleting) near-zero edges |
| `T_bridge` | 0–1 | 0.8 | Activation threshold for bridging trigger |
| Speed | 1–200 | 10 | Simulation steps per second |

### Fixed Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `σ` (sigma) | 0.02 | Weight noise standard deviation |
| `ε` (eps) | 0.001 | Near-zero edge threshold |
| `w_reset` | 1.0 | Weight magnitude after flip |
| `K` (cooldown) | 10 | Steps between bridging triggers per node |

## Simulation Step Order

Each call to `step()` executes in this exact order:

1. **Set input activations** — `a[x_i] = x_i(t)` from the selected input generator
2. **Forward pass** — For each non-input node in creation order:
   - `z_i = Σ(w_ji × a_j)` over all incoming edges
   - `a_i = tanh(z_i)`
3. **Bridging trigger** — Mark nodes where `|a_i| > T_bridge` (with cooldown K=10 steps)
4. **Bridging action** — For each triggered node `i`, create a new internal node `b_k` with:
   - Edge `i → b_k` with weight `sign(a_i) × 1`
   - Edge `b_k → i` with weight `sign(a_i) × 1`
5. **Weight update** — For every edge: `w += σ × N(0,1) + μ × sign(w)`
6. **Near-zero event** — If `|w| < ε`:
   - With probability `p_flip`: set `w = -w_reset`
   - Otherwise: delete the edge
7. **Node cleanup** — Remove any internal node with zero in-degree OR zero out-degree (and all incident edges)
8. **Increment** — `t++`

## File Structure

```
demo/
├── index.html          # Entry point
├── styles.css          # All styles
├── main.js             # Orchestrator (loop, buttons, wiring)
├── sim/
│   ├── graph.js        # Graph data structure (nodes, edges, adjacency)
│   ├── input.js        # Input signal generators (noise, sine)
│   └── step.js         # Simulation step logic
├── ui/
│   ├── controls.js     # Parameter panel reader
│   ├── graph-view.js   # Cytoscape.js wrapper
│   ├── chart-view.js   # Chart.js degree histogram
│   └── stats.js        # Read-only stat counters
└── README.md
```

## Known Limitations

- **Forward pass** uses a single sweep in node creation order (not topological sort). For deep graphs this may lag one step behind true convergence.
- **Layout** uses Cytoscape's CoSE algorithm which re-runs on structural changes; may cause brief visual jitter when many nodes are added/removed simultaneously.
- **Performance** degrades above ~500 nodes due to full graph re-rendering. For large graphs, consider reducing speed or bridging frequency.
- **Input generators** are simple built-in functions; file upload is not supported in this version.
- **No persistence** — simulation state is lost on page refresh.
