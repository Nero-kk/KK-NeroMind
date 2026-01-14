/**
 * MoveNodeCommand
 *
 * Phase 4.x: 노드 위치 이동을 Command로 캡슐화
 *
 * === 책임 (Responsibilities) ===
 * - execute(): 노드 위치를 to로 이동 (persistent state)
 * - undo(): 노드 위치를 from으로 복원
 * - position 변경만 담당 (단일 책임)
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ 레이아웃 계산: 외부에서 좌표 계산 후 전달받음
 * - ❌ 다른 노드 영향: 오직 지정된 노드만 이동
 * - ❌ DOM/SVG 접근: 순수 상태 변경만 수행
 * - ❌ 노드 존재 여부 검증: 호출자 책임
 * - ❌ EventBus 발행: StateManager의 책임
 * - ❌ Renderer 호출: StateManager가 snapshot 반환 후 외부에서 처리
 *
 * === 구조 패턴 ===
 * - Inverse Operation 패턴: undo()는 execute()를 정확히 역으로 되돌림
 * - from/to 좌표는 생성자에서 확정 (immutable)
 * - updatedAt 자동 갱신
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { NodeId, Position } from '../types';

export class MoveNodeCommand implements UndoableCommand {
	description = 'Move node';

	constructor(
		private readonly nodeId: NodeId,
		private readonly from: Position,
		private readonly to: Position
	) {}

	/**
	 * execute: 노드 위치를 to로 이동
	 *
	 * 동작:
	 * 1. 노드를 persistent state에서 조회
	 * 2. position을 to로 변경
	 * 3. updatedAt 자동 갱신
	 */
	execute(context: StateContext): void {
		const node = context.persistent.graph.nodes.get(this.nodeId);
		if (!node) {
			// 노드가 없으면 조용히 실패 (방어 코드)
			return;
		}

		// 위치 변경
		node.position.x = this.to.x;
		node.position.y = this.to.y;

		// 메타데이터 갱신
		node.updatedAt = Date.now();
	}

	/**
	 * undo: 노드 위치를 from으로 복원
	 *
	 * 동작:
	 * 1. 노드를 persistent state에서 조회
	 * 2. position을 from으로 복원
	 * 3. updatedAt 자동 갱신
	 */
	undo(context: StateContext): void {
		const node = context.persistent.graph.nodes.get(this.nodeId);
		if (!node) {
			// 노드가 없으면 조용히 실패 (방어 코드)
			return;
		}

		// 위치 복원
		node.position.x = this.from.x;
		node.position.y = this.from.y;

		// 메타데이터 갱신
		node.updatedAt = Date.now();
	}
}
