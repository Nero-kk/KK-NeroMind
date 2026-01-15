/**
 * TransactionCommand
 *
 * 책임:
 * - 여러 UndoableCommand를 하나로 묶어 실행/취소
 * - execute 실패 시 부분 실행 롤백
 *
 * 비책임:
 * - HistoryManager 제어
 * - 이벤트 발행
 */

import { UndoableCommand } from './UndoableCommand';
import { StateContext } from '../state/stateTypes';

export class TransactionCommand implements UndoableCommand {
  description = 'Transaction';
  private readonly commands: UndoableCommand[];

  constructor(commands: UndoableCommand[], description?: string) {
    this.commands = commands;
    if (description) {
      this.description = description;
    }
  }

  execute(context: StateContext): void {
    const executed: UndoableCommand[] = [];

    try {
      for (const command of this.commands) {
        command.execute(context);
        executed.push(command);
      }
    } catch (error) {
      for (let i = executed.length - 1; i >= 0; i -= 1) {
        try {
          executed[i].undo(context);
        } catch {
          // rollback best-effort
        }
      }
      throw error;
    }
  }

  undo(context: StateContext): void {
    for (let i = this.commands.length - 1; i >= 0; i -= 1) {
      this.commands[i].undo(context);
    }
  }
}
