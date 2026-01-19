/**
 * Disposable Interface & Registry
 * 
 * 근거: KK-NeroMind-Architecture-v5.2.0.md Section 17
 * 
 * 목적: onunload 시 모든 리소스 자동 정리
 */

export interface Disposable {
  dispose(): void;
}

/**
 * Disposable Registry
 * 
 * 모든 Disposable 리소스를 추적하고 일괄 정리
 */
export class DisposableRegistry implements Disposable {
  private disposables = new Set<Disposable>();
  
  /**
   * Disposable 등록
   */
  register(disposable: Disposable): void {
    this.disposables.add(disposable);
  }
  
  /**
   * Disposable 등록 해제
   */
  unregister(disposable: Disposable): void {
    this.disposables.delete(disposable);
  }
  
  /**
   * 모든 Disposable 정리
   * 
   * CRITICAL: 하나 실패해도 나머지 계속 진행
   */
  dispose(): void {
    const errors: Error[] = [];
    
    for (const disposable of this.disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('[DisposableRegistry] Dispose failed', error);
        errors.push(error as Error);
      }
    }
    
    this.disposables.clear();
    
    if (errors.length > 0) {
      console.warn(`[DisposableRegistry] ${errors.length} disposables failed to clean up`);
    }
  }
  
  /**
   * 등록된 Disposable 개수
   */
  get count(): number {
    return this.disposables.size;
  }
}
