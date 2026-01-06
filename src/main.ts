import { Plugin, WorkspaceLeaf } from 'obsidian';
import { NeroMindView, VIEW_TYPE_NEROMIND } from './views/NeroMindView';

export default class NeroMindPlugin extends Plugin {
  async onload() {
    console.log('Loading KK-NeroMind plugin');

    // Register the custom view
    this.registerView(
      VIEW_TYPE_NEROMIND,
      (leaf: WorkspaceLeaf) => new NeroMindView(leaf)
    );

    // Add ribbon icon (left sidebar)
    this.addRibbonIcon('brain', 'Open NeroMind', () => {
      this.activateView();
    });

    // Add command to open NeroMind
    this.addCommand({
      id: 'open-neromind',
      name: 'Open NeroMind View',
      callback: () => {
        this.activateView();
      },
    });
  }

  async onunload() {
    console.log('Unloading KK-NeroMind plugin');
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NEROMIND);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_NEROMIND);

    if (leaves.length > 0) {
      // View already exists, reveal it
      leaf = leaves[0];
    } else {
      // Create new leaf in the right sidebar
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_NEROMIND,
          active: true,
        });
      }
    }

    // Reveal the leaf
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
