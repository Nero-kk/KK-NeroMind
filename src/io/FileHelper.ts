import { type App, TFile, normalizePath } from "obsidian";
import type { MindMapNode } from "../types";

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

/**
 * 노드에서 노트 파일 경로를 결정한다.
 * 1) noteRef가 있으면 그대로 사용
 * 2) 없으면 라벨에서 [[위키링크]] 패턴을 추출하여 vault에서 파일 검색
 */
export function resolveNotePath(app: App, node: MindMapNode): string | null {
  if (node.noteRef) {
    return node.noteRef;
  }

  const match = node.label.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
  if (!match) return null;

  const linkText = match[1].trim();
  if (!linkText) return null;

  // Obsidian metadataCache로 위키링크 해석
  const resolved = app.metadataCache.getFirstLinkpathDest(linkText, "");
  if (resolved instanceof TFile) {
    return resolved.path;
  }

  // 직접 경로로 시도
  const directPath = linkText.endsWith(".md") ? linkText : `${linkText}.md`;
  const directFile = app.vault.getAbstractFileByPath(directPath);
  if (directFile) {
    return directPath;
  }

  return null;
}

/** noteRef 경로에서 노트 이름 추출 (.md 제거) */
export function extractNoteName(noteRef: string): string {
  return noteRef.split("/").pop()?.replace(".md", "") || noteRef;
}
