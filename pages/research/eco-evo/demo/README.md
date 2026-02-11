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
| Input source | noise / constant / sine | Input signal generator |

### Runtime (applied immediately)

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `μ` (mu) | 0–0.1 | 0.01 | Weight drift magnitude toward sign(w) |
| `p_flip` | 0–1 | 0.3 | Probability of flipping (vs deleting) near-zero edges |
| `T_bridge` | 0–1 | 0.8 | Activation threshold for bridging trigger |
| Speed | 1–200 | 10 | Simulation steps per second |

### Fixed Constants

These are currently not exposed in the UI:

| Constant | Value | Description |
|----------|-------|-------------|
| `ε` (eps) | 0.001 | Near-zero edge threshold |
| `w_reset` | 1.0 | Weight magnitude after flip |

### Runtime Parameters (UI)

| Name | Range | Description |
|------|-------|-------------|
| `μ` (mu) | `[-0.1, 0.1]` | Deterministic drift term in weight update (can be negative) |
| `σ` (sigma) | `[0, 0.05]` | Weight noise standard deviation in `w += σ ξ + μ sign(w)` |
| `p_flip` | `[0, 1]` | Probability of sign-flip when `|w| < ε_zero` |
| `T_bridge` | `[0, 1]` | Activation threshold for triggering bridges |
| `ω_bridge` | `[0, 0.2]` | Bridge feedback strength for edges `z1 → z0 = -ω` and `z0 → z2 = ω` |
| `ε_zero` | `[0, 0.01]` | Near-zero threshold used to decide when edges are flipped or deleted |
| `K` (cooldown) | `[0, 50]` | Minimum steps between two bridge events on the same node |

## Simulation Step Order

Each call to `step()` executes in this exact order:

1. **Set input activations** — `a[xi] = xi(t)` from the selected input generator
2. **Forward pass** — For each non-input node in creation order:
   - `z_i = Σ(w_ji × a_j)` over all incoming edges
   - `a_i = tanh(z_i)`
3. **Bridging trigger** — For internal nodes, mark those where `|a_i| > T_bridge` (with cooldown `K` steps)
4. **Bridging action** — For each triggered node `z0`, apply the bridge construction described in the paper (creating internal nodes `z1, z2, ...`, a 2-cycle, fan-in from `xi` to `z1`, duplicated outputs from `z2`, and feedback edges of size `±ω_bridge`).
5. **Weight update** — For every edge: `w += σ × N(0,1) + μ × sign(w)`
6. **Near-zero event** — If `|w| < ε_zero`:
   - With probability `p_flip`: draw a new magnitude `u ~ Uniform(0, ε_zero)` and set  
     `w ← -sign(w) · u` (flip the sign but keep the weight small)
   - Otherwise: delete the edge
7. **Node cleanup** — Remove any internal node with zero in-degree OR zero out-degree (and all incident edges)
8. **Increment** — `t++`

At each step the UI also shows:

- `‖y(t)‖₂` — the Euclidean norm of the current output vector, computed as  
  \[
  \|y(t)\|_2 = \sqrt{\sum_j a_{yj}(t)^2}.
  \]
- A small line chart of `‖y(t)‖₂` over time (window can be selected as last 50/100/500/1000/5000 steps or all steps).

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
│   ├── output-view.js  # Chart.js output norm time-series
│   └── stats.js        # Read-only stat counters
└── README.md
```

## Known Limitations

- **Forward pass** uses a single sweep in node creation order (not topological sort). For deep graphs this may lag one step behind true convergence.
- **Layout** uses Cytoscape's CoSE algorithm which re-runs on structural changes; may cause brief visual jitter when many nodes are added/removed simultaneously.
- **Performance** degrades above ~500 nodes due to full graph re-rendering. For large graphs, consider reducing speed or bridging frequency.
- **Input generators** are simple built-in functions; file upload is not supported in this version.
- **No persistence** — simulation state is lost on page refresh.
