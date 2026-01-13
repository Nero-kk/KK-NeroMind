/**
 * HistoryManager 사용 예시 (Phase 3.0 MVP용)
 *
 * === 예제 목록 ===
 * 1. AddNodeCommand - 노드 추가/제거
 * 2. RemoveNodeCommand - 노드 제거/추가
 * 3. UpdateNodeCommand - 노드 속성 변경
 * 4. MoveNodeCommand - 노드 이동
 * 5. SelectNodeCommand - 노드 선택 (EphemeralState - Undo 비대상)
 *
 * === 패턴 ===
 * - execute(): 순방향 작업
 * - undo(): 역방향 작업 (Inverse Operation)
 * - 메모리 스냅샷 금지: 필요한 데이터만 저장
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { MindMapNode, NodeId, Position } from '../types';

/**
 * 예제 1: AddNodeCommand
 *
 * 책임:
 * - execute(): 노드를 그래프에 추가
 * - undo(): 추가된 노드 제거
 *
 * 비책임:
 * - 레이아웃 계산
 * - 이벤트 발행 (StateManager이 처리)
 * - 부모 노드 자식 리스트 업데이트 (Phase 2+ 개선 예정)
 *
 * 역작업 안전성:
 * - execute에서 노드 ID만 저장하고 노드 객체는 보존
 * - undo에서 동일한 ID로 노드 제거
 */
export class AddNodeCommand implements UndoableCommand {
  description = 'Add node';
  private readonly node: MindMapNode;

  constructor(node: MindMapNode) {
    // 노드 객체는 reference로 보존 (복사 금지 - 메모리 효율성)
    this.node = node;
  }

  execute(context: StateContext): void {
    context.persistent.graph.nodes.set(this.node.id, this.node);

    // 루트 노드 설정 (첫 노드)
    if (!context.persistent.graph.rootId) {
      context.persistent.graph.rootId = this.node.id;
    }
  }

  undo(context: StateContext): void {
    context.persistent.graph.nodes.delete(this.node.id);

    // Phase 2+: 루트 노드 이었던 경우 처리
    // if (context.persistent.graph.rootId === this.node.id) {
    //   context.persistent.graph.rootId = '';
    // }
  }
}

/**
 * 예제 2: RemoveNodeCommand
 *
 * 책임:
 * - execute(): 노드를 그래프에서 제거
 * - undo(): 제거된 노드 복원
 *
 * 주의:
 * - 현재 불완전한 구현 (연결된 엣지 미처리)
 * - Phase 2+에서 완전한 구현 필요
 *
 * 역작업 안전성:
 * - execute에서 노드를 미리 저장
 * - undo에서 저장된 노드 복원
 */
export class RemoveNodeCommand implements UndoableCommand {
  description = 'Remove node';
  private readonly nodeId: NodeId;
  private savedNode: MindMapNode | null = null;

  constructor(nodeId: NodeId) {
    this.nodeId = nodeId;
  }

  execute(context: StateContext): void {
    // 복원을 위해 제거 전에 노드 저장
    this.savedNode = context.persistent.graph.nodes.get(this.nodeId) || null;

    // 노드 제거
    context.persistent.graph.nodes.delete(this.nodeId);

    // Phase 2+: 연결된 엣지도 제거
  }

  undo(context: StateContext): void {
    // 저장된 노드 복원
    if (this.savedNode) {
      context.persistent.graph.nodes.set(this.nodeId, this.savedNode);
    }
  }
}

/**
 * 예제 3: UpdateNodeCommand
 *
 * 책임:
 * - execute(): 노드 속성 변경
 * - undo(): 이전 속성값으로 복원
 *
 * 역작업 안전성:
 * - execute 실행 전에 이전 속성값 저장
 * - undo에서 저장된 값 복원
 *
 * 메모리 효율성:
 * - 변경된 필드만 저장 (전체 스냅샷 금지)
 */
export class UpdateNodeCommand implements UndoableCommand {
  description = 'Update node';
  private readonly nodeId: NodeId;
  private readonly updates: Partial<MindMapNode>;
  private savedValues: Record<string, any> = {};

