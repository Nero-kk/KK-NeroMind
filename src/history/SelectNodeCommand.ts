/**
 * SelectNodeCommand
 *
 * Phase 5.1: 선택 상태를 persistentState.ui에서 관리 (Undo 대상)
 *
 * === 책임 (Responsibilities) ===
 * - execute(): 노드 선택 상태 변경 (persistent state)
 * - undo(): 이전 선택 상태로 복원
 * - Undo/Redo 지원 (persistentState이므로)
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ EventBus 발행: StateManager의 책임
 * - ❌ Renderer 호출: StateManager가 snapshot 반환 후 외부에서 처리
 * - ❌ 노드 존재 여부 검증: 호출자 책임
 *
 * === 구조 패턴 ===
 * - Inverse Operation 패턴: undo()는 execute()를 정확히 역으로 되돌림
 * - previousNodeId 저장: 첫 execute() 시 자동 저장
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { NodeId } from '../types';

export class SelectNodeCommand implements UndoableCommand {
	description = 'Select node';

	private previousNodeId: NodeId | null = null;
	private isFirstExecution = true;

	constructor(private readonly newNodeId: NodeId | null) {}

	/**
	 * execute: 노드 선택 상태 변경
	 *
	 * Phase 5.1:
	 * - persistentState.ui.selectedNodeId 변경 (Undo 대상)
	 * - lastSelectedNodeId는 ephemeral에 유지 (Undo 비대상)
	 */
	execute(context: StateContext): void {
		// 첫 실행 시 이전 값 저장
		if (this.isFirstExecution) {
			this.previousNodeId = context.persistent.ui.selectedNodeId;
			this.isFirstExecution = false;
		}

		// lastSelectedNodeId 업데이트 (ephemeral, Undo 비대상)
		if (context.persistent.ui.selectedNodeId !== null) {
			context.ephemeral.lastSelectedNodeId =
				context.persistent.ui.selectedNodeId;
		}

		// 새 선택 상태 설정 (persistent, Undo 대상)
		context.persistent.ui.selectedNodeId = this.newNodeId;
	}

	/**
	 * undo: 이전 선택 상태로 복원
	 *
	 * Phase 5.1:
	 * - persistentState.ui.selectedNodeId를 previousNodeId로 복원
	 */
	undo(context: StateContext): void {
		context.persistent.ui.selectedNodeId = this.previousNodeId;
	}
}
