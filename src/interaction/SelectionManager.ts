import type { StateManager } from "../core/StateManager";
import { flattenTree } from "../core/MindMapNode";

/**
 * 노드 선택 관리자.
 * 단일 선택, Ctrl+Click, Shift+Click 범위 선택을 지원한다.
 */
export class SelectionManager {
  private stateManager: StateManager;
  private lastSelectedId: string | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /** 단일 선택 (기존 선택 해제) */
  select(nodeId: string): void {
    this.lastSelectedId = nodeId;
    this.stateManager.applyAction({
      type: "SET_SELECTION",
      nodeIds: [nodeId],
    });
  }

  /** 선택에 추가/제거 토글 (Ctrl+Click) */
  toggleSelection(nodeId: string): void {
    const current = new Set(this.stateManager.getSelectedNodeIds());
    if (current.has(nodeId)) {
      current.delete(nodeId);
    } else {
      current.add(nodeId);
    }
    this.lastSelectedId = nodeId;
    this.stateManager.applyAction({
      type: "SET_SELECTION",
      nodeIds: [...current],
    });
  }

  /** 범위 선택 (Shift+Click) */
  selectRange(nodeId: string): void {
    if (!this.lastSelectedId) {
      this.select(nodeId);
      return;
    }

    const doc = this.stateManager.getDocument();
    const flat = flattenTree(doc.root);
    const fromIdx = flat.findIndex((n) => n.id === this.lastSelectedId);
    const toIdx = flat.findIndex((n) => n.id === nodeId);

    if (fromIdx < 0 || toIdx < 0) {
      this.select(nodeId);
      return;
    }

    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const nodeIds = flat.slice(start, end + 1).map((n) => n.id);

    this.stateManager.applyAction({
      type: "SET_SELECTION",
      nodeIds,
    });
  }

  /** 선택 해제 */
  clearSelection(): void {
    this.lastSelectedId = null;
    const rootId = this.stateManager.getDocument().root.id;
    this.stateManager.applyAction({
      type: "SET_SELECTION",
      nodeIds: [rootId],
    });
  }

  /** 클릭 이벤트에서 modifier 키에 따라 적절한 선택 수행 */
  handleClick(nodeId: string, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      this.toggleSelection(nodeId);
    } else if (event.shiftKey) {
      this.selectRange(nodeId);
    } else {
      this.select(nodeId);
    }
  }
}
