import { ItemView, WorkspaceLeaf } from "obsidian";
import type NeroMindPlugin from "../main";
import {
  BoundingBox,
  Disposable,
  MindMapNode,
  NODE_CONSTANTS,
  Position,
} from "../types";
import { StateSnapshot } from "../state/stateTypes";
import { StateManager } from "../state/StateManager";
import { HistoryManager } from "../history/HistoryManager";
import { EventBus } from "../events/EventBus";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { DomRenderer } from "../rendering/DomRenderer";
import { MindMapRenderer, MindMapViewport } from "../rendering/MindMapRenderer";
import { CreateNodeCommand } from "../history/CreateNodeCommand";
import type {
  LayoutDirection,
  NeroMindSettings,
  RendererType,
} from "../settings/NeroMindSettingTab";

export const VIEW_TYPE_NEROMIND = "neromind-view";

/**
 * NeroMind 마인드맵 뷰
 *
 * Phase 1: 기본 뷰 골격 및 SVG 캔버스 초기화
 * Phase 2: Snapshot + Command 패턴 적용
 * Phase 3.1: HistoryManager 통합, Undo UI 추가
 * Phase 3.2: CreateNodeCommand 실제 연결, Undo 동작 검증
 * Phase 3.3: 테스트 코드 제거, 실제 사용자 액션(더블클릭) 연결
 *
 * 주의사항:
 * - DOM 조작은 onOpen() 이후에만 수행
 * - 모든 리소스는 onClose()에서 정리
 * - HistoryManager는 StateManager의 Wrapper
 * - 사용자 작업은 historyManager.execute(command)로만 실행
 */
export class NeroMindView extends ItemView {
  plugin: NeroMindPlugin;
  private renderer: MindMapRenderer | null = null;
  private rendererType: RendererType | null = null;
  private renderSurfaceEl: Element | null = null; // Phase 10: Expanded to Element | null for SVG support
  private disposables: Disposable[] = [];
  private mindmapContainerEl: HTMLElement | null = null;

  // Phase 3.1: State Management
  private stateManager: StateManager | null = null; // Phase 3.4: Command History
  private historyManager: HistoryManager | null = null;

