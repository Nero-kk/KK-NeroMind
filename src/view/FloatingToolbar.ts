/**
 * 상단 플로팅 툴바 컴포넌트.
 * 기본 숨김 상태. SVG 아이콘 사용.
 */

export interface ToolbarCallbacks {
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onNew: () => void;
  readonly onSave: () => void;
  readonly onExport: () => void;
  readonly onImport: () => void;
  readonly onFullNote: () => void;
}

/** SVG 아이콘 (18x18, stroke 기반) */
const ICONS: Record<string, string> = {
  menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  undo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  redo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>',
  new: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  save: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  export: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  import: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  fullNote: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
};

export class FloatingToolbar {
  private containerEl: HTMLElement;
  private actionsEl: HTMLElement | null = null;
  private toggleBtn: HTMLButtonElement | null = null;
  private undoBtn: HTMLButtonElement | null = null;
  private redoBtn: HTMLButtonElement | null = null;
  private isCollapsed = true; // 기본 숨김

  constructor(parent: HTMLElement, callbacks: ToolbarCallbacks) {
    this.containerEl = parent.createDiv({ cls: "nm-toolbar nm-toolbar--collapsed" });
    this.build(callbacks);
  }

  private build(callbacks: ToolbarCallbacks): void {
    // 토글 버튼 (햄버거/닫기)
    this.toggleBtn = this.createIconBtn(this.containerEl, "menu", "툴바 열기");
    this.toggleBtn.classList.add("nm-toolbar__toggle");
    this.toggleBtn.addEventListener("click", () => this.toggleCollapse());

    // 액션 버튼 컨테이너
    this.actionsEl = this.containerEl.createDiv({ cls: "nm-toolbar__actions" });

    // Undo / Redo
    this.undoBtn = this.createIconBtn(this.actionsEl, "undo", "실행 취소");
    this.undoBtn.classList.add("nm-toolbar__btn--disabled");
    this.undoBtn.addEventListener("click", callbacks.onUndo);

    this.redoBtn = this.createIconBtn(this.actionsEl, "redo", "다시 실행");
    this.redoBtn.classList.add("nm-toolbar__btn--disabled");
    this.redoBtn.addEventListener("click", callbacks.onRedo);

    this.actionsEl.createDiv({ cls: "nm-toolbar__separator" });

    // New / Save
    const newBtn = this.createIconBtn(this.actionsEl, "new", "새 마인드맵");
    newBtn.addEventListener("click", callbacks.onNew);

    const saveBtn = this.createIconBtn(this.actionsEl, "save", "저장");
    saveBtn.addEventListener("click", callbacks.onSave);

    this.actionsEl.createDiv({ cls: "nm-toolbar__separator" });

    // Export / Import / Full Note
    const exportBtn = this.createIconBtn(this.actionsEl, "export", "내보내기");
    exportBtn.addEventListener("click", callbacks.onExport);

    const importBtn = this.createIconBtn(this.actionsEl, "import", "가져오기");
    importBtn.addEventListener("click", callbacks.onImport);

    const fullNoteBtn = this.createIconBtn(this.actionsEl, "fullNote", "전체 노트");
    fullNoteBtn.addEventListener("click", callbacks.onFullNote);
  }

  /** SVG 아이콘 버튼 생성 */
  private createIconBtn(parent: HTMLElement, icon: string, label: string): HTMLButtonElement {
    const btn = parent.createEl("button", { cls: "nm-toolbar__btn" });
    btn.innerHTML = ICONS[icon] || "";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    return btn;
  }

  /** 접기/펼치기 토글 */
  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      this.containerEl.classList.add("nm-toolbar--collapsed");
      if (this.toggleBtn) {
        this.toggleBtn.innerHTML = ICONS.menu;
        this.toggleBtn.setAttribute("aria-label", "툴바 열기");
        this.toggleBtn.setAttribute("title", "툴바 열기");
      }
    } else {
      this.containerEl.classList.remove("nm-toolbar--collapsed");
      if (this.toggleBtn) {
        this.toggleBtn.innerHTML = ICONS.close;
        this.toggleBtn.setAttribute("aria-label", "툴바 닫기");
        this.toggleBtn.setAttribute("title", "툴바 닫기");
      }
    }
  }

  /** Undo/Redo 버튼 활성/비활성 상태 업데이트 */
  updateUndoRedoState(canUndo: boolean, canRedo: boolean): void {
    if (this.undoBtn) {
      this.undoBtn.disabled = !canUndo;
      this.undoBtn.classList.toggle("nm-toolbar__btn--disabled", !canUndo);
    }
    if (this.redoBtn) {
      this.redoBtn.disabled = !canRedo;
      this.redoBtn.classList.toggle("nm-toolbar__btn--disabled", !canRedo);
    }
  }

  destroy(): void {
    this.containerEl.remove();
  }
}
