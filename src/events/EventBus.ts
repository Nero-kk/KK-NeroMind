/**
 * EventBus
 * 책임: 이벤트 구독/발행의 최소 연결부 제공 (in-memory)
 * 비책임: 이벤트 타입 정의, 외부 상태 관리, 로깅/디버그, retry/once/off/clear, 히스토리·렌더·퍼시스턴스 연동
 */
export class EventBus {
  private listeners: Map<string, Set<(payload: unknown) => void>> = new Map();

  /**
   * 이벤트 구독
   * @returns 구독 해제 함수
   */
  on(eventName: string, handler: (payload: unknown) => void): () => void {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('EventBus.on: eventName must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new Error('EventBus.on: handler must be a function');
    }

    let handlers = this.listeners.get(eventName);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(eventName, handlers);
    }
    handlers.add(handler);

    return () => {
      const current = this.listeners.get(eventName);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  /**
   * 이벤트 발행
   */
  emit(eventName: string, payload: unknown): void {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('EventBus.emit: eventName must be a non-empty string');
    }
    if (payload === undefined) {
      throw new Error('EventBus.emit: payload is undefined');
    }

    const handlers = this.listeners.get(eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch {
        // 의도적으로 에러를 전파하거나 로깅하지 않는다.
      }
    }
  }
}
