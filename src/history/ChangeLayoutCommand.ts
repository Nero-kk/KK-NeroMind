/**
 * ChangeLayoutCommand
 *
 * 책임:
 * - execute(): 레이아웃 설정 변경 + 재계산 이벤트 발행
 * - undo(): 이전 설정 복구 + 재계산 이벤트 발행
 *
 * 비책임:
 * - View 직접 호출
 * - 레이아웃 계산 직접 호출
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';
import type { LayoutDirection, NeroMindSettings } from '../settings/NeroMindSettingTab';

export type LayoutChangeScope = { scope: 'all' | 'subtree'; rootId?: string };

export type LayoutSettingsPatch = {
  enableRadialLayout?: boolean;
  layoutDirection?: LayoutDirection;
};

export class ChangeLayoutCommand implements UndoableCommand {
  description = 'Change layout settings';
  private readonly currentSettings: NeroMindSettings;
  private readonly nextPatch: LayoutSettingsPatch;
  private readonly scope: LayoutChangeScope;
  private prevSettings: Pick<NeroMindSettings, 'enableRadialLayout' | 'layoutDirection'> | null = null;

  constructor(
    currentSettings: NeroMindSettings,
    nextPatch: LayoutSettingsPatch,
    scope: LayoutChangeScope = { scope: 'all' }
  ) {
    this.currentSettings = { ...currentSettings };
    this.nextPatch = { ...nextPatch };
    this.scope = scope;
  }

  execute(context: StateContext): void {
    if (!this.prevSettings) {
      this.prevSettings = {
        enableRadialLayout: this.currentSettings.enableRadialLayout,
        layoutDirection: this.currentSettings.layoutDirection,
      };
    }

    const nextSettings: NeroMindSettings = {
      ...this.currentSettings,
      ...this.nextPatch,
    };

    context.emit?.('layoutSettingsChanged', {
      settings: {
        enableRadialLayout: nextSettings.enableRadialLayout,
        layoutDirection: nextSettings.layoutDirection,
      },
      scope: this.scope.scope,
      rootId: this.scope.rootId,
    });
  }

  undo(context: StateContext): void {
    if (!this.prevSettings) return;

    context.emit?.('layoutSettingsChanged', {
      settings: {
        enableRadialLayout: this.prevSettings.enableRadialLayout,
        layoutDirection: this.prevSettings.layoutDirection,
      },
      scope: this.scope.scope,
      rootId: this.scope.rootId,
    });
  }
}
