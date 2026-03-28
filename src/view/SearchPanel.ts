import type { MindMapNode } from "../types";

/**
 * 노드 검색 패널 컴포넌트.
 * Ctrl+F로 열고 노드 label/noteRef를 검색한다.
 * ↑↓ 키로 결과 탐색, Enter로 카메라 이동, 매칭 노드 glow 하이라이트.
 */

interface SearchMatch {
  readonly node: MindMapNode;
  readonly matchType: "label" | "noteRef";
}

export interface SearchCallbacks {
  readonly onSelectNode: (nodeId: string) => void;
  readonly onHighlightNodes: (nodeIds: ReadonlySet<string>) => void;
  readonly getNodes: () => readonly MindMapNode[];
}

export class SearchPanel {
  private containerEl: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private resultsEl: HTMLElement | null = null;
  private isOpen = false;
  private callbacks: SearchCallbacks;
  private parentEl: HTMLElement;

  // 결과 네비게이션 상태
  private matches: readonly SearchMatch[] = [];
  private activeIndex = -1;
  private itemElements: HTMLElement[] = [];

  constructor(parent: HTMLElement, callbacks: SearchCallbacks) {
    this.parentEl = parent;
    this.callbacks = callbacks;
  }

  /** 검색 패널 토글 */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /** 검색 패널 열기 */
  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    this.containerEl = this.parentEl.createDiv({ cls: "nm-search-panel" });
    this.inputEl = this.containerEl.createEl("input", {
      cls: "nm-search-panel__input",
      placeholder: "노드 검색...",
    });
    this.resultsEl = this.containerEl.createDiv({ cls: "nm-search-panel__results" });

    // 입력 이벤트
    this.inputEl.addEventListener("input", () => {
      this.activeIndex = -1;
      this.updateResults();
    });

    // 키보드 네비게이션
    this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        this.parentEl.focus();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.navigateResult(1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.navigateResult(-1);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        this.selectActiveResult();
        return;
      }
    });

    this.inputEl.focus();
  }

  /** 검색 패널 닫기 */
  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.matches = [];
    this.activeIndex = -1;
    this.itemElements = [];
    this.containerEl?.remove();
    this.containerEl = null;
    this.inputEl = null;
    this.resultsEl = null;
    // 하이라이트 해제
    this.callbacks.onHighlightNodes(new Set());
  }

  /** 현재 열려있는지 */
  getIsOpen(): boolean {
    return this.isOpen;
  }

  /** ↑↓ 결과 네비게이션 */
  private navigateResult(direction: number): void {
    if (this.matches.length === 0) return;

    const nextIndex = this.activeIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.matches.length) return;

    this.setActiveIndex(nextIndex);
  }

  /** 활성 결과 인덱스 설정 + UI 반영 */
  private setActiveIndex(index: number): void {
    // 이전 활성 항목 해제
    if (this.activeIndex >= 0 && this.activeIndex < this.itemElements.length) {
      this.itemElements[this.activeIndex].classList.remove("nm-search-panel__item--active");
    }

    this.activeIndex = index;

    // 새 활성 항목 하이라이트
    if (this.activeIndex >= 0 && this.activeIndex < this.itemElements.length) {
      const activeEl = this.itemElements[this.activeIndex];
      activeEl.classList.add("nm-search-panel__item--active");
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }

  /** Enter로 활성 결과 선택 → 카메라 이동 */
  private selectActiveResult(): void {
    if (this.activeIndex < 0 || this.activeIndex >= this.matches.length) {
      // 활성 항목 없으면 첫 번째 결과 선택
      if (this.matches.length > 0) {
        this.setActiveIndex(0);
        this.callbacks.onSelectNode(this.matches[0].node.id);
      }
      return;
    }

    this.callbacks.onSelectNode(this.matches[this.activeIndex].node.id);
  }

  /** 검색 결과 업데이트 */
  private updateResults(): void {
    if (!this.resultsEl || !this.inputEl) return;

    const query = this.inputEl.value.trim().toLowerCase();
    this.resultsEl.empty();
    this.itemElements = [];

    if (!query) {
      this.matches = [];
      this.callbacks.onHighlightNodes(new Set());
      return;
    }

    const allNodes = this.callbacks.getNodes();
    const matchResults: SearchMatch[] = [];

    for (const n of allNodes) {
      if (n.label.toLowerCase().includes(query)) {
        matchResults.push({ node: n, matchType: "label" });
      } else if (n.noteRef && n.noteRef.toLowerCase().includes(query)) {
        matchResults.push({ node: n, matchType: "noteRef" });
      }
    }

    this.matches = matchResults;

    // 매칭 노드 하이라이트 알림
    const highlightIds = new Set(matchResults.map((m) => m.node.id));
    this.callbacks.onHighlightNodes(highlightIds);

    if (matchResults.length === 0) {
      this.resultsEl.createDiv({
        cls: "nm-search-panel__empty",
        text: "결과 없음",
      });
      return;
    }

    for (let i = 0; i < matchResults.length; i++) {
      const { node, matchType } = matchResults[i];
      const item = this.resultsEl.createDiv({
        cls: "nm-search-panel__item",
      });

      // matchType에 따라 표시 구분
      if (matchType === "noteRef") {
        const labelSpan = item.createSpan({ text: node.label });
        labelSpan.style.marginRight = "4px";
        const refSpan = item.createSpan({
          cls: "nm-search-panel__match-ref",
          text: `(${node.noteRef})`,
        });
        refSpan.style.opacity = "0.6";
        refSpan.style.fontSize = "11px";
      } else {
        item.textContent = node.noteRef ? `${node.label} (${node.noteRef})` : node.label;
      }

      const index = i;
      item.addEventListener("click", () => {
        this.setActiveIndex(index);
        this.callbacks.onSelectNode(node.id);
      });

      this.itemElements.push(item);
    }
  }

  destroy(): void {
    this.close();
  }
}
