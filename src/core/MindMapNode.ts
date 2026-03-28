import type { MindMapNode, MindMapDocument } from "../types";
import { FILE_FORMAT_VERSION } from "../constants";
import { nanoid } from "nanoid";

// === ID 생성 ===
export function generateNodeId(): string {
  return `node-${nanoid(12)}`;
}

// === 노드 팩토리 ===
export function createNode(label: string, overrides?: Partial<MindMapNode>): MindMapNode {
  return {
    id: generateNodeId(),
    label,
    children: [],
    ...overrides,
  };
}

// === 문서 팩토리 ===
export function createDocument(title: string): MindMapDocument {
  const now = new Date().toISOString();
  return {
    version: FILE_FORMAT_VERSION,
    title,
    autoAlign: true,
    root: createNode(title),
    viewport: { x: 0, y: 0, zoom: 1.0 },
    theme: "default",
    createdAt: now,
    updatedAt: now,
  };
}

// === 트리 순회 유틸리티 ===

/** 트리에서 특정 ID의 노드를 찾는다 */
export function findNodeById(root: MindMapNode, id: string): MindMapNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return undefined;
}

/** 특정 노드의 부모를 찾는다 */
export function findParentNode(root: MindMapNode, targetId: string): MindMapNode | undefined {
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentNode(child, targetId);
    if (found) return found;
  }
  return undefined;
}

/** 트리 내 특정 노드를 변환 함수로 업데이트한다 (불변) */
export function updateNodeInTree(
  root: MindMapNode,
  targetId: string,
  updater: (node: MindMapNode) => MindMapNode,
): MindMapNode {
  if (root.id === targetId) {
    return updater(root);
  }
  let changed = false;
  const newChildren = root.children.map((child) => {
    const updated = updateNodeInTree(child, targetId, updater);
    if (updated !== child) changed = true;
    return updated;
  });
  if (!changed) return root;
  return { ...root, children: newChildren };
}

/** 트리에서 특정 노드를 제거한다 (불변). 루트는 제거 불가 */
export function removeNodeFromTree(root: MindMapNode, targetId: string): MindMapNode {
  if (root.id === targetId) return root; // 루트 제거 불가
  const newChildren = root.children
    .filter((child) => child.id !== targetId)
    .map((child) => removeNodeFromTree(child, targetId));
  if (newChildren.length === root.children.length &&
      newChildren.every((c, i) => c === root.children[i])) {
    return root;
  }
  return { ...root, children: newChildren };
}

/** 특정 노드에 자식을 추가한다 (불변) */
export function addChildToNode(
  root: MindMapNode,
  parentId: string,
  newChild: MindMapNode,
): MindMapNode {
  return updateNodeInTree(root, parentId, (node) => ({
    ...node,
    children: [...node.children, newChild],
  }));
}

/** 특정 노드에 여러 자식을 한번에 추가한다 (불변, 배치) */
export function addChildrenToNode(
  root: MindMapNode,
  parentId: string,
  newChildren: readonly MindMapNode[],
): MindMapNode {
  if (newChildren.length === 0) return root;
  return updateNodeInTree(root, parentId, (node) => ({
    ...node,
    children: [...node.children, ...newChildren],
  }));
}

/** 특정 노드의 형제로 추가한다 (불변) */
export function addSiblingToNode(
  root: MindMapNode,
  siblingId: string,
  newSibling: MindMapNode,
): MindMapNode {
  const parent = findParentNode(root, siblingId);
  if (!parent) return root; // 루트에는 형제 추가 불가
  return updateNodeInTree(root, parent.id, (node) => {
    const idx = node.children.findIndex((c) => c.id === siblingId);
    const newChildren = [...node.children];
    newChildren.splice(idx + 1, 0, newSibling);
    return { ...node, children: newChildren };
  });
}

