/**
 * CreateNodeCommand
 *
 * 책임:
 * - execute(): 노드 생성 및 그래프에 추가, 부모 연결
 * - undo(): 생성된 노드 제거 및 부모 연결 해제
 *
 * 비책임:
 * - EventBus 발행
 * - Renderer 호출
 * - 레이아웃 계산
 * - Edge 생성 (Phase 2+)
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import { MindMapNode } from '../types';

export class CreateNodeCommand implements UndoableCommand {
  description = 'Create node';
  private readonly node: MindMapNode;
  private parentWasUpdated = false;

  constructor(node: MindMapNode) {
    this.node = node;
  }

  execute(context: StateContext): void {
    // 노드 추가
    context.persistent.graph.nodes.set(this.node.id, this.node);

    // 루트 노드 설정 (첫 노드)
    if (!context.persistent.graph.rootId) {
      context.persistent.graph.rootId = this.node.id;
    }

    // 부모 노드에 자식 추가
    if (this.node.parentId) {
      const parent = context.persistent.graph.nodes.get(this.node.parentId);
      if (parent && !parent.childIds.includes(this.node.id)) {
        parent.childIds.push(this.node.id);
        parent.updatedAt = Date.now();
        this.parentWasUpdated = true;
      }
    }
  }

  undo(context: StateContext): void {
    // 부모 노드에서 자식 제거
    if (this.parentWasUpdated && this.node.parentId) {
      const parent = context.persistent.graph.nodes.get(this.node.parentId);
      if (parent) {
        const index = parent.childIds.indexOf(this.node.id);
        if (index !== -1) {
          parent.childIds.splice(index, 1);
          parent.updatedAt = Date.now();
        }
      }
    }

    // 노드 제거
    context.persistent.graph.nodes.delete(this.node.id);
  }
}
