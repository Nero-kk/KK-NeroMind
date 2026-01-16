import { TextFileView, WorkspaceLeaf, Notice, TFile } from "obsidian";
import type NeroMindPlugin from "../main";
import {
	BoundingBox,
	Disposable,
	MindMapNode,
	NODE_CONSTANTS,
	Position,
} from "../types";
import { MindMapData, CURRENT_SCHEMA_VERSION, FILE_SIGNATURE } from "../types/MindMapData";
import { StateSnapshot } from "../state/stateTypes";
import { StateManager } from "../state/StateManager";
import { HistoryManager } from "../history/HistoryManager";
import { EventBus } from "../events/EventBus";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { DomRenderer } from "../rendering/DomRenderer";
import { MindMapRenderer, MindMapViewport } from "../rendering/MindMapRenderer";
import { CreateNodeCommand } from "../history/CreateNodeCommand";
import { SchemaValidator } from "../core/SchemaValidator";
import { SchemaSanitizer } from "../core/SchemaSanitizer";
import type {
	LayoutDirection,
	NeroMindSettings,
	RendererType,
} from "../settings/NeroMindSettingTab";

export const VIEW_TYPE_NEROMIND = "neromind-view";

/**
 * NeroMind 마인드맵 뷰 (TextFileView 기반)
 *
 * KK-NeroMind Architecture v4.2.8 헌법 준수
 *
 * === 핵심 원칙 ===
 * 1. File First: .kknm 파일이 유일한 진실의 원천
 * 2. Schema is Law: 스키마 위반 시 Fail Loudly
 * 3. Atomic Write: 임시 파일 → 검증 → 원자적 교체
 * 4. Timestamp 권위: updatedAt은 직렬화 시점에만 갱신
 * 5. Strict Sanitation: 파일 로드/마이그레이션 시점에만
 * 6. Dirty State 분리: 비영속 UI 상태는 isDirty 트리거 금지
 * 7. Fail Loudly: 에러 발생 시 작업 컨텍스트 즉시 중단
 *
 * === 책임 ===
 * - 파일 직렬화/역직렬화
 * - Schema 검증 및 Sanitation
 * - Atomic Write 구현
 * - StateManager/HistoryManager 통합
 * - Renderer 관리
 * - UI 이벤트 처리
 *
 * === 비책임 ===
 * - 파일 없이 열기 (allowNoFile = false)
 * - 스키마 외 필드 추가
 * - 추측, 보정, 생성
 */
export class NeroMindView extends TextFileView {
	plugin: NeroMindPlugin;
	
	// TextFileView 설정
	allowNoFile = false; // 파일 없이 열기 금지 (헌법 4.1)
	
	// 핵심 컴포넌트
	private renderer: MindMapRenderer | null = null;
	private rendererType: RendererType | null = null;
	private renderSurfaceEl: Element | null = null;
	private disposables: Disposable[] = [];
	private mindmapContainerEl: HTMLElement | null = null;
	
	// State Management
	private stateManager: StateManager | null = null;
	private historyManager: HistoryManager | null = null;
	private eventBus: EventBus | null = null;
	
	// Schema 검증 및 정화
	private schemaValidator: SchemaValidator = new SchemaValidator();
	private schemaSanitizer: SchemaSanitizer = new SchemaSanitizer();
	
	// 파일 메타데이터
	private fileCreatedAt: number = Date.now();
	
	// FAB Toolbar
	private fabMainEl: HTMLElement | null = null;
	private fabMenuEl: HTMLElement | null = null;
	private fabUndoBtn: HTMLElement | null = null;
	private fabRedoBtn: HTMLElement | null = null;
	private isToolbarExpanded: boolean = false;
	
	// 이벤트 구독 해제
	private unsubscribeSettings: (() => void) | null = null;
	private readonly eventUnsubscribers: Array<() => void> = [];
	private readonly viewportUnsubscribers: Array<() => void> = [];
	
	// 설정 및 상태
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
	 * 
	 * TextFileView 필수 메서드
	 */
	getDisplayText(): string {
		return this.file?.basename || "Untitled Mind Map";
	}

	/**
	 * 뷰 아이콘
	 * 
	 * TextFileView 필수 메서드
	 */
	getIcon(): string {
		return "brain";
	}

