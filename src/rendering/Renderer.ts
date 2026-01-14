import { Disposable, SVG_NS, MindMapNode, Position, NodeId } from '../types';
import { StateSnapshot } from '../state/stateTypes';
import { StateManager } from '../state/StateManager';
import { computeCenterRootLayout } from '../layout/CenterRootLayout';
import { computeTextLayout } from '../layout/NodeTextLayout';

/**
 * Renderer
 *
 * Phase 5: Drag 상호작용 추가
 *
 * === 책임 (Responsibilities) ===
 * - StateSnapshot을 받아 SVG에 시각적 표현 생성
 * - 노드 원(circle) + 텍스트(text) 렌더링
 * - 엣지(line) 렌더링 (parentId 기반)
 * - 렌더링 전 기존 요소 제거 (clear → re-render)
 * - 렌더링 순서: edge-layer → node-layer (뒤에서 앞으로)
 * - Phase 5: 노드 드래그 상호작용 처리
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ HistoryManager 참조: 렌더링과 무관
 * - ❌ EventBus 참조: 이벤트 발행/구독 안 함
 * - ❌ 상태 캐싱: snapshot 저장 금지
 * - ❌ 애니메이션: Phase 5.0 범위 초과
 * - ❌ 베지어 곡선: 직선만 사용
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

	/**
	 * Phase 6.1: 초기 viewport 캐싱
	 *
	 * 책임:
	 * - 플러그인 최초 로딩 시 1회만 viewport 크기 계산
	 * - 이후 resize/pan/zoom 시 viewport 재계산 금지
	 * - 노드의 절대 위치를 고정하여 transform-layer만 변경
	 *
	 * 이유:
	 * - resize 시 layout 재계산하면 노드 위치가 변경됨
	 * - pan/zoom은 transform-layer로 처리해야 함
	 * - 초기 위치를 고정하여 일관된 좌표계 유지
	 */
	private initialViewport: { width: number; height: number } | null = null;

	constructor(svgElement: SVGSVGElement) {
		this.svgElement = svgElement;
		this.setupCanvasBackgroundHandler();
	}

	/**
	 * Phase 5: StateManager 주입
	 *
	 * drag 완료 시 moveNode() 호출을 위해 필요
	 * Phase 5.1: 선택 해제를 위한 clearSelection() 호출
	 */
	setStateManager(stateManager: StateManager): void {
		this.stateManager = stateManager;
	}

	/**
	 * Phase 5.1: Canvas background 클릭 핸들러 설정
	 *
	 * SVG 빈 공간 클릭 시 선택 해제
	 */
	private setupCanvasBackgroundHandler(): void {
		this.svgElement.addEventListener('pointerdown', (e) => {
			// 노드 클릭이 아닌 경우 (background 클릭)
			const target = e.target as SVGElement;
			if (target === this.svgElement || target.id === 'transform-layer') {
				// 선택 해제 (Command 패턴)
				if (this.stateManager) {
					this.stateManager.clearSelection();
				}
			}
		});
	}

	/**
	 * StateSnapshot을 SVG로 렌더링
	 *
	 * Phase 4.0 렌더링 순서:
	 * 1. edge-layer: 엣지 먼저 (뒤에 그려짐)
	 * 2. node-layer: 노드 나중에 (앞에 그려짐)
	 *
	 * Phase 6.0 레이아웃 통합:
	 * - computeCenterRootLayout 호출하여 실제 렌더 좌표 계산
	 * - node.position 대신 layout 결과 사용
	 * - viewport는 viewBox 기준 (SVG 내부 좌표계)
	 *
	 * @param snapshot - 렌더링할 StateSnapshot
	 */
	render(snapshot: StateSnapshot): void {
		// ========================================================================
		// Phase 6.1: 초기 1회 viewport 계산 + layout 캐싱
		// ========================================================================
		// 초기 viewport가 없으면 1회만 계산 (이후 resize/pan/zoom 시 재계산 금지)
		if (this.initialViewport === null) {
			this.initialViewport = this.getViewportSize();
			console.log('[Renderer.render] 🎯 초기 viewport 캐싱 (1회만):', this.initialViewport);
		}

		// 항상 초기 viewport 기준으로 layout 계산
		// 이렇게 하면 resize 시에도 노드 절대 위치가 유지됨
		const layout = computeCenterRootLayout(snapshot.nodes, this.initialViewport);

		// ========================================================================
		// 🔍 강제 검증: viewBox vs DOM viewport 좌표계 분석
		// ========================================================================
		const svgViewBox = this.svgElement.viewBox.baseVal;
		const svgBoundingRect = this.svgElement.getBoundingClientRect();

		console.log('[🔍 좌표계 검증]', {
			'viewBox.baseVal': {
				x: svgViewBox.x,
				y: svgViewBox.y,
				width: svgViewBox.width,
				height: svgViewBox.height
			},
			'getBoundingClientRect()': {
				top: svgBoundingRect.top,
				left: svgBoundingRect.left,
				width: svgBoundingRect.width,
				height: svgBoundingRect.height
			},
			'initialViewport (캐싱됨)': this.initialViewport,
			'현재 실제 크기와 일치 여부': {
				widthMatch: Math.abs(svgBoundingRect.width - this.initialViewport.width) < 1,
				heightMatch: Math.abs(svgBoundingRect.height - this.initialViewport.height) < 1
			}
		});

		// 루트 노드 최종 transform 출력
		if (snapshot.rootId && layout[snapshot.rootId]) {
			const rootPos = layout[snapshot.rootId];
			console.log('[🔍 좌표계 검증] 루트 노드 최종 transform:', {
				nodeId: snapshot.rootId,
				x: rootPos.x,
				y: rootPos.y,
				transform: `translate(${rootPos.x}, ${rootPos.y})`
			});
		}

		console.log('[Renderer.render] 렌더링 시작:', {
			viewport: this.initialViewport,
			nodeCount: snapshot.nodes.length,
			rootId: snapshot.rootId,
			layoutSample: Object.keys(layout).length > 0
				? { [snapshot.rootId || 'none']: layout[snapshot.rootId || ''] }
				: 'empty'
		});

		// Phase 4.0: 엣지 먼저 렌더링 (뒤에 그려짐)
		this.renderEdges(snapshot, layout);

		// Phase 3.4: 노드 렌더링 (앞에 그려짐)
		this.renderNodes(snapshot, layout);
	}

	/**
	 * Phase 6.0: Viewport 크기 계산
	 *
	 * 책임:
	 * - ✅ 실제 DOM viewport 크기를 기반으로 계산 (getBoundingClientRect)
	 * - ✅ viewBox가 아닌 사용자가 보는 실제 화면 기준
	 * - ✅ 이 좌표계가 SVG transform 좌표계와 일치함
	 *
	 * 이유:
	 * - viewBox 좌표계와 DOM viewport 좌표계가 다를 수 있음
	 * - 사용자가 보는 "시각적 중앙"은 DOM viewport 기준
	 * - CenterRootLayout은 이 DOM 좌표계 기준으로 계산해야 정확
	 *
	 * 검증 체크리스트:
	 * ✓ 루트 노드가 항상 시각적 중앙에 오는지
	 * ✓ 창 리사이즈 시 재계산 되는지 (render() 호출 시마다 계산)
	 * ✓ viewBox 설정과 무관하게 동일한 시각적 결과
	 *
	 * @returns { width, height } viewport 크기 (DOM 기준)
	 */
	private getViewportSize(): { width: number; height: number } {
		// 실제 DOM viewport 크기 사용 (viewBox 무시)
		const rect = this.svgElement.getBoundingClientRect();
		return {
			width: rect.width || 800,  // fallback: 800px
			height: rect.height || 600, // fallback: 600px
		};
	}

	/**
	 * Phase 4.0: 엣지 렌더링
	 *
	 * Phase 6.0: layout 좌표 사용
	 * - node.position 대신 layout[nodeId] 사용
	 *
	 * 책임:
	 * - parentId 기반으로 부모-자식 연결선 렌더링
	 * - 레이아웃 결과 좌표 사용
	 *
	 * @param snapshot - 렌더링할 StateSnapshot
	 * @param layout - 레이아웃 계산 결과 좌표
	 */
	private renderEdges(
		snapshot: StateSnapshot,
		layout: Record<NodeId, Position>
	): void {
		const edgeLayer = this.getOrCreateEdgeLayer();
		this.clearLayer(edgeLayer);

		// parentId 기반 엣지 렌더링 (O(n))
		for (const node of snapshot.nodes) {
			if (node.parentId !== null) {
				const parentPosition = layout[node.parentId];
				const nodePosition = layout[node.id];
				if (parentPosition && nodePosition) {
					const line = this.createLine(parentPosition, nodePosition);
					edgeLayer.appendChild(line);
				}
			}
		}
	}

	/**
	 * 노드 렌더링 (Phase 3.4 로직 분리)
	 *
	 * Phase 4.x: 선택 상태 시각화 추가
	 * - snapshot.selectedNodeId 기반으로 선택 노드 강조
	 *
	 * Phase 5: 드래그 이벤트 리스너 추가
	 * - pointerdown 이벤트로 드래그 시작
	 *
	 * Phase 6.0: layout 좌표 사용 + rounded rect 렌더링
	 * - node.position 대신 layout[nodeId] 사용
	 * - circle 대신 rounded rect 사용
	 * - NodeTextLayout으로 텍스트 크기 계산
	 * - 다중 줄 텍스트 지원 (tspan)
	 *
	 * @param snapshot - 렌더링할 StateSnapshot
	 * @param layout - 레이아웃 계산 결과 좌표
	 */
	private renderNodes(
		snapshot: StateSnapshot,
		layout: Record<NodeId, Position>
	): void {
		const nodeLayer = this.getOrCreateNodeLayer();
		this.clearLayer(nodeLayer);

		for (const node of snapshot.nodes) {
			const nodePosition = layout[node.id];
			if (!nodePosition) {
				console.warn(`[renderNodes] SKIP: layout에 좌표 없음 (nodeId: ${node.id})`);
				continue;
			}

			const isSelected = node.id === snapshot.selectedNodeId;
			const isDragging = node.id === this.draggingNodeId;

			// 1. 텍스트 레이아웃 계산 (maxWidth: 200px)
			const textLayout = computeTextLayout(node.content, 200, {
				fontSize: 12,
				fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
			});

			// 2. padding 추가하여 rect 크기 결정
			const padding = 16;
			const rectWidth = textLayout.width + padding * 2;
			const rectHeight = textLayout.height + padding * 2;

			// 3. 노드 그룹 생성
			const nodeGroup = this.createNodeGroup(
				node.id,
				nodePosition.x,
				nodePosition.y
			);

			// 4. rounded rect 생성
			const rect = this.createRoundedRect(
				rectWidth,
				rectHeight,
				8,
				isSelected,
				isDragging
			);
			nodeGroup.appendChild(rect);

			// 5. 텍스트 생성 (다중 줄 지원)
			const text = this.createMultilineText(textLayout.lines);
			nodeGroup.appendChild(text);

			// 6. 드래그 이벤트 리스너 등록
			nodeGroup.style.cursor = 'grab';
			nodeGroup.addEventListener('pointerdown', (e) =>
				this.handlePointerDown(e, node.id, nodePosition)
			);

			nodeLayer.appendChild(nodeGroup);
		}

		console.log('[renderNodes] 완료:', {
			렌더링된_노드_개수: nodeLayer.children.length,
			전체_노드_개수: snapshot.nodes.length
		});
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
	 *
	 * 책임:
	 * - CenterRootLayout 결과 좌표를 SVG transform으로 변환
	 * - viewBox 기준 좌표계 사용 (transform-layer의 identity transform 기준)
	 *
	 * 검증:
	 * - CenterRootLayout이 계산한 viewport 중앙 좌표가 그대로 적용됨
	 * - transform-layer가 identity이므로 추가 변환 없음
	 */
	private createNodeGroup(id: string, x: number, y: number): SVGGElement {
		console.log('[createNodeGroup] 최종 좌표 적용:', {
			nodeId: id,
			x,
			y,
			transform: `translate(${x}, ${y})`
		});

		const group = document.createElementNS(SVG_NS, 'g') as SVGGElement;
		group.setAttribute('id', `node-${id}`);
		group.setAttribute('transform', `translate(${x}, ${y})`);
		group.setAttribute('data-node-id', id);
		return group;
	}

	/**
	 * Phase 6.0: Rounded rect 생성 (circle 대체)
	 *
	 * 책임:
	 * - 텍스트 콘텐츠를 감싸는 rounded rectangle 생성
	 * - 선택/드래그 상태에 따른 시각적 피드백
	 *
	 * @param width - rect 너비
	 * @param height - rect 높이
	 * @param radius - 모서리 둥글기
	 * @param isSelected - 선택 상태
	 * @param isDragging - 드래그 상태
	 * @returns SVGRectElement
	 */
	private createRoundedRect(
		width: number,
		height: number,
		radius: number = 8,
		isSelected: boolean = false,
		isDragging: boolean = false
	): SVGRectElement {
		const rect = document.createElementNS(SVG_NS, 'rect') as SVGRectElement;

		// rect 중심을 (0, 0)으로 배치하기 위해 x, y를 -width/2, -height/2로 설정
		rect.setAttribute('x', String(-width / 2));
		rect.setAttribute('y', String(-height / 2));
		rect.setAttribute('width', String(width));
		rect.setAttribute('height', String(height));
		rect.setAttribute('rx', String(radius));
		rect.setAttribute('ry', String(radius));
		rect.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');

		if (isSelected) {
			// 선택 상태: 파란색 강조
			rect.setAttribute('stroke', 'rgba(0, 122, 255, 1)');
			rect.setAttribute('stroke-width', '3');
		} else {
			// 기본 상태
			rect.setAttribute('stroke', 'rgba(0, 0, 0, 0.15)');
			rect.setAttribute('stroke-width', '1');
		}

		// 드래그 중 opacity
		if (isDragging) {
			rect.setAttribute('opacity', '0.85');
		}

		return rect;
	}

	/**
	 * 텍스트 생성 (단일 줄)
	 *
	 * 스타일: 하드코딩 (Phase 4.0 임시)
	 *
	 * @deprecated Phase 6.0부터 createMultilineText() 사용 권장
	 */
	private createText(content: string): SVGTextElement {
		const text = document.createElementNS(SVG_NS, 'text') as SVGTextElement;
		text.setAttribute('x', '0');
		text.setAttribute('y', '0');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('dominant-baseline', 'middle');
		text.setAttribute(
			'font-family',
			'-apple-system, BlinkMacSystemFont, sans-serif'
		);
		text.setAttribute('font-size', '12');
		text.setAttribute('fill', '#1d1d1f');
		text.textContent = content;
		return text;
	}

	/**
	 * Phase 6.0: 다중 줄 텍스트 생성 (tspan 기반)
	 *
	 * 책임:
	 * - lines 배열을 tspan 요소로 변환
	 * - 수직/수평 중앙 정렬 유지
	 * - lineHeight 적용
	 *
	 * @param lines - 줄바꿈된 텍스트 배열
	 * @returns SVGTextElement (tspan 포함)
	 */
	private createMultilineText(lines: string[]): SVGTextElement {
		const text = document.createElementNS(SVG_NS, 'text') as SVGTextElement;
		text.setAttribute('x', '0');
		text.setAttribute('y', '0');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute(
			'font-family',
			'-apple-system, BlinkMacSystemFont, sans-serif'
		);
		text.setAttribute('font-size', '12');
		text.setAttribute('fill', '#1d1d1f');

		const fontSize = 12;
		const lineHeight = fontSize * 1.4; // 140%

		// 수직 중앙 정렬을 위한 시작 y 좌표 계산
		const totalHeight = lines.length * lineHeight;
		const startY = -totalHeight / 2 + lineHeight / 2;

		// 각 줄을 tspan으로 생성
		for (let i = 0; i < lines.length; i++) {
			const tspan = document.createElementNS(
				SVG_NS,
				'tspan'
			) as SVGTSpanElement;
			tspan.setAttribute('x', '0');
			tspan.setAttribute('y', String(startY + i * lineHeight));
			tspan.setAttribute('dominant-baseline', 'middle');
			tspan.textContent = lines[i];
			text.appendChild(tspan);
		}

		return text;
	}

	// =========================================================================
	// Phase 5: Drag 이벤트 핸들러
	// =========================================================================

	/**
	 * pointerdown: 드래그 시작 + 노드 선택
	 *
	 * Phase 5.1:
	 * 1. SelectNodeCommand 실행 (노드 선택)
	 * 2. draggingNodeId 설정
	 * 3. dragOffset 계산 (포인터 위치 - 노드 위치)
	 * 4. dragStartPosition 저장 (undo용)
	 * 5. 전역 pointermove/pointerup 리스너 등록
	 * 6. cursor 변경
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
		const svgP = pt.matrixTransform(
			this.svgElement.getScreenCTM()?.inverse()
		);

		// dragOffset 계산 (포인터 - 노드 위치)
		this.dragOffset = {
			x: svgP.x - nodePosition.x,
			y: svgP.y - nodePosition.y,
		};

		// 전역 리스너 등록
		document.addEventListener('pointermove', this.handlePointerMove);
		document.addEventListener('pointerup', this.handlePointerUp);

		// cursor 변경
		document.body.style.cursor = 'grabbing';
	}

	/**
	 * pointermove: 드래그 preview (state 변경 ❌)
	 *
	 * 동작:
	 * 1. draggingNodeId 없으면 무시
	 * 2. 포인터 위치 → SVG 좌표 변환
	 * 3. 새 위치 계산 (포인터 - dragOffset)
	 * 4. DOM transform 직접 변경 (state 변경 없음)
	 *
	 * 핵심: StateManager 호출 ❌, Command 생성 ❌
	 */
	private handlePointerMove = (e: PointerEvent): void => {
		if (!this.draggingNodeId) return;

		// 포인터 위치를 SVG 좌표계로 변환
		const pt = this.svgElement.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const svgP = pt.matrixTransform(
			this.svgElement.getScreenCTM()?.inverse()
		);

		// 새 위치 계산 (포인터 - offset)
		const newX = svgP.x - this.dragOffset.x;
		const newY = svgP.y - this.dragOffset.y;

		// DOM transform 직접 변경 (preview만, state 변경 없음)
		const nodeGroup = this.svgElement.querySelector(
			`#node-${this.draggingNodeId}`
		) as SVGGElement | null;
		if (nodeGroup) {
			nodeGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
		}
	};

	/**
	 * pointerup: 드래그 완료 (MoveNodeCommand 생성)
	 *
	 * 동작:
	 * 1. draggingNodeId 없으면 무시
	 * 2. 포인터 위치 → SVG 좌표 변환
	 * 3. 최종 위치 계산
	 * 4. StateManager.moveNode() 호출 (단 1회 Command 생성)
	 * 5. 드래그 상태 초기화
	 * 6. 전역 리스너 제거
	 *
	 * 핵심: 여기서만 StateManager.moveNode() 호출
	 */
	private handlePointerUp = (e: PointerEvent): void => {
		if (!this.draggingNodeId) return;

		// 포인터 위치를 SVG 좌표계로 변환
		const pt = this.svgElement.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const svgP = pt.matrixTransform(
			this.svgElement.getScreenCTM()?.inverse()
		);

		// 최종 위치 계산
		const finalX = svgP.x - this.dragOffset.x;
		const finalY = svgP.y - this.dragOffset.y;

		// StateManager.moveNode() 호출 (단 1회 Command 생성)
		// ★ MoveNodeCommand 생성 지점 ★
		if (this.stateManager) {
			this.stateManager.moveNode(this.draggingNodeId, finalX, finalY);
		}

		// 드래그 상태 초기화
		this.draggingNodeId = null;
		this.dragOffset = { x: 0, y: 0 };
		this.dragStartPosition = { x: 0, y: 0 };

		// 전역 리스너 제거
		document.removeEventListener('pointermove', this.handlePointerMove);
		document.removeEventListener('pointerup', this.handlePointerUp);

		// cursor 복원
		document.body.style.cursor = '';
	};

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

		// Phase 5: 전역 이벤트 리스너 제거
		document.removeEventListener('pointermove', this.handlePointerMove);
		document.removeEventListener('pointerup', this.handlePointerUp);
	}
}
