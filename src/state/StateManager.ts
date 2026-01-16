import {
	Disposable,
	EdgeId,
	MindMapNode,
	MindMapEdge,
	NodeGraph,
	NodeId,
	PersistentState,
	EphemeralState,
} from '../types';
import { StateCommand, StateContext, StateSnapshot } from './stateTypes';
import { EventBus } from '../events/EventBus';

/**
 * StateManager
 *
 * Architecture v4.0 § 상태 관리 시스템 기준
 *
 * === 책임 (Responsibilities) ===
 * - PersistentState (Undo 대상): 그래프, 레이아웃, 설정, 핀 고정 상태 관리
 * - EphemeralState (Undo 비대상): 선택, 편집, 접힘, 드래그 상태 관리
 * - Snapshot 제공: 외부 소비자에게 불변 읽기 전용 뷰 제공
 * - Command 실행: apply(command)를 통한 상태 변경 단방향 흐름
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ 렌더링: SVG/DOM 조작은 Renderer 책임
 * - ❌ 레이아웃 계산: 좌표 계산은 LayoutEngine 책임
 * - ❌ Undo/Redo: Phase 3에서 별도 레이어로 분리 예정
 * - ❌ 파일 저장: Phase 3에서 Persistence 레이어로 분리 예정
 * - ❌ 이벤트 발행: Phase 2+에서 추가 예정 (현재 주석 처리)
 * - ❌ 그래프 유효성 검증: 연결된 엣지 제거, 고아 노드 처리 등 미구현
 *
 * === 현재 Phase ===
 * Phase 2: Snapshot + Command 패턴 적용
 * - Snapshot: 불변 읽기 전용 인터페이스 제공
 * - Command: apply(command) 단방향 흐름 (undo/redo 제외)
 * - 직접 setter 메서드는 Phase 2+ 마이그레이션 대상
 */
export class StateManager implements Disposable {
	private readonly persistentState: PersistentState;
	private readonly ephemeralState: EphemeralState;
	private eventBus?: EventBus;

	constructor() {
		// 초기 상태 설정
		this.persistentState = this.createInitialPersistentState();
		this.ephemeralState = this.createInitialEphemeralState();
	}

	/**
	 * EventBus 주입 (선택적)
	 * - 주입되지 않아도 기존 동작을 유지해야 하므로 optional 로 둔다.
	 */
	public setEventBus(eventBus: EventBus): void {
		this.eventBus = eventBus;
	}

	/**
	 * 현재 상태의 읽기 전용 스냅샷을 반환
	 * - 외부 소비자는 반환값을 수정하더라도 내부 상태에 영향 없음
	 * - 내부 배열까지 deep freeze하여 불변성 보장
	 *
	 * Phase 5.1: selectedNodeId는 persistentState.ui에서 가져옴
	 */
	getSnapshot(): StateSnapshot {
		const nodes = Object.freeze(
			Array.from(this.persistentState.graph.nodes.values()).map(
				(node) => this.cloneNode(node)
			)
		);
		const edges = Object.freeze(
			Array.from(this.persistentState.graph.edges.values()).map(
				(edge) => ({ ...edge })
			)
		);
		const pinnedNodeIds = Object.freeze(
			Array.from(this.persistentState.pinnedNodes)
		);
		const collapsedNodeIds = Object.freeze(
			Array.from(this.ephemeralState.collapsedNodes)
		);

		return Object.freeze({
			nodes,
			edges,
			rootId: this.persistentState.graph.rootId,
			pinnedNodeIds,
			collapsedNodeIds,
			selectedNodeId: this.persistentState.ui.selectedNodeId, // Phase 5.1: persistent
			editingNodeId: this.ephemeralState.editingNodeId,
		});
	}

	/**
	 * 커맨드를 적용하고 최신 스냅샷을 반환
	 * - 단방향 흐름: 입력 → Command → State → Snapshot
	 */
	apply(command: StateCommand): StateSnapshot {
		command.execute(this.getContext());
		return this.getSnapshot();
	}

