import { BoundingBox, MindMapEdge, MindMapNode } from "../types";

export type MindMapViewport = BoundingBox;

export interface MindMapRenderer {
  init(container: HTMLElement): void;
  render(
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>,
    viewport: MindMapViewport
  ): void;
  update(
    nodes: ReadonlyArray<MindMapNode>,
    edges: ReadonlyArray<MindMapEdge>
  ): void;
  destroy(): void;
  getSurfaceElement?(): Element | null;  // Phase 10: Expanded to Element | null to support SVG rendering
}