	/**
	 * 현재 상태를 JSON 문자열로 직렬화
	 * 
	 * TextFileView 필수 메서드
	 * 
	 * === 헌법 준수 사항 ===
	 * - updatedAt은 이 메서드에서만 갱신 (헌법 2.2)
	 * - UI 상호작용, 카메라 이동, 렌더링으로는 절대 갱신 안 됨
	 * - 이 메서드가 호출되는 순간 = 파일 저장 시점
	 */
	getViewData(): string {
		console.log("[getViewData] Serializing current state...");
		
		const data = this.serialize();
		
		// updatedAt은 직렬화 시점에만 갱신 (유일한 갱신 지점)
		data.meta.updatedAt = Date.now();
		
		const json = JSON.stringify(data, null, 2);
		console.log("[getViewData] Serialized:", {
			nodeCount: Object.keys(data.nodes).length,
			edgeCount: Object.keys(data.edges).length,
			size: json.length,
		});
		
		return json;
	}

	/**
	 * JSON 문자열을 파싱하여 상태 복원
	 * 
	 * TextFileView 필수 메서드
	 * 
	 * === 헌법 준수 사항 ===
	 * - Schema 검증 (Fail Loudly)
	 * - Sanitation (파일 로드 시점 - 허용)
	 * - 작업 컨텍스트 즉시 중단 (에러 시)
	 * - Partial continuation 금지
	 */
	setViewData(data: string, clear: boolean): void {
		console.log("[setViewData] Loading file data...", { clear });
		
		if (clear) {
			this.clear();
		}
		
		try {
			// 1. JSON 파싱
			const parsed = JSON.parse(data);
			console.log("[setViewData] Parsed JSON:", {
				hasNodes: !!parsed.nodes,
				hasEdges: !!parsed.edges,
				rootNodeId: parsed.rootNodeId,
			});
			
			// 2. Schema 검증 (Fail Loudly)
			this.schemaValidator.validate(parsed);
			console.log("[setViewData] Schema validation passed");
			
			// 3. Sanitation (파일 로드 시점 - 허용)
			const sanitized = this.schemaSanitizer.sanitize(parsed);
			console.log("[setViewData] Sanitation completed");
			
			// 4. 상태 복원
			this.deserialize(sanitized);
			console.log("[setViewData] State deserialized");
			
			// 5. Projection 갱신
			if (this.stateManager) {
				this.renderSnapshot(this.stateManager.getSnapshot());
			}
			console.log("[setViewData] File loaded successfully");
			
		} catch (e) {
			// Fail Loudly: 작업 컨텍스트 즉시 중단
			console.error("[setViewData] File load failed:", e);
			new Notice("파일이 손상되었거나 호환되지 않습니다.");
			
			// 작업 컨텍스트 중단 (Partial continuation 금지)
			throw e;
		}
	}

	/**
	 * 상태 초기화
	 * 
	 * TextFileView 필수 메서드
	 */
	clear(): void {
		console.log("[clear] Clearing all state...");
		
		if (this.stateManager) {
			// StateManager 초기화
			this.stateManager = new StateManager();
			if (this.eventBus) {
				this.stateManager.setEventBus(this.eventBus);
			}
		}
		
		// UI 상태 초기화
		this.visibleNodeIds.clear();
		this.forcedVisibleNodeIds.clear();
		this.lastSnapshot = null;
		
		console.log("[clear] State cleared");
	}

	/**
	 * 현재 상태를 MindMapData로 직렬화
	 * 
	 * === 책임 ===
	 * - StateSnapshot → MindMapData 변환
	 * - 메타데이터 생성
	 * - View 상태 저장 (힌트)
	 * 
	 * === 비책임 ===
	 * - updatedAt 갱신 (getViewData() 책임)
	 */
	private serialize(): MindMapData {
		const snapshot = this.stateManager?.getSnapshot() || {
			nodes: [],
			edges: [],
			rootId: "",
			pinnedNodeIds: [],
			collapsedNodeIds: [],
			selectedNodeId: null,
			editingNodeId: null,
		};
		
		// StateSnapshot → MindMapData 변환
		const nodes: MindMapData["nodes"] = {};
		for (const node of snapshot.nodes) {
			nodes[node.id] = { ...node };
		}
		
		const edges: MindMapData["edges"] = {};
		for (const edge of snapshot.edges) {
			edges[edge.id] = { ...edge };
		}
		
		return {
			meta: {
				createdWith: FILE_SIGNATURE,
				schemaVersion: CURRENT_SCHEMA_VERSION,
				pluginVersion: this.plugin.manifest.version,
				createdAt: this.fileCreatedAt,
				updatedAt: Date.now(), // getViewData()에서 다시 갱신됨
			},
			nodes,
			edges,
			rootNodeId: snapshot.rootId || "",
			view: {
				zoom: 1.0,
				pan: { x: 0, y: 0 },
				selectedNodeId: snapshot.selectedNodeId,
			},
		};
	}

