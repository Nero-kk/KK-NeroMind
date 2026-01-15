/**
 * HistoryManager
 *
 * === 책임 (Responsibilities) ===
 * - UndoableCommand를 실행하고 히스토리에 저장 (execute)
 * - 이전 상태로 복원 (undo)
 * - 취소 가능 여부 확인 (canUndo)
 * - 히스토리 크기 제한 (MAX_HISTORY = 10)
 * - StateManager를 외부에서 래핑 (wrapper pattern)
 *
 * === 하지 않는 것 (Non-Responsibilities) ===
 * - ❌ 메모리 스냅샷 저장: Inverse Operation 패턴으로 필요한 데이터만 보존
 * - ❌ EventBus 통합: Phase 3.0 범위 초과
 * - ❌ Redo 기능: Undo-only 정책
 * - ❌ 이벤트 발행: StateManager이 이미 처리
 * - ❌ 유효성 검증: 커맨드 구현체의 책임
 * - ❌ StateManager 상태 직접 조작: apply(command) 호출로만 상호작용
 *
 * === 아키텍처 ===
 * NeroMindView
 *     ↓
 * HistoryManager (wrapper)
 *     ↓
 * StateManager (피래핑 객체)
 *
 * 호출 흐름:
 * 1. view.execute(command) → HistoryManager.execute(command)
 * 2. HistoryManager → StateManager.apply(command)
 * 3. CommandQueue.push(command)
 * 4. return StateSnapshot
 *
 * Undo 흐름:
 * 1. view.undo() → HistoryManager.undo()
 * 2. command = queue.pop()
 * 3. HistoryManager → StateManager.apply(undoCommand)
 *    (undoCommand.execute = original.undo)
 * 4. return StateSnapshot
 *
 * === MAX_HISTORY = 10 ===
 * 최대 10개의 작업만 히스토리에 보관.
 * 11번째 작업 추가 시 가장 오래된 작업 자동 제거.
 *
 * === 실패 안전성 ===
 * - HistoryManager 제거 시 StateManager는 독립적으로 작동
 * - 히스토리 관련 코드만 제거하면 롤백 가능
 * - StateManager의 기존 apply(command) 메서드로 직접 호출 가능
 */

import { Disposable } from '../types';
import { StateManager } from '../state/StateManager';
import { StateContext, StateSnapshot } from '../state/stateTypes';
import { UndoableCommand } from './UndoableCommand';
import { TransactionCommand } from './TransactionCommand';
import { MoveNodeCommand } from './MoveNodeCommand';

export class HistoryManager implements Disposable {
  private readonly commandQueue: UndoableCommand[] = [];
  private readonly MAX_HISTORY = 10;
  private readonly stateManager: StateManager;
  private readonly coalesceWindowMs = 300;
  private coalesceBlocked = false;

  /**
   * HistoryManager 생성자
   *
   * @param stateManager - 래핑할 StateManager 인스턴스
   *
   * 책임:
   * - StateManager 참조 저장
   * - 빈 히스토리 큐 초기화
   *
   * 비책임:
   * - StateManager의 초기 상태 설정 (호출자 책임)
   */
  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * UndoableCommand 실행
   *
   * 책임:
   * 1. StateManager.apply(command) 호출로 명령 실행
   * 2. 실행된 커맨드를 히스토리 큐에 추가
   * 3. MAX_HISTORY 초과 시 가장 오래된 커맨드 제거
   * 4. 현재 상태 스냅샷 반환
   *
   * @param command - 실행할 UndoableCommand
   * @returns 명령 실행 후의 StateSnapshot
   *
   * 비책임:
   * - 커맨드 유효성 검증 (구현체의 책임)
   * - StateManager 내부 상태 직접 조작
   * - EventBus 발행
   */
  execute(command: UndoableCommand | UndoableCommand[]): StateSnapshot {
    if (Array.isArray(command)) {
      const transaction = new TransactionCommand(command);
      return this.executeSingle(transaction);
    }

    return this.executeSingle(command);
  }

  endMoveCoalescing(): void {
    this.coalesceBlocked = true;
  }

  private executeSingle(command: UndoableCommand): StateSnapshot {
    const mergedSnapshot = this.tryCoalesceMove(command);
    if (mergedSnapshot) {
      return mergedSnapshot;
    }

    // StateManager이 command.execute(context)를 호출함
    const snapshot = this.stateManager.apply(command as any);

    // 히스토리에 커맨드 추가
    this.commandQueue.push(command);

    // MAX_HISTORY 초과 시 FIFO로 가장 오래된 커맨드 제거
    if (this.commandQueue.length > this.MAX_HISTORY) {
      this.commandQueue.shift();
    }

    return snapshot;
  }

