/**
 * Cytoscape.js graph visualization.
 */

/* global cytoscape */

const NODE_COLORS = {
  input: '#4a90d9',
  internal: '#7c7c7c',
  output: '#d94a4a'
};

// All edges are drawn in black on a light background for clarity.
const EDGE_COLOR = '#000000';
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
      layout: { name: 'preset' },
      minZoom: 0.2,
      maxZoom: 5,
      wheelSensitivity: 0.3
    });
  }

  /** Full rebuild of the cytoscape graph from simulation graph. */
  rebuild(graph, bridgedSet) {
    this.cy.elements().remove();

    const elements = [];

    // Add nodes
    for (const [id, node] of graph.nodes) {
      elements.push({
        group: 'nodes',
        data: {
          id,
          color: NODE_COLORS[node.type] || NODE_COLORS.internal
        },
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
          color: EDGE_COLOR,
          thickness: Math.max(0.5, Math.min(Math.abs(edge.w), 3) * 2)
        }
      });
    }

    this.cy.add(elements);
    this._runLayout();
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
          }
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
            color: EDGE_COLOR,
            thickness: Math.max(0.5, Math.min(Math.abs(edge.w), 3) * 2)
          }
        });
      }
    }

    if (newElements.length > 0) {
      this.cy.add(newElements);
    }

    // Update existing edge styles
    for (const [eid, edge] of graph.edges) {
      const cyEdge = this.cy.getElementById(eid);
      if (cyEdge.length) {
        cyEdge.data('color', EDGE_COLOR);
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

    // Layout only new nodes if any were added
    if (newElements.some(e => e.group === 'nodes')) {
      this._runLayout();
    }
  }

  _runLayout() {
    this.cy.layout({
      name: 'cose',
      animate: false,
      randomize: false,
      nodeRepulsion: () => 8000,
      idealEdgeLength: () => 60,
      edgeElasticity: () => 100,
      gravity: 0.5,
      numIter: 100,
      fit: true,
      padding: 30
    }).run();
  }

  resize() {
    this.cy.resize();
    this.cy.fit();
  }
}
