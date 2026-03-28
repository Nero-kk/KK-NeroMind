import { type App, TFolder, TFile, Notice } from "obsidian";
import type { MindMapNode } from "../types";
import type { StateManager } from "../core/StateManager";
import type { CanvasEngine } from "../canvas/CanvasEngine";
import { createNode, findNodeById, collectDescendantIds } from "../core/MindMapNode";

/** 폴더 재귀 순회 최대 깊이 */
const MAX_FOLDER_DEPTH = 20;

/**
 * 드래그 앤 드롭 핸들러.
 * 1) 노드 드래그 -> 다른 노드 위에 드롭하여 부모 변경 (Reparenting)
 * 2) Obsidian 파일 탐색기에서 .md 파일을 드래그 -> 노드에 드롭하여 노트 연결
 * 3) 빈 캔버스에 파일/폴더 드롭 -> 새 노드 자동 생성
 * 4) 다중 파일 동시 드롭 -> 배치 노드 생성
 */
export class DragDropHandler {
  private app: App;
  private stateManager: StateManager;
  private canvasEngine: CanvasEngine;
  private containerEl: HTMLElement;

  // 노드 드래그 상태
  private draggingNodeIds: ReadonlySet<string> = new Set();
  private dropTargetNodeId: string | null = null;

  // 드래그 프리뷰 요소
  private dragPreviewEl: HTMLElement | null = null;

  constructor(
    app: App,
    stateManager: StateManager,
    canvasEngine: CanvasEngine,
    containerEl: HTMLElement,
  ) {
    this.app = app;
    this.stateManager = stateManager;
    this.canvasEngine = canvasEngine;
    this.containerEl = containerEl;

    this.bindEvents();
  }

  private bindEvents(): void {
    // 외부 파일 드래그 이벤트 (Obsidian 파일 탐색기)
    this.containerEl.addEventListener("dragover", this.handleDragOver);
    this.containerEl.addEventListener("dragleave", this.handleDragLeave);
    this.containerEl.addEventListener("drop", this.handleDrop);
  }

  /** 노드 드래그 시작 (선택된 노드 전체를 드래그) */
  startNodeDrag(nodeId: string): void {
    const doc = this.stateManager.getDocument();
    const selectedIds = this.stateManager.getSelectedNodeIds();

    // 드래그 대상: 선택된 노드에 포함되면 전체, 아니면 해당 노드만
    let dragIds: Set<string>;
    if (selectedIds.has(nodeId)) {
      dragIds = new Set([...selectedIds].filter((id) => id !== doc.root.id));
    } else {
      if (nodeId === doc.root.id) return;
      dragIds = new Set([nodeId]);
    }

    if (dragIds.size === 0) return;
    this.draggingNodeIds = dragIds;

    // 드래그 중인 노드에 시각적 피드백
    for (const id of this.draggingNodeIds) {
      const div = this.canvasEngine.getNodeRenderer().getNodeDiv(id);
      div?.classList.add("nm-node--dragging");
    }

    // 드래그 프리뷰 생성
    this.createDragPreview();
  }

  /** 노드 드래그 종료 */
  endNodeDrag(): void {
    if (this.draggingNodeIds.size > 0 && this.dropTargetNodeId) {
      // 드래그 대상을 드롭 타겟의 자식으로 이동
      for (const id of this.draggingNodeIds) {
        this.performReparent(id, this.dropTargetNodeId);
      }
    }
    this.cleanupDrag();
  }

  /** 마우스 이동 중 드롭 타겟 업데이트 + 프리뷰 위치 갱신 */
  updateDropTarget(screenX: number, screenY: number): void {
    if (this.draggingNodeIds.size === 0) return;

    // 프리뷰 위치 갱신
    if (this.dragPreviewEl) {
      this.dragPreviewEl.style.left = `${screenX + 12}px`;
      this.dragPreviewEl.style.top = `${screenY + 12}px`;
    }

    const targetId = this.findNodeAtPosition(screenX, screenY);

    // 이전 타겟 해제
    if (this.dropTargetNodeId && this.dropTargetNodeId !== targetId) {
      this.setDropHighlight(this.dropTargetNodeId, false);
    }

    if (targetId && !this.draggingNodeIds.has(targetId)) {
      // 순환 참조 방지: 드래그 노드의 하위 노드인지 확인
      const doc = this.stateManager.getDocument();
      let isDescendant = false;
      for (const dragId of this.draggingNodeIds) {
        const draggingNode = findNodeById(doc.root, dragId);
        if (draggingNode) {
          const descendants = collectDescendantIds(draggingNode);
          if (descendants.has(targetId)) {
            isDescendant = true;
            break;
          }
        }
      }

      if (!isDescendant) {
        this.dropTargetNodeId = targetId;
        this.setDropHighlight(targetId, true);
      } else {
        this.dropTargetNodeId = null;
      }
    } else {
      this.dropTargetNodeId = null;
    }
  }

