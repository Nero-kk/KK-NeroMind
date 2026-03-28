import { Plugin, type TAbstractFile, type TFile, WorkspaceLeaf } from "obsidian";
import type { NeroMindSettings } from "./types";
import { VIEW_TYPE_MINDMAP, FILE_EXTENSION, DEFAULT_SETTINGS } from "./constants";
import { MindMapView } from "./view/MindMapView";
import { NeroMindSettingsTab } from "./view/SettingsTab";

export default class NeroMindPlugin extends Plugin {
  settings: NeroMindSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // 마인드맵 뷰 등록 (확장자 등록보다 먼저 해야 함)
    this.registerView(VIEW_TYPE_MINDMAP, (leaf) => {
      return new MindMapView(leaf, this.settings);
    });

    // .NeroMind 파일 확장자 등록 (뷰 등록 후)
    try {
      this.registerExtensions([FILE_EXTENSION], VIEW_TYPE_MINDMAP);
    } catch {
      // 이미 등록된 경우 무시
    }

    // 사이드바 리본 아이콘
    this.addRibbonIcon("brain", "새 마인드맵 생성", async () => {
      await this.createNewMindMap();
    });

    // 커맨드 팔레트 명령
    this.addCommand({
      id: "create-new-mindmap",
      name: "새 마인드맵 생성",
      callback: async () => {
        await this.createNewMindMap();
      },
    });

    // 설정 탭
    this.addSettingTab(new NeroMindSettingsTab(this.app, this));

    // .NeroMind 파일 클릭 시 마인드맵 뷰로 열기
    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (!file || !file.path.endsWith(`.${FILE_EXTENSION}`)) return;

        // 현재 활성 leaf가 이미 마인드맵 뷰이고 같은 파일이면 무시
        const activeLeaf = this.app.workspace.getLeaf(false);
        if (activeLeaf.view instanceof MindMapView) return;

        // 마인드맵 뷰로 전환
        this.openMindMapFile(file.path);
      }),
    );

    // Vault 이벤트: 노트 이름 변경 시 noteRef 자동 업데이트
    this.registerEvent(
      this.app.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
        this.propagateToViews((view) => {
          view.handleNoteRenamed(oldPath, file.path);
        });
      }),
    );

    // Vault 이벤트: 노트 삭제 시 noteRef 해제 + 알림
    this.registerEvent(
      this.app.vault.on("delete", (file: TAbstractFile) => {
        this.propagateToViews((view) => {
          view.handleNoteDeleted(file.path);
        });
      }),
    );
  }

  onunload(): void {
    // 뷰 정리는 Obsidian이 자동 처리
  }

  async loadSettings(): Promise<void> {
    const loaded = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loaded };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // 열려있는 모든 마인드맵 뷰에 설정 변경 알림
    this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MindMapView) {
        view.updateSettings(this.settings);
      }
    });
  }

  /** 열려있는 모든 MindMapView에 콜백 전파 */
  private propagateToViews(callback: (view: MindMapView) => void): void {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MindMapView) {
        callback(view);
      }
    });
  }

  /** .NeroMind 파일을 마인드맵 뷰로 열기 */
  private async openMindMapFile(filePath: string): Promise<void> {
    // 이미 해당 파일을 열고 있는 leaf가 있으면 재사용
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MINDMAP).find((leaf) => {
      const view = leaf.view;
      return view instanceof MindMapView && view.getState().file === filePath;
    });

    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }

    // 현재 leaf에서 마인드맵 뷰로 전환
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_MINDMAP,
      active: true,
      state: { file: filePath },
    });
    this.app.workspace.revealLeaf(leaf);
  }

  /** 새 마인드맵을 생성하고 뷰를 열기 */
  private async createNewMindMap(): Promise<void> {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE_MINDMAP,
      active: true,
    });
    this.app.workspace.revealLeaf(leaf);
  }
}