  constructor(nodeId: NodeId, updates: Partial<MindMapNode>) {
    this.nodeId = nodeId;
    this.updates = updates;
  }

  execute(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node) return;

    // 역작업을 위해 이전 값 저장
    for (const key of Object.keys(this.updates) as (keyof MindMapNode)[]) {
      this.savedValues[key] = node[key];
    }

    // 속성 변경
    Object.assign(node, this.updates);
    node.updatedAt = Date.now();
  }

  undo(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node) return;

    // 저장된 값으로 복원
    Object.assign(node, this.savedValues);
    node.updatedAt = Date.now();
  }
}

/**
 * 예제 4: MoveNodeCommand
 *
 * 책임:
 * - execute(): 노드 위치 변경
 * - undo(): 이전 위치로 복원
 *
 * 역작업 안전성:
 * - 이전 위치를 저장하고 undo에서 복원
 *
 * 최적화:
 * - 위치 정보만 저장 (다른 속성은 무시)
 */
export class MoveNodeCommand implements UndoableCommand {
  description = 'Move node';
  private readonly nodeId: NodeId;
  private readonly newPosition: Position;
  private oldPosition: Position | null = null;

  constructor(nodeId: NodeId, newPosition: Position) {
    this.nodeId = nodeId;
    this.newPosition = newPosition;
  }

  execute(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node) return;

    // 이전 위치 저장
    this.oldPosition = { ...node.position };

    // 새 위치 적용
    node.position = { ...this.newPosition };
    node.updatedAt = Date.now();
  }

  undo(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node || !this.oldPosition) return;

    // 이전 위치로 복원
    node.position = { ...this.oldPosition };
    node.updatedAt = Date.now();
  }
}

/**
 * 예제 5: SelectNodeCommand (Ephemeral State)
 *
 * ⚠️ 주의: 이 예제는 Undo 대상이 아니므로 HistoryManager에 추가하지 않음
 *
 * 책임:
 * - execute(): 노드 선택
 * - undo(): 이전 선택 상태 복원
 *
 * 용도:
 * - 선택 상태도 undo하고 싶을 경우에만 사용
 * - 기본적으로는 ephemeralState이므로 undo 대상 아님
 *
 * 역작업 안전성:
 * - 이전 선택 노드 ID 저장
 */
export class SelectNodeCommand implements UndoableCommand {
  description = 'Select node';
  private readonly nodeId: NodeId | null;
  private previousSelectedId: NodeId | null = null;

  constructor(nodeId: NodeId | null) {
    this.nodeId = nodeId;
  }

  execute(context: StateContext): void {
    // 이전 선택 저장
    this.previousSelectedId = context.ephemeral.selectedNodeId;

    // 새로운 노드 선택
    if (context.ephemeral.selectedNodeId) {
      context.ephemeral.lastSelectedNodeId = context.ephemeral.selectedNodeId;
    }
    context.ephemeral.selectedNodeId = this.nodeId;
  }

  undo(context: StateContext): void {
    // 이전 선택 상태로 복원
    context.ephemeral.selectedNodeId = this.previousSelectedId;
  }
}

/**
 * === 사용 패턴 ===
 *
 * // HistoryManager 초기화
 * const stateManager = new StateManager();
 * const historyManager = new HistoryManager(stateManager);
 *
 * // 커맨드 실행 (히스토리에 기록)
 * const newNode: MindMapNode = {
 *   id: 'node-1',
 *   content: 'Hello',
 *   position: { x: 0, y: 0 },
 *   // ... 나머지 속성
 * };
 * const snapshot = historyManager.execute(new AddNodeCommand(newNode));
 *
 * // 취소 (Undo)
 * if (historyManager.canUndo()) {
 *   const previousSnapshot = historyManager.undo();
 * }
 *
 * // 히스토리 크기 확인
 * console.log(`Undo history: ${historyManager.getHistorySize()} items`);
 *
 * // StateManager 직접 접근 (히스토리에 기록되지 않음)
 * const currentSnapshot = historyManager.getStateManager().getSnapshot();
 */
