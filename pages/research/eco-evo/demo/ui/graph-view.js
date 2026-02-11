/**
 * Cytoscape.js graph visualization.
 */

/* global cytoscape */

const NODE_COLORS = {
  input: '#4a90d9',
  internal: '#7c7c7c',
  output: '#d94a4a'
};

// Edge colours: positive / non-negative vs negative weights.
const EDGE_POS_COLOR = '#000000';   // black
const EDGE_NEG_COLOR = '#b71c1c';   // deep red
const BRIDGE_BORDER_COLOR = '#ffd600';

export class GraphView {
  constructor(containerId) {
    this.cy = cytoscape({
      container: document.getElementById(containerId),
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(id)',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': 'data(color)',
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 0,
            'border-color': BRIDGE_BORDER_COLOR,
            'color': '#fff',
            'text-outline-color': '#333',
            'text-outline-width': 1
          }
        },
        {
          selector: 'node.bridged',
          style: {
            'border-width': 4,
            'border-color': BRIDGE_BORDER_COLOR
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'data(thickness)',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        }
      ],
      // We use explicit positions (preset layout) so that
      // inputs stay on the left and outputs on the right.
      layout: { name: 'preset' },
      minZoom: 0.2,
      maxZoom: 5,
      wheelSensitivity: 0.3
    });
  }

  /**
   * Compute deterministic positions so that:
   *  - input nodes form a vertical column on the left
   *  - output nodes form a vertical column on the right
   *  - internal nodes are arranged on a regular grid inside the
   *    square region between the two columns (side length equal
   *    to the x-distance between input and output columns).
   */
  _computePositions(graph) {
    const inputs = [];
    const internals = [];
    const outputs = [];

    for (const [id, node] of graph.nodes) {
      if (node.type === 'input') inputs.push(id);
      else if (node.type === 'output') outputs.push(id);
      else internals.push(id);
    }

    // Sort ids to keep a stable ordering
    const sortByIndex = (a, b) => {
      const parse = id => {
        const m = id.match(/_(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      };
      return parse(a) - parse(b);
    };
    inputs.sort(sortByIndex);
    outputs.sort(sortByIndex);
    internals.sort();

    const spacingY = 80;
    const positions = new Map();

    const assignColumn = (ids, x) => {
      const n = ids.length;
      if (n === 0) return;
      const offset = (n - 1) / 2;
      ids.forEach((id, idx) => {
        const y = (idx - offset) * spacingY;
        positions.set(id, { x, y });
      });
    };

    // Logical coordinates; cy.fit() will scale them to viewport.
    // Keep input/output columns at fixed positions; only the
    // internal grid adapts within the central square.
    const nInt = internals.length;
    const side = 500; // fixed central square side length
    const halfSide = side / 2;

    const xLeft = -250;
    const xRight = 250;
    assignColumn(inputs, xLeft);    // left column for inputs
    assignColumn(outputs, xRight);  // right column for outputs

    // Internal nodes are distributed on a grid inside the square
    // between xLeft and xRight. The grid is roughly square, with
    // a minimum spacing for readability.
    if (nInt > 0) {
      const minSpacing = 40;
      let cols = Math.max(1, Math.ceil(Math.sqrt(nInt)));
      let rows = Math.ceil(nInt / cols);

      let spacingX = side / (cols + 1);
      if (spacingX < minSpacing) {
        cols = Math.max(1, Math.floor(side / minSpacing));
        rows = Math.ceil(nInt / cols);
        spacingX = side / (cols + 1);
      }
      let spacingGridY = side / (rows + 1);
      if (spacingGridY < minSpacing) {
        rows = Math.max(1, Math.floor(side / minSpacing));
        cols = Math.ceil(nInt / rows);
        spacingGridY = side / (rows + 1);
      }

      internals.forEach((id, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = -halfSide + (col + 1) * spacingX;
        const y = -halfSide + (row + 1) * spacingGridY;
        positions.set(id, { x, y });
      });
    }

    // Also return a recommended size for internal nodes so the caller
    // can shrink them when there are many.
    const baseSize = 28;
    const minSize = 10;
    const N0 = 100;
    const internalSize =
      nInt > 0
        ? Math.max(minSize, baseSize * Math.sqrt(N0 / (nInt + N0)))
        : baseSize;

    return { positions, internalSize, xLeft, xRight };
  }

  /** Full rebuild of the cytoscape graph from simulation graph. */
  rebuild(graph, bridgedSet) {
    this.cy.elements().remove();

    const { positions, internalSize } = this._computePositions(graph);
    const elements = [];

    // Add nodes
    for (const [id, node] of graph.nodes) {
      const size = node.type === 'internal' ? internalSize : 28;
      elements.push({
        group: 'nodes',
        data: {
          id,
          color: NODE_COLORS[node.type] || NODE_COLORS.internal,
          size
        },
        position: positions.get(id),
        classes: bridgedSet.has(id) ? 'bridged' : ''
      });
    }

    // Add edges
    for (const [eid, edge] of graph.edges) {
      elements.push({
        group: 'edges',
        data: {
          id: eid,
          source: edge.src,
          target: edge.dst,
          color: edge.w >= 0 ? EDGE_POS_COLOR : EDGE_NEG_COLOR,
          thickness: Math.max(0.5, Math.min(Math.abs(edge.w), 3) * 2)
        }
      });
    }

    this.cy.add(elements);
    this.cy.fit();
  }

  /** Incremental update: sync node classes and edge styles without full rebuild. */
  update(graph, bridgedSet) {
    const cyNodeIds = new Set();
    const cyEdgeIds = new Set();

    // Collect current cy element ids
    this.cy.nodes().forEach(n => cyNodeIds.add(n.id()));
    this.cy.edges().forEach(e => cyEdgeIds.add(e.id()));

    const graphNodeIds = new Set(graph.nodes.keys());
    const graphEdgeIds = new Set(graph.edges.keys());

    // Recompute desired positions and internal node size
    const { positions, internalSize } = this._computePositions(graph);

    // Remove nodes/edges no longer in graph
    this.cy.nodes().forEach(n => {
      if (!graphNodeIds.has(n.id())) n.remove();
    });
    this.cy.edges().forEach(e => {
      if (!graphEdgeIds.has(e.id())) e.remove();
    });

    // Add new nodes
    const newElements = [];
    for (const [id, node] of graph.nodes) {
      if (!cyNodeIds.has(id)) {
        const size = node.type === 'internal' ? internalSize : 28;
        newElements.push({
          group: 'nodes',
          data: {
            id,
            color: NODE_COLORS[node.type] || NODE_COLORS.internal,
            size
          },
          position: positions.get(id)
        });
      }
    }

    // Add new edges
    for (const [eid, edge] of graph.edges) {
      if (!cyEdgeIds.has(eid)) {
        newElements.push({
          group: 'edges',
          data: {
            id: eid,
            source: edge.src,
            target: edge.dst,
            color: edge.w >= 0 ? EDGE_POS_COLOR : EDGE_NEG_COLOR,
            thickness: Math.max(0.5, Math.min(Math.abs(edge.w), 3) * 2)
          }
        });
      }
    }

    if (newElements.length > 0) {
      this.cy.add(newElements);
    }

    // Update positions and sizes of all existing nodes to keep columns neat
    for (const [id] of graph.nodes) {
      const pos = positions.get(id);
      if (!pos) continue;
      const cyNode = this.cy.getElementById(id);
      if (cyNode.length) {
        cyNode.position(pos);
        const node = graph.nodes.get(id);
        if (node) {
          const size = node.type === 'internal' ? internalSize : 28;
          cyNode.data('size', size);
        }
      }
    }

    // Update existing edge styles
    for (const [eid, edge] of graph.edges) {
      const cyEdge = this.cy.getElementById(eid);
      if (cyEdge.length) {
        cyEdge.data('color', edge.w >= 0 ? EDGE_POS_COLOR : EDGE_NEG_COLOR);
        cyEdge.data('thickness', Math.max(0.5, Math.min(Math.abs(edge.w), 3) * 2));
      }
    }

    // Update bridged classes
    this.cy.nodes().forEach(n => {
      if (bridgedSet.has(n.id())) {
        n.addClass('bridged');
      } else {
        n.removeClass('bridged');
      }
    });

    // Keep the whole graph in view
    if (newElements.some(e => e.group === 'nodes')) {
      this.cy.fit();
    }
  }

  resize() {
    this.cy.resize();
    this.cy.fit();
  }
}