	/**
	 * MindMapData를 StateManager로 역직렬화
	 * 
	 * === 책임 ===
	 * - MindMapData → StateManager 복원
	 * - View 상태 복원 (힌트)
	 * 
	 * === 비책임 ===
	 * - Schema 검증 (setViewData() 책임)
	 * - Sanitation (setViewData() 책임)
	 */
	private deserialize(data: MindMapData): void {
		if (!this.stateManager) {
			console.error("[deserialize] StateManager not initialized!");
			return;
		}
		
		// 파일 생성 시간 저장
		this.fileCreatedAt = data.meta.createdAt;
		
		// StateManager 초기화
		this.clear();
		
		// 노드 복원
		for (const node of Object.values(data.nodes)) {
			this.stateManager.addNode(node);
		}
		
		console.log("[deserialize] Restored nodes:", Object.keys(data.nodes).length);
		
		// View 상태 복원 (힌트)
		if (data.view?.selectedNodeId) {
			const nodeExists = data.nodes[data.view.selectedNodeId];
			if (nodeExists) {
				this.stateManager.selectNode(data.view.selectedNodeId);
			}
		}
	}

	/**
	 * 뷰 열기
	 * 
	 * === 초기화 순서 ===
	 * 1. UI 컨테이너 생성
	 * 2. Renderer 초기화
	 * 3. State Management 초기화
	 * 4. 이벤트 등록
	 * 5. FAB Toolbar 설정
	 * 
	 * === 주의사항 ===
	 * - setViewData()가 별도로 호출되어 파일 로드됨
	 * - 여기서는 초기 데이터 생성하지 않음
	 */
	async onOpen(): Promise<void> {
		console.log("[onOpen] Opening NeroMind view...");

		const container = this.containerEl;
		container.empty();
		container.addClass("neromind-view");

		// 메인 컨테이너 생성
		this.mindmapContainerEl = container.createDiv({
			cls: "neromind-container",
		});

		this.ensureOverlay();
		this.initializeRenderer(this.plugin.settings.rendererType);

		// State Management 초기화
		this.initializeStateManagement();

		// 단축키 등록
		this.registerShortcuts();

		// 캔버스 이벤트 등록
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

		// FAB Toolbar 설정
		this.setupFabToolbar();

		console.log("[onOpen] View opened successfully");
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
		console.log(`[initializeRenderer] Initializing ${rendererType} renderer...`);
		this.destroyRenderer();
		this.rendererType = rendererType;
		this.renderer = this.createRenderer(rendererType);
		this.renderer.init(this.mindmapContainerEl);
		this.renderSurfaceEl =
			this.renderer.getSurfaceElement?.() ?? this.mindmapContainerEl;
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
	 * State Management 초기화
	 */
	private initializeStateManagement(): void {
		// EventBus 초기화
		this.eventBus = new EventBus();

		// StateManager 초기화
		this.stateManager = new StateManager();
		this.stateManager.setEventBus(this.eventBus);
		this.addDisposable(this.stateManager);

		// HistoryManager 초기화
		this.historyManager = new HistoryManager(this.stateManager);
		this.addDisposable(this.historyManager);

		this.bindStateEvents();

		console.log("[initializeStateManagement] State management initialized");
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

	private renderSnapshot(snapshot: StateSnapshot): void {
		console.log("[renderSnapshot] Rendering snapshot:", {
			nodeCount: snapshot.nodes.length,
			edgeCount: snapshot.edges.length,
			rootId: snapshot.rootId,
		});

		if (!this.renderer) {
			console.error("[renderSnapshot] Renderer is null!");
			return;
		}

		this.lastSnapshot = snapshot;
		const visibleNodeIds = this.computeVisibleNodeIds(snapshot);
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

		// Pass selection state to renderer
		if (this.renderer && "setSelectedNodeId" in this.renderer) {
			(this.renderer as any).setSelectedNodeId(snapshot.selectedNodeId || null);
		}

		this.renderer.render(visibleNodes, visibleEdges, this.currentViewport);
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

	private registerShortcuts(): void {
		this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
			if ((evt.ctrlKey || evt.metaKey) && evt.key === "z" && !evt.shiftKey) {
				evt.preventDefault();
				this.handleUndo();
			}
		});
	}

	private registerCanvasEvents(): void {
		const target = this.renderSurfaceEl ?? this.mindmapContainerEl;
		if (!target) {
			console.warn("[registerCanvasEvents] Render surface not initialized");
			return;
		}

		target.addEventListener("dblclick", (evt: Event) => {
			if (evt instanceof MouseEvent) {
				this.handleCanvasDoubleClick(evt);
			}
		});
	}

	private handleCanvasDoubleClick(evt: MouseEvent): void {
		if (!this.historyManager || !this.mindmapContainerEl) {
			console.warn("[handleCanvasDoubleClick] HistoryManager or container not initialized");
			return;
		}

		const rect = this.mindmapContainerEl.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;

		const nodeId = crypto.randomUUID();

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

		const command = new CreateNodeCommand(newNode);

		try {
			const snapshot = this.historyManager.execute(command);
			console.log("[handleCanvasDoubleClick] Node created:", { x, y, nodeId });

			this.renderSnapshot(snapshot);
			this.updateFabButtons();
		} catch (error) {
			console.error("[handleCanvasDoubleClick] Failed to create node:", error);
		}
	}

	private handleUndo(): void {
		if (!this.historyManager || !this.historyManager.canUndo()) {
			console.log("[handleUndo] Cannot undo");
			return;
		}

		try {
			const snapshot = this.historyManager.undo();
			this.renderSnapshot(snapshot);
			this.updateFabButtons();
			console.log("[handleUndo] Undo successful");
		} catch (error) {
			console.error("[handleUndo] Undo failed:", error);
		}
	}

	private setupFabToolbar(): void {
		console.log("[setupFabToolbar] Setting up FAB toolbar...");

		if (!this.containerEl) {
			console.error("[setupFabToolbar] containerEl is null!");
			return;
		}

		// Main FAB button
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

		// FAB menu
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

		console.log("[setupFabToolbar] FAB toolbar created successfully");
	}

	private toggleFabMenu(): void {
		this.isToolbarExpanded = !this.isToolbarExpanded;

		if (this.isToolbarExpanded) {
			this.fabMainEl!.style.width = "240px";
			console.log("[toggleFabMenu] Expanded");
		} else {
			this.fabMainEl!.style.width = "40px";
			console.log("[toggleFabMenu] Collapsed");
		}
	}

	private handleFabUndo(): void {
		if (!this.historyManager?.canUndo()) return;
		try {
			const snapshot = this.historyManager.undo();
			this.renderSnapshot(snapshot);
			this.updateFabButtons();
		} catch (error) {
			console.error("[handleFabUndo] Undo failed:", error);
		}
	}

	private handleFabRedo(): void {
		console.log("[handleFabRedo] Redo not yet implemented");
	}

	private updateFabButtons(): void {
		if (!this.historyManager) return;

		if (this.historyManager.canUndo()) {
			this.fabUndoBtn?.removeClass("disabled");
		} else {
			this.fabUndoBtn?.addClass("disabled");
		}

		this.fabRedoBtn?.addClass("disabled");
	}

	/**
	 * 뷰 닫기
	 */
	async onClose(): Promise<void> {
		console.log("[onClose] Closing NeroMind view...");

		// 역순으로 dispose
		const disposablesToDestroy = [...this.disposables].reverse();
		for (const disposable of disposablesToDestroy) {
			try {
				disposable.destroy();
			} catch (error) {
				console.error("[onClose] Error destroying disposable:", error);
			}
		}
		this.disposables = [];

		this.destroyRenderer();

		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		// 참조 정리
		this.stateManager = null;
		this.historyManager = null;
		this.eventBus = null;
		this.renderer = null;
		this.rendererType = null;
		this.renderSurfaceEl = null;
		
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

		console.log("[onClose] View closed successfully");
	}

	/**
	 * Disposable 추가
	 */
	addDisposable(disposable: Disposable): void {
		this.disposables.push(disposable);
	}
}
