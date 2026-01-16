/**
 * MindMapView
 * 
 * 책임:
 * - Obsidian ItemView 연동
 * - CameraController 생명주기 관리
 * - 렌더링 stub 제공 (Phase 1 P0)
 * 
 * 비책임:
 * - 노드 상태 관리 (StateManager 담당)
 * - 레이아웃 계산 (AutoAligner 담당)
 * - 이벤트 처리 (InteractionManager 담당)
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { CameraController } from '../camera/CameraController';
import { CameraState, CameraChangeReason } from '../types/camera';

export const VIEW_TYPE_NEROMIND = 'neromind-view';

export class MindMapView extends ItemView {
	private cameraController: CameraController | null = null;
	private svgEl: SVGSVGElement | null = null;
	private transformLayer: SVGGElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
	 * 뷰 열림
	 */
	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('neromind-container');

		// SVG 캔버스 생성
		this.createSVGCanvas(container);

		// CameraController 초기화
		this.cameraController = new CameraController(container);

		// 카메라 변경 콜백 등록
		this.cameraController.onCameraChange((camera) => {
			this.updateTransform(camera);
		});

		// 초기 뷰포트 설정 (중앙 정렬)
		const viewport = this.cameraController.getViewport();
		this.cameraController.applyCameraChange(
			{
				offsetX: viewport.width / 2,
				offsetY: viewport.height / 2,
				scale: 1.0
			},
			CameraChangeReason.InitialViewport
		);

		// 테스트용 stub 렌더링
		this.renderStub();
	}

	/**
	 * SVG 캔버스 생성
	 */
	private createSVGCanvas(container: HTMLElement): void {
		// SVG 루트 요소
		this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this.svgEl.addClass('neromind-canvas');
		this.svgEl.setAttribute('width', '100%');
		this.svgEl.setAttribute('height', '100%');

		// Transform Layer (카메라 적용)
		this.transformLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.transformLayer.setAttribute('id', 'transform-layer');

		this.svgEl.appendChild(this.transformLayer);
		container.appendChild(this.svgEl);
	}

	/**
	 * Transform 업데이트
	 * 
	 * 규칙:
	 * - SVG transform-layer에만 카메라 적용
	 * - 노드 좌표는 월드 좌표 그대로 유지
	 */
	private updateTransform(camera: CameraState): void {
		if (!this.transformLayer) return;

		this.transformLayer.setAttribute(
			'transform',
			`translate(${camera.offsetX}, ${camera.offsetY}) scale(${camera.scale})`
		);
	}

	/**
	 * Stub 렌더링 (Phase 1 P0)
	 * 
	 * 목적:
	 * - CameraController 동작 확인
	 * - 좌표 변환 검증
	 */
	private renderStub(): void {
		if (!this.transformLayer) return;

		// 원점 (0, 0) 표시
		const origin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		origin.setAttribute('cx', '0');
		origin.setAttribute('cy', '0');
		origin.setAttribute('r', '10');
		origin.setAttribute('fill', '#ff3b30');

		// X축 (100px)
		const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		xAxis.setAttribute('x1', '0');
		xAxis.setAttribute('y1', '0');
		xAxis.setAttribute('x2', '100');
		xAxis.setAttribute('y2', '0');
		xAxis.setAttribute('stroke', '#007AFF');
		xAxis.setAttribute('stroke-width', '2');

		// Y축 (100px)
		const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		yAxis.setAttribute('x1', '0');
		yAxis.setAttribute('y1', '0');
		yAxis.setAttribute('x2', '0');
		yAxis.setAttribute('y2', '100');
		yAxis.setAttribute('stroke', '#34C759');
		yAxis.setAttribute('stroke-width', '2');

		// 테스트 노드 (100, 100)
		const testNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		testNode.setAttribute('x', '80');
		testNode.setAttribute('y', '80');
		testNode.setAttribute('width', '40');
		testNode.setAttribute('height', '40');
		testNode.setAttribute('rx', '8');
		testNode.setAttribute('fill', 'rgba(255, 255, 255, 0.72)');
		testNode.setAttribute('stroke', '#007AFF');
		testNode.setAttribute('stroke-width', '2');

		this.transformLayer.appendChild(origin);
		this.transformLayer.appendChild(xAxis);
		this.transformLayer.appendChild(yAxis);
		this.transformLayer.appendChild(testNode);
	}

	/**
	 * 뷰 닫힘
	 */
	async onClose(): Promise<void> {
		// CameraController 정리
		if (this.cameraController) {
			this.cameraController.destroy();
			this.cameraController = null;
		}

		// DOM 정리
		this.svgEl = null;
		this.transformLayer = null;
	}
}
