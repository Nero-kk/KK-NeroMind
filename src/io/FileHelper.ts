import { type App, normalizePath } from "obsidian";

/**
 * 파일 I/O 공통 유틸리티.
 * ExportManager, FullNoteCompiler, FileManager에서 공유한다.
 */

/** 폴더가 없으면 생성 */
export async function ensureFolder(app: App, folderPath: string): Promise<void> {
  if (!folderPath) return;
  const existing = app.vault.getAbstractFileByPath(folderPath);
  if (!existing) {
    await app.vault.createFolder(folderPath);
  }
}

/** 파일 쓰기 (기존 파일이면 덮어쓰기, 없으면 폴더 생성 후 생성) */
export async function writeFile(app: App, filePath: string, content: string): Promise<void> {
  const normalized = normalizePath(filePath);
  const existing = app.vault.getAbstractFileByPath(normalized);

  if (existing) {
    await app.vault.adapter.write(normalized, content);
  } else {
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash > 0) {
      await ensureFolder(app, normalized.substring(0, lastSlash));
    }
    await app.vault.create(normalized, content);
  }
}

/** 출력 파일 경로 생성 (폴더 + 파일명 결합) */
export function buildOutputPath(outputFolder: string, fileName: string): string {
  return normalizePath(
    outputFolder ? `${outputFolder}/${fileName}` : fileName,
  );
}
