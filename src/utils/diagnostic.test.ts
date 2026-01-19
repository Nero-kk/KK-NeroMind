import { BootDiagnostics } from './diagnostic';

describe('BootDiagnostics', () => {
  let diagnostics: BootDiagnostics;
  
  beforeEach(() => {
    diagnostics = new BootDiagnostics();
  });
  
  test('초기 moduleCount는 0', () => {
    expect(diagnostics.moduleCount).toBe(0);
  });
  
  test('성공 모듈 등록', () => {
    diagnostics.register('test-module', 'success');
    
    const status = diagnostics.getModuleStatus('test-module');
    expect(status).toBeDefined();
    expect(status?.status).toBe('success');
  });
  
  test('실패 모듈 등록 with error', () => {
    const error = new Error('Test error');
    diagnostics.register('failing-module', 'failed', error);
    
    const status = diagnostics.getModuleStatus('failing-module');
    expect(status?.status).toBe('failed');
    expect(status?.error).toBe(error);
  });
  
  test('모든 모듈 성공 시 checkAllModules 성공', () => {
    diagnostics.register('module-1', 'success');
    diagnostics.register('module-2', 'success');
    
    const result = diagnostics.checkAllModules();
    expect(result.success).toBe(true);
    expect(result.failedCount).toBe(0);
  });
  
  test('하나라도 실패 시 checkAllModules 실패', () => {
    diagnostics.register('module-1', 'success');
    diagnostics.register('module-2', 'failed', new Error('Test'));
    
    const result = diagnostics.checkAllModules();
    expect(result.success).toBe(false);
    expect(result.failedCount).toBe(1);
  });
  
  test('timestamp 기록 확인', () => {
    const before = Date.now();
    diagnostics.register('test', 'success');
    const after = Date.now();
    
    const status = diagnostics.getModuleStatus('test');
    expect(status?.timestamp).toBeGreaterThanOrEqual(before);
    expect(status?.timestamp).toBeLessThanOrEqual(after);
  });
});
