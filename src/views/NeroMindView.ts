import { ItemView, WorkspaceLeaf } from 'obsidian';
import type NeroMindPlugin from '../main';
import { Disposable } from '../types';

export const VIEW_TYPE_NEROMIND = 'neromind-view';

/**
 * NeroMind 마인드맵 뷰
 *
 * Phase 1: 기본 뷰 골격 및 SVG 캔버스 초기화
 * Phase 2+: 노드 생성, 인터랙션, 렌더링 등 추가
 *
 * 주의사항:
 * - DOM 조작은 onOpen() 이후에만 수행
 * - 모든 리소스는 onClose()에서 정리
 */
export class NeroMindView extends ItemView {
	plugin: NeroMindPlugin;
	private svgElement: SVGSVGElement | null = null;
	private disposables: Disposable[] = [];
	private mindmapContainerEl: HTMLElement | null = null;

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
	 * Phase 1 주의사항:
	 * - SVG 요소는 createElementNS 사용
	 * - 좌표계 초기화 (Screen/Canvas/World 구분)
	 * - 루트노드는 화면 중앙에 배치
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

		// Phase 1: 기본 환영 메시지
		this.renderWelcomeMessage();

		// Phase 2+: Renderer, StateManager 등 초기화
		// this.initializeRenderers();
		// this.initializeStateManager();
	}

	/**
	 * SVG 캔버스 초기화
	 *
	 * Phase 1 주의사항:
	 * - SVG_NS 네임스페이스 사용 필수
	 * - 뷰포트 설정 (viewBox)
	 * - 줌/팬 준비 (transform group)
	 */
	private initializeSVGCanvas(): void {
		const SVG_NS = 'http://www.w3.org/2000/svg';

		// SVG 루트 요소 생성
		this.svgElement = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
		this.svgElement.setAttribute('class', 'neromind-canvas');
		this.svgElement.setAttribute('width', '100%');
		this.svgElement.setAttribute('height', '100%');

		// 뷰포트 초기 설정
		const containerRect = this.mindmapContainerEl?.getBoundingClientRect();
		const viewBoxWidth = containerRect?.width || 800;
		const viewBoxHeight = containerRect?.height || 600;
		this.svgElement.setAttribute(
			'viewBox',
			`0 0 ${viewBoxWidth} ${viewBoxHeight}`
		);

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
	 * Phase 1 환영 메시지
	 */
	private renderWelcomeMessage(): void {
		const SVG_NS = 'http://www.w3.org/2000/svg';

		if (!this.svgElement) return;

		const nodeLayer = this.svgElement.querySelector('#node-layer');
		if (!nodeLayer) return;

		// 간단한 환영 노드 생성
		const containerRect = this.mindmapContainerEl?.getBoundingClientRect();
		const centerX = (containerRect?.width || 800) / 2;
		const centerY = (containerRect?.height || 600) / 2;

		// 노드 그룹
		const nodeGroup = document.createElementNS(SVG_NS, 'g');
		nodeGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);

		// 노드 배경 (Glassmorphism 스타일)
		const rect = document.createElementNS(SVG_NS, 'rect');
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
	 * Phase 1 주의사항:
	 * - 모든 disposables 역순 정리
	 * - 이벤트 리스너 제거
	 * - DOM 요소 detach
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
	}

	/**
	 * Disposable 추가
	 */
	addDisposable(disposable: Disposable): void {
		this.disposables.push(disposable);
	}
}
