import {
  BoundingBox,
  MindMapEdge,
  MindMapNode,
  Position,
  SVG_NS,
} from "../types";
import { MindMapRenderer, MindMapViewport } from "./MindMapRenderer";
import { computeTextLayout } from "../layout/NodeTextLayout";

/**
 * DomRenderer - Apple-style SVG rendering
 *
 * Author: Nero-kk (https://github.com/Nero-kk)
 *
 * Renders nodes as rounded rectangles with text-based auto-sizing
 * per UITokens.md and Renderer-Circle-to-RoundedRect.md specifications
 */

export class DomRenderer implements MindMapRenderer {
  private svgElement: SVGSVGElement | null = null;
  private containerEl: HTMLElement | null = null;
  private lastViewport: MindMapViewport | null = null;
  private selectedNodeId: string | null = null;

  init(container: HTMLElement): void {
    this.containerEl = container;
    this.svgElement = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    this.svgElement.setAttribute("class", "neromind-canvas");
    this.svgElement.setAttribute("width", "100%");
    this.svgElement.setAttribute("height", "100%");

    const bgGroup = document.createElementNS(SVG_NS, "g");
    bgGroup.setAttribute("id", "background-layer");
    this.svgElement.appendChild(bgGroup);

    const transformGroup = document.createElementNS(SVG_NS, "g");
    transformGroup.setAttribute("id", "transform-layer");
    transformGroup.setAttribute("transform", "translate(0, 0) scale(1)");
    this.svgElement.appendChild(transformGroup);

    const edgeGroup = document.createElementNS(SVG_NS, "g");
    edgeGroup.setAttribute("id", "edge-layer");
    transformGroup.appendChild(edgeGroup);

    const nodeGroup = document.createElementNS(SVG_NS, "g");
    nodeGroup.setAttribute("id", "node-layer");
    transformGroup.appendChild(nodeGroup);

    this.containerEl.appendChild(this.svgElement);

    // Setup Apple-style shadow filter
    this.setupShadowFilter();
  }

