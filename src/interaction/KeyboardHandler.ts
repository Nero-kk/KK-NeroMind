import type { App } from "obsidian";
import type { StateManager } from "../core/StateManager";
import type { NodeEditHandler } from "./NodeEditHandler";
import type { SelectionManager } from "./SelectionManager";
import type { KeyBinding, KeyBindingMap, KeyActionName } from "../types";
import { createNode, findParentNode, countDescendants } from "../core/MindMapNode";
import { ConfirmDeleteModal } from "../view/ConfirmDeleteModal";

/**
 * 키보드 이벤트 중앙 처리기.
 * 설정 가능한 키바인딩 맵을 사용하여 마인드맵 조작 단축키를 처리한다.
 */
export class KeyboardHandler {
  private app: App;
  private stateManager: StateManager;
  private editHandler: NodeEditHandler;
  private selectionManager: SelectionManager;
  private keyBindings: KeyBindingMap;

  constructor(
    app: App,
    stateManager: StateManager,
    editHandler: NodeEditHandler,
    selectionManager: SelectionManager,
    keyBindings: KeyBindingMap,
  ) {
    this.app = app;
    this.stateManager = stateManager;
    this.editHandler = editHandler;
    this.selectionManager = selectionManager;
    this.keyBindings = keyBindings;
  }

  /** 키바인딩 업데이트 (설정 변경 시 호출) */
  updateKeyBindings(keyBindings: KeyBindingMap): void {
    this.keyBindings = keyBindings;
  }

  /** 키보드 이벤트 처리. true를 반환하면 이벤트가 소비됨 */
  handleKeyDown(e: KeyboardEvent): boolean {
    // 편집 모드 중이면 무시 (NodeEditHandler가 직접 처리)
    if (this.editHandler.isEditing()) return false;

    const action = this.matchAction(e);
    if (!action) return false;

    return this.executeAction(action, e);
  }

  /** 이벤트를 키바인딩 맵과 매칭하여 액션 이름 반환 */
  private matchAction(e: KeyboardEvent): KeyActionName | null {
    const entries = Object.entries(this.keyBindings) as ReadonlyArray<[KeyActionName, KeyBinding]>;

    for (const [actionName, binding] of entries) {
      if (this.matchesBinding(e, binding)) {
        return actionName;
      }
    }
    return null;
  }

  /** 키보드 이벤트가 바인딩과 일치하는지 확인 */
  private matchesBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
    const keyMatch = e.key.toLowerCase() === binding.key.toLowerCase()
      || e.key === binding.key; // Space 등 특수키 대소문자 무관 매칭

    if (!keyMatch) return false;

    const ctrlRequired = binding.ctrl ?? false;
    const shiftRequired = binding.shift ?? false;
    const altRequired = binding.alt ?? false;
    const metaRequired = binding.meta ?? false;

    // ctrl/meta 통합 (macOS 호환)
    const ctrlMatch = ctrlRequired ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
    const shiftMatch = shiftRequired ? e.shiftKey : !e.shiftKey;
    const altMatch = altRequired ? e.altKey : !e.altKey;
    const metaMatch = metaRequired ? e.metaKey : true; // meta는 ctrl 통합으로 별도 체크 생략

