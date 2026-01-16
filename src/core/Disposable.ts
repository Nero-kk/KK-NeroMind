/**
 * Disposable Interface
 * 
 * 목적:
 * - 리소스 정리(cleanup)를 강제하는 인터페이스
 * - 메모리 누수 방지
 * - 일관된 생명주기 관리
 */

export interface Disposable {
	/**
	 * 리소스 정리
	 * - 이벤트 리스너 제거
	 * - 타이머 정리
	 * - 참조 해제
	 */
	destroy(): void;
}
