import { Disposable, SVG_NS, MindMapNode, Position } from '../types';
import { StateSnapshot } from '../state/stateTypes';

/**
 * Renderer
 *
 * Phase 4.0: Edge 렌더링 추가
 *
 * === 책임 (Responsibilities) ===
 * - StateSnapshot을 받아 SVG에 시각적 표현 생성
 * - 노드 원(circle) + 텍스트(text) 렌더링
 * - 엣지(line) 렌더링 (parentId 기반)
 * - 렌더링 전 기존 요소 제거 (clear → re-render)
 * - 렌더링 순서: edge-layer → node-layer (뒤에서 앞으로)
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ StateManager 참조: snapshot만 소비
 * - ❌ HistoryManager 참조: 렌더링과 무관
 * - ❌ EventBus 참조: 이벤트 발행/구독 안 함
 * - ❌ 상태 캐싱: snapshot 저장 금지
 * - ❌ 애니메이션: Phase 4.0 범위 초과
 * - ❌ 상호작용: 클릭/드래그 등 Phase 4.0 범위 초과
 * - ❌ 베지어 곡선: 직선만 사용
 */
export class Renderer implements Disposable {
	private svgElement: SVGSVGElement;
	private rafId: number | null = null;

	constructor(svgElement: SVGSVGElement) {
		this.svgElement = svgElement;
	}

	/**
	 * StateSnapshot을 SVG로 렌더링
	 *
	 * Phase 4.0 렌더링 순서:
	 * 1. edge-layer: 엣지 먼저 (뒤에 그려짐)
	 * 2. node-layer: 노드 나중에 (앞에 그려짐)
	 *
	 * @param snapshot - 렌더링할 StateSnapshot
	 * @param visibleNodeIds - 렌더링할 노드 ID 집합
	 */
	render(snapshot: StateSnapshot, visibleNodeIds?: Set<string>): void {
		// Phase 4.0: 엣지 먼저 렌더링 (뒤에 그려짐)
		this.renderEdges(snapshot, visibleNodeIds);

		// Phase 3.4: 노드 렌더링 (앞에 그려짐)
		this.renderNodes(snapshot, visibleNodeIds);
	}

	/**
	 * Phase 4.0: 엣지 렌더링
	 *
	 * 책임:
	 * - parentId 기반으로 부모-자식 연결선 렌더링
	 * - 노드 위치 맵 구축 후 순회
	 *
	 * @param snapshot - 렌더링할 StateSnapshot
	 */
	private renderEdges(snapshot: StateSnapshot, visibleNodeIds?: Set<string>): void {
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
	 */
	private renderNodes(snapshot: StateSnapshot, visibleNodeIds?: Set<string>): void {
		const nodeLayer = this.getOrCreateNodeLayer();
		this.clearLayer(nodeLayer);

		for (const node of snapshot.nodes) {
			if (visibleNodeIds && !visibleNodeIds.has(node.id)) {
				continue;
			}
			const nodeGroup = this.createNodeGroup(node.id, node.position.x, node.position.y);
			const circle = this.createCircle();
			const text = this.createText(node.content);

			nodeGroup.appendChild(circle);
			nodeGroup.appendChild(text);
			nodeLayer.appendChild(nodeGroup);
		}
	}

	/**
	 * Phase 4.0: edge-layer 획득 또는 생성
	 *
	 * edge-layer는 node-layer보다 먼저 추가되어야 함 (뒤에 렌더링)
	 */
	private getOrCreateEdgeLayer(): SVGGElement {
		let edgeLayer = this.svgElement.querySelector('#edge-layer') as SVGGElement | null;

		if (!edgeLayer) {
			edgeLayer = document.createElementNS(SVG_NS, 'g') as SVGGElement;
			edgeLayer.setAttribute('id', 'edge-layer');

			const transformLayer = this.svgElement.querySelector('#transform-layer');
			if (transformLayer) {
				// node-layer보다 먼저 삽입 (뒤에 렌더링됨)
				const nodeLayer = transformLayer.querySelector('#node-layer');
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
		let nodeLayer = this.svgElement.querySelector('#node-layer') as SVGGElement | null;

		if (!nodeLayer) {
			nodeLayer = document.createElementNS(SVG_NS, 'g') as SVGGElement;
			nodeLayer.setAttribute('id', 'node-layer');

			const transformLayer = this.svgElement.querySelector('#transform-layer');
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
	 *
	 * 스타일: 하드코딩 (Phase 4.0 임시)
	 */
	private createLine(from: Position, to: Position): SVGLineElement {
		const line = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
		line.setAttribute('x1', String(from.x));
		line.setAttribute('y1', String(from.y));
		line.setAttribute('x2', String(to.x));
		line.setAttribute('y2', String(to.y));
		line.setAttribute('stroke', 'rgba(0, 0, 0, 0.2)');
		line.setAttribute('stroke-width', '2');
		return line;
	}

	/**
	 * 노드 그룹 생성
	 */
	private createNodeGroup(id: string, x: number, y: number): SVGGElement {
		const group = document.createElementNS(SVG_NS, 'g') as SVGGElement;
		group.setAttribute('id', `node-${id}`);
		group.setAttribute('transform', `translate(${x}, ${y})`);
		group.setAttribute('data-node-id', id);
		return group;
	}

	/**
	 * 원(circle) 생성
	 *
	 * 스타일: 하드코딩 (Phase 4.0 임시)
	 */
	private createCircle(): SVGCircleElement {
		const circle = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
		circle.setAttribute('r', '30');
		circle.setAttribute('cx', '0');
		circle.setAttribute('cy', '0');
		circle.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
		circle.setAttribute('stroke', 'rgba(0, 0, 0, 0.15)');
		circle.setAttribute('stroke-width', '1');
		return circle;
	}

	/**
	 * 텍스트 생성
	 *
	 * 스타일: 하드코딩 (Phase 4.0 임시)
	 */
	private createText(content: string): SVGTextElement {
		const text = document.createElementNS(SVG_NS, 'text') as SVGTextElement;
		text.setAttribute('x', '0');
		text.setAttribute('y', '0');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('dominant-baseline', 'middle');
		text.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');
		text.setAttribute('font-size', '12');
		text.setAttribute('fill', '#1d1d1f');
		text.textContent = content;
		return text;
	}

	/**
	 * 렌더링 시작 (현재 미사용)
	 */
	start(): void {
		console.log('Renderer started');
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
	 * Disposable
	 */
	destroy(): void {
		this.stop();
	}
}
