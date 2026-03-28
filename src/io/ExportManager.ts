import { type App, TFile, Notice } from "obsidian";
import type { MindMapNode, MindMapDocument } from "../types";
import { writeFile, buildOutputPath } from "./FileHelper";

/**
 * 구조적 마크다운 Export.
 * 마인드맵 트리를 DFS 순회하여 들여쓰기 불릿 리스트 + 위키링크 구조로 변환한다.
 */
export class ExportManager {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /** 마인드맵을 구조적 마크다운으로 Export */
  async exportStructure(doc: MindMapDocument, outputFolder: string): Promise<string> {
    const markdown = this.buildStructureMarkdown(doc.root, 0);
    const fileName = `${doc.title}_구조.md`;
    const filePath = buildOutputPath(outputFolder, fileName);

    try {
      await writeFile(this.app, filePath, markdown);
      new Notice(`Export 완료: ${fileName}`);
    } catch (err) {
      new Notice(`Export 실패: ${String(err)}`, 3000);
      throw err;
    }
    return filePath;
  }

  /** 트리를 들여쓰기 불릿 리스트로 변환 */
  private buildStructureMarkdown(node: MindMapNode, depth: number): string {
    const indent = "\t".repeat(depth);
    const label = node.label || "(untitled)";

    // 노트 경로 해석: noteRef 우선, 없으면 라벨의 [[위키링크]] 패턴에서 추출
    const notePath = this.resolveNotePath(node);
    const displayLabel = notePath
      ? `[[${this.extractNoteName(notePath)}]]`
      : label;

    let result = `${indent}- ${displayLabel}\n`;

    for (const child of node.children) {
      result += this.buildStructureMarkdown(child, depth + 1);
    }

    return result;
  }

  /**
   * 노드에서 노트 파일 경로를 결정한다.
   * 1) noteRef가 있으면 그대로 사용
   * 2) 없으면 라벨에서 [[위키링크]] 패턴을 추출하여 vault에서 파일 검색
   */
  private resolveNotePath(node: MindMapNode): string | null {
    if (node.noteRef) {
      return node.noteRef;
    }

    const match = node.label.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
    if (!match) return null;

    const linkText = match[1].trim();
    if (!linkText) return null;

    // Obsidian metadataCache로 위키링크 해석
    const resolved = this.app.metadataCache.getFirstLinkpathDest(linkText, "");
    if (resolved instanceof TFile) {
      return resolved.path;
    }

    // 직접 경로로 시도
    const directPath = linkText.endsWith(".md") ? linkText : `${linkText}.md`;
    const directFile = this.app.vault.getAbstractFileByPath(directPath);
    if (directFile) {
      return directPath;
    }

    return null;
  }

  /** noteRef 경로에서 노트 이름 추출 (.md 제거) */
  private extractNoteName(noteRef: string): string {
    return noteRef.split("/").pop()?.replace(".md", "") || noteRef;
  }
}
