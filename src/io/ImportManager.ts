import { type App, Notice } from "obsidian";
import type { MindMapNode, MindMapDocument } from "../types";
import { createNode, createDocument } from "../core/MindMapNode";

/**
 * 구조적 마크다운 Import.
 * 마크다운 파일의 헤딩 구조를 파싱하여 마인드맵 트리를 생성한다.
 */
export class ImportManager {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /** 마크다운 파일을 마인드맵 문서로 Import */
  async importFromMarkdown(filePath: string): Promise<MindMapDocument> {
    try {
      const content = await this.app.vault.adapter.read(filePath);
      const title = filePath.split("/").pop()?.replace(".md", "") || "Import";
      const doc = this.parseMarkdownToDocument(content, title);
      new Notice(`Import 완료: ${title}`);
      return doc;
    } catch (err) {
      new Notice(`Import 실패: ${String(err)}`, 3000);
      // 파싱 실패 시 기본 빈 문서 반환 (기존 맵 유지를 위해 호출자에서 처리)
      throw err;
    }
  }

  /** 마크다운 텍스트를 MindMapDocument로 파싱 */
  private parseMarkdownToDocument(markdown: string, title: string): MindMapDocument {
    const lines = markdown.split("\n");

    // 불릿 리스트 형식 감지 (Export 출력 형식)
    const bulletItems = this.extractBulletItems(lines);
    if (bulletItems.length > 0) {
      return this.buildDocumentFromBullets(bulletItems, title);
    }

    // 헤딩 형식 폴백
    const headings = this.extractHeadings(lines);

    if (headings.length === 0) {
      return createDocument(title);
    }

    const rootLabel = headings[0].level === 1 ? headings[0].text : title;
    const root = createNode(rootLabel);
    const startIdx = headings[0].level === 1 ? 1 : 0;

    const children = this.buildTreeFromHeadings(headings, startIdx, 2);
    const rootWithChildren: MindMapNode = { ...root, children };

    const now = new Date().toISOString();
    return {
      version: "1.0",
      title: rootLabel,
      autoAlign: true,
      root: rootWithChildren,
      viewport: { x: 0, y: 0, zoom: 1.0 },
      theme: "default",
      createdAt: now,
      updatedAt: now,
    };
  }

