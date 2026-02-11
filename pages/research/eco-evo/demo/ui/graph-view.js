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
            'width': 28,
            'height': 28,
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
            'border-color': BRIDGE_BORDER_COLOR,
            'width': 34,
            'height': 34
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
    const xLeft = -250;
    const xRight = 250;
    assignColumn(inputs, xLeft);    // left column for inputs
    assignColumn(outputs, xRight);  // right column for outputs

    // Internal nodes are distributed on a grid inside the square
    // between xLeft and xRight, with side length equal to the
    // distance between the two columns.
    const nInt = internals.length;
    if (nInt > 0) {
      const side = Math.abs(xRight - xLeft);
      const half = side / 2;

      // Choose grid dimensions roughly square.
      const cols = Math.max(1, Math.ceil(Math.sqrt(nInt)));
      const rows = Math.ceil(nInt / cols);

      const spacingX = side / (cols + 1);
      const spacingGridY = side / (rows + 1);

      internals.forEach((id, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = -half + (col + 1) * spacingX;
        const y = -half + (row + 1) * spacingGridY;
        positions.set(id, { x, y });
      });
    }

    return positions;
  }

  /** Full rebuild of the cytoscape graph from simulation graph. */
  rebuild(graph, bridgedSet) {
    this.cy.elements().remove();

    const positions = this._computePositions(graph);
    const elements = [];

    // Add nodes
    for (const [id, node] of graph.nodes) {
      elements.push({
        group: 'nodes',
        data: {
          id,
          color: NODE_COLORS[node.type] || NODE_COLORS.internal
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

    // Recompute desired positions for all nodes
    const positions = this._computePositions(graph);

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
        newElements.push({
          group: 'nodes',
          data: {
            id,
            color: NODE_COLORS[node.type] || NODE_COLORS.internal
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

    // Update positions of all existing nodes to keep columns neat
    for (const [id] of graph.nodes) {
      const pos = positions.get(id);
      if (!pos) continue;
      const cyNode = this.cy.getElementById(id);
      if (cyNode.length) cyNode.position(pos);
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
