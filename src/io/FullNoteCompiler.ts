import { type App, TFile, Notice } from "obsidian";
import type { MindMapNode, MindMapDocument } from "../types";
import { writeFile, buildOutputPath } from "./FileHelper";

/**
 * Full Note 컴파일러.
 * 마인드맵 구조 순서대로 노드를 불릿 리스트로 나열하고,
 * 연결된 노트의 전체 내용을 인라인으로 삽입하여 하나의 문서를 생성한다.
 */
export class FullNoteCompiler {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /** Full Note 컴파일 실행 */
  async compile(doc: MindMapDocument, outputFolder: string): Promise<string> {
    const markdown = await this.buildFullNote(doc.root, 0, new Set());
    const fileName = `${doc.title}_전체노트.md`;
    const filePath = buildOutputPath(outputFolder, fileName);

    try {
      await writeFile(this.app, filePath, markdown);
      new Notice(`Full Note 컴파일 완료: ${fileName}`);
    } catch (err) {
      new Notice(`Full Note 컴파일 실패: ${String(err)}`, 3000);
      throw err;
    }
    return filePath;
  }

  /** 트리를 DFS 순회하며 불릿 구조 + 노트 내용 합침 */
  private async buildFullNote(
    node: MindMapNode,
    depth: number,
    visitedIds: Set<string>,
  ): Promise<string> {
    // 순환 참조 방어
    if (visitedIds.has(node.id)) {
      const indent = "\t".repeat(depth);
      return `${indent}- > [!ERROR] 순환 참조 감지: ${node.label}\n`;
    }
    visitedIds.add(node.id);

    const indent = "\t".repeat(depth);
    const label = node.label || "(untitled)";

    // 노트 경로 해석: noteRef 우선, 없으면 라벨의 [[위키링크]] 패턴에서 추출
    const notePath = this.resolveNotePath(node);

    // 라벨 표시: noteRef나 위키링크가 있으면 [[이름]], 없으면 일반 텍스트
    const displayLabel = notePath
      ? `[[${this.extractNoteName(notePath)}]]`
      : label;

    let result = `${indent}- ${displayLabel}\n`;

    // 노트 경로가 있으면 내용을 한 단계 깊은 들여쓰기로 삽입
    if (notePath) {
      const content = await this.readNoteContent(notePath);
      if (content !== null) {
        const contentIndent = "\t".repeat(depth + 1);
        const indentedContent = content
          .split("\n")
          .map((line) => (line.trim() ? `${contentIndent}${line}` : ""))
          .join("\n");
        result += `${indentedContent}\n`;
      } else {
        result += `${indent}\t> [!WARNING] 노트를 찾을 수 없습니다: ${notePath}\n`;
      }
    }

    for (const child of node.children) {
      result += await this.buildFullNote(child, depth + 1, visitedIds);
    }

    return result;
  }

  /**
   * 노드에서 노트 파일 경로를 결정한다.
   * 1) noteRef가 있으면 그대로 사용
   * 2) 없으면 라벨에서 [[위키링크]] 패턴을 추출하여 vault에서 파일 검색
   */
  private resolveNotePath(node: MindMapNode): string | null {
    // 1. noteRef 직접 참조
    if (node.noteRef) {
      return node.noteRef;
    }

    // 2. 라벨에서 [[위키링크]] 패턴 추출
    const match = node.label.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
    if (!match) return null;

    const linkText = match[1].trim();
    if (!linkText) return null;

    // Obsidian metadataCache로 위키링크 해석 (경로 자동 해석)
    const resolved = this.app.metadataCache.getFirstLinkpathDest(linkText, "");
    if (resolved instanceof TFile) {
      return resolved.path;
    }

    // 직접 경로로 시도 (.md 확장자 추가)
    const directPath = linkText.endsWith(".md") ? linkText : `${linkText}.md`;
    const directFile = this.app.vault.getAbstractFileByPath(directPath);
    if (directFile) {
      return directPath;
    }

    return null;
  }

  /** 노트 파일 내용 읽기 (프론트매터 포함) */
  private async readNoteContent(notePath: string): Promise<string | null> {
    // 비-마크다운 파일 가드
    if (!notePath.endsWith(".md")) {
      return `> [!WARNING] 마크다운 파일이 아닙니다: ${notePath}`;
    }

    try {
      const file = this.app.vault.getAbstractFileByPath(notePath);
      if (!file) return null;
      const content = await this.app.vault.adapter.read(notePath);

      // 빈 노트 처리
      if (!content.trim()) {
        return `> [!INFO] 빈 노트입니다: ${notePath}`;
      }

      // 프론트매터 포함하여 반환
      return content.trim();
    } catch {
      return null;
    }
  }

  /** noteRef 경로에서 노트 이름 추출 (.md 제거) */
  private extractNoteName(noteRef: string): string {
    return noteRef.split("/").pop()?.replace(".md", "") || noteRef;
  }
}