    return ctrlMatch && shiftMatch && altMatch && (metaRequired ? metaMatch : true);
  }

  /** 매칭된 액션 실행 */
  private executeAction(action: KeyActionName, e: KeyboardEvent): boolean {
    const selectedId = this.stateManager.getFirstSelectedId();

    switch (action) {
      case "undo":
        e.preventDefault();
        this.stateManager.undo();
        return true;

      case "redo":
        e.preventDefault();
        this.stateManager.redo();
        return true;

      case "addChild": {
        if (!selectedId) return false;
        e.preventDefault();
        const newChild = createNode("");
        this.stateManager.applyAction({
          type: "ADD_CHILD",
          parentId: selectedId,
          node: newChild,
        });
        requestAnimationFrame(() => {
          this.editHandler.startEdit(newChild.id);
        });
        return true;
      }

      case "addSibling": {
        if (!selectedId) return false;
        e.preventDefault();
        const doc = this.stateManager.getDocument();
        if (selectedId === doc.root.id) return true;
        const newSibling = createNode("");
        this.stateManager.applyAction({
          type: "ADD_SIBLING",
          siblingId: selectedId,
          node: newSibling,
        });
        requestAnimationFrame(() => {
          this.editHandler.startEdit(newSibling.id);
        });
        return true;
      }

      case "deleteNode": {
        if (!selectedId) return false;
        e.preventDefault();
        this.handleDelete();
        return true;
      }

      case "rename": {
        if (!selectedId) return false;
        e.preventDefault();
        this.editHandler.startEdit(selectedId);
        return true;
      }

      case "escape":
        e.preventDefault();
        this.selectionManager.clearSelection();
        return true;

      case "navUp": {
        if (!selectedId) return false;
        e.preventDefault();
        this.navigateSibling(selectedId, "prev");
        return true;
      }

      case "navDown": {
        if (!selectedId) return false;
        e.preventDefault();
        this.navigateSibling(selectedId, "next");
        return true;
      }

      case "navLeft": {
        if (!selectedId) return false;
        e.preventDefault();
        this.navigateToParent(selectedId);
        return true;
      }

      case "navRight": {
        if (!selectedId) return false;
        e.preventDefault();
        this.navigateToFirstChild(selectedId);
        return true;
      }

      case "reorderUp": {
        if (!selectedId) return false;
        e.preventDefault();
        this.stateManager.applyAction({
          type: "REORDER_NODE",
          nodeId: selectedId,
          direction: "up",
        });
        return true;
      }

      case "reorderDown": {
        if (!selectedId) return false;
        e.preventDefault();
        this.stateManager.applyAction({
          type: "REORDER_NODE",
          nodeId: selectedId,
          direction: "down",
        });
        return true;
      }

      case "moveToParent": {
        if (!selectedId) return false;
        e.preventDefault();
        this.moveToParentLevel(selectedId);
        return true;
      }

      case "moveToChild": {
        if (!selectedId) return false;
        e.preventDefault();
        this.moveToChildLevel(selectedId);
        return true;
      }

      case "toggleCollapse": {
        if (!selectedId) return false;
        e.preventDefault();
        const node = this.stateManager.getNodeById(selectedId);
        if (node && node.children.length > 0) {
          this.stateManager.applyAction({
            type: "TOGGLE_COLLAPSE",
            nodeId: selectedId,
          });
        }
        return true;
      }

      default:
        return false;
    }
  }

  // === 네비게이션 ===

  private navigateSibling(nodeId: string, direction: "prev" | "next"): void {
    const doc = this.stateManager.getDocument();
    const parent = findParentNode(doc.root, nodeId);
    if (!parent) return;

    const idx = parent.children.findIndex((c) => c.id === nodeId);
    const newIdx = direction === "prev" ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < parent.children.length) {
      this.selectionManager.select(parent.children[newIdx].id);
    }
  }

  private navigateToParent(nodeId: string): void {
    const doc = this.stateManager.getDocument();
    const parent = findParentNode(doc.root, nodeId);
    if (parent) {
      this.selectionManager.select(parent.id);
    }
  }

  private navigateToFirstChild(nodeId: string): void {
    const node = this.stateManager.getNodeById(nodeId);
    if (node && node.children.length > 0 && !node.collapsed) {
      this.selectionManager.select(node.children[0].id);
    }
  }

  // === 노드 레벨 이동 (Shift+좌우) ===

  /** 노드를 부모 레벨로 이동 (부모의 형제가 됨) */
  private moveToParentLevel(nodeId: string): void {
    const doc = this.stateManager.getDocument();
    const parent = findParentNode(doc.root, nodeId);
    if (!parent || parent.id === doc.root.id) return;

    const grandParent = findParentNode(doc.root, parent.id);
    if (!grandParent) return;

    const parentIdx = grandParent.children.findIndex((c) => c.id === parent.id);
    this.stateManager.applyAction({
      type: "MOVE_NODE",
      nodeId,
      newParentId: grandParent.id,
      index: parentIdx + 1,
    });
  }

  /** 노드를 이전 형제의 자식으로 이동 */
  private moveToChildLevel(nodeId: string): void {
    const doc = this.stateManager.getDocument();
    const parent = findParentNode(doc.root, nodeId);
    if (!parent) return;

    const idx = parent.children.findIndex((c) => c.id === nodeId);
    if (idx <= 0) return;

    const prevSibling = parent.children[idx - 1];
    this.stateManager.applyAction({
      type: "MOVE_NODE",
      nodeId,
      newParentId: prevSibling.id,
    });
  }

  // === 삭제 확인 ===

  /** 선택된 노드 삭제 (하위 노드가 있으면 확인 다이얼로그 표시) */
  private handleDelete(): void {
    const doc = this.stateManager.getDocument();
    const selectedIds = this.stateManager.getSelectedNodeIds();
    const deletableIds = [...selectedIds].filter((id) => id !== doc.root.id);
    if (deletableIds.length === 0) return;

    // 삭제 전 인접 노드 탐색 (삭제 후 선택할 노드)
    const nextSelectId = this.findNearestSibling(doc.root, deletableIds[0]);

    // 하위 노드가 있는지 확인
    let totalDescendants = 0;
    let firstLabel = "";
    for (const id of deletableIds) {
      const node = this.stateManager.getNodeById(id);
      if (node) {
        if (!firstLabel) firstLabel = node.label;
        totalDescendants += countDescendants(node);
      }
    }

    const executeDelete = (): void => {
      for (const id of deletableIds) {
        this.stateManager.applyAction({
          type: "DELETE_NODE",
          nodeId: id,
        });
      }
      // 인접 형제가 있으면 선택, 없으면 부모 선택 (StateManager 기본 동작)
      if (nextSelectId) {
        this.selectionManager.select(nextSelectId);
      }
    };

    // 하위 노드가 없으면 즉시 삭제
    if (totalDescendants === 0) {
      executeDelete();
      return;
    }

    // 하위 노드가 있으면 확인 다이얼로그 표시
    const label = deletableIds.length > 1
      ? `${firstLabel} 외 ${deletableIds.length - 1}개`
      : firstLabel;

    const modal = new ConfirmDeleteModal(
      this.app,
      label,
      totalDescendants,
      executeDelete,
    );
    modal.open();
  }

  /** 삭제 대상의 인접 형제 노드 ID 반환 (아래 → 위 → 부모 순) */
  private findNearestSibling(root: MindMapNode, nodeId: string): string | null {
    const parent = this.findParent(root, nodeId);
    if (!parent) return null;

    const idx = parent.children.findIndex((c) => c.id === nodeId);
    if (idx === -1) return null;

    // 아래 형제 우선
    if (idx < parent.children.length - 1) {
      return parent.children[idx + 1].id;
    }
    // 위 형제
    if (idx > 0) {
      return parent.children[idx - 1].id;
    }
    // 형제 없으면 부모
    return parent.id;
  }

  /** 트리에서 특정 노드의 부모 찾기 */
  private findParent(root: MindMapNode, nodeId: string): MindMapNode | null {
    for (const child of root.children) {
      if (child.id === nodeId) return root;
      const found = this.findParent(child, nodeId);
      if (found) return found;
    }
    return null;
  }
}