  /** 마크다운에서 헤딩 추출 */
  private extractHeadings(lines: readonly string[]): Array<{ level: number; text: string }> {
    const headings: Array<{ level: number; text: string }> = [];
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
        });
      }
    }
    return headings;
  }

  /** 헤딩 배열을 재귀적으로 트리 구조로 변환 */
  private buildTreeFromHeadings(
    headings: readonly { level: number; text: string }[],
    startIdx: number,
    currentLevel: number,
  ): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    let i = startIdx;

    while (i < headings.length) {
      const heading = headings[i];

      if (heading.level < currentLevel) {
        // 상위 레벨 → 현재 그룹 종료
        break;
      }

      if (heading.level === currentLevel) {
        // 현재 레벨 노드 생성
        const node = createNode(heading.text);
        i++;

        // 하위 헤딩들을 자식으로
        const children = this.buildTreeFromHeadings(headings, i, currentLevel + 1);
        const nodeWithChildren: MindMapNode = children.length > 0
          ? { ...node, children }
          : node;

        nodes.push(nodeWithChildren);

        // 자식 처리 후 인덱스 이동
        i += this.countNodesInSubtree(headings, i, currentLevel + 1);
      } else {
        // 현재 레벨보다 깊은 경우 (상위 없이 바로 하위가 나옴) → 자식으로 처리
        const children = this.buildTreeFromHeadings(headings, i, heading.level);
        if (children.length > 0) {
          nodes.push(...children);
        }
        i += this.countNodesInSubtree(headings, i, heading.level);
      }
    }

    return nodes;
  }

  /** 특정 레벨 이상의 노드 수를 센다 (인덱스 스킵용) */
  private countNodesInSubtree(
    headings: readonly { level: number; text: string }[],
    startIdx: number,
    minLevel: number,
  ): number {
    let count = 0;
    for (let i = startIdx; i < headings.length; i++) {
      if (headings[i].level < minLevel) break;
      count++;
    }
    return count;
  }

  // === 불릿 리스트 파싱 (Export 출력 형식) ===

  /** 탭 들여쓰기 불릿 리스트 항목 추출 */
  private extractBulletItems(lines: readonly string[]): Array<{ depth: number; text: string }> {
    const items: Array<{ depth: number; text: string }> = [];
    for (const line of lines) {
      const match = line.match(/^(\t*)-\s+(.+)$/);
      if (match) {
        items.push({
          depth: match[1].length,
          text: match[2].trim(),
        });
      }
    }
    return items;
  }

  /** 불릿 리스트에서 MindMapDocument 생성 */
  private buildDocumentFromBullets(
    items: readonly { depth: number; text: string }[],
    title: string,
  ): MindMapDocument {
    // 첫 항목(depth=0)을 루트로 사용
    const rootLabel = items[0].depth === 0 ? items[0].text : title;
    const root = createNode(this.parseBulletLabel(rootLabel));
    const startIdx = items[0].depth === 0 ? 1 : 0;
    const baseDepth = items[0].depth === 0 ? 1 : items[0].depth;

    const children = this.buildTreeFromBullets(items, startIdx, baseDepth);
    const rootWithChildren: MindMapNode = { ...root, children };

    // [[위키링크]]가 있으면 noteRef 해석
    this.resolveNoteRefs(rootWithChildren);

    const now = new Date().toISOString();
    return {
      version: "1.0",
      title: rootLabel.replace(/\[\[|\]\]/g, ""),
      autoAlign: true,
      root: rootWithChildren,
      viewport: { x: 0, y: 0, zoom: 1.0 },
      theme: "default",
      createdAt: now,
      updatedAt: now,
    };
  }

  /** 불릿 항목 배열을 재귀적으로 트리 구조로 변환 */
  private buildTreeFromBullets(
    items: readonly { depth: number; text: string }[],
    startIdx: number,
    currentDepth: number,
  ): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    let i = startIdx;

    while (i < items.length) {
      const item = items[i];

      if (item.depth < currentDepth) {
        break;
      }

      if (item.depth === currentDepth) {
        const label = this.parseBulletLabel(item.text);
        const node = createNode(label);
        i++;

        const children = this.buildTreeFromBullets(items, i, currentDepth + 1);
        const nodeWithChildren: MindMapNode = children.length > 0
          ? { ...node, children }
          : node;
        nodes.push(nodeWithChildren);

        // 자식 처리 후 인덱스 이동
        let skip = 0;
        for (let j = i; j < items.length; j++) {
          if (items[j].depth <= currentDepth) break;
          skip++;
        }
        i += skip;
      } else {
        // 깊이가 건너뛴 경우: 해당 깊이부터 파싱
        const children = this.buildTreeFromBullets(items, i, item.depth);
        nodes.push(...children);
        let skip = 0;
        for (let j = i; j < items.length; j++) {
          if (items[j].depth < currentDepth) break;
          skip++;
        }
        i += skip;
      }
    }

    return nodes;
  }

  /** 불릿 라벨에서 [[위키링크]] → 표시 이름 추출 */
  private parseBulletLabel(text: string): string {
    const wikiMatch = text.match(/^\[\[([^\]|]+)(?:\|([^\]]*))?\]\]$/);
    if (wikiMatch) {
      return wikiMatch[2] || wikiMatch[1];
    }
    return text;
  }

  /** 트리를 순회하며 [[위키링크]] 노드에 noteRef 설정 */
  private resolveNoteRefs(node: MindMapNode): void {
    // 원본 라벨이 위키링크인지 확인
    const wikiMatch = node.label.match(/^(.+)$/);
    if (wikiMatch) {
      const resolved = this.app.metadataCache.getFirstLinkpathDest(node.label, "");
      if (resolved) {
        // MindMapNode는 readonly이므로 직접 수정 (import 시 새로 생성된 노드)
        (node as { noteRef?: string }).noteRef = resolved.path;
      }
    }

    for (const child of node.children) {
      this.resolveNoteRefs(child);
    }
  }
}
