import type { MindMapDocument } from "../types";
import { HISTORY_MAX_SIZE } from "../constants";

/**
 * Undo/Redo 히스토리 스택.
 * 각 항목은 MindMapDocument의 전체 스냅샷이다.
 * 불변 구조의 structural sharing 덕분에 메모리 효율적이다.
 */
export class HistoryManager {
  private undoStack: MindMapDocument[] = [];
  private redoStack: MindMapDocument[] = [];

  /** 변경 전 스냅샷을 히스토리에 push */
  push(snapshot: MindMapDocument): void {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > HISTORY_MAX_SIZE) {
      this.undoStack.shift();
    }
    // 새 변경이 발생하면 redo 스택은 초기화
    this.redoStack = [];
  }

  /** 이전 상태로 되돌린다. 현재 상태를 redo 스택에 저장 */
  undo(currentDoc: MindMapDocument): MindMapDocument | undefined {
    const prev = this.undoStack.pop();
    if (!prev) return undefined;
    this.redoStack.push(currentDoc);
    return prev;
  }

  /** 다시 실행한다. 현재 상태를 undo 스택에 저장 */
  redo(currentDoc: MindMapDocument): MindMapDocument | undefined {
    const next = this.redoStack.pop();
    if (!next) return undefined;
    this.undoStack.push(currentDoc);
    return next;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
