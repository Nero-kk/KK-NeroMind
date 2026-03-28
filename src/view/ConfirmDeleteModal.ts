import { Modal, type App } from "obsidian";

/**
 * 하위 노드가 있는 노드 삭제 시 확인 다이얼로그.
 * 삭제 대상 노드 이름과 하위 노드 수를 표시한다.
 */
export class ConfirmDeleteModal extends Modal {
  private nodeLabel: string;
  private descendantCount: number;
  private onConfirm: () => void;

  constructor(
    app: App,
    nodeLabel: string,
    descendantCount: number,
    onConfirm: () => void,
  ) {
    super(app);
    this.nodeLabel = nodeLabel;
    this.descendantCount = descendantCount;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nm-confirm-delete");

    contentEl.createEl("h3", { text: "노드 삭제 확인" });

    const label = this.nodeLabel || "(빈 노드)";
    contentEl.createEl("p", {
      text: `"${label}" 노드와 하위 ${this.descendantCount}개 노드가 함께 삭제됩니다.`,
    });

    const btnContainer = contentEl.createDiv({ cls: "nm-confirm-delete__buttons" });

    const cancelBtn = btnContainer.createEl("button", { text: "취소" });
    cancelBtn.addEventListener("click", () => this.close());

    const deleteBtn = btnContainer.createEl("button", {
      text: "삭제",
      cls: "mod-warning",
    });
    deleteBtn.addEventListener("click", () => {
      this.onConfirm();
      this.close();
    });

    // Enter로 삭제, Escape로 취소
    deleteBtn.focus();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
