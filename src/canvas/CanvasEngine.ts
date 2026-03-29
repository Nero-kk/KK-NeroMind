import type { MindMapDocument, MindMapAction, RenderNode, RenderEdge } from "../types";
import type { StateManager } from "../core/StateManager";
import { ViewportManager } from "./ViewportManager";
import { NodeRenderer } from "./NodeRenderer";
import { EdgeRenderer } from "./EdgeRenderer";
import { computeLayout } from "../layout/LayoutEngine";
import { VIEWPORT, LAYOUT } from "../constants";

/**
 * SVG 기반 캔버스 렌더링 엔진.
 * StateManager를 구독하여 상태 변경 시 자동 재렌더링한다.
 */
export class CanvasEngine {
  private containerEl: HTMLElement;
  private svgEl: SVGSVGElement;
  private worldGroup: SVGGElement;
  private stateManager: StateManager;
  private viewport: ViewportManager;
  private nodeRenderer: NodeRenderer;
  private edgeRenderer: EdgeRenderer;

  // 현재 렌더링된 노드/엣지 데이터
  private renderNodes: RenderNode[] = [];
  private renderEdges: RenderEdge[] = [];

  // 검색 하이라이트 노드 ID
  private searchHighlightIds: ReadonlySet<string> = new Set();

  // 팬 드래그 상태
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;

  // 휠 더블클릭 감지
  private lastMiddleClickTime = 0;

  // 렌더 프레임 배칭
  private renderScheduled = false;

  // 초기 센터링 완료 여부
  private initialCenterDone = false;
  private resizeObserver: ResizeObserver | null = null;

  // 콜백
  private onNodeClick: ((nodeId: string, event: MouseEvent) => void) | null = null;
  private onNodeDoubleClick: ((nodeId: string, event: MouseEvent) => void) | null = null;
  private onNodeMouseDown: ((nodeId: string, event: MouseEvent) => void) | null = null;
  private onViewportChange: (() => void) | null = null;

