/**
 * UndoableCommand Interface
 *
 * === 책임 (Responsibilities) ===
 * - execute(): 작업을 실행하고 상태 변경 (순방향)
 * - undo(): execute를 역으로 되돌림 (역방향)
 * - description: 커맨드의 의미있는 이름 (사용자용 라벨)
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ 상태 스냅샷 저장: HistoryManager가 관리
 * - ❌ 이벤트 발행: StateManager의 책임
 * - ❌ StateContext 직접 조작: execute/undo 구현체가 관리
 * - ❌ 유효성 검증: 커맨드 구현체에서 처리
 *
 * === Inverse Operation 패턴 ===
 * undo()는 execute()를 정확히 역으로 되돌려야 함.
 * 예: execute()가 노드 추가이면, undo()는 그 노드 제거
 *
 * === 구현 예시 ===
 * class AddNodeCommand implements UndoableCommand {
 *   description = 'Add node';
 *   private nodeId: string;
 *   private node: MindMapNode;
 *
 *   constructor(node: MindMapNode) {
 *     this.node = node;
 *     this.nodeId = node.id;
 *   }
 *
 *   execute(context: StateContext): void {
 *     context.persistent.graph.nodes.set(this.nodeId, this.node);
 *     // inverse를 위해 노드 참조 보존
 *   }
 *
 *   undo(context: StateContext): void {
 *     context.persistent.graph.nodes.delete(this.nodeId);
 *   }
 * }
 */

import { StateContext } from '../state/stateTypes';

export interface UndoableCommand {
  /**
   * 커맨드 실행 (순방향)
   * - 상태를 변경하는 모든 작업을 수행
   * - 나중에 undo()를 정확히 역으로 되돌릴 수 있도록 필요한 데이터 보존
   */
  execute(context: StateContext): void;

  /**
   * 커맨드 실행 취소 (역방향)
   * - execute()를 정확히 역으로 되돌림
   * - Inverse Operation 패턴: 원래 상태로 완벽하게 복원
   */
  undo(context: StateContext): void;

  /**
   * 커맨드 설명 (사용자 라벨)
   * - undo 버튼 텍스트 등에 사용: "Undo: Add node"
   * - 디버깅용 로깅
   */
  description: string;
}
