import { Disposable } from '../types';

/**
 * Renderer
 *
 * Architecture v4.0 § Presentation Layer 기준
 *
 * 역할:
 * - NodeRenderer, EdgeRenderer, UIRenderer 조합
 * - 렌더링 파이프라인 관리
 * - ViewportCuller, LODStrategy 적용
 *
 * Phase 1: 기본 골격만 구현
 * Phase 2+: 실제 렌더링 로직 추가
 */
export class Renderer implements Disposable {
	private svgElement: SVGSVGElement;
	private rafId: number | null = null;

	constructor(svgElement: SVGSVGElement) {
		this.svgElement = svgElement;
	}

	/**
	 * 렌더링 시작
	 */
	start(): void {
		console.log('Renderer started');
		// Phase 2+: RAF 루프 시작
		// this.scheduleRender();
	}

	/**
	 * 렌더링 정지
	 */
	stop(): void {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
		console.log('Renderer stopped');
	}

	/**
	 * 다음 프레임 렌더링 예약
	 */
	private scheduleRender(): void {
		this.rafId = requestAnimationFrame(() => {
			this.render();
			this.scheduleRender();
		});
	}

	/**
	 * 렌더링 수행
	 */
	private render(): void {
		// Phase 2+: 실제 렌더링 로직
		// 1. ViewportCuller: 화면 밖 노드 필터링
		// 2. LODStrategy: 노드 상세도 결정
		// 3. NodeRenderer: 노드 렌더링
		// 4. EdgeRenderer: 엣지 렌더링
	}

	/**
	 * Disposable
	 */
	destroy(): void {
		this.stop();
	}
}
