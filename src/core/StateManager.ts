import type {
  MindMapDocument,
  MindMapNode,
  MindMapAction,
  StateListener,
  Unsubscribe,
} from "../types";
import { NON_HISTORY_ACTIONS } from "../types";
import { HistoryManager } from "./HistoryManager";
import {
  addChildToNode,
  addChildrenToNode,
  addSiblingToNode,
  removeNodeFromTree,
  updateNodeInTree,
  moveNode,
  reorderNode,
  findNodeById,
  updateNoteRefInTree,
  unlinkNoteRefInTree,
} from "./MindMapNode";

/**
 * 중앙 상태 관리자.
 * 불변 업데이트 + Observer 패턴 + Undo/Redo 통합.
 */
export class StateManager {
  private document: MindMapDocument;
  private selectedNodeIds: Set<string> = new Set();
  private listeners: Set<StateListener> = new Set();
  private history: HistoryManager;

  constructor(initialDoc: MindMapDocument) {
    this.document = initialDoc;
    this.history = new HistoryManager();
    // 루트 노드를 기본 선택
    this.selectedNodeIds.add(initialDoc.root.id);
  }

  // === 상태 읽기 ===

  getDocument(): MindMapDocument {
    return this.document;
  }

  getNodeById(id: string): MindMapNode | undefined {
    return findNodeById(this.document.root, id);
  }

  getSelectedNodeIds(): ReadonlySet<string> {
    return this.selectedNodeIds;
  }

  getFirstSelectedId(): string | undefined {
    return this.selectedNodeIds.values().next().value;
  }

  // === 상태 변경 ===

  applyAction(action: MindMapAction): void {
    const shouldRecord = !NON_HISTORY_ACTIONS.has(action.type);

    if (shouldRecord) {
      this.history.push(this.document);
    }

    const newDoc = this.reduce(this.document, action);
    this.document = newDoc;

    this.notifyListeners(action);
  }

  // === Undo/Redo ===

  undo(): void {
    const prev = this.history.undo(this.document);
    if (prev) {
      this.document = prev;
      const action: MindMapAction = { type: "LOAD_DOCUMENT", document: prev };
      this.notifyListeners(action);
    }
  }

  redo(): void {
    const next = this.history.redo(this.document);
    if (next) {
      this.document = next;
      const action: MindMapAction = { type: "LOAD_DOCUMENT", document: next };
      this.notifyListeners(action);
    }
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  // === 구독 ===

  subscribe(listener: StateListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // === 리듀서 ===

  private reduce(doc: MindMapDocument, action: MindMapAction): MindMapDocument {
    const now = new Date().toISOString();

    switch (action.type) {
      case "ADD_CHILD": {
        const newRoot = addChildToNode(doc.root, action.parentId, action.node);
        this.selectedNodeIds = new Set([action.node.id]);
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "ADD_SIBLING": {
        const newRoot = addSiblingToNode(doc.root, action.siblingId, action.node);
        this.selectedNodeIds = new Set([action.node.id]);
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "DELETE_NODE": {
        if (action.nodeId === doc.root.id) return doc; // 루트 삭제 불가
        const newRoot = removeNodeFromTree(doc.root, action.nodeId);
        this.selectedNodeIds.delete(action.nodeId);
        if (this.selectedNodeIds.size === 0) {
          this.selectedNodeIds.add(doc.root.id);
        }
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "RENAME_NODE": {
        const newRoot = updateNodeInTree(doc.root, action.nodeId, (node) => ({
          ...node,
          label: action.label,
        }));
        // 루트 노드의 이름이 변경되면 문서 제목도 동기화
        const newTitle = action.nodeId === doc.root.id ? action.label : doc.title;
        return { ...doc, root: newRoot, title: newTitle, updatedAt: now };
      }

      case "MOVE_NODE": {
        const newRoot = moveNode(doc.root, action.nodeId, action.newParentId, action.index);
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "REORDER_NODE": {
        const newRoot = reorderNode(doc.root, action.nodeId, action.direction);
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "TOGGLE_COLLAPSE": {
        const newRoot = updateNodeInTree(doc.root, action.nodeId, (node) => ({
          ...node,
          collapsed: !node.collapsed,
        }));
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "LINK_NOTE": {
        const newRoot = updateNodeInTree(doc.root, action.nodeId, (node) => ({
          ...node,
          noteRef: action.noteRef,
          label: action.label ?? node.label,
        }));
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "UNLINK_NOTE": {
        const newRoot = updateNodeInTree(doc.root, action.nodeId, (node) => {
          const { noteRef: _, ...rest } = node;
          return { ...rest, children: node.children };
        });
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "SET_AUTO_ALIGN":
        return { ...doc, autoAlign: action.enabled, updatedAt: now };

      case "UPDATE_POSITION": {
        const newRoot = updateNodeInTree(doc.root, action.nodeId, (node) => ({
          ...node,
          position: action.position,
        }));
        return { ...doc, root: newRoot, updatedAt: now };
      }

      case "UPDATE_VIEWPORT": {
        const newViewport = { ...doc.viewport, ...action.viewport };
        return { ...doc, viewport: newViewport };
      }

      case "SET_SELECTION": {
        this.selectedNodeIds = new Set(action.nodeIds);
        return doc; // 문서 자체는 변경 없음
      }

      case "LOAD_DOCUMENT":
        this.history.clear();
        this.selectedNodeIds = new Set([action.document.root.id]);
        return action.document;

      case "SET_THEME":
        return { ...doc, theme: action.theme };

      case "UPDATE_NOTE_REF": {
        const newRoot = updateNoteRefInTree(doc.root, action.oldPath, action.newPath);
        return newRoot !== doc.root ? { ...doc, root: newRoot, updatedAt: now } : doc;
      }

      case "UNLINK_NOTE_BY_REF": {
        const newRoot = unlinkNoteRefInTree(doc.root, action.notePath);
        return newRoot !== doc.root ? { ...doc, root: newRoot, updatedAt: now } : doc;
      }

      case "ADD_CHILDREN_BATCH": {
        const newRoot = addChildrenToNode(doc.root, action.parentId, action.nodes);
        if (action.nodes.length > 0) {
          this.selectedNodeIds = new Set([action.nodes[0].id]);
        }
        return { ...doc, root: newRoot, updatedAt: now };
      }
    }
  }

  private notifyListeners(action: MindMapAction): void {
    for (const listener of this.listeners) {
      listener(this.document, action);
    }
  }
}
