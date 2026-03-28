import { Modal, type App } from "obsidian";

/**
 * 마인드맵 파일명 입력 모달.
 * 사용자가 파일명을 지정하여 저장할 수 있다.
 */
export class SaveAsModal extends Modal {
  private defaultName: string;
  private onSubmit: (fileName: string) => void;

  constructor(app: App, defaultName: string, onSubmit: (fileName: string) => void) {
    super(app);
    this.defaultName = defaultName;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nm-save-as");

    contentEl.createEl("h3", { text: "마인드맵 저장" });

    // 파일명 입력
    const inputContainer = contentEl.createDiv({ cls: "nm-save-as__input-container" });
    inputContainer.createEl("label", { text: "파일명", cls: "nm-save-as__label" });

    const input = inputContainer.createEl("input", {
      type: "text",
      cls: "nm-save-as__input",
      value: this.defaultName,
    });
    input.setAttribute("placeholder", "마인드맵 파일명");

    // 버튼
    const btnContainer = contentEl.createDiv({ cls: "nm-save-as__buttons" });

    const cancelBtn = btnContainer.createEl("button", { text: "취소" });
    cancelBtn.addEventListener("click", () => this.close());

    const saveBtn = btnContainer.createEl("button", {
      text: "저장",
      cls: "mod-cta",
    });
    saveBtn.addEventListener("click", () => {
      const fileName = input.value.trim() || this.defaultName;
      this.onSubmit(fileName);
      this.close();
    });

    // Enter로 저장
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const fileName = input.value.trim() || this.defaultName;
        this.onSubmit(fileName);
        this.close();
      }
    });

    // 입력란 포커스 + 전체 선택
    input.focus();
    input.select();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