  isDragging(): boolean {
    return this.draggingNodeIds.size > 0;
  }

  destroy(): void {
    this.containerEl.removeEventListener("dragover", this.handleDragOver);
    this.containerEl.removeEventListener("dragleave", this.handleDragLeave);
    this.containerEl.removeEventListener("drop", this.handleDrop);
  }

  // === 외부 파일 드래그 (Obsidian 파일 탐색기에서 드래그) ===

  private handleDragOver = (e: DragEvent): void => {
    if (!e.dataTransfer) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "link";

    const targetId = this.findNodeAtPosition(e.clientX, e.clientY);
    if (targetId && targetId !== this.dropTargetNodeId) {
      if (this.dropTargetNodeId) {
        this.setDropHighlight(this.dropTargetNodeId, false);
      }
      this.dropTargetNodeId = targetId;
      this.setDropHighlight(targetId, true);
      this.containerEl.classList.remove("nm-canvas--drop-zone");
    } else if (!targetId) {
      if (this.dropTargetNodeId) {
        this.setDropHighlight(this.dropTargetNodeId, false);
        this.dropTargetNodeId = null;
      }
      // 빈 캔버스 영역: 드롭존 피드백 표시
      this.containerEl.classList.add("nm-canvas--drop-zone");
    }
  };

  private handleDragLeave = (_e: DragEvent): void => {
    this.clearDropTarget();
    this.containerEl.classList.remove("nm-canvas--drop-zone");
  };

  private handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    this.containerEl.classList.remove("nm-canvas--drop-zone");

    if (!e.dataTransfer) {
      this.clearDropTarget();
      return;
    }

    const paths = this.extractDropPaths(e.dataTransfer);
    if (paths.length === 0) {
      this.clearDropTarget();
      return;
    }

    const targetNodeId = this.dropTargetNodeId;

    if (targetNodeId) {
      // 기존 노드 위에 드롭
      this.handleDropOnNode(paths, targetNodeId);
    } else {
      // 빈 캔버스에 드롭: root 자식으로 추가
      const doc = this.stateManager.getDocument();
      this.handleDropOnCanvas(paths, doc.root.id);
    }

