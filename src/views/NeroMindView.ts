import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { createElement } from 'react';
import { NeroMindCanvas } from '../components/NeroMindCanvas';

export const VIEW_TYPE_NEROMIND = 'neromind-view';

export class NeroMindView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_NEROMIND;
  }

  getDisplayText(): string {
    return 'NeroMind';
  }

  getIcon(): string {
    return 'brain';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();

    // Add the main container class
    container.addClass('neromind-container');

    // Create root element for React
    const rootEl = container.createDiv({ cls: 'neromind-root' });

    // Mount React component
    this.root = createRoot(rootEl);
    this.root.render(
      createElement(NeroMindCanvas, {
        app: this.app,
      })
    );
  }

  async onClose(): Promise<void> {
    // Cleanup React
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