  // Phase 11: Expandable FAB Toolbar
  private fabMainEl: HTMLElement | null = null;
  private fabMenuEl: HTMLElement | null = null;
  private fabUndoBtn: HTMLElement | null = null;
  private fabRedoBtn: HTMLElement | null = null;
  private isToolbarExpanded: boolean = false;
  private eventBus: EventBus | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private readonly eventUnsubscribers: Array<() => void> = [];
  private currentSettings: NeroMindSettings | null = null;
  private readonly baseRadius = 160;
  private readonly depthGap = 140;
  private readonly minAngleGap = 12;
  private pendingRender = false;
  private suppressRender = false;
  private ignoreNextSettingsEvent = false;
  private resizeObserver: ResizeObserver | null = null;
  private currentViewport: MindMapViewport = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  };
  private readonly viewportUnsubscribers: Array<() => void> = [];
  private lastSnapshot: StateSnapshot | null = null;
  private visibleNodeIds: Set<string> = new Set();
  private forcedVisibleNodeIds: Set<string> = new Set();
  private visibleUpdateScheduled = false;
  private layoutRequest: {
    scope: "all" | "subtree";
    rootIds: Set<string>;
  } | null = null;
  private layoutScheduled = false;
  private layoutDebounceMs = 140;
  private layoutDebounceTimer: number | null = null;

  // Phase 3.1: UI Elements
  private undoButtonEl: HTMLButtonElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: NeroMindPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  /**
   * 뷰 타입 반환
   */
  getViewType(): string {
    return VIEW_TYPE_NEROMIND;
  }

  /**
   * 뷰 표시 이름
   */
  getDisplayText(): string {
    return "NeroMind";
  }

  /**
   * 뷰 아이콘
   */
  getIcon(): string {
    return "brain";
  }

  /**
   * 뷰 열기
   *
   * Phase 3.1 주의사항:
   * - EventBus → StateManager → HistoryManager 순서
   * - StateManager.setEventBus() 선택적 주입
   * - HistoryManager는 StateManager를 Wrapper로 감싼다
   */
  async onOpen(): Promise<void> {
    console.log("Opening NeroMind view...");

    const container = this.containerEl;
    container.empty();
    container.addClass("neromind-view");

    // 메인 컨테이너 생성
    this.mindmapContainerEl = container.createDiv({
      cls: "neromind-container",
    });

    this.ensureOverlay();
    this.initializeRenderer(this.plugin.settings.rendererType);

    // Phase 3.1: State Management 초기화
    this.initializeStateManagement();

    // Phase 3.1: Undo 버튼 생성 - REMOVED: Using FAB toolbar instead
    // this.createUndoButton();

    // Phase 3.1: 단축키 등록
    this.registerShortcuts();

    // Phase 3.3: 캔버스 이벤트 등록 (노드 생성 트리거)
    this.registerCanvasEvents();

    this.setupViewportObserver();
    this.registerViewportEvents();

    // 설정 반영 및 구독
    this.applySettings(this.plugin.settings);
    this.unsubscribeSettings = this.plugin.onSettingsChange((settings) => {
      if (this.ignoreNextSettingsEvent) {
        this.ignoreNextSettingsEvent = false;
        return;
      }
      this.applySettings(settings);
    });

    // Phase 11: Setup FAB toolbar (after all container setup)
    this.setupFabToolbar();

    // Phase 10: 초기 데이터 생성 (루트 노드)
    this.initializeDefaultData();
  }

  private ensureOverlay(): void {
    if (!this.mindmapContainerEl) return;
    const existing = this.mindmapContainerEl.querySelector(".neromind-overlay");
    if (existing) return;

    const overlayDiv = this.mindmapContainerEl.createDiv({
      cls: "neromind-overlay",
    });
    overlayDiv.style.position = "absolute";
    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.width = "100%";
    overlayDiv.style.height = "100%";
    overlayDiv.style.pointerEvents = "none";
  }

  private initializeRenderer(rendererType: RendererType): void {
    if (!this.mindmapContainerEl) {
      console.error("[initializeRenderer] mindmapContainerEl is null!");
      return;
    }
    console.log(
      `[initializeRenderer] Initializing ${rendererType} renderer...`
    );
    this.destroyRenderer();
    this.rendererType = rendererType;
    this.renderer = this.createRenderer(rendererType);
    this.renderer.init(this.mindmapContainerEl);
    this.renderSurfaceEl =
      this.renderer.getSurfaceElement?.() ?? this.mindmapContainerEl;
    console.log("[initializeRenderer] Renderer surface element:", {
      surfaceType: this.renderSurfaceEl?.tagName,
      isAttached: this.renderSurfaceEl?.isConnected,
      parentElement: this.renderSurfaceEl?.parentElement?.className,
    });
    this.updateViewportBounds();
  }

  private createRenderer(rendererType: RendererType): MindMapRenderer {
    if (rendererType === "canvas") {
      return new CanvasRenderer();
    }
    return new DomRenderer();
  }

  private destroyRenderer(): void {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
    this.renderSurfaceEl = null;
    this.rendererType = null;
  }

  /**
   * Phase 3.1: State Management 초기화
   *
   * 책임:
   * - EventBus 생성
   * - StateManager 생성 및 EventBus 주입 (선택적)
   * - HistoryManager 생성 (Wrapper Pattern)
   * - Renderer 생성
   * - disposables 배열에 모두 등록
   *
   * 비책임:
   * - Command 실행
   * - UI 갱신
   */
  private initializeStateManagement(): void {
    // EventBus 초기화 (선택적)
    this.eventBus = new EventBus();

    // StateManager 초기화
    this.stateManager = new StateManager();
    this.stateManager.setEventBus(this.eventBus); // 선택적 주입
    this.addDisposable(this.stateManager);

    // HistoryManager 초기화 (Wrapper Pattern)
    this.historyManager = new HistoryManager(this.stateManager);
    this.addDisposable(this.historyManager);

    this.bindStateEvents();

    console.log("State management initialized");
  }

  private setupViewportObserver(): void {
    if (!this.mindmapContainerEl) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.updateViewportBounds();
      this.scheduleVisibleUpdate();
    });
    this.resizeObserver.observe(this.mindmapContainerEl);
    this.updateViewportBounds();
  }

  private registerViewportEvents(): void {
    for (const unsubscribe of this.viewportUnsubscribers) {
      unsubscribe();
    }
    this.viewportUnsubscribers.length = 0;

    const target = this.renderSurfaceEl ?? this.mindmapContainerEl;
    if (!target) return;

    const handler = () => {
      this.scheduleVisibleUpdate();
    };
    target.addEventListener("wheel", handler, { passive: true });
    this.viewportUnsubscribers.push(() => {
      target.removeEventListener("wheel", handler);
    });
  }

  private updateViewportBounds(): void {
    if (!this.mindmapContainerEl) return;
    const rect = this.mindmapContainerEl.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    this.currentViewport = {
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
    };
  }

  private bindStateEvents(): void {
    if (!this.eventBus) return;

    const unsubscribeNodeUpdated = this.eventBus.on("nodeUpdated", () => {
      if (this.suppressRender) return;
      this.scheduleRender();
    });

    const unsubscribeLayoutReset = this.eventBus.on(
      "layoutResetRequested",
      (payload) => {
        const data = payload as { rootIds?: string[] } | undefined;
        const rootIds = Array.isArray(data?.rootIds) ? data!.rootIds : [];
        if (rootIds.length === 0) {
          this.enqueueLayoutRequest({ scope: "all" });
          return;
        }

        this.enqueueLayoutRequest({ scope: "subtree", rootIds });
      }
    );

    this.eventUnsubscribers.push(
      unsubscribeNodeUpdated,
      unsubscribeLayoutReset
    );

    const unsubscribeLayoutSettingsChanged = this.eventBus.on(
      "layoutSettingsChanged",
      (payload) => {
        const data = payload as
          | {
              settings?: Partial<NeroMindSettings>;
              scope?: "all" | "subtree";
              rootId?: string;
            }
          | undefined;
        const patch = data?.settings ?? {};
        const nextSettings: NeroMindSettings = {
          ...this.plugin.settings,
          ...patch,
        };

        this.plugin.settings = nextSettings;
        this.currentSettings = { ...nextSettings };
        this.ignoreNextSettingsEvent = true;
        void this.plugin.saveSettings();

        const scope = data?.scope ?? "all";
        if (scope === "subtree" && data?.rootId) {
          this.enqueueLayoutRequest({
            scope: "subtree",
            rootIds: [data.rootId],
          });
          return;
        }

        this.enqueueLayoutRequest({ scope: "all" });
      }
    );

    this.eventUnsubscribers.push(unsubscribeLayoutSettingsChanged);
  }

  /**
   * Phase 3.1: Undo 버튼 생성
   *
   * 책임:
   * - HTML 버튼 요소 생성
   * - 스타일 적용
   * - 클릭 이벤트 연결
   * - 초기 활성화 상태 설정
   *
   * 비책임:
   * - Undo 로직 실행 (handleUndo 책임)
   */
  private createUndoButton(): void {
    const overlayEl = this.containerEl.querySelector(".neromind-overlay");
    if (!overlayEl) {
      console.warn("Overlay element not found");
      return;
    }

    this.undoButtonEl = overlayEl.createEl("button", {
      text: "Undo",
      cls: "neromind-undo-button",
    });

    // 스타일 적용
    this.undoButtonEl.style.position = "absolute";
    this.undoButtonEl.style.bottom = "20px";
    this.undoButtonEl.style.right = "20px";
    this.undoButtonEl.style.padding = "8px 16px";
    this.undoButtonEl.style.border = "1px solid rgba(0, 0, 0, 0.1)";
    this.undoButtonEl.style.borderRadius = "8px";
    this.undoButtonEl.style.background = "rgba(255, 255, 255, 0.9)";
    this.undoButtonEl.style.cursor = "pointer";
    this.undoButtonEl.style.pointerEvents = "auto"; // overlay는 pointer-events: none
    this.undoButtonEl.style.fontSize = "14px";
    this.undoButtonEl.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, sans-serif";

    // 클릭 이벤트 연결
    this.undoButtonEl.addEventListener("click", () => this.handleUndo());

    // 초기 상태 설정
    this.updateUndoButton();
  }

  /**
   * Phase 3.1: Undo 처리
   *
   * 책임:
   * - canUndo() 확인
   * - historyManager.undo() 호출
   * - snapshot 렌더링
   * - UI 갱신
   * - 에러 처리
   *
   * 비책임:
   * - StateManager 직접 조작
   * - Command 실행 (execute는 사용자 작업용)
   */
  private handleUndo(): void {
    if (!this.historyManager || !this.historyManager.canUndo()) {
      console.log("Cannot undo: no history available");
      return;
    }

    try {
      const snapshot = this.historyManager.undo();
      this.renderSnapshot(snapshot);
      this.updateUndoButton();
      console.log("Undo successful");
    } catch (error) {
      console.error("Undo failed:", error);
    }
  }

  /**
   * Phase 3.1: Undo 버튼 상태 갱신
   *
   * 책임:
   * - canUndo() 결과에 따라 버튼 활성화/비활성화
   * - 버튼 텍스트 설정
   *
   * 비책임:
   * - Undo 로직 실행
   */
  private updateUndoButton(): void {
    if (!this.undoButtonEl || !this.historyManager) {
      return;
    }

    const canUndo = this.historyManager.canUndo();
    this.undoButtonEl.disabled = !canUndo;

    // 비활성화 시 스타일 변경
    if (!canUndo) {
      this.undoButtonEl.style.opacity = "0.5";
      this.undoButtonEl.style.cursor = "not-allowed";
    } else {
      this.undoButtonEl.style.opacity = "1";
      this.undoButtonEl.style.cursor = "pointer";
    }
  }

  /**
   * Phase 3.4: Snapshot 렌더링
   *
   * 책임:
   * - StateSnapshot을 Renderer에 전달
   * - 콘솔 로깅 (디버깅용)
   *
   * 비책임:
   * - Renderer 내부 로직 수정
   * - StateManager 상태 직접 조작
   */
  private renderSnapshot(snapshot: StateSnapshot): void {
    console.log("[renderSnapshot] Rendering snapshot:", {
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
      rootId: snapshot.rootId,
      hasRenderer: !!this.renderer,
      rendererType: this.rendererType,
    });

    if (!this.renderer) {
      console.error("[renderSnapshot] Renderer is null! Cannot render.");
      return;
    }

    this.lastSnapshot = snapshot;
    const visibleNodeIds = this.computeVisibleNodeIds(snapshot);
    console.log("[renderSnapshot] Visible nodes:", {
      total: snapshot.nodes.length,
      visible: visibleNodeIds.size,
      visibleIds: Array.from(visibleNodeIds),
    });
    this.applyVisibleNodes(snapshot, visibleNodeIds);
  }

  private applySettings(settings: NeroMindSettings): void {
    const prev = this.currentSettings;
    this.currentSettings = { ...settings };

    if (!prev || prev.rendererType !== settings.rendererType) {
      this.initializeRenderer(settings.rendererType);
      this.registerViewportEvents();
      if (this.lastSnapshot) {
        this.renderSnapshot(this.lastSnapshot);
      }
    }

    const layoutChanged =
      !prev ||
      prev.enableRadialLayout !== settings.enableRadialLayout ||
      prev.layoutDirection !== settings.layoutDirection;

    if (layoutChanged) {
      this.enqueueLayoutRequest({ scope: "all" });
    }
  }

  private enqueueLayoutRequest(request: {
    scope: "all" | "subtree";
    rootIds?: string[];
  }): void {
    if (!this.layoutRequest) {
      this.layoutRequest = { scope: request.scope, rootIds: new Set() };
    }

    if (request.scope === "all") {
      this.layoutRequest.scope = "all";
      this.layoutRequest.rootIds.clear();
    } else if (this.layoutRequest.scope !== "all" && request.rootIds) {
      for (const rootId of request.rootIds) {
        this.layoutRequest.rootIds.add(rootId);
      }
    }

    this.scheduleLayoutFlush();
  }

  private scheduleLayoutFlush(): void {
    if (this.layoutScheduled) return;
    this.layoutScheduled = true;

    const flush = () => {
      this.layoutScheduled = false;
      if (!this.layoutRequest) return;
      const request = this.layoutRequest;
      this.layoutRequest = null;
      this.flushLayoutRequest(request);
    };

    if (this.layoutDebounceMs > 0) {
      if (this.layoutDebounceTimer !== null) {
        window.clearTimeout(this.layoutDebounceTimer);
      }
      this.layoutDebounceTimer = window.setTimeout(() => {
        this.layoutDebounceTimer = null;
        requestAnimationFrame(flush);
      }, this.layoutDebounceMs);
      return;
    }

    requestAnimationFrame(flush);
  }

  private flushLayoutRequest(request: {
    scope: "all" | "subtree";
    rootIds: Set<string>;
  }): void {
    const settings = this.currentSettings ?? this.plugin.settings;
    if (request.scope === "all") {
      this.recomputeLayout(settings, { scope: "all" });
      return;
    }

    if (request.rootIds.size === 0) {
      this.recomputeLayout(settings, { scope: "all" });
      return;
    }

    for (const rootId of request.rootIds) {
      this.recomputeLayout(settings, { scope: "subtree", rootId });
    }
  }

  private recomputeLayout(
    settings: NeroMindSettings,
    options: { scope: "all" | "subtree"; rootId?: string } = { scope: "all" }
  ): void {
    if (!this.stateManager || !this.renderer) {
      return;
    }

    const snapshot = this.stateManager.getSnapshot();
    if (!settings.enableRadialLayout || snapshot.nodes.length === 0) {
      this.renderSnapshot(snapshot);
      return;
    }

    const center = this.getViewportCenter();
    const positions = this.computeRadialPositions(
      snapshot,
      center,
      settings.layoutDirection,
      options
    );

    this.suppressRender = true;
    try {
      for (const [nodeId, position] of positions) {
        this.stateManager.updateNode(nodeId, { position });
      }

      const updatedSnapshot = this.stateManager.getSnapshot();
      this.renderSnapshot(updatedSnapshot);
    } finally {
      this.suppressRender = false;
    }
  }

  private scheduleRender(): void {
    if (this.pendingRender) return;
    this.pendingRender = true;
    requestAnimationFrame(() => {
      this.pendingRender = false;
      if (!this.stateManager || !this.renderer) return;
      this.renderSnapshot(this.stateManager.getSnapshot());
    });
  }

  private scheduleVisibleUpdate(): void {
    if (this.visibleUpdateScheduled) return;
    this.visibleUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.visibleUpdateScheduled = false;
      if (!this.lastSnapshot) return;
      const nextVisible = this.computeVisibleNodeIds(this.lastSnapshot);
      if (!this.isVisibleSetChanged(this.visibleNodeIds, nextVisible)) {
        return;
      }
      this.applyVisibleNodes(this.lastSnapshot, nextVisible);
    });
  }

  private applyVisibleNodes(
    snapshot: StateSnapshot,
    visibleNodeIds: Set<string>
  ): void {
    this.visibleNodeIds = visibleNodeIds;
    if (!this.renderer) return;

    const visibleNodes = snapshot.nodes.filter((n) => visibleNodeIds.has(n.id));
    const visibleEdges = snapshot.edges.filter(
      (e) => visibleNodeIds.has(e.fromNodeId) && visibleNodeIds.has(e.toNodeId)
    );

    // Pass selection state to renderer (Apple-style visualization)
    if (this.renderer && "setSelectedNodeId" in this.renderer) {
      (this.renderer as any).setSelectedNodeId(snapshot.selectedNodeId || null);
    }

    this.renderer.render(visibleNodes, visibleEdges, this.currentViewport);
  }

  private buildRenderData(
    snapshot: StateSnapshot,
    visibleNodeIds: Set<string>
  ): { nodes: MindMapNode[]; edges: typeof snapshot.edges } {
    const nodes = snapshot.nodes.filter((node) => visibleNodeIds.has(node.id));
    const edges = snapshot.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.fromNodeId) && visibleNodeIds.has(edge.toNodeId)
    );
    return { nodes, edges };
  }

  private computeVisibleNodeIds(snapshot: StateSnapshot): Set<string> {
    const bounds = this.getVisibleBounds();
    const result = new Set<string>();
    const forcedIds = new Set(this.forcedVisibleNodeIds);

    if (snapshot.selectedNodeId) {
      forcedIds.add(snapshot.selectedNodeId);
    }

    for (const node of snapshot.nodes) {
      if (forcedIds.has(node.id)) {
        result.add(node.id);
        continue;
      }
      if (this.isNodeVisible(node.position, bounds)) {
        result.add(node.id);
      }
    }

    for (const id of forcedIds) {
      result.add(id);
    }

    return result;
  }

  private getVisibleBounds(): BoundingBox {
    return { ...this.currentViewport };
  }

  private isNodeVisible(position: Position, bounds: BoundingBox): boolean {
    const halfWidth = NODE_CONSTANTS.MIN_WIDTH / 2;
    const halfHeight = NODE_CONSTANTS.HEIGHT / 2;
    const left = position.x - halfWidth;
    const right = position.x + halfWidth;
    const top = position.y - halfHeight;
    const bottom = position.y + halfHeight;

    return (
      right >= bounds.left &&
      left <= bounds.right &&
      bottom >= bounds.top &&
      top <= bounds.bottom
    );
  }

  private isVisibleSetChanged(
    previous: Set<string>,
    next: Set<string>
  ): boolean {
    if (previous.size !== next.size) return true;
    for (const id of next) {
      if (!previous.has(id)) return true;
    }
    return false;
  }

  private getViewportCenter(): Position {
    const rect = this.mindmapContainerEl?.getBoundingClientRect();
    const width = rect?.width ?? 800;
    const height = rect?.height ?? 600;
    return { x: width / 2, y: height / 2 };
  }

  private computeRadialPositions(
    snapshot: StateSnapshot,
    center: Position,
    layoutDirection: LayoutDirection,
    options: { scope: "all" | "subtree"; rootId?: string }
  ): Map<string, Position> {
    const positions = new Map<string, Position>();
    if (snapshot.nodes.length === 0) {
      return positions;
    }

    const nodeById = new Map<string, MindMapNode>();
    const childrenByParent = new Map<string | null, MindMapNode[]>();

    for (const node of snapshot.nodes) {
      nodeById.set(node.id, node);
      const list = childrenByParent.get(node.parentId) ?? [];
      list.push(node);
      childrenByParent.set(node.parentId, list);
    }

    const rootId =
      options.scope === "subtree" && options.rootId
        ? options.rootId
        : (snapshot.rootId &&
            nodeById.has(snapshot.rootId) &&
            snapshot.rootId) ||
          snapshot.nodes.find((node) => node.parentId === null)?.id ||
          snapshot.nodes[0].id;

    const targetNodes =
      options.scope === "subtree" && options.rootId
        ? this.collectSubtreeNodeIds(options.rootId, childrenByParent)
        : null;

    const rootNode = nodeById.get(rootId);
    const rootPosition = rootNode?.userPosition ? rootNode.position : center;
    if (!rootNode?.userPosition) {
      positions.set(rootId, rootPosition);
    }

    const angleRange = this.getAngleRange(layoutDirection);
    this.layoutSubtree(
      rootId,
      1,
      angleRange.start,
      angleRange.end,
      rootPosition,
      positions,
      childrenByParent,
      targetNodes
    );

    return positions;
  }

  private layoutSubtree(
    nodeId: string,
    depth: number,
    startAngle: number,
    endAngle: number,
    parentPosition: Position,
    positions: Map<string, Position>,
    childrenByParent: Map<string | null, MindMapNode[]>,
    targetNodes: Set<string> | null
  ): void {
    const children = childrenByParent.get(nodeId) ?? [];
    if (children.length === 0) {
      return;
    }

    const span = endAngle - startAngle;
    const step = Math.max(
      span / Math.max(children.length, 1),
      this.minAngleGap
    );
    let angle = startAngle + step / 2;
    const radius = this.getRadiusForDepth(depth);

    for (const child of children) {
      if (targetNodes && !targetNodes.has(child.id)) {
        angle += step;
        continue;
      }

      const position = child.userPosition
        ? child.position
        : this.calculatePosition(parentPosition, radius, angle);

      if (!child.userPosition) {
        positions.set(child.id, position);
      }

      this.layoutSubtree(
        child.id,
        depth + 1,
        angle - step / 2,
        angle + step / 2,
        position,
        positions,
        childrenByParent,
        targetNodes
      );

      angle += step;
    }
  }

  private getRadiusForDepth(depth: number): number {
    return this.baseRadius + (depth - 1) * this.depthGap;
  }

  private getAngleRange(layoutDirection: LayoutDirection): {
    start: number;
    end: number;
  } {
    switch (layoutDirection) {
      case "horizontal":
        return { start: -90, end: 90 };
      case "vertical":
        return { start: 0, end: 180 };
      case "radial":
      default:
        return { start: 0, end: 360 };
    }
  }

  private calculatePosition(
    origin: Position,
    radius: number,
    angle: number
  ): Position {
    const rad = (angle * Math.PI) / 180;
    return {
      x: origin.x + Math.cos(rad) * radius,
      y: origin.y + Math.sin(rad) * radius,
    };
  }

  private collectSubtreeNodeIds(
    rootId: string,
    childrenByParent: Map<string | null, MindMapNode[]>
  ): Set<string> {
    const result = new Set<string>();
    const stack = [rootId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      if (result.has(current)) continue;
      result.add(current);
      const children = childrenByParent.get(current) ?? [];
      for (const child of children) {
        stack.push(child.id);
      }
    }

    return result;
  }

  /**
   * Phase 3.1: 단축키 등록
   *
   * 책임:
   * - Ctrl/Cmd + Z → Undo
   * - 이벤트 전파 방지
   *
   * 비책임:
   * - Redo (Shift + Ctrl/Cmd + Z 금지)
   */
  private registerShortcuts(): void {
    this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
      // Ctrl/Cmd + Z (Undo만 허용, Shift 없음)
      if ((evt.ctrlKey || evt.metaKey) && evt.key === "z" && !evt.shiftKey) {
        evt.preventDefault();
        this.handleUndo();
      }
    });
  }

  /**
   * Phase 3.3: 캔버스 이벤트 등록
   *
   * 책임:
   * - SVG 캔버스 더블클릭 이벤트 등록
   * - 더블클릭 위치에 노드 생성
   *
   * 비책임:
   * - 렌더링 (Renderer 책임)
   * - 이벤트 발행 (StateManager 책임)
   */
  private registerCanvasEvents(): void {
    const target = this.renderSurfaceEl ?? this.mindmapContainerEl;
    if (!target) {
      console.warn("Render surface not initialized");
      return;
    }

    target.addEventListener("dblclick", (evt: Event) => {
      if (evt instanceof MouseEvent) {
        this.handleCanvasDoubleClick(evt);
      }
    });
  }

  /**
   * Phase 3.3: 캔버스 더블클릭 처리 (실제 사용자 액션)
   *
   * 책임:
   * - 더블클릭 위치 계산
   * - MindMapNode 생성
   * - CreateNodeCommand로 래핑
   * - historyManager.execute() 호출
   *
   * 비책임:
   * - StateManager 직접 조작
   * - 렌더링 (Renderer 책임)
   */
  private handleCanvasDoubleClick(evt: MouseEvent): void {
    if (!this.historyManager || !this.mindmapContainerEl) {
      console.warn("HistoryManager or render container not initialized");
      return;
    }

    // 클릭 위치 계산 (SVG 좌표계)
    const rect = this.mindmapContainerEl.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    // 노드 ID 생성 (UUID 기반)
    const nodeId = crypto.randomUUID();

    // 노드 생성
    const newNode: MindMapNode = {
      id: nodeId,
      content: "New Node",
      position: { x, y },
      userPosition: true,
      parentId: null,
      childIds: [],
      direction: null,
      isPinned: false,
      isCollapsed: false,
      linkedNotePath: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // CreateNodeCommand 사용
    const command = new CreateNodeCommand(newNode);

    try {
      // historyManager.execute() → StateManager.apply() → commandQueue.push()
      const snapshot = this.historyManager.execute(command);
      console.log("Node created at position:", {
        x,
        y,
        nodeId,
        canUndo: this.historyManager.canUndo(),
      });

      // Phase 3.4: 렌더링
      this.renderSnapshot(snapshot);

      // Undo 버튼 활성화
      this.updateUndoButton();
    } catch (error) {
      console.error("Failed to create node:", error);
    }
  }

  /**
   * Phase 1 환영 메시지
   */
  private renderWelcomeMessage(): void {
    const SVG_NS = "http://www.w3.org/2000/svg";

    const surface = this.renderSurfaceEl;
    if (!(surface instanceof SVGSVGElement)) return;

    const nodeLayer = surface.querySelector("#node-layer");
    if (!nodeLayer) return;

    // 간단한 환영 노드 생성
    const containerRect = this.mindmapContainerEl?.getBoundingClientRect();
    const centerX = (containerRect?.width || 800) / 2;
    const centerY = (containerRect?.height || 600) / 2;

    // 노드 그룹
    const nodeGroup = document.createElementNS(SVG_NS, "g");
    nodeGroup.setAttribute("transform", `translate(${centerX}, ${centerY})`);

    // 노드 배경 (Glassmorphism 스타일)
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", "-100");
    rect.setAttribute("y", "-20");
    rect.setAttribute("width", "200");
    rect.setAttribute("height", "40");
    rect.setAttribute("rx", "12");
    rect.setAttribute("fill", "rgba(255, 255, 255, 0.72)");
    rect.setAttribute("stroke", "rgba(0, 0, 0, 0.08)");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("filter", "url(#glass-blur)");

    // 텍스트
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "5");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute(
      "font-family",
      "-apple-system, BlinkMacSystemFont, sans-serif"
    );
    text.setAttribute("font-size", "14");
    text.setAttribute("fill", "#1d1d1f");
    text.textContent = "Welcome to NeroMind";

    nodeGroup.appendChild(rect);
    nodeGroup.appendChild(text);
    nodeLayer.appendChild(nodeGroup);

    // Glassmorphism 필터 정의
    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "glass-blur");
    const feGaussianBlur = document.createElementNS(SVG_NS, "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "10");
    filter.appendChild(feGaussianBlur);
    defs.appendChild(filter);
    surface.insertBefore(defs, surface.firstChild);
  }

  /**
   * 뷰 닫기
   *
   * Phase 3.1 주의사항:
   * - disposables 배열이 StateManager, HistoryManager, Renderer 자동 정리
   * - 역순으로 destroy 호출
   * - null 설정으로 메모리 누수 방지
   */
  async onClose(): Promise<void> {
    console.log("Closing NeroMind view...");

    // 역순으로 dispose
    const disposablesToDestroy = [...this.disposables].reverse();
    for (const disposable of disposablesToDestroy) {
      try {
        disposable.destroy();
      } catch (error) {
        console.error("Error destroying disposable in view:", error);
      }
    }
    this.disposables = [];

    this.destroyRenderer();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Phase 3.1: 참조 정리
    this.stateManager = null;
    this.historyManager = null;
    this.eventBus = null;
    this.renderer = null;
    this.rendererType = null;
    this.renderSurfaceEl = null;
    this.undoButtonEl = null;
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    for (const unsubscribe of this.eventUnsubscribers) {
      unsubscribe();
    }
    this.eventUnsubscribers.length = 0;
    for (const unsubscribe of this.viewportUnsubscribers) {
      unsubscribe();
    }
    this.viewportUnsubscribers.length = 0;
    this.currentSettings = null;
    this.lastSnapshot = null;
    this.visibleNodeIds.clear();
    this.forcedVisibleNodeIds.clear();
  }

  /**
   * Disposable 추가
   */
  addDisposable(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  /**
   * Phase 10: Initialize default data
   *
   * Per CentralRoot_LeftRightLayout.md: Root node is the "foundation of the map"
   * and should not be deletable via Undo. We create it directly in state without
   * going through history.
   */
  private initializeDefaultData(): void {
    if (!this.stateManager || !this.historyManager) {
      console.error(
        "[initializeDefaultData] StateManager or HistoryManager not initialized!"
      );
      return;
    }

    const snapshot = this.stateManager.getSnapshot();
    console.log("[initializeDefaultData] Current state:", {
      nodeCount: snapshot.nodes.length,
      rootId: snapshot.rootId,
    });

    if (snapshot.nodes.length > 0) {
      console.log("[initializeDefaultData] Data already exists, rendering...");
      this.renderSnapshot(snapshot);
      return;
    }

    console.log("[initializeDefaultData] Creating permanent root node...");

    const center = this.getViewportCenter();

    const rootNode: MindMapNode = {
      id: "root", // Fixed ID for consistency
      content: "Central Topic",
      position: center,
      userPosition: false, // Allow auto-layout
      parentId: null,
      childIds: [],
      direction: null,
      isPinned: false,
      isCollapsed: false,
      linkedNotePath: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      console.log(
        "[initializeDefaultData] Creating root node (bypassing history)..."
      );

      // Create root node directly in state WITHOUT going through history
      // This makes it permanent and not subject to Undo
      this.stateManager.addNode(rootNode);

      const newSnapshot = this.stateManager.getSnapshot();
      console.log("[initializeDefaultData] Root node created:", {
        nodeCount: newSnapshot.nodes.length,
        rootId: newSnapshot.rootId,
        rootPosition: rootNode.position,
        canUndo: this.historyManager.canUndo(), // Should be false
      });

      this.renderSnapshot(newSnapshot);
      this.updateUndoButton();
      console.log(
        "[initializeDefaultData] Initialization complete! Root is permanent."
      );
    } catch (error) {
      console.error("[initializeDefaultData] Failed to initialize:", error);
    }
  }

  /**
   * Phase 11: Setup FAB Toolbar
   * Author: Nero-kk (https://github.com/Nero-kk)
   * Blog: http://nero-k.tistory.com
   */
  private setupFabToolbar(): void {
    console.log("🚀 Attempting to render FAB Toolbar...");

    if (!this.containerEl) {
      console.error("❌ FAB Toolbar: containerEl is null!");
      return;
    }

    // Main FAB button with inline styles
    this.fabMainEl = this.containerEl.createDiv({ cls: "neromind-fab-main" });
    this.fabMainEl.style.position = "fixed";
    this.fabMainEl.style.top = "16px";
    this.fabMainEl.style.left = "16px";
    this.fabMainEl.style.width = "36px";
    this.fabMainEl.style.height = "36px";
    this.fabMainEl.style.zIndex = "99999";
    this.fabMainEl.style.display = "flex";
    this.fabMainEl.style.alignItems = "center";
    this.fabMainEl.style.justifyContent = "center";
    this.fabMainEl.style.borderRadius = "8px";
    this.fabMainEl.style.background = "rgba(255, 255, 255, 0.95)";
    this.fabMainEl.style.border = "1px solid rgba(0, 0, 0, 0.08)";
    this.fabMainEl.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.12)";
    this.fabMainEl.style.cursor = "pointer";

    this.fabMainEl.innerHTML = `
      <svg class="neromind-fab-main-icon" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
        <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    // FAB menu with inline styles
    this.fabMenuEl = this.containerEl.createDiv({ cls: "neromind-fab-menu" });
    this.fabMenuEl.style.position = "fixed";
    this.fabMenuEl.style.top = "116px";
    this.fabMenuEl.style.left = "20px";
    this.fabMenuEl.style.zIndex = "99998";
    this.fabMenuEl.style.display = "flex";
    this.fabMenuEl.style.flexDirection = "column";
    this.fabMenuEl.style.gap = "4px";
    this.fabMenuEl.style.borderRadius = "12px";
    this.fabMenuEl.style.padding = "8px";
    this.fabMenuEl.style.background = "rgba(30, 30, 30, 0.92)";
    this.fabMenuEl.style.opacity = "0";
    this.fabMenuEl.style.pointerEvents = "none";
    this.fabMenuEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    // Undo button
    this.fabUndoBtn = this.fabMenuEl.createDiv({
      cls: "neromind-fab-item disabled",
    });
    this.fabUndoBtn.style.width = "40px";
    this.fabUndoBtn.style.height = "40px";
    this.fabUndoBtn.style.display = "flex";
    this.fabUndoBtn.style.alignItems = "center";
    this.fabUndoBtn.style.justifyContent = "center";
    this.fabUndoBtn.style.cursor = "pointer";
    this.fabUndoBtn.style.borderRadius = "8px";

    this.fabUndoBtn.innerHTML = `
      <svg class="neromind-fab-item-icon" viewBox="0 0 24 24" style="width: 20px; height: 20px; stroke: white;">
        <path d="M3 7v6h6M3 13a9 9 0 1 0 2-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;

    // Redo button
    this.fabRedoBtn = this.fabMenuEl.createDiv({
      cls: "neromind-fab-item disabled",
    });
    this.fabRedoBtn.style.width = "40px";
    this.fabRedoBtn.style.height = "40px";
    this.fabRedoBtn.style.display = "flex";
    this.fabRedoBtn.style.alignItems = "center";
    this.fabRedoBtn.style.justifyContent = "center";
    this.fabRedoBtn.style.cursor = "pointer";
    this.fabRedoBtn.style.borderRadius = "8px";

    this.fabRedoBtn.innerHTML = `
      <svg class="neromind-fab-item-icon" viewBox="0 0 24 24" style="width: 20px; height: 20px; stroke: white;">
        <path d="M21 7v6h-6M21 13a9 9 0 1 1-2-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    `;

    // Events
    this.fabMainEl.addEventListener("click", () => this.toggleFabMenu());
    this.fabUndoBtn.addEventListener("click", () => this.handleFabUndo());
    this.fabRedoBtn.addEventListener("click", () => this.handleFabRedo());

    console.log("✅ FAB Toolbar created successfully!", {
      mainButton: this.fabMainEl,
      menu: this.fabMenuEl,
      undoBtn: this.fabUndoBtn,
      redoBtn: this.fabRedoBtn,
    });
  }

  private toggleFabMenu(): void {
    this.isToolbarExpanded = !this.isToolbarExpanded;

    if (this.isToolbarExpanded) {
      this.fabMainEl!.style.width = "240px"; // Expanded width for 6 icons
      console.log("[FAB] Expanded");
    } else {
      this.fabMainEl!.style.width = "40px"; // Collapsed width (menu icon only)
      console.log("[FAB] Collapsed");
    }
  }

  private handleFabUndo(): void {
    if (!this.historyManager?.canUndo()) return;
    try {
      const snapshot = this.historyManager.undo();
      this.renderSnapshot(snapshot);
      this.updateFabButtons();
    } catch (error) {
      console.error("[FAB] Undo failed:", error);
    }
  }

  private handleFabRedo(): void {
    // TODO: Redo functionality not yet implemented in HistoryManager
    console.log("[FAB] Redo not yet implemented");
  }

  private updateFabButtons(): void {
    if (!this.historyManager) return;

    if (this.historyManager.canUndo()) {
      this.fabUndoBtn?.removeClass("disabled");
    } else {
      this.fabUndoBtn?.addClass("disabled");
    }

    // Redo always disabled for now
    this.fabRedoBtn?.addClass("disabled");
  }
}
