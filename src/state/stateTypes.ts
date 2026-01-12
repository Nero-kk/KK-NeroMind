import {
	EphemeralState,
	MindMapEdge,
	MindMapNode,
	NodeId,
	PersistentState,
} from '../types';

/**
 * State 레이어에서 사용하는 커맨드 컨텍스트
 * - Persistent / Ephemeral 상태를 직접 전달하여 커맨드가 현재 상태만 다루도록 한다.
 */
export interface StateContext {
	persistent: PersistentState;
	ephemeral: EphemeralState;
}

/**
 * Phase 2 전용 State 커맨드 인터페이스
 * - undo/redo 책임은 Phase 3로 이관 예정이므로 포함하지 않는다.
 */
export interface StateCommand {
	description?: string;
	execute(context: StateContext): void;
}

/**
 * 렌더러 등 외부 소비자를 위한 읽기 전용 스냅샷
 * - 내부 상태 객체에 대한 직접 참조를 노출하지 않는다.
 */
export interface StateSnapshot {
	readonly nodes: ReadonlyArray<MindMapNode>;
	readonly edges: ReadonlyArray<MindMapEdge>;
	readonly rootId: NodeId;
	readonly pinnedNodeIds: ReadonlyArray<NodeId>;
	readonly collapsedNodeIds: ReadonlyArray<NodeId>;
	readonly selectedNodeId: NodeId | null;
	readonly editingNodeId: NodeId | null;
}

/**
 * 구조 검증용 Noop 커맨드
 */
export class NoopCommand implements StateCommand {
	description = 'no-op';

	execute(): void {
		// 의도적으로 아무 것도 하지 않음
	}
}
