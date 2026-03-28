import { type App, PluginSettingTab, Setting } from "obsidian";
import type NeroMindPlugin from "../main";
import type { ThemeId, KeyBinding, KeyActionName } from "../types";
import { DEFAULT_KEY_BINDINGS } from "../constants";

/** 액션 이름 → 사용자에게 보여줄 한국어 라벨 */
const ACTION_LABELS: Record<KeyActionName, string> = {
  addChild: "자식 노드 추가",
  addSibling: "형제 노드 추가",
  deleteNode: "노드 삭제",
  rename: "이름 편집",
  escape: "선택 해제",
  undo: "실행 취소",
  redo: "다시 실행",
  navUp: "위로 이동",
  navDown: "아래로 이동",
  navLeft: "부모로 이동",
  navRight: "자식으로 이동",
  reorderUp: "순서 위로",
  reorderDown: "순서 아래로",
  moveToParent: "부모 레벨로 이동",
  moveToChild: "자식 레벨로 이동",
  toggleCollapse: "접기/펼치기",
};

/** KeyBinding을 사람이 읽을 수 있는 문자열로 변환 */
function formatBinding(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  if (binding.meta) parts.push("Meta");

  // 키 이름을 보기 좋게 변환
  const keyLabel = binding.key === " " ? "Space" : binding.key;
  parts.push(keyLabel);

  return parts.join(" + ");
}

export class NeroMindSettingsTab extends PluginSettingTab {
  plugin: NeroMindPlugin;

