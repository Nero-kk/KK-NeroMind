import { MindMapEdge, MindMapNode } from "../types";
import { MindMapRenderer, MindMapViewport } from "./MindMapRenderer";

export class CanvasRenderer implements MindMapRenderer {
  private canvasEl: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private containerEl: HTMLElement | null = null;
  private lastViewport: MindMapViewport | null = null;

  init(container: HTMLElement): void {
    this.containerEl = container;
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.className = "neromind-canvas";
    this.canvasEl.style.width = "100%";
    this.canvasEl.style.height = "100%";
    this.context = this.canvasEl.getContext("2d");
    this.containerEl.appendChild(this.canvasEl);
  }

  render(
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>,
    viewport: MindMapViewport
  ): void {
    this.lastViewport = viewport;
    if (!this.canvasEl || !this.context) return;

    this.resizeCanvas(viewport);
    const ctx = this.context;

    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    ctx.save();
    ctx.translate(-viewport.left, -viewport.top);

    this.drawEdges(ctx, nodes, edges);
    this.drawNodes(ctx, nodes);

    ctx.restore();
  }

  update(nodes: ReadonlyArray<MindMapNode>, edges: ReadonlyArray<MindMapEdge>): void {
    if (!this.lastViewport) return;
    this.render(nodes, edges, this.lastViewport);
  }

  destroy(): void {
    if (this.canvasEl) {
      this.canvasEl.remove();
    }
    this.canvasEl = null;
    this.context = null;
    this.containerEl = null;
    this.lastViewport = null;
  }

  // Phase 10: Expanded return type to Element | null to support interface consistency
  getSurfaceElement(): Element | null {
    return this.canvasEl;
  }

  private resizeCanvas(viewport: MindMapViewport): void {
    if (!this.canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(viewport.width));
    const height = Math.max(1, Math.floor(viewport.height));
    this.canvasEl.width = width * dpr;
    this.canvasEl.height = height * dpr;
    const ctx = this.context;
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private drawEdges(
    ctx: CanvasRenderingContext2D,
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>
  ): void {
    const nodePositionMap = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      nodePositionMap.set(node.id, node.position);
    }

    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 2;

    for (const edge of edges) {
      const from = nodePositionMap.get(edge.fromNodeId);
      const to = nodePositionMap.get(edge.toNodeId);
      if (!from || !to) continue;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    nodes: ReadonlyArray<MindMapNode>
  ): void {
    for (const node of nodes) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1d1d1f";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.content, node.position.x, node.position.y);
    }
  }
}
