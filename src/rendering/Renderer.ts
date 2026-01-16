import { Disposable, SVG_NS, MindMapNode, Position, NodeId } from "../types";
import { StateSnapshot } from "../state/stateTypes";
import { StateManager } from "../state/StateManager";
import { computeTextLayout } from "../layout/NodeTextLayout";

/**
 * Renderer
 *
 * Phase 5: Drag 상호작용 추가
 * Phase 10: visibleNodeIds 지원
 *
 * === 책임 (Responsibilities) ===
 * - StateSnapshot을 받아 SVG에 시각적 표현 생성
 * - 노드 + 텍스트 렌더링
 * - 엣지(line) 렌더링 (parentId 기반)
 * - 렌더링 전 기존 요소 제거 (clear → re-render)
 * - Phase 5: 노드 드래그 상호작용 처리
 * - Phase 10: 가시성 필터링 지원
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ HistoryManager 참조: 렌더링과 무관
 * - ❌ EventBus 참조: 이벤트 발행/구독 안 함
 * - ❌ 상태 캐싱: snapshot 저장 금지
 * - ❌ 애니메이션: Phase 5.0 범위 초과
 */
export class Renderer implements Disposable {
  private svgElement: SVGSVGElement;
  private rafId: number | null = null;

  // Phase 5: Drag 상태
  private draggingNodeId: NodeId | null = null;
  private dragOffset: Position = { x: 0, y: 0 };
  private dragStartPosition: Position = { x: 0, y: 0 };

  // Phase 5: StateManager 참조 (drag 완료 시 moveNode 호출용)
  private stateManager: StateManager | null = null;

  constructor(svgElement: SVGSVGElement) {
    this.svgElement = svgElement;
    this.setupCanvasBackgroundHandler();
    this.setupShadowFilter();
  }

  /**
   * Phase 5: StateManager 주입
   */
  setStateManager(stateManager: StateManager): void {
    this.stateManager = stateManager;
  }

  /**
   * Phase 5.1: Canvas background 클릭 핸들러 설정
   */
  private setupCanvasBackgroundHandler(): void {
    this.svgElement.addEventListener("pointerdown", (e) => {
      const target = e.target as SVGElement;
      if (target === this.svgElement || target.id === "transform-layer") {
        if (this.stateManager) {
          this.stateManager.clearSelection();
        }
      }
    });
  }

  /**
   * Setup Apple-style shadow filter for nodes
   */
  private setupShadowFilter(): void {
    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "node-shadow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    // Blur
    const feGaussianBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
    feGaussianBlur.setAttribute("in", "SourceAlpha");
    feGaussianBlur.setAttribute("stdDeviation", "4");

    // Offset
    const feOffset = document.createElementNS(SVG_NS, "feOffset");
    feOffset.setAttribute("dx", "0");
    feOffset.setAttribute("dy", "2");
    feOffset.setAttribute("result", "offsetblur");

    // Opacity
    const feComponentTransfer = document.createElementNS(
      SVG_NS,
      "feComponentTransfer"
    );
    const feFuncA = document.createElementNS(SVG_NS, "feFuncA");
    feFuncA.setAttribute("type", "linear");
    feFuncA.setAttribute("slope", "0.08");
    feComponentTransfer.appendChild(feFuncA);

    // Merge
    const feMerge = document.createElementNS(SVG_NS, "feMerge");
    const feMergeNode1 = document.createElementNS(SVG_NS, "feMergeNode");
    feMergeNode1.setAttribute("in", "offsetblur");
    const feMergeNode2 = document.createElementNS(SVG_NS, "feMergeNode");
    feMergeNode2.setAttribute("in", "SourceGraphic");
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);

    filter.appendChild(feGaussianBlur);
    filter.appendChild(feOffset);
    feComponentTransfer.appendChild(feFuncA); // Corrected: feFuncA is appended to feComponentTransfer
    filter.appendChild(feComponentTransfer);
    filter.appendChild(feMerge);

