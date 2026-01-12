import { Plugin, WorkspaceLeaf } from 'obsidian';
import { NeroMindView, VIEW_TYPE_NEROMIND } from './views/NeroMindView';
import { NeroMindSettingTab } from './ui/NeroMindSettingTab';
import { NeroMindSettings, DEFAULT_SETTINGS } from './types';

/**
 * KK-NeroMind 플러그인 메인 클래스
 *
 * Phase 1 주의사항 준수:
 * 1. onload()는 async
 * 2. await loadSettings() 먼저 실행
 * 3. onLayoutReady() 내에서 초기화
 * 4. disposables 배열로 생명주기 관리
 * 5. onunload()에서 역순으로 destroy
 */
export default class NeroMindPlugin extends Plugin {
	settings: NeroMindSettings;
	private disposables: Array<{ destroy: () => void }> = [];

	/**
	 * 플러그인 로드
	 *
	 * 실행 순서:
	 * 1. 설정 로드 (비동기)
	 * 2. 뷰 타입 등록
	 * 3. 리본 아이콘 추가
	 * 4. 설정 탭 등록
	 * 5. workspace onLayoutReady 대기 후 초기화
	 */
	async onload(): Promise<void> {
		console.log('Loading KK-NeroMind plugin...');

		// 1. 설정 로드 (비동기 작업 완료 필수)
		await this.loadSettings();

		// 2. 뷰 타입 등록
		this.registerView(
			VIEW_TYPE_NEROMIND,
			(leaf) => new NeroMindView(leaf, this)
		);

		// 3. 리본 아이콘 추가 (좌측 사이드바)
		const ribbonIconEl = this.addRibbonIcon(
			'brain',
			'Open NeroMind',
			(evt: MouseEvent) => {
				this.activateView();
			}
		);
		ribbonIconEl.addClass('neromind-ribbon-icon');

		// 4. 설정 탭 등록
		this.addSettingTab(new NeroMindSettingTab(this.app, this));

		// 5. 명령어 등록
		this.addCommand({
			id: 'open-neromind',
			name: 'Open NeroMind View',
			callback: () => {
				this.activateView();
			}
		});

		// 6. workspace 준비 완료 후 초기화
		// 주의: DOM 조작은 반드시 onLayoutReady 내에서 수행
		this.app.workspace.onLayoutReady(() => {
			this.initializePlugin();
		});
	}

	/**
	 * 플러그인 초기화
	 *
	 * onLayoutReady 콜백 내에서 실행되어야 함
	 * DOM이 완전히 준비된 상태를 보장
	 */
	private initializePlugin(): void {
		console.log('Initializing KK-NeroMind plugin...');

		// Phase 1에서는 기본 초기화만 수행
		// Phase 2 이후: InputManager, StateManager 등 초기화

		// 추가 모듈 초기화는 여기서 수행
		// this.inputManager = new InputManager(...);
		// this.disposables.push(this.inputManager);
	}

	/**
	 * 플러그인 언로드
	 *
	 * Phase 1 주의사항: 역순으로 destroy 호출
	 *
	 * 향후 destroy 순서 (Phase 2+):
	 * 1. Input Layer (InputManager, GlobalShortcutInterceptor)
	 * 2. Sync Layer (SyncManager, IntegrityChecker)
	 * 3. State Layer (StateManager, CommandHistory)
	 * 4. Renderer Layer (Renderer, MiniMapRenderer)
	 *
	 * 이유: 상위 이벤트 소스부터 차단하여
	 *       하위 모듈에 이벤트가 유입되지 않도록 함
	 */
	async onunload(): Promise<void> {
		console.log('Unloading KK-NeroMind plugin...');

		// 역순으로 dispose (중요!)
		// reverse()는 원본 배열을 변경하므로 복사본 사용
		const disposablesToDestroy = [...this.disposables].reverse();

		for (const disposable of disposablesToDestroy) {
			try {
				disposable.destroy();
			} catch (error) {
				console.error('Error destroying disposable:', error);
			}
		}

		// 배열 초기화
		this.disposables = [];

		// 뷰 정리
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_NEROMIND);
	}

	/**
	 * 설정 로드
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * 설정 저장
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * NeroMind 뷰 활성화
	 *
	 * 우측 사이드바에 뷰가 없으면 생성
	 * 이미 있으면 해당 뷰로 전환
	 */
	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NEROMIND);

		if (leaves.length > 0) {
			// 이미 열려있는 뷰로 전환
			leaf = leaves[0];
		} else {
			// 새 뷰 생성 (우측 사이드바)
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_NEROMIND,
					active: true,
				});
			}
		}

		// 뷰 활성화
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
