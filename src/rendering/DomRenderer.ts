import { BoundingBox, MindMapEdge, MindMapNode, Position, SVG_NS } from "../types";
import { MindMapRenderer, MindMapViewport } from "./MindMapRenderer";

export class DomRenderer implements MindMapRenderer {
  private svgElement: SVGSVGElement | null = null;
  private containerEl: HTMLElement | null = null;
  private lastViewport: MindMapViewport | null = null;

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

  update(nodes: ReadonlyArray<MindMapNode>, edges: ReadonlyArray<MindMapEdge>): void {
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
      const nodeGroup = this.createNodeGroup(node.id, node.position.x, node.position.y);
      const circle = this.createCircle();
      const text = this.createText(node.content);
      nodeGroup.appendChild(circle);
      nodeGroup.appendChild(text);
      nodeLayer.appendChild(nodeGroup);
    }
  }

  private getOrCreateEdgeLayer(): SVGGElement {
    if (!this.svgElement) {
      return document.createElementNS(SVG_NS, "g") as SVGGElement;
    }
    let edgeLayer = this.svgElement.querySelector("#edge-layer") as SVGGElement | null;
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
    let nodeLayer = this.svgElement.querySelector("#node-layer") as SVGGElement | null;
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

  private createCircle(): SVGCircleElement {
    const circle = document.createElementNS(SVG_NS, "circle") as SVGCircleElement;
    circle.setAttribute("r", "30");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("fill", "rgba(255, 255, 255, 0.9)");
    circle.setAttribute("stroke", "rgba(0, 0, 0, 0.15)");
    circle.setAttribute("stroke-width", "1");
    return circle;
  }

  private createText(content: string): SVGTextElement {
    const text = document.createElementNS(SVG_NS, "text") as SVGTextElement;
    text.setAttribute("x", "0");
    text.setAttribute("y", "0");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, sans-serif");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "#1d1d1f");
    text.textContent = content;
    return text;
  }
}
