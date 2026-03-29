import { ItemView, type WorkspaceLeaf, type TFile, Notice } from "obsidian";
import { VIEW_TYPE_MINDMAP } from "../constants";
import { StateManager } from "../core/StateManager";
import { CanvasEngine } from "../canvas/CanvasEngine";
import { NodeEditHandler } from "../interaction/NodeEditHandler";
import { SelectionManager } from "../interaction/SelectionManager";
import { KeyboardHandler } from "../interaction/KeyboardHandler";
import { DragDropHandler } from "../interaction/DragDropHandler";
import { FileManager } from "../io/FileManager";
import { ExportManager } from "../io/ExportManager";
import { ImportManager } from "../io/ImportManager";
import { FullNoteCompiler } from "../io/FullNoteCompiler";
import { ThemeManager } from "../theme/ThemeManager";
import { FloatingToolbar } from "./FloatingToolbar";
import { SearchPanel } from "./SearchPanel";
import { SaveAsModal } from "./SaveAsModal";
import type { MindMapDocument, MindMapAction, NeroMindSettings } from "../types";
import { NON_HISTORY_ACTIONS } from "../types";
import { createNode, flattenTree } from "../core/MindMapNode";

export class MindMapView extends ItemView {
  private stateManager: StateManager | null = null;
  private canvasEngine: CanvasEngine | null = null;
  private editHandler: NodeEditHandler | null = null;
  private selectionManager: SelectionManager | null = null;
  private keyboardHandler: KeyboardHandler | null = null;
  private dragDropHandler: DragDropHandler | null = null;
  private themeManager: ThemeManager | null = null;
  private toolbar: FloatingToolbar | null = null;
  private searchPanel: SearchPanel | null = null;
  private fileManager: FileManager;
  private exportManager: ExportManager;
  private importManager: ImportManager;
  private fullNoteCompiler: FullNoteCompiler;
  private settings: NeroMindSettings;
  private filePath: string | null = null;
  private titleClickCleanup: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, settings: NeroMindSettings) {
    super(leaf);
    this.settings = settings;
    this.fileManager = new FileManager(this.app);
    this.exportManager = new ExportManager(this.app);
    this.importManager = new ImportManager(this.app);
    this.fullNoteCompiler = new FullNoteCompiler(this.app);
  }

  getViewType(): string {
    return VIEW_TYPE_MINDMAP;
  }

  getDisplayText(): string {
    if (this.filePath) {
      // "폴더경로/파일이름" (확장자 제거)
      return this.filePath.replace(/\.NeroMind$/i, "");
    }
    const doc = this.stateManager?.getDocument();
    return doc?.title || "마인드맵";
  }

  getIcon(): string {
    return "brain";
  }

  /** Obsidian 뷰 상태 저장 (탭 복원/파일 연결용) */
  getState(): Record<string, unknown> {
    return { file: this.filePath };
  }

  /** Obsidian 뷰 상태 복원 (.neromind 파일 열기 시 onOpen 이후 호출) */
  async setState(state: unknown, result: { history: boolean }): Promise<void> {
    const s = state as Record<string, unknown> | null;
    const newPath = s && typeof s.file === "string" ? s.file : null;

    if (newPath && newPath !== this.filePath) {
      this.filePath = newPath;
      await this.reinitialize();
    } else if (!this.stateManager && !newPath) {
      // 새 마인드맵 생성 (filePath 없이 뷰가 열린 경우)
      await this.reinitialize();
    }

    await super.setState(state, result);
  }

  async onOpen(): Promise<void> {
    // setState()에서 초기화하므로 여기서는 아무것도 하지 않음
    // (onOpen → setState 순서로 호출됨)
  }

  /** 뷰 전체 초기화/재초기화 */
  private async reinitialize(): Promise<void> {
    // 기존 리소스 정리
    this.cleanupModules();

    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.classList.add("nm-view-container");

    try {
      await this.initializeView(container);
    } catch (err) {
      container.empty();
      container.createDiv({
        cls: "nm-error-message",
        text: `마인드맵 로드 실패: ${String(err)}`,
      });
      new Notice(`마인드맵 초기화 오류: ${String(err)}`, 5000);
    }
  }

  /** 모듈 정리 (재초기화 전) */
  private cleanupModules(): void {
    this.titleClickCleanup?.();
    this.titleClickCleanup = null;
    this.searchPanel?.destroy();
    this.toolbar?.destroy();
    this.canvasEngine?.destroy();
    this.dragDropHandler?.destroy();
    this.stateManager = null;
    this.canvasEngine = null;
    this.editHandler = null;
    this.selectionManager = null;
    this.keyboardHandler = null;
    this.dragDropHandler = null;
    this.themeManager = null;
    this.toolbar = null;
    this.searchPanel = null;
  }

  private async initializeView(container: HTMLElement): Promise<void> {
    // 툴바 생성 (FloatingToolbar 컴포넌트)
    this.toolbar = new FloatingToolbar(container, {
      onUndo: () => this.stateManager?.undo(),
      onRedo: () => this.stateManager?.redo(),
      onNew: () => this.handleNew(),
      onSave: () => this.handleSaveAs(),
      onExport: () => this.handleExport(),
      onImport: () => this.handleImport(),
      onFullNote: () => this.handleFullNote(),
    });

    // 캔버스 컨테이너
    const canvasContainer = container.createDiv({ cls: "nm-canvas-container" });

    // 검색 패널 (SearchPanel 컴포넌트)
    this.searchPanel = new SearchPanel(canvasContainer, {
      onSelectNode: (nodeId) => {
        this.selectionManager?.select(nodeId);
        this.canvasEngine?.focusNode(nodeId);
      },
      onHighlightNodes: (nodeIds) => {
        this.canvasEngine?.setSearchHighlightIds(nodeIds);
      },
      getNodes: () => {
        const doc = this.stateManager?.getDocument();
        return doc ? flattenTree(doc.root) : [];
      },
    });

    // 문서 로드 또는 생성
    let doc: MindMapDocument;
    if (this.filePath) {
      doc = await this.fileManager.load(this.filePath);
    } else {
      const result = await this.fileManager.createNew(
        "새 마인드맵",
        this.settings.saveFolderPath,
      );
      doc = result.doc;
      this.filePath = result.path;
    }

    // 모듈 초기화
    this.stateManager = new StateManager(doc);
    this.themeManager = new ThemeManager(container, doc.theme ?? this.settings.theme);
    this.themeManager.applyFont(this.settings.fontFamily);
    this.themeManager.applyBgColor(this.settings.canvasBgColor);
    this.canvasEngine = new CanvasEngine(canvasContainer, this.stateManager);
    this.selectionManager = new SelectionManager(this.stateManager);
    this.editHandler = new NodeEditHandler(
      this.stateManager,
      this.canvasEngine.getNodeRenderer(),
      this.settings.keyBindings,
    );
    this.keyboardHandler = new KeyboardHandler(
      this.app,
      this.stateManager,
      this.editHandler,
      this.selectionManager,
      this.settings.keyBindings,
    );
    this.dragDropHandler = new DragDropHandler(
      this.app,
      this.stateManager,
      this.canvasEngine,
      canvasContainer,
    );

    // 편집 완료 콜백: Tab→자식 생성, Enter→형제 생성, Escape→선택 유지
    this.editHandler.setOnEditComplete((nodeId, finishKey) => {
      if (finishKey === "tab") {
        const newChild = createNode("");
        this.stateManager?.applyAction({
          type: "ADD_CHILD",
          parentId: nodeId,
          node: newChild,
        });
        requestAnimationFrame(() => this.editHandler?.startEdit(newChild.id));
      } else if (finishKey === "enter") {
        const currentDoc = this.stateManager?.getDocument();
        if (currentDoc && nodeId !== currentDoc.root.id) {
          const newSibling = createNode("");
          this.stateManager?.applyAction({
            type: "ADD_SIBLING",
            siblingId: nodeId,
            node: newSibling,
          });
          requestAnimationFrame(() => this.editHandler?.startEdit(newSibling.id));
        }
      } else if (finishKey === "escape") {
        // 편집 종료 후 노드 선택 유지 + 캔버스에 포커스 복원
        this.selectionManager?.select(nodeId);
        const canvasEl = this.containerEl.querySelector(".nm-canvas-container") as HTMLElement;
        canvasEl?.focus();
      }
    });

    // 캔버스 이벤트 연결
    this.canvasEngine.setOnNodeClick((nodeId, event) => {
      this.selectionManager?.handleClick(nodeId, event);
    });

    this.canvasEngine.setOnNodeDoubleClick((nodeId, event) => {
      if ((event.ctrlKey || event.metaKey)) {
        // Ctrl+더블클릭: noteRef가 있으면 새 탭에서 노트 열기
        const node = this.stateManager?.getNodeById(nodeId);
        if (node?.noteRef) {
          this.openLinkedNote(node.noteRef);
          return;
        }
      }
      this.editHandler?.startEdit(nodeId);
    });

    // 노드 mousedown → 드래그 시작 (5px 이상 이동 시)
    let dragPending: { nodeId: string; startX: number; startY: number } | null = null;

    this.canvasEngine.setOnNodeMouseDown((nodeId, event) => {
      if (this.editHandler?.isEditing()) return;
      dragPending = { nodeId, startX: event.clientX, startY: event.clientY };
    });

    this.canvasEngine.setOnViewportChange(() => {
      const viewport = this.canvasEngine?.getViewport().getState();
      if (viewport) {
        this.stateManager?.applyAction({ type: "UPDATE_VIEWPORT", viewport });
      }
    });

    // 상태 변경 시 자동 저장 + 테마 반영 + Undo/Redo 상태 동기화
    this.stateManager.subscribe((_doc: MindMapDocument, action: MindMapAction) => {
      if (!NON_HISTORY_ACTIONS.has(action.type)) {
        this.fileManager.markDirty(_doc);
      }
      if (action.type === "SET_THEME") {
        this.themeManager?.applyTheme(action.theme);
      }
      this.toolbar?.updateUndoRedoState(
        this.stateManager?.canUndo() ?? false,
        this.stateManager?.canRedo() ?? false,
      );
    });

    // Escape를 capture 단계에서 차단 (Obsidian 기본 동작보다 먼저 잡음)
    const escapeHandler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!this.editHandler?.isEditing()) {
          this.keyboardHandler?.handleKeyDown(e);
        }
      }
    };
    container.addEventListener("keydown", escapeHandler, true);
    this.register(() => container.removeEventListener("keydown", escapeHandler, true));

    // 키보드 이벤트
    this.registerDomEvent(canvasContainer, "keydown", (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        e.stopPropagation();
        this.searchPanel?.toggle();
        return;
      }

      const consumed = this.keyboardHandler?.handleKeyDown(e);
      if (consumed) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Ctrl+S 저장
    this.registerDomEvent(container, "keydown", (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const currentDoc = this.stateManager?.getDocument();
        if (currentDoc) {
          this.fileManager.saveImmediate(currentDoc);
        }
      }
    });

    // 노드 드래그: 이동 감지 + 드롭 타겟 업데이트
    this.registerDomEvent(document, "mousemove", (e: MouseEvent) => {
      // 드래그 시작 판정 (5px 이상 이동)
      if (dragPending && !this.dragDropHandler?.isDragging()) {
        const dx = e.clientX - dragPending.startX;
        const dy = e.clientY - dragPending.startY;
        if (Math.abs(dx) + Math.abs(dy) > 5) {
          this.dragDropHandler?.startNodeDrag(dragPending.nodeId);
          dragPending = null;
        }
      }
      // 드래그 중 드롭 타겟 업데이트
      if (this.dragDropHandler?.isDragging()) {
        this.dragDropHandler.updateDropTarget(e.clientX, e.clientY);
      }
    });

    this.registerDomEvent(document, "mouseup", () => {
      dragPending = null;
      if (this.dragDropHandler?.isDragging()) {
        this.dragDropHandler.endNodeDrag();
      }
    });

    // 캔버스에 포커스 가능하도록 설정
    canvasContainer.setAttribute("tabindex", "0");
    canvasContainer.focus();

    // 탭 제목 클릭 시 파일명 변경
    this.setupTitleClick();

    // 탭 제목 업데이트
    this.updateTabTitle();
  }

  /** 탭 제목 업데이트 (Obsidian 탭 헤더에 반영) */
  private updateTabTitle(): void {
    // 직접 DOM 업데이트 + Obsidian 내부 API 둘 다 시도
    const titleEl = this.containerEl.parentElement?.querySelector(
      ".view-header-title",
    ) as HTMLElement | null;
    if (titleEl) {
      titleEl.textContent = this.getDisplayText();
    }
    (this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
  }

  /** 탭 헤더 클릭 시 파일명 변경 모달 */
  private setupTitleClick(): void {
    // 이전 리스너 정리
    this.titleClickCleanup?.();
    this.titleClickCleanup = null;

    // Obsidian 뷰 헤더의 제목 요소 탐색
    const titleEl = this.containerEl.parentElement?.querySelector(
      ".view-header-title",
    ) as HTMLElement | null;
    if (!titleEl) return;

    const clickHandler = (): void => {
      const doc = this.stateManager?.getDocument();
      if (!doc) return;

      const currentName = this.getDisplayText();
      const modal = new SaveAsModal(this.app, currentName, async (newName: string) => {
        if (newName === currentName) return;

        try {
          const currentDoc = this.stateManager?.getDocument();
          if (!currentDoc) return;

          const updatedDoc = { ...currentDoc, title: newName };
          const newPath = await this.fileManager.saveAs(
            updatedDoc,
            newName,
            this.settings.saveFolderPath,
          );
          this.filePath = newPath;
          this.stateManager?.applyAction({
            type: "LOAD_DOCUMENT",
            document: updatedDoc,
          });
          this.updateTabTitle();
          new Notice(`파일명 변경: ${newName}`);
        } catch (err) {
          new Notice(`파일명 변경 실패: ${String(err)}`, 5000);
        }
      });
      modal.open();
    };

    titleEl.addEventListener("click", clickHandler);
    this.titleClickCleanup = () => titleEl.removeEventListener("click", clickHandler);
    this.register(() => this.titleClickCleanup?.());
  }

  async onClose(): Promise<void> {
    const doc = this.stateManager?.getDocument();
    if (doc) {
      await this.fileManager.saveImmediate(doc);
    }
    this.cleanupModules();
    this.fileManager.destroy();
  }

  /** 외부에서 파일 경로 설정 (파일 열기 시) */
  setFilePath(path: string): void {
    this.filePath = path;
  }

  /** 설정 변경 시 호출 (테마, 단축키, 폰트 등) */
  updateSettings(settings: NeroMindSettings): void {
    this.settings = settings;
    this.themeManager?.updateSettings(settings);
    this.keyboardHandler?.updateKeyBindings(settings.keyBindings);
    this.editHandler?.updateKeyBindings(settings.keyBindings);
    this.stateManager?.applyAction({ type: "SET_THEME", theme: settings.theme });
  }

  // === New/Save ===

  /** 새 마인드맵 생성 (현재 뷰 초기화) */
  private async handleNew(): Promise<void> {
    // 현재 문서 저장
    const doc = this.stateManager?.getDocument();
    if (doc) {
      await this.fileManager.saveImmediate(doc);
    }

    // 새 문서로 초기화
    this.filePath = null;
    await this.reinitialize();
  }

  /** 파일명 지정 저장 */
  private handleSaveAs(): void {
    const doc = this.stateManager?.getDocument();
    if (!doc) return;

    const modal = new SaveAsModal(this.app, doc.title, async (fileName: string) => {
      try {
        const currentDoc = this.stateManager?.getDocument();
        if (!currentDoc) return;

        // 문서 제목 업데이트
        const updatedDoc = { ...currentDoc, title: fileName };
        const newPath = await this.fileManager.saveAs(
          updatedDoc,
          fileName,
          this.settings.saveFolderPath,
        );
        this.filePath = newPath;

        // StateManager에도 제목 반영
        this.stateManager?.applyAction({
          type: "LOAD_DOCUMENT",
          document: updatedDoc,
        });

        this.updateTabTitle();
        new Notice(`저장 완료: ${fileName}`);
      } catch (err) {
        new Notice(`저장 실패: ${String(err)}`, 5000);
      }
    });
    modal.open();
  }

  // === Export/Import/FullNote ===

  private async handleExport(): Promise<void> {
    const doc = this.stateManager?.getDocument();
    if (!doc) return;

    try {
      const outputFolder = this.settings.saveFolderPath;
      const filePath = await this.exportManager.exportStructure(doc, outputFolder);
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        await this.app.workspace.getLeaf(true).openFile(file as TFile);
      }
    } catch (err) {
      console.warn("[NeroMind] Export 실패:", err);
    }
  }

  private async handleImport(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    if (files.length === 0) {
      new Notice("Import할 마크다운 파일이 없습니다.");
      return;
    }

    const { FileSuggestModal } = await import("./FileSuggestModal");
    const modal = new FileSuggestModal(this.app, files, async (file: TFile) => {
      try {
        const doc = await this.importManager.importFromMarkdown(file.path);
        this.stateManager?.applyAction({ type: "LOAD_DOCUMENT", document: doc });
      } catch (err) {
        console.warn("[NeroMind] Import 실패:", err);
      }
    });
    modal.open();
  }

  private async handleFullNote(): Promise<void> {
    const doc = this.stateManager?.getDocument();
    if (!doc) return;

    try {
      const outputFolder = this.settings.saveFolderPath;
      const filePath = await this.fullNoteCompiler.compile(doc, outputFolder);
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (file) {
        await this.app.workspace.getLeaf(true).openFile(file as TFile);
      }
    } catch (err) {
      console.warn("[NeroMind] FullNote 컴파일 실패:", err);
    }
  }

  // === 노트 열기 ===

  private openLinkedNote(noteRef: string): void {
    const file = this.app.vault.getAbstractFileByPath(noteRef);
    if (file) {
      this.app.workspace.getLeaf(true).openFile(file as TFile);
    } else {
      new Notice(`노트를 찾을 수 없습니다: ${noteRef}`);
    }
  }

  // === Vault 이벤트 핸들링 ===

  /** 노트 파일 이름/경로 변경 시 noteRef 자동 업데이트 */
  handleNoteRenamed(oldPath: string, newPath: string): void {
    this.stateManager?.applyAction({
      type: "UPDATE_NOTE_REF",
      oldPath,
      newPath,
    });
  }

  /** 노트 파일 삭제 시 noteRef 해제 + 알림 */
  handleNoteDeleted(notePath: string): void {
    const doc = this.stateManager?.getDocument();
    if (!doc) return;

    const allNodes = flattenTree(doc.root);
    const affected = allNodes.filter((n) => n.noteRef === notePath);
    if (affected.length === 0) return;

    this.stateManager?.applyAction({ type: "UNLINK_NOTE_BY_REF", notePath });
    new Notice(`연결된 노트가 삭제되었습니다: ${notePath} (${affected.length}개 노드 연결 해제)`);
  }
}
