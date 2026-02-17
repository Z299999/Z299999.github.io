# Eco-Evo Graph Simulation Demo

Interactive browser demo of a directed weighted graph simulation with configurable activations (`tanh`, `ReLU`, `ReLU with threshold`, `Identity`, `max |w_i x_i|`), stochastic weight dynamics, and two graph-construction modes: **bridging growth** and **random growth**.

## How to Open

Open `index.html` directly in a modern browser (Chrome, Firefox, Safari, Edge). No build step or server required.

> **Note:** Some browsers block ES module imports from `file://`. If the demo doesn't load, serve it with a local server:
> ```bash
> python3 -m http.server 8000
> # then open http://localhost:8000/pages/research/eco-evo/demo/
> ```

## Layout

- **Left panel** — Parameter controls (genesis and runtime, impulse test)
- **Center** — Interactive graph (Cytoscape.js) with zoom/pan
- **Right panel** —  
  - Output signal `‖y(t)‖₂` (value + time series)  
  - Node activation value distribution histogram (all node activations)  
  - Edge weight distribution histogram  
  - Degree distribution histogram  
- **Top toolbar** — Play/Pause, Step, Reset, Speed slider, live stats

## Parameters

This section doubles as both a user manual (what each control does) and an experiment setup reference (how to reproduce a configuration).

### Genesis (applied on Reset)

| Parameter | Range | Description |
|-----------|-------|-------------|
| `m` | 1–50 | Number of input nodes |
| `n` | 1–50 | Number of output nodes |
| `k` | 1–50 | Number of internal nodes at genesis (z0, ..., z_{k-1} fully connected; each x_i connects to every z_j, and each z_j connects to every y_l) |
| Input source | noise / constant / sine | Input signal generator |
| Activation | tanh / ReLU / ReLU (with threshold) / Identity / max \|w_i x_i\| | Node activation nonlinearity (applied to all non-input nodes) |
| Edge weight control | vanilla / tanh(w) / OU | - `vanilla`: Brownian weight dynamics + raw `w` in forward pass; `tanh(w)`: Brownian dynamics + `tanh(w)` as effective weight; `OU`: Ornstein–Uhlenbeck dynamics with mean `m` and raw `w` in forward pass |
| Construction mode | bridge / random | - `bridge`: canonical bridging growth described below; `random`: suppresses bridging and instead applies random edge/node growth with parameters in “Random growth (runtime)” |

### Runtime (applied immediately)

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `μ` (mu) | -0.1–0.1 | 0.0 | Drift term in `w += σ ξ + μ sign(w)` (can be negative) |
| `σ` (sigma) | 0–0.05 | 0.02 | Weight noise standard deviation (used in both Brownian and OU dynamics) |
| `θ` (activation threshold) | 0–1 | 0.0 | Global threshold used only when activation is set to “ReLU (with threshold)”; nodes apply `ReLU(z - θ)` to their aggregated input |
| OU mean `m` | free | 0.0 | Target mean for OU weight dynamics (only used when edge weight control is set to OU) |
| `p_flip` | 0–1 | 0.3 | Probability of sign-flip when `|w|` is near zero |
| `T_bridge` | 0–1 | 0.8 | Activation threshold for triggering bridges |
| `ω` (omega) | 0–0.2 | 0.05 | Bridge feedback strength for edges `z1 → z0 = -ω`, `z0 → z2 = ω` |
| `ε_zero` | 0–0.01 | 0.001 | Near-zero threshold for edge deletion / flip |
| `K` (cooldown) | 0–50 | 10 | Minimum steps between two bridge events on the same node |
| Speed | 1–200 | 10 | Simulation steps per second |

### Random growth (runtime, only when construction = random)

These parameters are visible in the UI but disabled unless you select `construction = random`.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `p_add_edge` | 0–1 | 0.01 | Per-step probability of adding a weak new edge from an internal node to another internal/output node at a sampled graph distance |
| `p_add_node` | 0–1 | 0.005 | Per-step probability of inserting a new internal node along an existing internal→(internal/output) edge |
| `α` (alpha) | 1–3 | 1.5 | Power-law exponent for the target graph distance: smaller `α` favors longer jumps, larger `α` favors local connections |
| `d_max` | 1–6 | 4 | Maximum graph-distance considered for random edge targets |

Under the hood, the “random” mode performs:

