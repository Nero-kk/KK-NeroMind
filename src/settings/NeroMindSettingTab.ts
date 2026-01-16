import { App, PluginSettingTab, Setting } from "obsidian";
import type NeroMindPlugin from "../main";

export type LayoutDirection = "horizontal" | "vertical" | "radial";
export type RendererType = "dom" | "canvas";

export interface NeroMindSettings {
  enableRadialLayout: boolean;
  enableArchive: boolean;
  layoutDirection: LayoutDirection;
  rendererType: RendererType;
}

export const DEFAULT_SETTINGS: NeroMindSettings = {
  enableRadialLayout: true,
  enableArchive: true,
  layoutDirection: "radial",
  rendererType: "dom",
};

export class NeroMindSettingTab extends PluginSettingTab {
  private readonly plugin: NeroMindPlugin;

  constructor(app: App, plugin: NeroMindPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private get settings(): NeroMindSettings {
    return this.plugin.settings;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.addToggleSetting(
      "방사형 레이아웃 자동 적용",
      this.settings.enableRadialLayout,
      async (value) => {
        this.settings.enableRadialLayout = value;
        await this.plugin.saveSettings();
      }
    );

    this.addToggleSetting(
      "노드 삭제 시 Archive 사용",
      this.settings.enableArchive,
      async (value) => {
        this.settings.enableArchive = value;
        await this.plugin.saveSettings();
      }
    );

    this.addDropdownSetting(
      "기본 레이아웃 방향",
      {
        horizontal: "horizontal",
        vertical: "vertical",
        radial: "radial",
      },
      this.settings.layoutDirection,
      async (value) => {
        this.settings.layoutDirection = value as LayoutDirection;
        await this.plugin.saveSettings();
      }
    );

    this.addDropdownSetting(
      "렌더러 타입",
      {
        dom: "dom",
        canvas: "canvas",
      },
      this.settings.rendererType,
      async (value) => {
        this.settings.rendererType = value as RendererType;
        await this.plugin.saveSettings();
      }
    );
  }

  private addToggleSetting(
    name: string,
    value: boolean,
    onChange: (value: boolean) => Promise<void>
  ): void {
    new Setting(this.containerEl).setName(name).addToggle((toggle) => {
      toggle.setValue(value).onChange(onChange);
    });
  }

  private addDropdownSetting(
    name: string,
    options: Record<string, string>,
    value: string,
    onChange: (value: string) => Promise<void>
  ): void {
    new Setting(this.containerEl).setName(name).addDropdown((dropdown) => {
      dropdown.addOptions(options).setValue(value).onChange(onChange);
    });
  }
}
