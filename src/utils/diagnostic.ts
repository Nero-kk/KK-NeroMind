/**
 * Boot Diagnostics
 * 
 * 근거: KK-NeroMind-Architecture-v5.2.0.md Section 3
 * 
 * 목적: 각 모듈 로드 성공/실패 추적
 */

export interface ModuleStatus {
  id: string;
  status: 'success' | 'failed';
  error?: Error;
  timestamp: number;
}

export interface BootResult {
  success: boolean;
  modules: ModuleStatus[];
  failedCount: number;
}

/**
 * Boot Diagnostics Manager
 */
export class BootDiagnostics {
  private modules = new Map<string, ModuleStatus>();
  
  /**
   * 모듈 상태 등록
   */
  register(moduleId: string, status: 'success' | 'failed', error?: Error): void {
    const moduleStatus: ModuleStatus = {
      id: moduleId,
      status,
      error,
      timestamp: Date.now()
    };
    
    this.modules.set(moduleId, moduleStatus);
    
    // 로깅
    if (status === 'success') {
      console.log(`[BootDiagnostics] ${moduleId}: SUCCESS`);
    } else {
      console.error(`[BootDiagnostics] ${moduleId}: FAILED`, error);
    }
  }
  
  /**
   * 전체 모듈 체크
   */
  checkAllModules(): BootResult {
    const modules = Array.from(this.modules.values());
    const failedModules = modules.filter(m => m.status === 'failed');
    
    return {
      success: failedModules.length === 0,
      modules,
      failedCount: failedModules.length
    };
  }
  
  /**
   * 특정 모듈 상태 조회
   */
  getModuleStatus(moduleId: string): ModuleStatus | undefined {
    return this.modules.get(moduleId);
  }
  
  /**
   * 등록된 모듈 수
   */
  get moduleCount(): number {
    return this.modules.size;
  }
}
