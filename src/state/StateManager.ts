import {
	Disposable,
	MindMapNode,
	MindMapEdge,
	NodeGraph,
	PersistentState,
	EphemeralState,
} from '../types';
import { StateCommand, StateContext, StateSnapshot } from './stateTypes';

/**
 * StateManager
 *
 * Architecture v4.0 § 상태 관리 시스템 기준
 *
 * 역할:
 * - PersistentState (Undo 대상) 관리
 * - EphemeralState (Undo 비대상) 관리
 * - 상태 변경 이벤트 발행
 *
 * Phase 1: 기본 골격만 구현
 * Phase 2: Snapshot 철학 적용, Command 패턴(undo/redo 제외) 추가
 */
export class StateManager implements Disposable {
	private persistentState: PersistentState;
	private ephemeralState: EphemeralState;

	constructor() {
		// 초기 상태 설정
		this.persistentState = this.createInitialPersistentState();
		this.ephemeralState = this.createInitialEphemeralState();
	}

	/**
	 * 현재 상태의 읽기 전용 스냅샷을 반환
	 * - 외부 소비자는 반환값을 수정하더라도 내부 상태에 영향 없음
	 */
	getSnapshot(): StateSnapshot {
		const nodes = Array.from(this.persistentState.graph.nodes.values()).map(
			(node) => this.cloneNode(node)
		);
		const edges = Array.from(this.persistentState.graph.edges.values()).map(
			(edge) => ({ ...edge })
		);

		return Object.freeze({
			nodes,
			edges,
			rootId: this.persistentState.graph.rootId,
			pinnedNodeIds: Array.from(this.persistentState.pinnedNodes),
			collapsedNodeIds: Array.from(this.ephemeralState.collapsedNodes),
			selectedNodeId: this.ephemeralState.selectedNodeId,
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
	// Getters
	// =========================================================================

	/**
	 * 노드 조회
	 */
	getNode(nodeId: string): MindMapNode | undefined {
		return this.persistentState.graph.nodes.get(nodeId);
	}

	/**
	 * 모든 노드 조회
	 */
	getAllNodes(): MindMapNode[] {
		return Array.from(this.persistentState.graph.nodes.values());
	}

	/**
	 * 루트 노드 조회
	 */
	getRootNode(): MindMapNode | null {
		const rootId = this.persistentState.graph.rootId;
		if (!rootId) return null;
		return this.getNode(rootId) || null;
	}

	/**
	 * 엣지 조회
	 */
	getEdge(edgeId: string): MindMapEdge | undefined {
		return this.persistentState.graph.edges.get(edgeId);
	}

	/**
	 * 선택된 노드 ID 조회
	 */
	getSelectedNodeId(): string | null {
		return this.ephemeralState.selectedNodeId;
	}

	/**
	 * 편집 중인 노드 ID 조회
	 */
	getEditingNodeId(): string | null {
		return this.ephemeralState.editingNodeId;
	}

	// =========================================================================
	// Setters (Phase 2+: Command 패턴으로 변환 예정)
	// =========================================================================

	/**
	 * 노드 추가
	 */
	addNode(node: MindMapNode): void {
		this.persistentState.graph.nodes.set(node.id, node);

		// 루트 노드 설정 (첫 노드)
		if (!this.persistentState.graph.rootId) {
			this.persistentState.graph.rootId = node.id;
		}

		// Phase 2+: 이벤트 발행
		// this.emit('nodeCreated', node);
	}

	/**
	 * 노드 제거
	 */
	removeNode(nodeId: string): void {
		this.persistentState.graph.nodes.delete(nodeId);

		// Phase 2+: 연결된 엣지도 제거
		// Phase 2+: 이벤트 발행
		// this.emit('nodeDeleted', nodeId);
	}

	/**
	 * 노드 업데이트
	 */
	updateNode(nodeId: string, updates: Partial<MindMapNode>): void {
		const node = this.getNode(nodeId);
		if (!node) return;

		Object.assign(node, updates);
		node.updatedAt = Date.now();

		// Phase 2+: 이벤트 발행
		// this.emit('nodeUpdated', node);
	}

	/**
	 * 노드 선택
	 */
	selectNode(nodeId: string | null): void {
		if (this.ephemeralState.selectedNodeId) {
			this.ephemeralState.lastSelectedNodeId = this.ephemeralState.selectedNodeId;
		}
		this.ephemeralState.selectedNodeId = nodeId;

		// Phase 2+: 이벤트 발행
		// this.emit('nodeSelected', nodeId);
	}

	/**
	 * 노드 편집 모드 진입
	 */
	setEditingNode(nodeId: string | null): void {
		this.ephemeralState.editingNodeId = nodeId;

		// Phase 2+: 이벤트 발행
		// this.emit('editingChanged', nodeId);
	}

	/**
	 * 현재 상태 컨텍스트 (Command 전용)
	 */
	private getContext(): StateContext {
		return {
			persistent: this.persistentState,
			ephemeral: this.ephemeralState,
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
