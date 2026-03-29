import type { RenderNode } from "../types";
import { LAYOUT } from "../constants";
import { computeNodeWidth } from "../utils/TextMetrics";

interface NodeCallbacks {
  onClick: (nodeId: string, event: MouseEvent) => void;
  onDoubleClick: (nodeId: string, event: MouseEvent) => void;
  onMouseDown: (nodeId: string, event: MouseEvent) => void;
}

/**
 * SVG foreignObject 기반 노드 렌더러.
 * 글래스모피즘 CSS 효과를 위해 foreignObject 내 HTML div를 사용한다.
 *
 * Chromium(Electron) 환경에서는 foreignObject 안에
 * 표준 HTML DOM(document.createElement)을 직접 넣어야 안정적으로 렌더링된다.
 * XHTML body 래핑은 Chromium에서 오히려 렌더링 실패를 유발한다.
 */
export class NodeRenderer {
  private parentGroup: SVGGElement;
  private nodeGroup: SVGGElement;
  private nodeElements: Map<string, SVGForeignObjectElement> = new Map();

  constructor(parentGroup: SVGGElement) {
    this.parentGroup = parentGroup;
    this.nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.nodeGroup.classList.add("nm-nodes");
    this.parentGroup.appendChild(this.nodeGroup);
  }

  render(
    nodes: readonly RenderNode[],
    selectedIds: ReadonlySet<string>,
    searchHighlightIds: ReadonlySet<string>,
    callbacks: NodeCallbacks,
  ): void {
    const activeIds = new Set(nodes.map((n) => n.id));

    // 더 이상 없는 노드 제거
    for (const [id, el] of this.nodeElements) {
      if (!activeIds.has(id)) {
        this.nodeGroup.removeChild(el);
        this.nodeElements.delete(id);
      }
    }

    // 노드 생성/업데이트
    for (const node of nodes) {
      let fo = this.nodeElements.get(node.id);

      if (!fo) {
        fo = this.createNodeElement(node, callbacks);
        this.nodeElements.set(node.id, fo);
        this.nodeGroup.appendChild(fo);
      }

      this.updateNodeElement(fo, node, selectedIds.has(node.id), searchHighlightIds.has(node.id));
    }
  }

  /** 특정 노드의 foreignObject 요소 반환 (편집 모드용) */
  getNodeElement(nodeId: string): SVGForeignObjectElement | undefined {
    return this.nodeElements.get(nodeId);
  }

  /** foreignObject 내부의 nm-node div 반환 */
  getNodeDiv(nodeId: string): HTMLDivElement | undefined {
    const fo = this.nodeElements.get(nodeId);
    if (!fo) return undefined;
    // foreignObject > div.nm-node (직접 자식)
    return fo.firstElementChild as HTMLDivElement | undefined;
  }

  private createNodeElement(
    node: RenderNode,
    callbacks: NodeCallbacks,
  ): SVGForeignObjectElement {
    const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    fo.setAttribute("data-node-id", node.id);
    fo.setAttribute("overflow", "visible");

    // 표준 HTML div를 foreignObject의 직접 자식으로 사용
    // (Chromium/Electron에서 XHTML body 래핑보다 안정적)
    const div = document.createElement("div");
    div.className = "nm-node";
    div.setAttribute("role", "treeitem");
    div.setAttribute("aria-label", node.label || "빈 노드");
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.boxSizing = "border-box";
    fo.appendChild(div);

    // 레이블
    const label = document.createElement("span");
    label.className = "nm-node__label";
    div.appendChild(label);

    // 노트 아이콘
    const noteIcon = document.createElement("span");
    noteIcon.className = "nm-node__note-icon";
    noteIcon.textContent = "\u{1F4C4}";
    div.appendChild(noteIcon);

    // 배지 (접힌 노드의 자식 수 표시)
    const badge = document.createElement("span");
    badge.className = "nm-node__badge";
    div.appendChild(badge);

    // 이벤트
    div.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button === 0) {
        callbacks.onMouseDown(node.id, e);
      }
    });
    div.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      callbacks.onClick(node.id, e);
    });
    div.addEventListener("dblclick", (e: MouseEvent) => {
      e.stopPropagation();
      callbacks.onDoubleClick(node.id, e);
    });

    return fo;
  }

  private updateNodeElement(
    fo: SVGForeignObjectElement,
    node: RenderNode,
    isSelected: boolean,
    isSearchMatch: boolean,
  ): void {
    // foreignObject > div.nm-node (직접 자식)
    const div = fo.firstElementChild as HTMLDivElement;
    if (!div) return;

    const label = div.querySelector(".nm-node__label") as HTMLSpanElement;
    const noteIcon = div.querySelector(".nm-node__note-icon") as HTMLSpanElement;
    const badge = div.querySelector(".nm-node__badge") as HTMLSpanElement;
    if (!label || !noteIcon || !badge) return;

    // 레이블 업데이트
    if (label.textContent !== node.label) {
      label.textContent = node.label;
      div.setAttribute("aria-label", node.label || "빈 노드");
    }

    // 접근성 속성
    div.setAttribute("aria-selected", String(isSelected));
    div.setAttribute("aria-level", String(node.depth + 1));
    if (node.collapsed !== undefined) {
      div.setAttribute("aria-expanded", String(!node.collapsed));
    }

    // 노드 크기 계산 — pill 형태
    const nodeHeight = node.isRoot ? LAYOUT.ROOT_HEIGHT : LAYOUT.NODE_HEIGHT;
    const nodeWidth = computeNodeWidth(node.label, node.isRoot, LAYOUT);

    // foreignObject 위치/크기
    fo.setAttribute("x", String(node.computedX - nodeWidth / 2));
    fo.setAttribute("y", String(node.computedY - nodeHeight / 2));
    fo.setAttribute("width", String(nodeWidth));
    fo.setAttribute("height", String(nodeHeight));

    // CSS 클래스
    let cls = "nm-node";
    if (node.isRoot) cls += " nm-node--root";
    else if (node.noteRef) cls += " nm-node--note-linked";
    else cls += " nm-node--normal";

    // 레벨 기반 색상 클래스 (depth 0=root, 1~5=개별, 6+=deep)
    if (node.depth <= 5) {
      cls += ` nm-node--level-${node.depth}`;
    } else {
      cls += " nm-node--level-deep";
    }

    if (isSelected) cls += " nm-node--selected";
    if (isSearchMatch) cls += " nm-node--search-match";
    div.className = cls;

    // 노트 아이콘 표시
    noteIcon.style.display = node.noteRef ? "" : "none";

    // 접힌 노드 배지
    if (node.collapsed && node.childCount > 0) {
      badge.textContent = `${node.childCount}`;
      badge.style.display = "";
    } else {
      badge.style.display = "none";
    }
  }

}
