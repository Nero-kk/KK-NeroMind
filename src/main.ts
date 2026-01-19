import { Plugin, Notice } from 'obsidian';
import { SchemaValidator } from './schema/validator';
import { DisposableRegistry } from './utils/disposable';
import { BootDiagnostics } from './utils/diagnostic';
import { MindMapSchema, CURRENT_SCHEMA_VERSION } from './schema/types';

// View Type constant for .kknm files
const VIEW_TYPE_MINDMAP = 'kknm-mindmap-view';

/**
 * KK-NeroMind Plugin
 * 
 * Phase 1: Zero-to-One
 * - Plugin loads in Obsidian
 * - Command appears in palette
 * - .kknm file creation works
 */
export default class KKNeroMindPlugin extends Plugin {
  private bootDiagnostics!: BootDiagnostics;
  private disposableRegistry!: DisposableRegistry;
  private schemaValidator!: SchemaValidator;
  
  async onload(): Promise<void> {
    console.log('[KK-NeroMind] Plugin loading...');
    
    // 1. Initialize diagnostics
    this.bootDiagnostics = new BootDiagnostics();
    this.disposableRegistry = new DisposableRegistry();
    
    // 2. Initialize core modules
    try {
      this.initializeCore();
      this.bootDiagnostics.register('core-init', 'success');
    } catch (error) {
      this.bootDiagnostics.register('core-init', 'failed', error as Error);
      this.enterSafeMode();
      return;
    }
    
    // 3. Register commands
    try {
      this.registerCommands();
      this.bootDiagnostics.register('commands', 'success');
    } catch (error) {
      this.bootDiagnostics.register('commands', 'failed', error as Error);
      this.enterSafeMode();
      return;
    }
    
    // 4. Register file extensions
    try {
      this.registerExtensions(['kknm'], VIEW_TYPE_MINDMAP);
      this.bootDiagnostics.register('extensions', 'success');
    } catch (error) {
      this.bootDiagnostics.register('extensions', 'failed', error as Error);
      this.enterSafeMode();
      return;
    }
    
    // 5. Boot diagnostic check
    const bootResult = this.bootDiagnostics.checkAllModules();
    if (!bootResult.success) {
      console.error('[KK-NeroMind] Boot failed', bootResult);
      this.enterSafeMode();
      return;
    }
    
    console.log('[KK-NeroMind] Plugin loaded successfully');
  }
  
  /**
   * Initialize core modules
   */
  private initializeCore(): void {
    this.schemaValidator = new SchemaValidator();
    console.log('[KK-NeroMind] Core modules initialized');
  }
  
  /**
   * Register commands
   */
  private registerCommands(): void {
    this.addCommand({
      id: 'create-new-mindmap',
      name: 'Create New Mind Map',
      callback: () => this.createNewMindMap()
    });
    
    console.log('[KK-NeroMind] Commands registered');
  }
  
  /**
   * Create new mind map file
   */
  private async createNewMindMap(): Promise<void> {
    try {
      // CRITICAL: Use created, modified (NOT createdAt, updatedAt)
      const initialData: MindMapSchema = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        metadata: {
          created: Date.now(),    // ✅ created
          modified: Date.now(),   // ✅ modified
          title: 'New Mind Map'   // ✅ title
        },
        nodes: {},
        edges: {},
        camera: { x: 0, y: 0, zoom: 1.0 }
      };
      
      // Validate before creating
      if (!this.schemaValidator.validate(initialData)) {
        console.error('[KK-NeroMind] Invalid initial data');
        new Notice('Failed to create mind map: Invalid data');
        return;
      }
      
      const content = JSON.stringify(initialData, null, 2);
      const filename = `MindMap-${Date.now()}.kknm`;
      
      const file = await this.app.vault.create(filename, content);
      
      // Open the created file
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
      
      new Notice(`Created: ${filename}`);
      console.log(`[KK-NeroMind] Created: ${filename}`);
      
    } catch (error) {
      console.error('[KK-NeroMind] Failed to create mind map', error);
      new Notice('Failed to create mind map');
    }
  }
  
  /**
   * Enter safe mode (Phase 1에서는 로그만)
   */
  private enterSafeMode(): void {
    console.error('[KK-NeroMind] Entering safe mode - plugin disabled');
    new Notice('KK-NeroMind: Plugin loaded in safe mode due to boot errors');
    // Phase 2+: Conflict Lock 처리
  }
  
  async onunload(): Promise<void> {
    console.log('[KK-NeroMind] Plugin unloading...');
    
    if (this.disposableRegistry) {
      try {
        this.disposableRegistry.dispose();
        console.log('[KK-NeroMind] Resources disposed');
      } catch (error) {
        console.error('[KK-NeroMind] Error during disposal:', error);
      }
    }
    
    console.log('[KK-NeroMind] Plugin unloaded');
  }
}