  /**
   * Setup Apple-style shadow filter for nodes
   * Per UITokens.md: 0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)
   */
  private setupShadowFilter(): void {
    if (!this.svgElement) return;

    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "node-shadow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const feGaussianBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
    feGaussianBlur.setAttribute("in", "SourceAlpha");
    feGaussianBlur.setAttribute("stdDeviation", "4");

    const feOffset = document.createElementNS(SVG_NS, "feOffset");
    feOffset.setAttribute("dx", "0");
    feOffset.setAttribute("dy", "2");
    feOffset.setAttribute("result", "offsetblur");

    const feComponentTransfer = document.createElementNS(
      SVG_NS,
      "feComponentTransfer"
    );
    const feFuncA = document.createElementNS(SVG_NS, "feFuncA");
    feFuncA.setAttribute("type", "linear");
    feFuncA.setAttribute("slope", "0.08");
    feComponentTransfer.appendChild(feFuncA);

    const feMerge = document.createElementNS(SVG_NS, "feMerge");
    const feMergeNode1 = document.createElementNS(SVG_NS, "feMergeNode");
    feMergeNode1.setAttribute("in", "offsetblur");
    const feMergeNode2 = document.createElementNS(SVG_NS, "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);

    filter.appendChild(feGaussianBlur);
    filter.appendChild(feOffset);
    filter.appendChild(feComponentTransfer);
    filter.appendChild(feMerge);

    defs.appendChild(filter);
    this.svgElement.appendChild(defs);
  }

  render(
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>,
    viewport: MindMapViewport
  ): void {
    this.lastViewport = viewport;
    if (!this.svgElement) return;

    this.svgElement.setAttribute(
      "viewBox",
      `${viewport.left} ${viewport.top} ${viewport.width} ${viewport.height}`
    );

    this.renderEdges(nodes, edges);
    this.renderNodes(nodes);
  }

  update(
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>
  ): void {
    if (!this.lastViewport) return;
    this.render(nodes, edges, this.lastViewport);
  }

  destroy(): void {
    if (this.svgElement) {
      this.svgElement.remove();
      this.svgElement = null;
    }
    this.containerEl = null;
    this.lastViewport = null;
  }

  // Phase 10: Expanded return type to Element | null to support SVG rendering
  getSurfaceElement(): Element | null {
    return this.svgElement;
  }

  private renderEdges(
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>
  ): void {
    const edgeLayer = this.getOrCreateEdgeLayer();
    this.clearLayer(edgeLayer);

    const nodePositionMap = new Map<string, Position>();
    for (const node of nodes) {
      nodePositionMap.set(node.id, node.position);
    }

    for (const edge of edges) {
      const from = nodePositionMap.get(edge.fromNodeId);
      const to = nodePositionMap.get(edge.toNodeId);
      if (!from || !to) continue;
      const line = this.createLine(from, to);
      edgeLayer.appendChild(line);
    }
  }

  private renderNodes(nodes: ReadonlyArray<MindMapNode>): void {
    const nodeLayer = this.getOrCreateNodeLayer();
    this.clearLayer(nodeLayer);

    for (const node of nodes) {
      // 1. Calculate text layout (Apple-style auto-sizing)
      const textLayout = computeTextLayout(node.content, 240, {
        fontSize: 14,
        fontFamily: "system-ui, -apple-system",
      });

      // 2. Add padding per UITokens.md
      const paddingX = 16;
      const paddingY = 10;
      const width = textLayout.width + paddingX * 2;
      const height = textLayout.height + paddingY * 2;

      // 3. Create node group
      const nodeGroup = this.createNodeGroup(
        node.id,
        node.position.x,
        node.position.y
      );

      // 4. Create rounded rectangle (Apple-style)
      const isSelected = node.id === this.selectedNodeId;
      const rect = this.createRoundedRect(width, height, isSelected);
      nodeGroup.appendChild(rect);

      // 5. Create multiline text with pixel-perfect vertical centering
      // Since rect is centered at (0,0), we calculate from center
      // Formula: y_offset = -(lines - 1) * lineHeight / 2
      //          y = y_offset + (index * lineHeight)
      const lineHeight = 20; // Must match NodeTextLayout
      const totalLines = textLayout.lines.length;
      const yOffset = -((totalLines - 1) * lineHeight) / 2;

      textLayout.lines.forEach((line: string, i: number) => {
        const text = document.createElementNS(SVG_NS, "text") as SVGTextElement;
        text.textContent = line;
        text.setAttribute("x", "0");

        // Calculate y position from center (0,0)
        const lineY = yOffset + i * lineHeight;
        text.setAttribute("y", String(lineY));

        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central"); // More precise than 'middle'
        text.setAttribute("font-family", "system-ui, -apple-system");
        text.setAttribute("font-size", "14");
        text.setAttribute("fill", "#1C1C1E");
        text.setAttribute("font-weight", isSelected ? "500" : "400");
        text.setAttribute("pointer-events", "none"); // Allow click-through to rect
        nodeGroup.appendChild(text);
      });

      nodeLayer.appendChild(nodeGroup);
    }
  }

  private getOrCreateEdgeLayer(): SVGGElement {
    if (!this.svgElement) {
      return document.createElementNS(SVG_NS, "g") as SVGGElement;
    }
    let edgeLayer = this.svgElement.querySelector(
      "#edge-layer"
    ) as SVGGElement | null;
    if (!edgeLayer) {
      edgeLayer = document.createElementNS(SVG_NS, "g") as SVGGElement;
      edgeLayer.setAttribute("id", "edge-layer");
      const transformLayer = this.svgElement.querySelector("#transform-layer");
      if (transformLayer) {
        const nodeLayer = transformLayer.querySelector("#node-layer");
        if (nodeLayer) {
          transformLayer.insertBefore(edgeLayer, nodeLayer);
        } else {
          transformLayer.appendChild(edgeLayer);
        }
      } else {
        this.svgElement.appendChild(edgeLayer);
      }
    }
    return edgeLayer;
  }

  private getOrCreateNodeLayer(): SVGGElement {
    if (!this.svgElement) {
      return document.createElementNS(SVG_NS, "g") as SVGGElement;
    }
    let nodeLayer = this.svgElement.querySelector(
      "#node-layer"
    ) as SVGGElement | null;
    if (!nodeLayer) {
      nodeLayer = document.createElementNS(SVG_NS, "g") as SVGGElement;
      nodeLayer.setAttribute("id", "node-layer");
      const transformLayer = this.svgElement.querySelector("#transform-layer");
      if (transformLayer) {
        transformLayer.appendChild(nodeLayer);
      } else {
        this.svgElement.appendChild(nodeLayer);
      }
    }
    return nodeLayer;
  }

  private clearLayer(layer: SVGGElement): void {
    while (layer.firstChild) {
      layer.removeChild(layer.firstChild);
    }
  }

  private createLine(from: Position, to: Position): SVGLineElement {
    const line = document.createElementNS(SVG_NS, "line") as SVGLineElement;
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("stroke", "rgba(0, 0, 0, 0.2)");
    line.setAttribute("stroke-width", "2");
    return line;
  }

  private createNodeGroup(id: string, x: number, y: number): SVGGElement {
    const group = document.createElementNS(SVG_NS, "g") as SVGGElement;
    group.setAttribute("id", `node-${id}`);
    group.setAttribute("transform", `translate(${x}, ${y})`);
    group.setAttribute("data-node-id", id);
    return group;
  }

  /**
   * Create Apple-style rounded rectangle node
   * Per UITokens.md and NodeSelectionVisualSpec.md
   */
  private createRoundedRect(
    width: number,
    height: number,
    isSelected: boolean = false
  ): SVGRectElement {
    const rect = document.createElementNS(SVG_NS, "rect") as SVGRectElement;

    // Center the rect at (0, 0)
    rect.setAttribute("x", String(-width / 2));
    rect.setAttribute("y", String(-height / 2));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("rx", "10"); // Corner radius per UITokens.md
    rect.setAttribute("ry", "10");

    // Apple-style appearance
    rect.setAttribute("fill", "#FFFFFF"); // White background
    rect.setAttribute("filter", "url(#node-shadow)");

    if (isSelected) {
      // iOS Blue outline for selected state (NodeSelectionVisualSpec.md)
      rect.setAttribute("stroke", "#0A84FF");
      rect.setAttribute("stroke-width", "2");
    } else {
      // Default state
      rect.setAttribute("stroke", "#D0D0D0"); // Per UITokens.md
      rect.setAttribute("stroke-width", "1");
    }

    return rect;
  }

  /**
   * Set selected node ID for visualization
   * Called by NeroMindView when selection changes
   */
  setSelectedNodeId(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
  }
}
