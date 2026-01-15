/**
 * ResetNodeToAutoLayoutCommand
 *
 * 책임:
 * - execute(): userPosition false로 전환 후 레이아웃 재계산 요청 이벤트 발행
 * - undo(): 이전 position/userPosition 완전 복구
 *
 * 비책임:
 * - 레이아웃 계산 직접 호출
 * - 렌더링 호출
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { NodeId, Position } from '../types';

type NodeSnapshot = {
  position: Position;
  userPosition: boolean;
};

export class ResetNodeToAutoLayoutCommand implements UndoableCommand {
  description = 'Reset node to auto layout';
  private readonly nodeIds: NodeId[];
  private readonly prevStates = new Map<NodeId, NodeSnapshot>();

  constructor(nodeIds: NodeId[] | NodeId) {
    this.nodeIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
  }

  execute(context: StateContext): void {
    const validRootIds: NodeId[] = [];

    for (const nodeId of this.nodeIds) {
      const node = context.persistent.graph.nodes.get(nodeId);
      if (!node) continue;

      if (!this.prevStates.has(nodeId)) {
        this.prevStates.set(nodeId, {
          position: { ...node.position },
          userPosition: node.userPosition,
        });
      }

      node.userPosition = false;
      node.updatedAt = Date.now();
      validRootIds.push(nodeId);
    }

    if (validRootIds.length > 0) {
      context.emit?.('layoutResetRequested', { rootIds: validRootIds });
    }
  }

  undo(context: StateContext): void {
    for (const [nodeId, snapshot] of this.prevStates) {
      const node = context.persistent.graph.nodes.get(nodeId);
      if (!node) continue;
      node.position = { ...snapshot.position };
      node.userPosition = snapshot.userPosition;
      node.updatedAt = Date.now();
      context.emit?.('nodeUpdated', { node });
    }
  }
}