    this.clearDropTarget();
  };

  // === 드롭 시나리오별 처리 ===

  /** 기존 노드 위에 파일/폴더 드롭 */
  private handleDropOnNode(paths: readonly string[], targetNodeId: string): void {
    if (paths.length === 1) {
      const path = paths[0];
      const abstractFile = this.app.vault.getAbstractFileByPath(path);

      if (abstractFile instanceof TFolder) {
        // 폴더 -> 기존 노드: 폴더 구조를 자식으로 추가
        const folderNode = this.buildNodeTreeFromFolder(abstractFile, 0);
        if (folderNode) {
          this.stateManager.applyAction({
            type: "ADD_CHILD",
            parentId: targetNodeId,
            node: folderNode,
          });
        }
        return;
      }

      // 단일 .md 파일 -> 기존 노드: 노트 연결 + 라벨을 노트 이름으로 변경 (원자적)
      if (path.endsWith(".md")) {
        const fileName = path.split("/").pop()?.replace(".md", "") || path;
        this.stateManager.applyAction({
          type: "LINK_NOTE",
          nodeId: targetNodeId,
          noteRef: path,
          label: fileName,
        });
        return;
      }

      new Notice("마크다운 파일(.md)만 연결할 수 있습니다.");
      return;
    }

    // 다중 파일 -> 기존 노드: 자식으로 배치 추가
    this.addMultipleFilesAsChildren(paths, targetNodeId);
  }

  /** 빈 캔버스에 파일/폴더 드롭 */
  private handleDropOnCanvas(paths: readonly string[], rootId: string): void {
    if (paths.length === 1) {
      const path = paths[0];
      const abstractFile = this.app.vault.getAbstractFileByPath(path);

      if (abstractFile instanceof TFolder) {
        // 폴더 -> 캔버스: 폴더 구조를 root 자식으로 추가
        const folderNode = this.buildNodeTreeFromFolder(abstractFile, 0);
        if (folderNode) {
          this.stateManager.applyAction({
            type: "ADD_CHILD",
            parentId: rootId,
            node: folderNode,
          });
        }
        return;
      }

      // 단일 .md 파일 -> 캔버스: 새 노드 생성
      if (path.endsWith(".md")) {
        const fileName = path.split("/").pop()?.replace(".md", "") || path;
        const newNode = createNode(fileName, { noteRef: path });
        this.stateManager.applyAction({
          type: "ADD_CHILD",
          parentId: rootId,
          node: newNode,
        });
        return;
      }

      new Notice("마크다운 파일(.md) 또는 폴더만 드롭할 수 있습니다.");
      return;
    }

    // 다중 파일 -> 캔버스: root 자식으로 배치 추가
    this.addMultipleFilesAsChildren(paths, rootId);
  }

  /** 여러 파일 경로를 특정 부모의 자식 노드로 배치 추가 */
  private addMultipleFilesAsChildren(paths: readonly string[], parentId: string): void {
    const newNodes: MindMapNode[] = [];
    let skippedCount = 0;

    for (const path of paths) {
      const abstractFile = this.app.vault.getAbstractFileByPath(path);

      if (abstractFile instanceof TFolder) {
        const folderNode = this.buildNodeTreeFromFolder(abstractFile, 0);
        if (folderNode) {
          newNodes.push(folderNode);
        }
        continue;
      }

      if (!path.endsWith(".md")) {
        skippedCount++;
        continue;
      }

      const fileName = path.split("/").pop()?.replace(".md", "") || path;
      newNodes.push(createNode(fileName, { noteRef: path }));
    }

    if (newNodes.length > 0) {
      this.stateManager.applyAction({
        type: "ADD_CHILDREN_BATCH",
        parentId,
        nodes: newNodes,
      });
    }

    if (skippedCount > 0) {
      new Notice(`${skippedCount}개의 비-마크다운 파일은 건너뛰었습니다.`);
    }

    if (newNodes.length === 0 && skippedCount > 0) {
      new Notice("마크다운 파일(.md)이 포함되어 있지 않습니다.");
    }
  }

  // === 폴더 구조 -> 노드 트리 변환 ===

  /** TFolder를 재귀적으로 MindMapNode 트리로 변환 */
  private buildNodeTreeFromFolder(folder: TFolder, depth: number): MindMapNode | null {
    if (depth >= MAX_FOLDER_DEPTH) {
      new Notice(`폴더 깊이 제한(${MAX_FOLDER_DEPTH})에 도달했습니다: ${folder.path}`);
      return null;
    }

    const children: MindMapNode[] = [];

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        const subTree = this.buildNodeTreeFromFolder(child, depth + 1);
        if (subTree) {
          children.push(subTree);
        }
      } else if (child instanceof TFile && child.extension === "md") {
        const fileName = child.basename;
        children.push(createNode(fileName, { noteRef: child.path }));
      }
      // 비-.md 파일은 건너뛰기
    }

    if (children.length === 0) {
      return null; // 빈 폴더(md 파일이 없는)는 건너뛰기
    }

    return createNode(folder.name, { children });
  }

  // === 드래그 데이터 추출 ===

  /** DataTransfer에서 파일 경로 배열 추출 */
  private extractDropPaths(dataTransfer: DataTransfer): string[] {
    const paths: string[] = [];

    const textData = dataTransfer.getData("text/plain");
    if (textData) {
      const lines = textData.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const resolved = this.resolveToVaultPath(line);
        if (resolved) {
          paths.push(resolved);
        }
      }
    }

    return paths;
  }

  /** 다양한 형식의 입력을 vault 파일 경로로 해석 */
  private resolveToVaultPath(input: string): string | null {
    // 1. obsidian:// URL 파싱 (Obsidian 파일 탐색기 드래그 형식)
    if (input.startsWith("obsidian://")) {
      try {
        const url = new URL(input);
        const fileParam = url.searchParams.get("file");
        if (fileParam) {
          input = fileParam;
        }
      } catch {
        // URL 파싱 실패 시 원본으로 진행
      }
    }

    // 2. 직접 경로 매칭 (예: "folder/file.md")
    if (this.app.vault.getAbstractFileByPath(input)) {
      return input;
    }

    // 3. .md 확장자 추가 (예: "+/6. 문제해결능력" → "+/6. 문제해결능력.md")
    if (!input.endsWith(".md")) {
      const withMd = `${input}.md`;
      if (this.app.vault.getAbstractFileByPath(withMd)) {
        return withMd;
      }
    }

    // 4. metadataCache로 파일명 해석 (경로 없이 이름만 있는 경우)
    const resolved = this.app.metadataCache.getFirstLinkpathDest(input, "");
    if (resolved instanceof TFile) return resolved.path;

    return null;
  }

  // === 드래그 프리뷰 ===

  /** 드래그 중 마우스 옆에 표시되는 프리뷰 생성 */
  private createDragPreview(): void {
    this.removeDragPreview();

    const el = document.createElement("div");
    el.className = "nm-drag-preview";

    // 드래그 노드 이름들 표시
    const labels: string[] = [];
    for (const id of this.draggingNodeIds) {
      const node = this.stateManager.getNodeById(id);
      if (node) {
        labels.push(node.label || "(빈 노드)");
      }
    }

    if (labels.length <= 3) {
      el.textContent = labels.join(", ");
    } else {
      el.textContent = `${labels.slice(0, 2).join(", ")} 외 ${labels.length - 2}개`;
    }

    document.body.appendChild(el);
    this.dragPreviewEl = el;
  }

  /** 드래그 프리뷰 제거 */
  private removeDragPreview(): void {
    if (this.dragPreviewEl) {
      this.dragPreviewEl.remove();
      this.dragPreviewEl = null;
    }
  }

  /** 드래그 상태 전체 정리 */
  private cleanupDrag(): void {
    // 드래그 중 시각적 피드백 제거
    for (const id of this.draggingNodeIds) {
      const div = this.canvasEngine.getNodeRenderer().getNodeDiv(id);
      div?.classList.remove("nm-node--dragging");
    }
    this.clearDropTarget();
    this.removeDragPreview();
    this.draggingNodeIds = new Set();
  }

  // === 내부 유틸 ===

  private performReparent(nodeId: string, newParentId: string): void {
    this.stateManager.applyAction({
      type: "MOVE_NODE",
      nodeId,
      newParentId,
    });
  }

  /** 화면 좌표에서 노드 찾기 */
  private findNodeAtPosition(screenX: number, screenY: number): string | null {
    const viewport = this.canvasEngine.getViewport();
    const worldPos = viewport.screenToWorld(
      screenX - this.containerEl.getBoundingClientRect().left,
      screenY - this.containerEl.getBoundingClientRect().top,
    );

    const nodes = this.canvasEngine.getRenderNodes();
    const nodeRenderer = this.canvasEngine.getNodeRenderer();

    for (const node of nodes) {
      const fo = nodeRenderer.getNodeElement(node.id);
      if (!fo) continue;

      const x = parseFloat(fo.getAttribute("x") || "0");
      const y = parseFloat(fo.getAttribute("y") || "0");
      const w = parseFloat(fo.getAttribute("width") || "0");
      const h = parseFloat(fo.getAttribute("height") || "0");

      if (
        worldPos.x >= x &&
        worldPos.x <= x + w &&
        worldPos.y >= y &&
        worldPos.y <= y + h
      ) {
        return node.id;
      }
    }

    return null;
  }

  /** 드롭 타겟 하이라이트 설정/해제 */
  private setDropHighlight(nodeId: string, active: boolean): void {
    const nodeRenderer = this.canvasEngine.getNodeRenderer();
    const div = nodeRenderer.getNodeDiv(nodeId);
    if (!div) return;

    if (active) {
      div.classList.add("nm-node--drop-target");
    } else {
      div.classList.remove("nm-node--drop-target");
    }
  }

  private clearDropTarget(): void {
    if (this.dropTargetNodeId) {
      this.setDropHighlight(this.dropTargetNodeId, false);
      this.dropTargetNodeId = null;
    }
  }
}
