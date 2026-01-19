import { Disposable, DisposableRegistry } from './disposable';

describe('DisposableRegistry', () => {
  let registry: DisposableRegistry;
  
  beforeEach(() => {
    registry = new DisposableRegistry();
  });
  
  test('초기 count는 0', () => {
    expect(registry.count).toBe(0);
  });
  
  test('register로 Disposable 추가', () => {
    const disposable: Disposable = {
      dispose: jest.fn()
    };
    
    registry.register(disposable);
    expect(registry.count).toBe(1);
  });
  
  test('unregister로 Disposable 제거', () => {
    const disposable: Disposable = {
      dispose: jest.fn()
    };
    
    registry.register(disposable);
    registry.unregister(disposable);
    expect(registry.count).toBe(0);
  });
  
  test('dispose 호출 시 모든 Disposable.dispose 실행', () => {
    const d1: Disposable = { dispose: jest.fn() };
    const d2: Disposable = { dispose: jest.fn() };
    
    registry.register(d1);
    registry.register(d2);
    registry.dispose();
    
    expect(d1.dispose).toHaveBeenCalled();
    expect(d2.dispose).toHaveBeenCalled();
  });
  
  test('dispose 후 count는 0', () => {
    const disposable: Disposable = {
      dispose: jest.fn()
    };
    
    registry.register(disposable);
    registry.dispose();
    expect(registry.count).toBe(0);
  });
  
  test('하나 실패해도 나머지 계속 진행', () => {
    const d1: Disposable = {
      dispose: jest.fn(() => { throw new Error('Test error'); })
    };
    const d2: Disposable = { dispose: jest.fn() };
    
    registry.register(d1);
    registry.register(d2);
    
    // 에러 throw 안 함
    expect(() => registry.dispose()).not.toThrow();
    
    // d2는 정상 실행됨
    expect(d2.dispose).toHaveBeenCalled();
  });
});