    defs.appendChild(filter);
    this.svgElement.appendChild(defs);
  }

  /**
   * StateSnapshot을 SVG로 렌더링
   *
   * Phase 10: visibleNodeIds 지원 추가
   */
  render(snapshot: StateSnapshot, visibleNodeIds?: Set<string>): void {
    // Phase 10: 엣지 먼저 렌더링 (뒤에 그려짐)
    this.renderEdges(snapshot, visibleNodeIds);

    // Phase 10: 노드 렌더링 (앞에 그려짐)
    this.renderNodes(snapshot, visibleNodeIds);
  }

  /**
   * Phase 10: 엣지 렌더링 with visibility filtering
   */
  private renderEdges(
    snapshot: StateSnapshot,
    visibleNodeIds?: Set<string>
  ): void {
    const edgeLayer = this.getOrCreateEdgeLayer();
    this.clearLayer(edgeLayer);

    // 노드 위치 맵 구축 (O(n))
    const nodePositionMap = new Map<string, Position>();
    for (const node of snapshot.nodes) {
      if (visibleNodeIds && !visibleNodeIds.has(node.id)) {
        continue;
      }
      nodePositionMap.set(node.id, node.position);
    }

    // parentId 기반 엣지 렌더링 (O(n))
    for (const node of snapshot.nodes) {
      if (visibleNodeIds && !visibleNodeIds.has(node.id)) {
        continue;
      }
      if (node.parentId !== null) {
        if (visibleNodeIds && !visibleNodeIds.has(node.parentId)) {
          continue;
        }
        const parentPosition = nodePositionMap.get(node.parentId);
        if (parentPosition) {
          const line = this.createLine(parentPosition, node.position);
          edgeLayer.appendChild(line);
        }
      }
    }
  }

  /**
   * 노드 렌더링 (Phase 3.4 로직 분리)
   *
   * Phase 4.x: 선택 상태 시각화 추가
   * Phase 5: 드래그 이벤트 리스너 추가
   * Phase 10: visibility filtering
   */
  private renderNodes(
    snapshot: StateSnapshot,
    visibleNodeIds?: Set<string>
  ): void {
    const nodeLayer = this.getOrCreateNodeLayer();
    this.clearLayer(nodeLayer);

    for (const node of snapshot.nodes) {
      if (visibleNodeIds && !visibleNodeIds.has(node.id)) {
        continue;
      }

      // 1. Calculate text layout (Apple-style auto-sizing)
      const textLayout = computeTextLayout(node.content, 240, {
        fontSize: 14,
        fontFamily: "system-ui, -apple-system",
      });

      // 2. Create node group
      const nodeGroup = this.createNodeGroup(
        node.id,
        node.position.x,
        node.position.y
      );

      // 3. Create rounded rectangle (Apple-style)
      const isSelected = node.id === snapshot.selectedNodeId;
      const rect = this.createRoundedRect(
        textLayout.width,
        textLayout.height,
        isSelected
      );
      nodeGroup.appendChild(rect);

      // 4. Create multiline text
      const textStartY = -textLayout.height / 2 + 16;
      textLayout.lines.forEach((line: string, i: number) => {
        const text = document.createElementNS(SVG_NS, "text") as SVGTextElement;
        text.textContent = line;
        text.setAttribute("x", "0");
        text.setAttribute("y", String(textStartY + i * 20));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "system-ui, -apple-system");
        text.setAttribute("font-size", "14");
        text.setAttribute("fill", "#1C1C1E");
        text.setAttribute("font-weight", isSelected ? "500" : "400");
        nodeGroup.appendChild(text);
      });

      // 5. Event listeners
      nodeGroup.style.cursor = "grab";
      nodeGroup.addEventListener("pointerdown", (e) =>
        this.handlePointerDown(e, node.id, node.position)
      );

      nodeLayer.appendChild(nodeGroup);
    }
  }

  /**
   * Phase 4.0: edge-layer 획득 또는 생성
   */
  private getOrCreateEdgeLayer(): SVGGElement {
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

  /**
   * node-layer 획득 또는 생성
   */
  private getOrCreateNodeLayer(): SVGGElement {
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

  /**
   * 레이어 내용 제거
   */
  private clearLayer(layer: SVGGElement): void {
    while (layer.firstChild) {
      layer.removeChild(layer.firstChild);
    }
  }

  /**
   * Phase 4.0: 직선(line) 생성
   */
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

  /**
   * 노드 그룹 생성
   */
  private createNodeGroup(id: string, x: number, y: number): SVGGElement {
    const group = document.createElementNS(SVG_NS, "g") as SVGGElement;
    group.setAttribute("id", `node-${id}`);
    group.setAttribute("transform", `translate(${x}, ${y})`);
    group.setAttribute("data-node-id", id);
    return group;
  }

  /**
    text.setAttribute("x", "0");
    text.setAttribute("y", "0");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute(
      "font-family",
      "-apple-system, BlinkMacSystemFont, sans-serif"
    );
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", "#1d1d1f");
    text.textContent = content;
    return text;
  }

	/**
	 * Create Apple-style rounded rectangle node
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
    rect.setAttribute("rx", "10");
    rect.setAttribute("ry", "10");

    // Apple-style appearance
    rect.setAttribute("fill", "#FFFFFF");
    rect.setAttribute("filter", "url(#node-shadow)");

    if (isSelected) {
      // iOS Blue outline for selected state
      rect.setAttribute("stroke", "#0A84FF");
      rect.setAttribute("stroke-width", "2");
    } else {
      rect.setAttribute("stroke", "none");
    }

    return rect;
  }

  // =========================================================================
  // Phase 5: Drag 이벤트 핸들러
  // =========================================================================

  /**
   * pointerdown: 드래그 시작 + 노드 선택
   */
  private handlePointerDown(
    e: PointerEvent,
    nodeId: NodeId,
    nodePosition: Position
  ): void {
    e.stopPropagation();

    // Phase 5.1: 노드 선택 (Command 패턴)
    if (this.stateManager) {
      this.stateManager.selectNode(nodeId);
    }

    // 드래그 상태 설정
    this.draggingNodeId = nodeId;
    this.dragStartPosition = { x: nodePosition.x, y: nodePosition.y };

    // 포인터 위치를 SVG 좌표계로 변환
    const pt = this.svgElement.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(this.svgElement.getScreenCTM()?.inverse());

    // dragOffset 계산 (포인터 - 노드 위치)
    this.dragOffset = {
      x: svgP.x - nodePosition.x,
      y: svgP.y - nodePosition.y,
    };

    // 전역 리스너 등록
    document.addEventListener("pointermove", this.handlePointerMove);
    document.addEventListener("pointerup", this.handlePointerUp);

    // cursor 변경
    document.body.style.cursor = "grabbing";
  }

  /**
   * pointermove: 드래그 preview (state 변경 ❌)
   */
  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.draggingNodeId) return;

    // 포인터 위치를 SVG 좌표계로 변환
    const pt = this.svgElement.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(this.svgElement.getScreenCTM()?.inverse());

    // 새 위치 계산 (포인터 - offset)
    const newX = svgP.x - this.dragOffset.x;
    const newY = svgP.y - this.dragOffset.y;

    // DOM transform 직접 변경 (preview만, state 변경 없음)
    const nodeGroup = this.svgElement.querySelector(
      `#node-${this.draggingNodeId}`
    ) as SVGGElement | null;
    if (nodeGroup) {
      nodeGroup.setAttribute("transform", `translate(${newX}, ${newY})`);
    }
  };

  /**
   * pointerup: 드래그 완료 (MoveNodeCommand 생성)
   */
  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.draggingNodeId) return;

    // 포인터 위치를 SVG 좌표계로 변환
    const pt = this.svgElement.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(this.svgElement.getScreenCTM()?.inverse());

    // 최종 위치 계산
    const finalX = svgP.x - this.dragOffset.x;
    const finalY = svgP.y - this.dragOffset.y;

    // StateManager.moveNode() 호출 (단 1회 Command 생성)
    if (this.stateManager) {
      this.stateManager.moveNode(this.draggingNodeId, finalX, finalY);
    }

    // 드래그 상태 초기화
    this.draggingNodeId = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartPosition = { x: 0, y: 0 };

    // 전역 리스너 제거
    document.removeEventListener("pointermove", this.handlePointerMove);
    document.removeEventListener("pointerup", this.handlePointerUp);

    // cursor 복원
    document.body.style.cursor = "";
  };

  /**
   * 렌더링 시작 (현재 미사용)
   */
  start(): void {
    console.log("Renderer started");
  }

  /**
   * 렌더링 정지
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    console.log("Renderer stopped");
  }

  /**
   * Disposable
   */
  destroy(): void {
    this.stop();

    // Phase 5: 전역 이벤트 리스너 제거
    document.removeEventListener("pointermove", this.handlePointerMove);
    document.removeEventListener("pointerup", this.handlePointerUp);
  }
}
