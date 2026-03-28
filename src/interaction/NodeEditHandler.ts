import type { StateManager } from "../core/StateManager";
import type { NodeRenderer } from "../canvas/NodeRenderer";
import type { KeyBinding, KeyBindingMap } from "../types";

/** 편집 완료 시 어떤 키로 완료했는지 전달하는 콜백 */
export type EditCompleteCallback = (
  nodeId: string,
  finishKey: "enter" | "tab" | "blur" | "escape",
) => void;

/**
 * 노드 인라인 텍스트 편집 핸들러.
 * foreignObject 내 div를 contenteditable로 전환하여 편집 모드를 구현한다.
 * 키바인딩 설정을 참조하여 편집 종료 키를 동적으로 매칭한다.
 */
export class NodeEditHandler {
  private stateManager: StateManager;
  private nodeRenderer: NodeRenderer;
  private keyBindings: KeyBindingMap;
  private editingNodeId: string | null = null;
  private originalLabel: string = "";
  private onEditComplete: EditCompleteCallback | null = null;

  constructor(stateManager: StateManager, nodeRenderer: NodeRenderer, keyBindings: KeyBindingMap) {
    this.stateManager = stateManager;
    this.nodeRenderer = nodeRenderer;
    this.keyBindings = keyBindings;
  }

  /** 키바인딩 업데이트 (설정 변경 시) */
  updateKeyBindings(keyBindings: KeyBindingMap): void {
    this.keyBindings = keyBindings;
  }

  /** 편집 완료 콜백 등록 */
  setOnEditComplete(callback: EditCompleteCallback): void {
    this.onEditComplete = callback;
  }

  isEditing(): boolean {
    return this.editingNodeId !== null;
  }

  getEditingNodeId(): string | null {
    return this.editingNodeId;
  }

  /** 편집 모드 진입 */
  startEdit(nodeId: string): void {
    if (this.editingNodeId) {
      this.finishEdit("blur");
    }

    const node = this.stateManager.getNodeById(nodeId);
    if (!node) return;

    this.editingNodeId = nodeId;
    this.originalLabel = node.label;

    const fo = this.nodeRenderer.getNodeElement(nodeId);
    if (!fo) return;

    // foreignObject > div.nm-node 구조 (직접 자식)
    const div = fo.firstElementChild as HTMLDivElement;
    if (!div) return;
    const label = div.querySelector(".nm-node__label") as HTMLSpanElement;
    if (!label) return;

    // contenteditable 활성화
    label.setAttribute("contenteditable", "true");
    label.classList.add("nm-node__label--editing");
    div.classList.add("nm-node--editing");

    // 텍스트 전체 선택
    label.focus();
    const range = document.createRange();
    range.selectNodeContents(label);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    // 이벤트 바인딩
    label.addEventListener("keydown", this.handleKeyDown);
    label.addEventListener("blur", this.handleBlur);
  }

  /** 편집 확정 (내부용 — finishKey 전달) */
  private finishEdit(finishKey: "enter" | "tab" | "blur" | "escape"): void {
    if (!this.editingNodeId) return;

    const editedNodeId = this.editingNodeId;
    const fo = this.nodeRenderer.getNodeElement(editedNodeId);
    if (fo) {
      const div = fo.firstElementChild as HTMLDivElement;
      const label = div?.querySelector(".nm-node__label") as HTMLSpanElement;
      if (!div || !label) {
        this.editingNodeId = null;
        this.originalLabel = "";
        return;
      }

      // 이벤트 해제
      label.removeEventListener("keydown", this.handleKeyDown);
      label.removeEventListener("blur", this.handleBlur);

      // contenteditable 비활성화
      label.removeAttribute("contenteditable");
      label.classList.remove("nm-node__label--editing");
      div.classList.remove("nm-node--editing");

      // 편집 내용 확정 (모든 종료 키에서 현재 값 저장)
      const newLabel = label.textContent?.trim() || this.originalLabel;
      if (newLabel !== this.originalLabel) {
        this.stateManager.applyAction({
          type: "RENAME_NODE",
          nodeId: editedNodeId,
          label: newLabel,
        });
      }
    }

    this.editingNodeId = null;
    this.originalLabel = "";

    // 콜백 호출 (편집 완료 후 노드 생성 등 후속 처리)
    this.onEditComplete?.(editedNodeId, finishKey);
  }

  /** 외부에서 호출하는 편집 확정 */
  confirmEdit(): void {
    this.finishEdit("blur");
  }

  /** 외부에서 호출하는 편집 취소 */
  cancelEdit(): void {
    this.finishEdit("escape");
  }

  /** 키 이벤트를 키바인딩 설정과 매칭하여 편집 종료 판단 */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.matchesBinding(e, this.keyBindings.addChild)) {
      e.preventDefault();
      e.stopPropagation();
      this.finishEdit("tab");
    } else if (this.matchesBinding(e, this.keyBindings.addSibling)) {
      e.preventDefault();
      e.stopPropagation();
      this.finishEdit("enter");
    } else if (this.matchesBinding(e, this.keyBindings.escape)) {
      e.preventDefault();
      e.stopPropagation();
      this.finishEdit("escape");
    }
  };

  /** KeyboardEvent가 KeyBinding과 일치하는지 확인 */
  private matchesBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
    if (e.key !== binding.key) return false;
    if (!!binding.ctrl !== (e.ctrlKey || e.metaKey)) return false;
    if (!!binding.shift !== e.shiftKey) return false;
    if (!!binding.alt !== e.altKey) return false;
    return true;
  }

  private handleBlur = (): void => {
    // 포커스 이탈 시 확정
    setTimeout(() => {
      if (this.editingNodeId) {
        this.finishEdit("blur");
      }
    }, 100);
  };
}
