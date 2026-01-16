/**
 * KK-NeroMind Plugin Entry Point
 * 
 * 책임:
 * - Obsidian 플러그인 라이프사이클 관리
 * - 설정 로드/저장
 * - 뷰 등록
 * - 다른 모듈 초기화 조율
 * 
 * 비책임:
 * - 비즈니스 로직
 * - 렌더링
 * - 상태 관리
 * 
 * Phase 1 P0 범위:
 * - 플러그인 기본 골격
 * - MindMapView 등록
 * - Ribbon 아이콘 추가
 */

import { Plugin } from 'obsidian';
import { NeroMindView, VIEW_TYPE_NEROMIND } from './views/NeroMindView';
import { Disposable } from './core/Disposable';
import { EventBus } from './events/EventBus';
import {
	DEFAULT_SETTINGS,
	NeroMindSettings,
	NeroMindSettingTab
} from './settings/NeroMindSettingTab';

const SETTINGS_CHANGED_EVENT = 'settingsChanged';

export default class NeroMindPlugin extends Plugin {
	settings: NeroMindSettings = DEFAULT_SETTINGS;
	private disposables: Disposable[] = [];
	private readonly settingsBus = new EventBus();

	/**
	 * 플러그인 로드
	 */
	async onload(): Promise<void> {
		console.log('Loading KK-NeroMind Plugin');

		// 설정 로드
		await this.loadSettings();

		// 뷰 등록
		this.registerView(
			VIEW_TYPE_NEROMIND,
			(leaf) => new NeroMindView(leaf, this)
		);

		// 설정 탭 등록
		this.addSettingTab(new NeroMindSettingTab(this.app, this));

		// Ribbon 아이콘 추가
		this.addRibbonIcon('brain', 'Open NeroMind', () => {
			this.activateView();
		});

		// 명령 추가: 뷰 열기
		this.addCommand({
			id: 'open-neromind-view',
			name: 'Open NeroMind View',
			callback: () => {
				this.activateView();
			}
		});

		// 레이아웃 준비 완료 후 초기화
		this.app.workspace.onLayoutReady(() => {
			console.log('NeroMind: Layout ready');
		});
	}

	/**
	 * 플러그인 언로드
	 */
	async onunload(): Promise<void> {
		console.log('Unloading KK-NeroMind Plugin');

		// Disposable 역순 해제
		for (const disposable of this.disposables.reverse()) {
			disposable.destroy();
		}
		this.disposables = [];

		// 뷰 정리
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_NEROMIND);
	}

	/**
	 * 설정 로드
	 */
	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	/**
	 * 설정 저장
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.settingsBus.emit(SETTINGS_CHANGED_EVENT, { settings: this.settings });
	}

	onSettingsChange(handler: (settings: NeroMindSettings) => void): () => void {
		return this.settingsBus.on(SETTINGS_CHANGED_EVENT, (payload) => {
			const data = payload as { settings: NeroMindSettings };
			handler(data.settings);
		});
	}

	/**
	 * MindMapView 활성화
	 */
	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// 기존 뷰 찾기
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_NEROMIND)[0];

		// 없으면 새로 생성
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_NEROMIND,
					active: true
				});
				leaf = rightLeaf;
			}
		}

		// 뷰 활성화
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * Disposable 등록
	 * 
	 * @param disposable - 정리가 필요한 객체
	 */
	registerDisposable(disposable: Disposable): void {
		this.disposables.push(disposable);
	}
}
