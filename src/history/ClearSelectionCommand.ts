/**
 * ClearSelectionCommand
 *
 * Phase 5.1: 선택 해제 Command
 *
 * === 책임 (Responsibilities) ===
 * - execute(): 선택 상태를 null로 설정 (선택 해제)
 * - undo(): 이전 선택 상태로 복원
 * - Undo/Redo 지원 (persistentState이므로)
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ EventBus 발행: StateManager의 책임
 * - ❌ Renderer 호출: StateManager가 snapshot 반환 후 외부에서 처리
 *
 * === 구조 패턴 ===
 * - Inverse Operation 패턴: undo()는 execute()를 정확히 역으로 되돌림
 * - SelectNodeCommand(null)과 동일하지만 의미적으로 구분
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { NodeId } from '../types';

export class ClearSelectionCommand implements UndoableCommand {
	description = 'Clear selection';

	private previousNodeId: NodeId | null = null;
	private isFirstExecution = true;

	/**
	 * execute: 선택 해제 (null 설정)
	 *
	 * Phase 5.1:
	 * - persistentState.ui.selectedNodeId = null
	 */
	execute(context: StateContext): void {
		// 첫 실행 시 이전 값 저장
		if (this.isFirstExecution) {
			this.previousNodeId = context.persistent.ui.selectedNodeId;
			this.isFirstExecution = false;
		}

		// 선택 해제
		context.persistent.ui.selectedNodeId = null;
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
