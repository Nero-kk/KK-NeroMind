import { App, PluginSettingTab, Setting } from 'obsidian';
import type NeroMindPlugin from '../main';

/**
 * NeroMind 설정 탭
 *
 * Architecture v4.0 § 8.2 설정 UI 기준
 *
 * Phase 1: 기본 골격만 구현
 * Phase 4: 모든 설정 항목 추가
 */
export class NeroMindSettingTab extends PluginSettingTab {
	plugin: NeroMindPlugin;

	constructor(app: App, plugin: NeroMindPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'NeroMind Settings' });

		// Phase 1: 기본 정보만 표시
		containerEl.createEl('p', {
			text: 'Settings will be available in Phase 4.',
		});

		// Phase 4: 설정 항목 추가
		// this.addViewportSettings(containerEl);
		// this.addMinimapSettings(containerEl);
		// this.addThemeSettings(containerEl);
		// this.addAdvancedSettings(containerEl);
	}

	/**
	 * Phase 4: 뷰포트 설정
	 */
	private addViewportSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'Viewport' });

		new Setting(containerEl)
			.setName('Center on node create')
			.setDesc('Move viewport to center when creating a new node')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.centerOnNodeCreate)
					.onChange(async (value) => {
						this.plugin.settings.centerOnNodeCreate = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Auto align')
			.setDesc('Automatically align nodes to avoid overlapping')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoAlign)
					.onChange(async (value) => {
						this.plugin.settings.autoAlign = value;
						await this.plugin.saveSettings();
					})
			);
	}

	/**
	 * Phase 4: 미니맵 설정
	 */
	private addMinimapSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'Minimap' });

		new Setting(containerEl)
			.setName('Show minimap')
			.setDesc('Display minimap in bottom-right corner')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.minimap.enabled)
					.onChange(async (value) => {
						this.plugin.settings.minimap.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Minimap size')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('small', 'Small')
					.addOption('medium', 'Medium')
					.addOption('large', 'Large')
					.setValue(this.plugin.settings.minimap.size)
					.onChange(async (value: 'small' | 'medium' | 'large') => {
						this.plugin.settings.minimap.size = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Minimap opacity')
			.addSlider((slider) =>
				slider
					.setLimits(0.3, 1.0, 0.1)
					.setValue(this.plugin.settings.minimap.opacity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.minimap.opacity = value;
						await this.plugin.saveSettings();
					})
			);
	}

	/**
	 * Phase 4: 테마 설정
	 */
	private addThemeSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'Theme' });

		new Setting(containerEl)
			.setName('Theme')
			.setDesc('Choose mindmap theme')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('light', 'Light Mode')
					.addOption('dark', 'Dark Mode')
					.addOption('system', 'System')
					.setValue(this.plugin.settings.theme)
					.onChange(async (value: 'light' | 'dark' | 'system') => {
						this.plugin.settings.theme = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