/** 노드 순서를 변경한다 (형제 내 up/down) */
export function reorderNode(
  root: MindMapNode,
  nodeId: string,
  direction: "up" | "down",
): MindMapNode {
  const parent = findParentNode(root, nodeId);
  if (!parent) return root;
  return updateNodeInTree(root, parent.id, (node) => {
    const idx = node.children.findIndex((c) => c.id === nodeId);
    if (idx < 0) return node;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= node.children.length) return node;
    const newChildren = [...node.children];
    [newChildren[idx], newChildren[newIdx]] = [newChildren[newIdx], newChildren[idx]];
    return { ...node, children: newChildren };
  });
}

/** 노드를 다른 부모로 이동한다 (불변). 순환 참조 방지 포함 */
export function moveNode(
  root: MindMapNode,
  nodeId: string,
  newParentId: string,
  index?: number,
): MindMapNode {
  if (nodeId === root.id) return root; // 루트 이동 불가
  if (nodeId === newParentId) return root; // 자기 자신으로 이동 불가

  // 순환 참조 방지: newParent가 nodeId의 하위인지 확인
  const targetNode = findNodeById(root, nodeId);
  if (!targetNode) return root;
  if (findNodeById(targetNode, newParentId)) return root;

  // 기존 위치에서 제거
  const withoutNode = removeNodeFromTree(root, nodeId);

  // 새 부모에 추가
  return updateNodeInTree(withoutNode, newParentId, (parent) => {
    const newChildren = [...parent.children];
    const insertIndex = index !== undefined ? index : newChildren.length;
    newChildren.splice(insertIndex, 0, targetNode);
    return { ...parent, children: newChildren };
  });
}

/** 모든 하위 노드 ID를 수집한다 */
export function collectDescendantIds(node: MindMapNode): ReadonlySet<string> {
  const ids = new Set<string>();
  function traverse(n: MindMapNode): void {
    ids.add(n.id);
    for (const child of n.children) {
      traverse(child);
    }
  }
  traverse(node);
  return ids;
}

/** 특정 노드의 하위 노드 수를 반환한다 (자신 제외) */
export function countDescendants(node: MindMapNode): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + countDescendants(child);
  }
  return count;
}

/** 트리를 DFS 순서로 평탄화한다 */
export function flattenTree(root: MindMapNode): readonly MindMapNode[] {
  const result: MindMapNode[] = [];
  function traverse(node: MindMapNode): void {
    result.push(node);
    for (const child of node.children) {
      traverse(child);
    }
  }
  traverse(root);
  return result;
}

/** 트리 내 모든 noteRef를 경로 기반으로 일괄 업데이트한다 (불변) */
export function updateNoteRefInTree(
  root: MindMapNode,
  oldPath: string,
  newPath: string,
): MindMapNode {
  const updated = root.noteRef === oldPath
    ? { ...root, noteRef: newPath }
    : root;

  let childChanged = false;
  const newChildren = root.children.map((child) => {
    const updatedChild = updateNoteRefInTree(child, oldPath, newPath);
    if (updatedChild !== child) childChanged = true;
    return updatedChild;
  });

  if (updated !== root || childChanged) {
    return { ...updated, children: childChanged ? newChildren : updated.children };
  }
  return root;
}

/** 트리 내 특정 noteRef를 가진 노드에서 noteRef를 제거한다 (불변) */
export function unlinkNoteRefInTree(
  root: MindMapNode,
  notePath: string,
): MindMapNode {
  const shouldUnlink = root.noteRef === notePath;
  const updated = shouldUnlink
    ? { ...root, noteRef: undefined, children: root.children }
    : root;

  let childChanged = false;
  const newChildren = root.children.map((child) => {
    const updatedChild = unlinkNoteRefInTree(child, notePath);
    if (updatedChild !== child) childChanged = true;
    return updatedChild;
  });

  if (updated !== root || childChanged) {
    return { ...updated, children: childChanged ? newChildren : updated.children };
  }
  return root;
}

/** 총 노드 수를 센다 */
export function countNodes(root: MindMapNode): number {
  let count = 1;
  for (const child of root.children) {
    count += countNodes(child);
  }
  return count;
}