	/**
	 * 초기 영구 상태 생성
	 *
	 * Phase 5.1: ui 상태 추가
	 */
	private createInitialPersistentState(): PersistentState {
		return {
			schemaVersion: 1,
			graph: {
				nodes: new Map<string, MindMapNode>(),
				edges: new Map<string, MindMapEdge>(),
				rootId: '',
			},
			layout: {
				viewport: {
					x: 0,
					y: 0,
					zoom: 1,
				},
				nodePositions: new Map<string, { x: number; y: number }>(),
			},
			settings: {
				autoAlign: true,
				centerOnCreate: true,
				minimap: {
					enabled: true,
					size: 'medium',
					opacity: 0.9,
				},
			},
			pinnedNodes: new Set<string>(),
			ui: {
				selectedNodeId: null, // Phase 5.1: 선택 상태 (Undo 대상)
			},
		};
	}

	/**
	 * 초기 임시 상태 생성
	 */
	private createInitialEphemeralState(): EphemeralState {
		return {
			selectedNodeId: null,
			editingNodeId: null,
			collapsedNodes: new Set<string>(),
			dragState: null,
			lastSelectedNodeId: null,
		};
	}

	// =========================================================================
	// Getters (Read-Only Interface)
	// =========================================================================

	/**
	 * 노드 조회
	 * - Readonly 반환으로 외부에서 내부 상태 직접 수정 방지
	 */
	getNode(nodeId: NodeId): Readonly<MindMapNode> | undefined {
		return this.persistentState.graph.nodes.get(nodeId);
	}

	/**
	 * 모든 노드 조회
	 * - Readonly 반환으로 외부에서 내부 상태 직접 수정 방지
	 */
	getAllNodes(): ReadonlyArray<Readonly<MindMapNode>> {
		return Array.from(this.persistentState.graph.nodes.values());
	}

	/**
	 * 루트 노드 조회
	 * - Readonly 반환으로 외부에서 내부 상태 직접 수정 방지
	 */
	getRootNode(): Readonly<MindMapNode> | null {
		const rootId = this.persistentState.graph.rootId;
		if (!rootId) return null;
		return this.getNode(rootId) || null;
	}

	/**
	 * 엣지 조회
	 * - Readonly 반환으로 외부에서 내부 상태 직접 수정 방지
	 */
	getEdge(edgeId: EdgeId): Readonly<MindMapEdge> | undefined {
		return this.persistentState.graph.edges.get(edgeId);
	}

	/**
	 * 선택된 노드 ID 조회
	 */
	getSelectedNodeId(): NodeId | null {
		return this.ephemeralState.selectedNodeId;
	}

	/**
	 * 편집 중인 노드 ID 조회
	 */
	getEditingNodeId(): NodeId | null {
		return this.ephemeralState.editingNodeId;
	}

	// =========================================================================
	// Setters (Write-Only Interface)
	// Phase 2+: Command 패턴으로 변환 예정
	// =========================================================================

	/**
	 * 노드 추가
	 *
	 * 제약사항:
	 * - 첫 번째 노드는 자동으로 루트 노드로 설정됨
	 * - 중복 ID 검증 없음 (호출자 책임)
	 * - 이벤트 발행 없음 (Phase 2+)
	 */
	addNode(node: MindMapNode): void {
		this.persistentState.graph.nodes.set(node.id, node);

		// 루트 노드 설정 (첫 노드)
		if (!this.persistentState.graph.rootId) {
			this.persistentState.graph.rootId = node.id;
		}

		// 상태 변경 지점에 한정된 이벤트 발행 (주입되지 않은 경우 무시)
		this.emitSafe('nodeCreated', { node });
	}