  constructor(containerEl: HTMLElement, stateManager: StateManager) {
    this.containerEl = containerEl;
    this.stateManager = stateManager;

    const doc = stateManager.getDocument();
    this.viewport = new ViewportManager(doc.viewport);

    // SVG 루트 생성
    this.svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svgEl.classList.add("nm-canvas");
    this.svgEl.setAttribute("width", "100%");
    this.svgEl.setAttribute("height", "100%");
    this.svgEl.setAttribute("role", "tree");
    this.svgEl.setAttribute("aria-label", "마인드맵 캔버스");
    // SVG 경계에서 노드가 잘리지 않도록 overflow 허용
    this.svgEl.style.overflow = "visible";
    this.containerEl.appendChild(this.svgEl);

    // 월드 좌표 그룹 (줌/팬 적용 대상)
    this.worldGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.worldGroup.classList.add("nm-world");
    this.svgEl.appendChild(this.worldGroup);

    // 렌더러 초기화
    this.edgeRenderer = new EdgeRenderer(this.worldGroup);
    this.nodeRenderer = new NodeRenderer(this.worldGroup);

    // 이벤트 바인딩
    this.bindEvents();

    // 상태 구독
    stateManager.subscribe((_doc: MindMapDocument, _action: MindMapAction) => {
      this.scheduleRender();
    });

    // 초기 렌더링
    this.render();

    // ResizeObserver로 컨테이너가 실제 크기를 가질 때 루트 노드 센터링
    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.initialCenterDone) return;
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        this.initialCenterDone = true;
        // 렌더링이 완료된 후 센터링 (다음 프레임)
        requestAnimationFrame(() => {
          const rootId = this.stateManager.getDocument().root.id;
          this.focusNode(rootId);
        });
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
      }
    });
    this.resizeObserver.observe(this.containerEl);
  }

  // === 이벤트 콜백 설정 ===

  setOnNodeClick(handler: (nodeId: string, event: MouseEvent) => void): void {
    this.onNodeClick = handler;
  }

  setOnNodeDoubleClick(handler: (nodeId: string, event: MouseEvent) => void): void {
    this.onNodeDoubleClick = handler;
  }

  setOnNodeMouseDown(handler: (nodeId: string, event: MouseEvent) => void): void {
    this.onNodeMouseDown = handler;
  }

  setOnViewportChange(handler: () => void): void {
    this.onViewportChange = handler;
  }

  // === 공개 메서드 ===

  getViewport(): ViewportManager {
    return this.viewport;
  }

  getRenderNodes(): readonly RenderNode[] {
    return this.renderNodes;
  }

  getNodeRenderer(): NodeRenderer {
    return this.nodeRenderer;
  }

  /** 검색 하이라이트 노드 ID 설정 */
  setSearchHighlightIds(ids: ReadonlySet<string>): void {
    this.searchHighlightIds = ids;
    this.scheduleRender();
  }

  /** 특정 노드로 카메라 이동 */
  focusNode(nodeId: string): void {
    const node = this.renderNodes.find((n) => n.id === nodeId);
    if (!node) return;

    const rect = this.svgEl.getBoundingClientRect();
    // 아직 레이아웃 전이면 무시
    if (rect.width === 0 || rect.height === 0) return;

    this.viewport.centerOn(node.computedX, node.computedY, rect.width, rect.height);
    this.applyViewportTransform();
    this.onViewportChange?.();
  }

  /** 모든 노드가 보이도록 뷰포트 조정 */
  fitAll(): void {
    if (this.renderNodes.length === 0) return;
    const rect = this.svgEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // 노드 바운딩 박스 계산
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const nodeRenderer = this.nodeRenderer;
    for (const node of this.renderNodes) {
      const fo = nodeRenderer.getNodeElement(node.id);
      if (!fo) continue;
      const x = parseFloat(fo.getAttribute("x") || "0");
      const y = parseFloat(fo.getAttribute("y") || "0");
      const w = parseFloat(fo.getAttribute("width") || "0");
      const h = parseFloat(fo.getAttribute("height") || "0");
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }

    if (!isFinite(minX)) return;
    this.viewport.fitBounds(minX, minY, maxX, maxY, rect.width, rect.height);
    this.applyViewportTransform();
    this.onViewportChange?.();
  }

  /** 캔버스 정리 */
  destroy(): void {
    this.resizeObserver?.disconnect();
    this.svgEl.removeEventListener("wheel", this.handleWheel);
    this.svgEl.removeEventListener("mousedown", this.handleMouseDown);
    // 팬 드래그 중 destroy 시 document 리스너 정리
    if (this.isPanning) {
      this.isPanning = false;
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);
    }
    this.containerEl.removeChild(this.svgEl);
  }

  // === 렌더링 ===

  private scheduleRender(): void {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.render();
    });
  }

  private render(): void {
    const doc = this.stateManager.getDocument();
    const selectedIds = this.stateManager.getSelectedNodeIds();

    // 레이아웃 계산
    const { nodes, edges } = computeLayout(doc.root, doc.autoAlign);
    this.renderNodes = nodes;
    this.renderEdges = edges;

    // 뷰포트 컬링 — 가시 영역 밖 노드/엣지 스킵
    const visibleBounds = this.getVisibleWorldBounds();
    const visibleNodes = visibleBounds
      ? this.renderNodes.filter((n) => this.isNodeVisible(n, visibleBounds))
      : this.renderNodes;

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = visibleBounds
      ? this.renderEdges.filter(
          (e) => visibleNodeIds.has(e.fromId) || visibleNodeIds.has(e.toId),
        )
      : this.renderEdges;

    // 엣지 먼저 렌더 (노드 아래에 표시)
    this.edgeRenderer.render(visibleEdges);

    // 노드 렌더
    this.nodeRenderer.render(visibleNodes, selectedIds, this.searchHighlightIds, {
      onClick: (nodeId, event) => this.onNodeClick?.(nodeId, event),
      onDoubleClick: (nodeId, event) => this.onNodeDoubleClick?.(nodeId, event),
      onMouseDown: (nodeId, event) => this.onNodeMouseDown?.(nodeId, event),
    });

    // 뷰포트 transform 적용
    this.applyViewportTransform();
  }

  /** 현재 뷰포트의 월드 좌표 영역 반환 (마진 포함) */
  private getVisibleWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const rect = this.svgEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // 화면 모서리를 월드 좌표로 변환 (마진 200px 여유)
    const margin = 200;
    const topLeft = this.viewport.screenToWorld(-margin, -margin);
    const bottomRight = this.viewport.screenToWorld(rect.width + margin, rect.height + margin);

    return {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y,
    };
  }

  /** 노드가 가시 영역 내에 있는지 판정 */
  private isNodeVisible(
    node: RenderNode,
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
  ): boolean {
    // 노드 대략적 반경 (최대 크기 기준)
    const halfW = LAYOUT.ROOT_MIN_WIDTH;
    const halfH = LAYOUT.ROOT_HEIGHT;
    return (
      node.computedX + halfW >= bounds.minX &&
      node.computedX - halfW <= bounds.maxX &&
      node.computedY + halfH >= bounds.minY &&
      node.computedY - halfH <= bounds.maxY
    );
  }

  private applyViewportTransform(): void {
    this.worldGroup.setAttribute("transform", this.viewport.toSvgTransform());
  }

  // === 이벤트 핸들러 ===

  private bindEvents(): void {
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.svgEl.addEventListener("wheel", this.handleWheel, { passive: false });
    this.svgEl.addEventListener("mousedown", this.handleMouseDown);
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.svgEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -VIEWPORT.ZOOM_STEP : VIEWPORT.ZOOM_STEP;
    this.viewport.zoomAt(delta, screenX, screenY);
    this.applyViewportTransform();
    this.onViewportChange?.();
  }

  private handleMouseDown(e: MouseEvent): void {
    // 휠 버튼 더블클릭 → 전체 보기
    if (e.button === 1) {
      const now = Date.now();
      if (now - this.lastMiddleClickTime < 400) {
        e.preventDefault();
        this.lastMiddleClickTime = 0;
        this.fitAll();
        return;
      }
      this.lastMiddleClickTime = now;
    }

    // 휠 버튼 (middle click) 또는 빈 캔버스 클릭 시 팬
    if (e.button === 1 || (e.button === 0 && e.target === this.svgEl)) {
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.svgEl.style.cursor = "grabbing";
      document.addEventListener("mousemove", this.handleMouseMove);
      document.addEventListener("mouseup", this.handleMouseUp);
      e.preventDefault();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPanning) return;
    const dx = e.clientX - this.panStartX;
    const dy = e.clientY - this.panStartY;
    this.panStartX = e.clientX;
    this.panStartY = e.clientY;
    this.viewport.pan(dx, dy);
    this.applyViewportTransform();
    this.onViewportChange?.();
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.isPanning) return;
    this.isPanning = false;
    this.svgEl.style.cursor = "";
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }
}
