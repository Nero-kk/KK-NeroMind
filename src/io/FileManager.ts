import { type App, Notice, normalizePath } from "obsidian";
import type { MindMapDocument } from "../types";
import { createDocument } from "../core/MindMapNode";
import { FILE_EXTENSION, AUTO_SAVE_DEBOUNCE_MS } from "../constants";
import { ensureFolder } from "./FileHelper";

/**
 * .NeroMind 파일 읽기/쓰기 및 자동 저장 관리.
 */
/** 자동 저장 재시도 설정 */
const AUTO_SAVE_RETRY_DELAY_MS = 30_000;
const AUTO_SAVE_MAX_RETRIES = 3;

export class FileManager {
  private app: App;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private isDirty = false;
  private currentFilePath: string | null = null;
  private retryCount = 0;

  constructor(app: App) {
    this.app = app;
  }

  /** 새 마인드맵 문서를 생성하고 파일에 저장 (파일명 충돌 시 번호 추가) */
  async createNew(title: string, folderPath: string): Promise<{ doc: MindMapDocument; path: string }> {
    const doc = createDocument(title || "새 마인드맵");

    // 폴더가 없으면 생성
    await ensureFolder(this.app, folderPath);

    // 파일명 충돌 방지: 기존 파일이 있으면 번호 추가
    const filePath = this.findAvailablePath(doc.title, folderPath);

    const content = JSON.stringify(doc, null, 2);
    await this.app.vault.create(filePath, content);
    this.currentFilePath = filePath;
    this.isDirty = false;

    return { doc, path: filePath };
  }

  /** 사용 가능한 파일 경로 탐색 (충돌 시 번호 추가) */
  private findAvailablePath(baseTitle: string, folderPath: string): string {
    const buildPath = (name: string): string =>
      normalizePath(folderPath ? `${folderPath}/${name}.${FILE_EXTENSION}` : `${name}.${FILE_EXTENSION}`);

    let candidate = buildPath(baseTitle);
    if (!this.app.vault.getAbstractFileByPath(candidate)) {
      return candidate;
    }

    for (let i = 2; i <= 100; i++) {
      candidate = buildPath(`${baseTitle} ${i}`);
      if (!this.app.vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
    }

    // 극단적 fallback: 타임스탬프
    return buildPath(`${baseTitle} ${Date.now()}`);
  }

  /** .NeroMind 파일에서 문서 로드 */
  async load(filePath: string): Promise<MindMapDocument> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }

    const content = await this.app.vault.adapter.read(filePath);
    const doc = JSON.parse(content) as MindMapDocument;
    this.currentFilePath = filePath;
    this.isDirty = false;

    return doc;
  }

  /** 문서를 현재 파일에 저장 */
  async save(doc: MindMapDocument): Promise<void> {
    if (!this.currentFilePath) return;

    try {
      const content = JSON.stringify(doc, null, 2);
      await this.app.vault.adapter.write(this.currentFilePath, content);
      this.isDirty = false;
      this.retryCount = 0;
    } catch (err) {
      if (this.retryCount < AUTO_SAVE_MAX_RETRIES) {
        this.retryCount++;
        new Notice(`마인드맵 저장 실패 (${this.retryCount}/${AUTO_SAVE_MAX_RETRIES}회). 30초 후 재시도...`);
        this.autoSaveTimer = setTimeout(() => {
          this.autoSaveTimer = null;
          this.save(doc);
        }, AUTO_SAVE_RETRY_DELAY_MS);
      } else {
        new Notice(`마인드맵 저장 실패: ${String(err)}. 수동 저장(Ctrl+S)을 시도해주세요.`, 5000);
      }
    }
  }

  /** 변경 알림 → debounce 자동 저장 예약 */
  markDirty(doc: MindMapDocument): void {
    this.isDirty = true;

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      if (this.isDirty) {
        this.save(doc);
      }
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  /** 현재 파일 경로 반환 */
  getCurrentFilePath(): string | null {
    return this.currentFilePath;
  }

  /** 파일 경로 설정 (외부에서 파일을 열 때) */
  setCurrentFilePath(filePath: string): void {
    this.currentFilePath = filePath;
  }

  /** 다른 이름으로 저장 (파일명 지정) */
  async saveAs(doc: MindMapDocument, fileName: string, folderPath: string): Promise<string> {
    await ensureFolder(this.app, folderPath);
    const filePath = this.findAvailablePath(fileName, folderPath);
    const content = JSON.stringify(doc, null, 2);
    await this.app.vault.create(filePath, content);
    this.currentFilePath = filePath;
    this.isDirty = false;
    return filePath;
  }

  /** 즉시 저장 (Ctrl+S) */
  async saveImmediate(doc: MindMapDocument): Promise<void> {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    await this.save(doc);
    new Notice("마인드맵 저장 완료");
  }

  /** 정리 */
  destroy(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}
