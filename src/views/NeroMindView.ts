import { ItemView, WorkspaceLeaf } from 'obsidian';
import type NeroMindPlugin from '../main';
import { Disposable, MindMapNode } from '../types';
import { StateSnapshot } from '../state/stateTypes';
import { StateManager } from '../state/StateManager';
import { HistoryManager } from '../history/HistoryManager';
import { EventBus } from '../events/EventBus';
import { Renderer } from '../rendering/Renderer';
import { CreateNodeCommand } from '../history/CreateNodeCommand';

export const VIEW_TYPE_NEROMIND = 'neromind-view';

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
	private svgElement: SVGSVGElement | null = null;
	private disposables: Disposable[] = [];
	private mindmapContainerEl: HTMLElement | null = null;

	// Phase 3.1: State Management
	private stateManager: StateManager | null = null;
	private historyManager: HistoryManager | null = null;
	private eventBus: EventBus | null = null;
	private renderer: Renderer | null = null;

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
		return 'NeroMind';
	}

	/**
	 * 뷰 아이콘
	 */
	getIcon(): string {
		return 'brain';
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
		console.log('Opening NeroMind view...');

		const container = this.containerEl;
		container.empty();
		container.addClass('neromind-view');

		// 메인 컨테이너 생성
		this.mindmapContainerEl = container.createDiv({ cls: 'neromind-container' });

		// SVG 캔버스 초기화
		this.initializeSVGCanvas();

		// Phase 3.1: State Management 초기화
		this.initializeStateManagement();

		// Phase 3.1: Undo 버튼 생성
		this.createUndoButton();

		// Phase 3.1: 단축키 등록
		this.registerShortcuts();

		// Phase 3.3: 캔버스 이벤트 등록 (노드 생성 트리거)
		this.registerCanvasEvents();

		// Phase 1: 기본 환영 메시지
		this.renderWelcomeMessage();
	}

	/**
	 * SVG 캔버스 초기화
	 *
	 * Phase 6.1 수정사항:
	 * - overflow: visible 설정 (clip 방지)
	 * - viewBox 제거 (DOM 좌표계와 일치시킴)
	 * - 줌/팬은 transform-layer로 처리
	 *
	 * Phase 1 주의사항:
	 * - SVG_NS 네임스페이스 사용 필수
	 * - 줌/팬 준비 (transform group)
	 */
	private initializeSVGCanvas(): void {
		const SVG_NS = 'http://www.w3.org/2000/svg';

		// SVG 루트 요소 생성
		this.svgElement = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
		this.svgElement.setAttribute('class', 'neromind-canvas');
		this.svgElement.setAttribute('width', '100%');
		this.svgElement.setAttribute('height', '100%');

		// Phase 6.1: overflow: visible 설정 (y축 하단 clip 방지)
		this.svgElement.style.overflow = 'visible';

		// Phase 6.1: viewBox 제거 (DOM 좌표계와 1:1 매칭)
		// 이전에는 viewBox를 설정했으나, 이는 좌표계 불일치의 원인이었음
		// 제거하면 SVG 좌표계 = DOM 좌표계가 되어 일관성 유지

		// 배경 그룹
		const bgGroup = document.createElementNS(SVG_NS, 'g');
		bgGroup.setAttribute('id', 'background-layer');
		this.svgElement.appendChild(bgGroup);

		// Transform 그룹 (줌/팬용)
		const transformGroup = document.createElementNS(SVG_NS, 'g');
		transformGroup.setAttribute('id', 'transform-layer');
		transformGroup.setAttribute('transform', 'translate(0, 0) scale(1)');
		this.svgElement.appendChild(transformGroup);

		// 엣지 레이어
		const edgeGroup = document.createElementNS(SVG_NS, 'g');
		edgeGroup.setAttribute('id', 'edge-layer');
		transformGroup.appendChild(edgeGroup);

		// 노드 레이어
		const nodeGroup = document.createElementNS(SVG_NS, 'g');
		nodeGroup.setAttribute('id', 'node-layer');
		transformGroup.appendChild(nodeGroup);

		// UI 오버레이 레이어 (HTML)
		if (this.mindmapContainerEl) {
			const overlayDiv = this.mindmapContainerEl.createDiv({
				cls: 'neromind-overlay',
			});
			overlayDiv.style.position = 'absolute';
			overlayDiv.style.top = '0';
			overlayDiv.style.left = '0';
			overlayDiv.style.width = '100%';
			overlayDiv.style.height = '100%';
			overlayDiv.style.pointerEvents = 'none';
		}

		// DOM에 추가
		this.mindmapContainerEl?.appendChild(this.svgElement);
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

		// Renderer 초기화
		if (this.svgElement) {
			this.renderer = new Renderer(this.svgElement);
			// Phase 5: StateManager 주입 (drag 완료 시 moveNode 호출용)
			this.renderer.setStateManager(this.stateManager);
			this.addDisposable(this.renderer);
		}

		console.log('State management initialized');
	}

	/**
	 * Phase 3.1: Undo 버튼 생성
	 *
	 * 책임:
	 * - HTML 버튼 요소 생성
	 * - CSS 클래스 적용 (styles.css의 .neromind-undo-button 사용)
	 * - 클릭 이벤트 연결
	 * - 초기 활성화 상태 설정
	 *
	 * 비책임:
	 * - Undo 로직 실행 (handleUndo 책임)
	 *
	 * z-index 전략:
	 * - Undo 버튼은 overlay 내 배치 (z-index: 20)
	 * - Canvas transform (zoom/pan)에 영향받지 않음
	 * - 노드 렌더링에 가려지지 않음
	 */
	private createUndoButton(): void {
		const overlayEl = this.containerEl.querySelector('.neromind-overlay');
		if (!overlayEl) {
			console.warn('Overlay element not found');
			return;
		}

		// CSS 클래스 사용 (.neromind-undo-button)
		this.undoButtonEl = overlayEl.createEl('button', {
			text: 'Undo',
			cls: 'neromind-undo-button'
		});

		// 클릭 이벤트 연결
		this.undoButtonEl.addEventListener('click', () => this.handleUndo());

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
			console.log('Cannot undo: no history available');
			return;
		}

		try {
			const snapshot = this.historyManager.undo();
			this.renderSnapshot(snapshot);
			this.updateUndoButton();
			console.log('Undo successful');
		} catch (error) {
			console.error('Undo failed:', error);
		}
	}

	/**
	 * Phase 3.1: Undo 버튼 상태 갱신
	 *
	 * 책임:
	 * - canUndo() 결과에 따라 버튼 활성화/비활성화
	 * - CSS :disabled 선택자가 자동으로 스타일 적용
	 *
	 * 비책임:
	 * - Undo 로직 실행
	 * - 스타일 직접 조작 (CSS에 위임)
	 */
	private updateUndoButton(): void {
		if (!this.undoButtonEl || !this.historyManager) {
			return;
		}

		const canUndo = this.historyManager.canUndo();
		this.undoButtonEl.disabled = !canUndo;

		// CSS :disabled 선택자가 자동으로 스타일 적용
		// .neromind-undo-button:disabled { opacity: 0.5; cursor: not-allowed; }
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
		console.log('Rendering snapshot:', {
			nodeCount: snapshot.nodes.length,
			edgeCount: snapshot.edges.length,
			rootId: snapshot.rootId
		});

		// Phase 3.4: Renderer.render(snapshot) 호출
		
		if (this.renderer) {
			this.renderer.render(snapshot);
			
			
		}
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
		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
			// Ctrl/Cmd + Z (Undo만 허용, Shift 없음)
			if ((evt.ctrlKey || evt.metaKey) && evt.key === 'z' && !evt.shiftKey) {
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
		if (!this.svgElement) {
			console.warn('SVG element not initialized');
			return;
		}

		// 더블클릭 이벤트: 클릭 위치에 노드 생성
		// SVGSVGElement는 registerDomEvent의 타입에 포함되지 않으므로 EventTarget 인터페이스 사용
		this.svgElement.addEventListener('dblclick', (evt: Event) => {
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
		if (!this.historyManager || !this.svgElement) {
			console.warn('HistoryManager or SVG element not initialized');
			return;
		}

		// 클릭 위치 계산 (SVG 좌표계)
		const rect = this.svgElement.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;

		// 노드 ID 생성 (타임스탬프 기반)
		const nodeId = `node-${Date.now()}`;

		// 노드 생성
		const newNode: MindMapNode = {
			id: nodeId,
			content: 'New Node',
			position: { x, y },
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
			console.log('[handleCanvasDoubleClick] 노드 생성 - 클릭 위치:', { x, y, nodeId });

			// Phase 3.4: 렌더링
			this.renderSnapshot(snapshot);

			// Undo 버튼 활성화
			this.updateUndoButton();
		} catch (error) {
			console.error('Failed to create node:', error);
		}
	}

	/**
	 * Phase 1 환영 메시지
	 *
	 * Phase 6.1 수정:
	 * - viewBox 제거로 인해 getBoundingClientRect() 사용
	 * - Renderer.getViewportSize()와 동일한 로직
	 * - DOM 좌표계 기준 중앙 계산
	 *
	 * 검증:
	 * ✓ DOM 기준 중앙 계산
	 * ✓ Renderer와 동일한 좌표계 사용
	 */
	private renderWelcomeMessage(): void {
		const SVG_NS = 'http://www.w3.org/2000/svg';

		if (!this.svgElement) return;

		const nodeLayer = this.svgElement.querySelector('#node-layer');
		if (!nodeLayer) return;

		// Phase 6.1: DOM 좌표계 기준 중앙 계산
		const boundingRect = this.svgElement.getBoundingClientRect();
		const centerX = boundingRect.width / 2 || 400; // fallback
		const centerY = boundingRect.height / 2 || 300; // fallback

		console.log('[renderWelcomeMessage] DOM 기준 중앙 계산:', {
			rectWidth: boundingRect.width,
			rectHeight: boundingRect.height,
			centerX,
			centerY
		});

		// 노드 그룹
		const nodeGroup = document.createElementNS(SVG_NS, 'g');
		nodeGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);

		// 노드 배경 (Glassmorphism 스타일)
		const rect = document.createElementNS(SVG_NS, 'rect') as SVGRectElement;
		rect.setAttribute('x', '-100');
		rect.setAttribute('y', '-20');
		rect.setAttribute('width', '200');
		rect.setAttribute('height', '40');
		rect.setAttribute('rx', '12');
		rect.setAttribute('fill', 'rgba(255, 255, 255, 0.72)');
		rect.setAttribute('stroke', 'rgba(0, 0, 0, 0.08)');
		rect.setAttribute('stroke-width', '1');
		rect.setAttribute('filter', 'url(#glass-blur)');

		// 텍스트
		const text = document.createElementNS(SVG_NS, 'text');
		text.setAttribute('x', '0');
		text.setAttribute('y', '5');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
		text.setAttribute('font-size', '14');
		text.setAttribute('fill', '#1d1d1f');
		text.textContent = 'Welcome to NeroMind';

		nodeGroup.appendChild(rect);
		nodeGroup.appendChild(text);
		nodeLayer.appendChild(nodeGroup);

		// Glassmorphism 필터 정의
		const defs = document.createElementNS(SVG_NS, 'defs');
		const filter = document.createElementNS(SVG_NS, 'filter');
		filter.setAttribute('id', 'glass-blur');
		const feGaussianBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
		feGaussianBlur.setAttribute('stdDeviation', '10');
		filter.appendChild(feGaussianBlur);
		defs.appendChild(filter);
		this.svgElement.insertBefore(defs, this.svgElement.firstChild);
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
		console.log('Closing NeroMind view...');

		// 역순으로 dispose
		const disposablesToDestroy = [...this.disposables].reverse();
		for (const disposable of disposablesToDestroy) {
			try {
				disposable.destroy();
			} catch (error) {
				console.error('Error destroying disposable in view:', error);
			}
		}
		this.disposables = [];

		// SVG 요소 정리
		if (this.svgElement) {
			this.svgElement.remove();
			this.svgElement = null;
		}

		// Phase 3.1: 참조 정리
		this.stateManager = null;
		this.historyManager = null;
		this.eventBus = null;
		this.renderer = null;
		this.undoButtonEl = null;
	}

	/**
	 * Disposable 추가
	 */
	addDisposable(disposable: Disposable): void {
		this.disposables.push(disposable);
	}
}