  private tryCoalesceMove(command: UndoableCommand): StateSnapshot | null {
    if (!(command instanceof MoveNodeCommand)) {
      this.coalesceBlocked = false;
      return null;
    }

    if (this.coalesceBlocked) {
      this.coalesceBlocked = false;
      return null;
    }

    const lastCommand = this.commandQueue[this.commandQueue.length - 1];
    if (!(lastCommand instanceof MoveNodeCommand)) {
      return null;
    }

    if (!this.canMergeMoveCommands(lastCommand, command)) {
      return null;
    }

    lastCommand.updateNextPosition(command.getNextPosition());
    const snapshot = this.stateManager.apply(lastCommand as any);
    return snapshot;
  }

  private canMergeMoveCommands(
    previous: MoveNodeCommand,
    next: MoveNodeCommand
  ): boolean {
    if (previous.getNodeId() !== next.getNodeId()) {
      return false;
    }

    const lastAppliedAt = previous.getLastAppliedAt();
    const now = next.getCreatedAt();
    if (lastAppliedAt === 0) {
      return false;
    }

    return now - lastAppliedAt <= this.coalesceWindowMs;
  }

  /**
   * 마지막 작업 취소
   *
   * 책임:
   * 1. 히스토리 큐에서 마지막 커맨드 추출 (pop)
   * 2. Inverse Operation 패턴으로 undo() 실행
   * 3. StateManager을 통해 역방향 변경 적용
   * 4. 복원된 상태 스냅샷 반환
   *
   * @returns 취소 후의 StateSnapshot
   * @throws Error - 취소할 히스토리가 없으면 에러
   *
   * 비책임:
   * - undo 가능 여부 사전 확인 (canUndo 메서드 별도 제공)
   * - Redo 기능
   * - EventBus 발행
   */
  undo(): StateSnapshot {
    if (!this.canUndo()) {
      throw new Error('No history to undo');
    }

    // 마지막 커맨드 제거
    const command = this.commandQueue.pop()!;

    // Inverse Operation: undo()를 execute()처럼 실행
    // StateManager.apply()는 command.execute(context)를 호출하는데,
    // 여기서는 command.undo(context)를 실행해야 하므로 래퍼를 사용
    const undoWrapper: any = {
      description: `Undo: ${command.description}`,
      execute: (context: StateContext) => {
        command.undo(context);
      },
    };

    const snapshot = this.stateManager.apply(undoWrapper);

    return snapshot;
  }

  /**
   * 취소 가능 여부
   *
   * @returns true면 undo() 호출 가능, false면 히스토리 없음
   *
   * 책임:
   * - 커맨드 큐 상태 확인
   *
   * 비책임:
   * - StateManager 상태 확인 (irrelevant)
   * - Redo 가능 여부 확인
   */
  canUndo(): boolean {
    return this.commandQueue.length > 0;
  }

  /**
   * 현재 히스토리 크기
   *
   * @returns 저장된 커맨드 개수
   *
   * 용도:
   * - UI에서 히스토리 개수 표시
   * - 디버깅
   * - 테스트
   */
  getHistorySize(): number {
    return this.commandQueue.length;
  }

  /**
   * 히스토리 초기화 (선택사항)
   *
   * 용도:
   * - 새 파일 로드 시 이전 히스토리 제거
   * - 테스트
   *
   * 책임:
   * - 모든 커맨드 큐 비우기
   *
   * 비책임:
   * - StateManager 상태 초기화
   */
  clearHistory(): void {
    this.commandQueue.length = 0;
  }

  /**
   * StateManager 직접 접근 (고급 사용)
   *
   * 용도:
   * - Renderer 등에서 현재 상태 조회
   * - StateManager의 getSnapshot() 등 직접 호출
   *
   * 책임:
   * - StateManager 인스턴스 반환
   *
   * 주의:
   * - 이 메서드로 StateManager.apply() 호출 시 히스토리에 기록되지 않음
   * - 히스토리가 필요하면 HistoryManager.execute() 사용
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }

  /**
   * 리소스 정리
   *
   * 책임:
   * - 히스토리 큐 비우기
   * - StateManager 정리
   *
   * 비책임:
   * - StateManager는 자신의 destroy()를 호출하므로 여기서는 관리 해제만
   */
  destroy(): void {
    this.commandQueue.length = 0;
    this.stateManager.destroy();
  }
}