- **Random edge growth** — with probability `p_add_edge`, pick an internal node, sample a distance `d` from the discrete power-law `P(d) ∝ 1/d^α` up to `d_max`, then add a small-weight edge to a reachable internal/output node at that distance (if any).
- **Random node growth** — with probability `p_add_node`, choose an internal→(internal/output) edge and insert a fresh internal node along it, adding two small-weight edges `src → new` and `new → dst`.

### Impulse test (frozen-graph experiments)

The “Impulse test (frozen graph)” panel is collapsed by default. When enabled, it lets you probe the linear response of the current graph while freezing structural evolution.

| Control | Range | Default | Description |
|---------|-------|---------|-------------|
| Input index `i` | 0–(m−1) | 0 | Which input node `x_i` receives the impulse |
| Amplitude `A` | ≥ 0 | 1.0 | Magnitude of the injected impulse |
| Test steps | ≥ 1 | 200 | Number of time steps to run the impulse response measurement |

Workflow for an impulse experiment:

1. Choose a configuration (genesis + runtime), run until the graph and weights reach a regime of interest.
2. Freeze structural evolution by pausing bridging or random growth (e.g. set `T_bridge` very high and `p_add_edge = p_add_node = 0`, or simply hold the graph fixed).
3. Open the **Impulse test** panel, set `i`, `A`, and `Test steps`.
4. Click **Inject** to apply the impulse and record the output norm / distributions; click **Stop** to end the recording early.

## Simulation Step Order

Each call to `step()` executes in this exact order:

1. **Set input activations** — `a[xi] = xi(t)` from the selected input generator
2. **Forward pass** — For each non-input node in creation order:
   - For standard activations:
     - `z_i = Σ(w_ji × a_j)` over all incoming edges  
     - `a_i = φ(z_i)` where `φ` is:
       - `tanh` (default), or  
       - `ReLU(x) = max(0, x)`, or  
       - **ReLU with threshold:** `ReLU(z_i - θ) = max(0, z_i - θ)` using the global runtime threshold `θ`, or  
       - `Identity(x) = x` (fully linear graph)
   - For `max |w_i x_i|`:
     - For each incoming edge, compute the contribution `c_j = w_ji × a_j`
     - Set `a_i` to the contribution with largest absolute value (preserving sign):  
       \[
       a_i = \operatorname*{arg\,max}_j |c_j|.
       \]
3. **Bridging trigger** — For internal nodes, mark those where `|a_i| > T_bridge` (with cooldown `K` steps)
4. **Bridging action** — For each triggered node `z0`, apply the bridge construction described in the paper (creating internal nodes `z1, z2, ...`, a 2-cycle, fan-in from `xi` to `z1`, duplicated outputs from `z2`, and feedback edges of size `±ω_bridge`).
5. **Weight update** — For every edge:
   - If edge weight control is `vanilla` or `tanh(w)`: `w += σ × N(0,1) + μ × sign(w)`  
   - If edge weight control is `OU`: Ornstein–Uhlenbeck update  
     \[
     w \leftarrow m + a(w - m) + b\,\xi, \quad a = e^{-\gamma},\; b = \sigma \sqrt{\frac{1-a^2}{2\gamma}}
     \]
     with fixed mean-reversion rate `γ = 0.05`, user-controlled mean `m`, and shared `σ`.
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
  plus a line chart of `‖y(t)‖₂` over time (window selectable as last 50/100/500/1000/5000 steps or all steps).
- **Node activation histogram** — a live bar chart of node activation values binned over a symmetric range `[-L, L]` (with `L` automatically chosen between 1 and 10 based on current activations).
- **Edge weight histogram** — a live bar chart of edge weights binned over a symmetric range `[-L, L]` (with `L` chosen based on the current maximum absolute weight).

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
│   ├── distributions.js # Chart.js histograms (degree, node activation, edge weight)
│   ├── output-view.js  # Chart.js output norm time-series
│   └── stats.js        # Read-only stat counters
└── README.md
```

## Known Limitations

- **Forward pass** uses a single sweep in node creation order (not a full topological sort). For graphs with complex cycles this is closer to one step of a recurrent update than exact feedforward evaluation.
- **Layout** uses a custom three-column preset (inputs on the left, internals in a central grid that adapts to node count, outputs on the right). Large or extremely dense graphs can still produce edge crossings.
- **Performance** degrades above ~500 nodes due to repeated layout updates and DOM work. For large graphs, consider reducing speed or bridging frequency.
- **Input generators** are simple built-in functions; file upload is not supported in this version.
- **No persistence** — simulation state is lost on page refresh.
