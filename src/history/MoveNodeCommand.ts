/**
 * MoveNodeCommand
 *
 * 책임:
 * - execute(): 노드 위치 변경 + userPosition true 설정
 * - undo(): 이전 position/userPosition 복구
 *
 * 비책임:
 * - 레이아웃 재계산 호출
 * - 렌더링 호출
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { NodeId, Position } from '../types';

export class MoveNodeCommand implements UndoableCommand {
  description = 'Move node';
  private readonly nodeId: NodeId;
  private nextPosition: Position;
  private prevPosition: Position | null = null;
  private prevUserPosition: boolean | null = null;
  private lastAppliedAt = 0;
  private createdAt = Date.now();

  constructor(nodeId: NodeId, nextPosition: Position) {
    this.nodeId = nodeId;
    this.nextPosition = { ...nextPosition };
  }

  execute(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node) return;

    if (!this.prevPosition) {
      this.prevPosition = { ...node.position };
    }
    if (this.prevUserPosition === null) {
      this.prevUserPosition = node.userPosition;
    }

    node.position = { ...this.nextPosition };
    node.userPosition = true;
    node.updatedAt = Date.now();
    this.lastAppliedAt = node.updatedAt;

    context.emit?.('nodeUpdated', { node });
  }

  undo(context: StateContext): void {
    const node = context.persistent.graph.nodes.get(this.nodeId);
    if (!node || !this.prevPosition || this.prevUserPosition === null) return;

    node.position = { ...this.prevPosition };
    node.userPosition = this.prevUserPosition;
    node.updatedAt = Date.now();

    context.emit?.('nodeUpdated', { node });
  }

  getNodeId(): NodeId {
    return this.nodeId;
  }

  getLastAppliedAt(): number {
    return this.lastAppliedAt;
  }

  updateNextPosition(nextPosition: Position): void {
    this.nextPosition = { ...nextPosition };
  }

  getNextPosition(): Position {
    return { ...this.nextPosition };
  }

  getCreatedAt(): number {
    return this.createdAt;
  }
}