	/**
	 * 노드 제거
	 *
	 * ⚠️ 경고: 현재 불완전한 구현
	 * - 연결된 엣지 제거 안 됨 (고아 엣지 발생)
	 * - 자식 노드 참조 업데이트 안 됨
	 * - 루트 노드 제거 시 그래프 무효화 가능
	 * - Phase 2+에서 완전한 구현 예정
	 */
	removeNode(nodeId: NodeId): void {
		this.persistentState.graph.nodes.delete(nodeId);

		// Phase 2+: 연결된 엣지도 제거

		// 상태 변경 지점에 한정된 이벤트 발행 (주입되지 않은 경우 무시)
		this.emitSafe('nodeDeleted', { nodeId });
	}

	/**
	 * 노드 업데이트
	 *
	 * 제약사항:
	 * - nodeId가 존재하지 않으면 조용히 실패 (undefined 반환)
	 * - updates 유효성 검증 없음 (잘못된 값 방지 안 됨)
	 * - childIds 등 관계 필드 수정 시 그래프 무결성 보장 안 됨
	 * - updatedAt은 자동 갱신됨
	 */
	updateNode(nodeId: NodeId, updates: Partial<MindMapNode>): void {
		const node = this.persistentState.graph.nodes.get(nodeId);
		if (!node) return;

		Object.assign(node, updates);
		node.updatedAt = Date.now();

		// 상태 변경 지점에 한정된 이벤트 발행 (주입되지 않은 경우 무시)
		this.emitSafe('nodeUpdated', { node });
	}

	/**
	 * 노드 선택 (Phase 4.x: Command 패턴)
	 *
	 * 제약사항:
	 * - nodeId 존재 여부 검증 안 됨
	 * - 이전 선택은 lastSelectedNodeId에 자동 저장됨
	 * - null 전달 시 선택 해제
	 *
	 * Phase 4.x:
	 * - SelectNodeCommand를 통해 apply() 경로 사용
	 * - HistoryManager 통합은 Phase 4.x+ 예정
	 */
	selectNode(nodeId: NodeId | null): void {
		// Dynamic import to avoid circular dependency
		// SelectNodeCommand는 이 메서드 내에서만 사용되므로
		// lazy import로 순환 참조 방지
		const { SelectNodeCommand } = require('../history/SelectNodeCommand');
		const command = new SelectNodeCommand(nodeId);
		this.apply(command);
	}

	/**
	 * 노드 편집 모드 진입
	 *
	 * 제약사항:
	 * - nodeId 존재 여부 검증 안 됨
	 * - 선택 상태와 독립적 (편집 중이어도 선택되지 않을 수 있음)
	 * - null 전달 시 편집 모드 종료
	 * - 동시에 여러 노드 편집 불가 (마지막 호출만 유효)
	 */
	setEditingNode(nodeId: NodeId | null): void {
		this.ephemeralState.editingNodeId = nodeId;

		// Phase 2+: 이벤트 발행
		// this.emit('editingChanged', nodeId);
	}

	/**
	 * 노드 이동 (Phase 4.x: Command 패턴)
	 *
	 * 제약사항:
	 * - nodeId 존재 여부 검증 안 됨
	 * - 레이아웃 계산은 외부에서 수행
	 * - 다른 노드에 영향 주지 않음
	 *
	 * Phase 4.x:
	 * - MoveNodeCommand를 통해 apply() 경로 사용
	 * - 현재 위치를 from으로 자동 캡처
	 * - HistoryManager 통합은 Phase 4.x+ 예정
	 *
	 * @param nodeId - 이동할 노드 ID
	 * @param toX - 목표 x 좌표
	 * @param toY - 목표 y 좌표
	 */
	moveNode(nodeId: NodeId, toX: number, toY: number): void {
		// 현재 위치 캡처 (undo용)
		const node = this.persistentState.graph.nodes.get(nodeId);
		if (!node) {
			// 노드가 없으면 조용히 실패
			return;
		}

		const from = { x: node.position.x, y: node.position.y };
		const to = { x: toX, y: toY };

		// Dynamic import to avoid circular dependency
		const { MoveNodeCommand } = require('../history/MoveNodeCommand');
		const command = new MoveNodeCommand(nodeId, from, to);
		this.apply(command);
	}

