import type { RenderEdge } from "../types";

/**
 * SVG 연결선 렌더러.
 * 부모-자식 간 베지어 곡선을 그린다.
 */
export class EdgeRenderer {
  private parentGroup: SVGGElement;
  private edgeGroup: SVGGElement;
  private edgeElements: Map<string, SVGPathElement> = new Map();

  constructor(parentGroup: SVGGElement) {
    this.parentGroup = parentGroup;
    this.edgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.edgeGroup.classList.add("nm-edges");
    // 엣지는 노드보다 먼저 추가 (뒤에 렌더)
    this.parentGroup.insertBefore(this.edgeGroup, this.parentGroup.firstChild);
  }

  render(edges: readonly RenderEdge[]): void {
    const activeKeys = new Set(edges.map((e) => edgeKey(e)));

    // 더 이상 없는 엣지 제거
    for (const [key, el] of this.edgeElements) {
      if (!activeKeys.has(key)) {
        this.edgeGroup.removeChild(el);
        this.edgeElements.delete(key);
      }
    }

    // 엣지 생성/업데이트
    for (const edge of edges) {
      const key = edgeKey(edge);
      let path = this.edgeElements.get(key);

      if (!path) {
        path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add("nm-edge");
        this.edgeElements.set(key, path);
        this.edgeGroup.appendChild(path);
      }

      // 베지어 곡선 경로 계산
      const d = this.computeBezierPath(edge);
      path.setAttribute("d", d);
    }
  }

  /** 3차 베지어 곡선 경로 생성 (부모 → 자식, LR 방향) */
  private computeBezierPath(edge: RenderEdge): string {
    const { fromX, fromY, toX, toY } = edge;
    // 부모 쪽 20%, 자식 쪽 80% 지점에 컨트롤 포인트 배치
    // → 부모 근처에서 빠르게 수직 분기, 자식 근처에서 수평 진입
    const cp1X = fromX + (toX - fromX) * 0.2;
    const cp2X = fromX + (toX - fromX) * 0.8;
    return `M ${fromX} ${fromY} C ${cp1X} ${fromY}, ${cp2X} ${toY}, ${toX} ${toY}`;
  }
}

function edgeKey(edge: RenderEdge): string {
  return `${edge.fromId}->${edge.toId}`;
}