  constructor(app: App, plugin: NeroMindPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "KK-NeroMind 설정" });

    // 저장 폴더 경로
    new Setting(containerEl)
      .setName("저장 폴더")
      .setDesc("새 마인드맵 파일이 저장되는 기본 폴더 경로")
      .addText((text) =>
        text
          .setPlaceholder("예: MindMaps")
          .setValue(this.plugin.settings.saveFolderPath)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              saveFolderPath: value,
            };
            await this.plugin.saveSettings();
          }),
      );

    // 테마 선택
    new Setting(containerEl)
      .setName("테마")
      .setDesc("마인드맵의 비주얼 테마")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("default", "Frost (기본)")
          .addOption("dark", "Midnight")
          .addOption("warm", "Dawn")
          .addOption("square", "Square")
          .addOption("toss-dark", "Toss Dark Mode")
          .addOption("neon", "Neon")
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              theme: value as ThemeId,
            };
            await this.plugin.saveSettings();
          }),
      );

    // 배경색 설정
    const bgSetting = new Setting(containerEl)
      .setName("배경색")
      .setDesc("마인드맵 캔버스 배경색 (비활성화 시 테마 기본색 사용)");

    const currentBg = this.plugin.settings.canvasBgColor;

    bgSetting.addColorPicker((picker) => {
      picker.setValue(currentBg || "#ffffff");
      picker.onChange(async (value) => {
        this.plugin.settings = {
          ...this.plugin.settings,
          canvasBgColor: value,
        };
        await this.plugin.saveSettings();
      });
    });

    bgSetting.addToggle((toggle) => {
      toggle.setValue(!!currentBg);
      toggle.setTooltip("배경색 사용");
      toggle.onChange(async (enabled) => {
        if (enabled) {
          this.plugin.settings = {
            ...this.plugin.settings,
            canvasBgColor: "#ffffff",
          };
        } else {
          this.plugin.settings = {
            ...this.plugin.settings,
            canvasBgColor: "",
          };
        }
        await this.plugin.saveSettings();
        this.display();
      });
    });

    // 폰트 설정
    const fontOptions: Record<string, string> = {
      "": "기본 (시스템 폰트)",
      "Pretendard, sans-serif": "Pretendard",
      "'Noto Sans KR', sans-serif": "Noto Sans KR",
      "'IBM Plex Sans KR', sans-serif": "IBM Plex Sans KR",
      "D2Coding, monospace": "D2Coding",
      "'Nanum Gothic', sans-serif": "나눔고딕",
      "'Nanum Myeongjo', serif": "나눔명조",
      "'Nanum Gothic Coding', monospace": "나눔고딕코딩",
      "Inter, sans-serif": "Inter",
      "'JetBrains Mono', monospace": "JetBrains Mono",
      "'Fira Code', monospace": "Fira Code",
      "Arial, sans-serif": "Arial",
      "'Times New Roman', serif": "Times New Roman",
      "'Courier New', monospace": "Courier New",
    };

    new Setting(containerEl)
      .setName("글꼴")
      .setDesc("노드 텍스트에 사용할 폰트")
      .addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(fontOptions)) {
          dropdown.addOption(value, label);
        }
        dropdown.setValue(this.plugin.settings.fontFamily);
        dropdown.onChange(async (value) => {
          this.plugin.settings = {
            ...this.plugin.settings,
            fontFamily: value,
          };
          await this.plugin.saveSettings();
        });
      });

    // === 단축키 설정 ===
    containerEl.createEl("h3", { text: "단축키" });

    const keyBindings = this.plugin.settings.keyBindings;

    for (const actionName of Object.keys(ACTION_LABELS) as KeyActionName[]) {
      const currentBinding = keyBindings[actionName];
      const defaultBinding = DEFAULT_KEY_BINDINGS[actionName];
      const isCustom = formatBinding(currentBinding) !== formatBinding(defaultBinding);

      const setting = new Setting(containerEl)
        .setName(ACTION_LABELS[actionName])
        .setDesc(isCustom ? `기본값: ${formatBinding(defaultBinding)}` : "");

      // 현재 바인딩을 표시하는 버튼 (클릭하면 키 입력 대기)
      setting.addButton((btn) => {
        btn.setButtonText(formatBinding(currentBinding));
        btn.setCta();
        btn.onClick(() => {
          btn.setButtonText("키를 입력하세요...");
          btn.removeCta();

          const handler = async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // 수정자 키만 눌렀을 때는 무시
            if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

            const newBinding: KeyBinding = {
              key: e.key,
              ...(e.ctrlKey && { ctrl: true }),
              ...(e.shiftKey && { shift: true }),
              ...(e.altKey && { alt: true }),
              ...(e.metaKey && { meta: true }),
            };

            containerEl.removeEventListener("keydown", handler, true);

            const newKeyBindings = {
              ...this.plugin.settings.keyBindings,
              [actionName]: newBinding,
            };

            this.plugin.settings = {
              ...this.plugin.settings,
              keyBindings: newKeyBindings,
            };

            await this.plugin.saveSettings();

            // UI 새로고침
            this.display();
          };

          containerEl.addEventListener("keydown", handler, true);
        });
      });

      // 초기화 버튼 (커스텀 바인딩인 경우만 표시)
      if (isCustom) {
        setting.addExtraButton((btn) => {
          btn.setIcon("reset");
          btn.setTooltip("기본값으로 초기화");
          btn.onClick(async () => {
            const newKeyBindings = {
              ...this.plugin.settings.keyBindings,
              [actionName]: defaultBinding,
            };

            this.plugin.settings = {
              ...this.plugin.settings,
              keyBindings: newKeyBindings,
            };

            await this.plugin.saveSettings();
            this.display();
          });
        });
      }
    }

    // === 고정 단축키 (변경 불가) ===
    containerEl.createEl("h3", { text: "고정 단축키" });
    containerEl.createEl("p", {
      text: "아래 단축키는 변경할 수 없습니다.",
      cls: "setting-item-description",
    });

    const fixedShortcuts: ReadonlyArray<{ key: string; desc: string }> = [
      { key: "Ctrl + S", desc: "마인드맵 파일 즉시 저장" },
      { key: "Ctrl + F", desc: "노드 검색 패널 열기/닫기" },
      { key: "Ctrl + 더블클릭", desc: "노드에 연결된 노트를 새 탭으로 열기" },
      { key: "더블클릭", desc: "노드 이름 편집 모드 진입" },
      { key: "클릭", desc: "노드 선택" },
      { key: "Ctrl + 클릭", desc: "노드 다중 선택 (토글)" },
      { key: "Shift + 클릭", desc: "노드 범위 선택" },
      { key: "드래그", desc: "선택된 노드를 다른 노드의 자식으로 이동" },
      { key: "휠 버튼 드래그", desc: "캔버스 팬 (이동)" },
      { key: "휠 버튼 더블클릭", desc: "전체 노드가 보이도록 뷰 조정" },
      { key: "마우스 휠", desc: "캔버스 줌 인/아웃" },
      { key: "빈 캔버스 드래그", desc: "캔버스 팬 (이동)" },
    ];

    for (const item of fixedShortcuts) {
      new Setting(containerEl)
        .setName(item.desc)
        .addButton((btn) => {
          btn.setButtonText(item.key);
          btn.setDisabled(true);
        });
    }

    // 전체 초기화 버튼
    new Setting(containerEl)
      .setName("모든 단축키 초기화")
      .setDesc("모든 단축키를 기본값으로 되돌립니다")
      .addButton((btn) => {
        btn.setButtonText("전체 초기화");
        btn.setWarning();
        btn.onClick(async () => {
          this.plugin.settings = {
            ...this.plugin.settings,
            keyBindings: { ...DEFAULT_KEY_BINDINGS },
          };
          await this.plugin.saveSettings();
          this.display();
        });
      });
  }
}