	/**
	 * 선택 해제 (Phase 5.1: Command 패턴)
	 *
	 * Phase 5.1:
	 * - ClearSelectionCommand를 통해 apply() 경로 사용
	 * - Undo/Redo 대상
	 */
	clearSelection(): void {
		const { ClearSelectionCommand } = require('../history/ClearSelectionCommand');
		const command = new ClearSelectionCommand();
		this.apply(command);
	}

	/**
	 * 현재 상태 컨텍스트 (Command 전용)
	 */
	private getContext(): StateContext {
		return {
			persistent: this.persistentState,
			ephemeral: this.ephemeralState,
			emit: this.emitSafe.bind(this),
		};
	}

	/**
	 * 스냅샷용 노드 복제
	 */
	private cloneNode(node: MindMapNode): MindMapNode {
		return {
			...node,
			position: { ...node.position },
			childIds: [...node.childIds],
		};
	}

	/**
	 * EventBus에 안전하게 발행
	 * - 설정되지 않았거나 핸들러 에러 발생 시 상태 변경에 영향을 주지 않는다.
	 */
	private emitSafe(eventName: string, payload: unknown): void {
		if (!this.eventBus) return;
		try {
			this.eventBus.emit(eventName, payload);
		} catch {
			// swallow to keep StateManager behavior unaffected
		}
	}

	// =========================================================================
	// 직렬화/역직렬화 (Phase 3: 파일 저장용)
	// =========================================================================

	/**
	 * 상태를 JSON으로 직렬화
	 */
	serialize(): string {
		const data = {
			schemaVersion: this.persistentState.schemaVersion,
			nodes: Array.from(this.persistentState.graph.nodes.entries()),
			edges: Array.from(this.persistentState.graph.edges.entries()),
			rootId: this.persistentState.graph.rootId,
			layout: {
				viewport: this.persistentState.layout.viewport,
				nodePositions: Array.from(
					this.persistentState.layout.nodePositions.entries()
				),
			},
			settings: this.persistentState.settings,
			pinnedNodes: Array.from(this.persistentState.pinnedNodes),
		};

		return JSON.stringify(data, null, 2);
	}

	/**
	 * JSON에서 상태 복원
	 */
	deserialize(jsonString: string): void {
		try {
			const data = JSON.parse(jsonString);

			this.persistentState.schemaVersion = data.schemaVersion || 1;
			this.persistentState.graph.nodes = new Map(data.nodes || []);
			this.persistentState.graph.edges = new Map(data.edges || []);
			this.persistentState.graph.rootId = data.rootId || '';

			if (data.layout) {
				this.persistentState.layout.viewport = data.layout.viewport || {
					x: 0,
					y: 0,
					zoom: 1,
				};
				this.persistentState.layout.nodePositions = new Map(
					data.layout.nodePositions || []
				);
			}

			this.persistentState.settings = data.settings || this.persistentState.settings;
			this.persistentState.pinnedNodes = new Set(data.pinnedNodes || []);

			// Phase 2+: 이벤트 발행
			// this.emit('stateChanged');
		} catch (error) {
			console.error('Failed to deserialize state:', error);
		}
	}

	// =========================================================================
	// Disposable
	// =========================================================================

	destroy(): void {
		// Phase 2+: 이벤트 리스너 정리
		// Phase 2+: 구독 해제

		// 상태 초기화
		this.persistentState.graph.nodes.clear();
		this.persistentState.graph.edges.clear();
		this.persistentState.layout.nodePositions.clear();
		this.persistentState.pinnedNodes.clear();
		this.ephemeralState.collapsedNodes.clear();
	}
}
