import type { NeroMindSettings, KeyBindingMap } from "./types";

// === 뷰 타입 ===
export const VIEW_TYPE_MINDMAP = "kk-neromind-view";

// === 파일 확장자 ===
export const FILE_EXTENSION = "neromind";

// === 기본 키바인딩 ===
export const DEFAULT_KEY_BINDINGS: KeyBindingMap = {
  addChild:       { key: "Tab" },
  addSibling:     { key: "Enter" },
  deleteNode:     { key: "Delete" },
  rename:         { key: "F2" },
  escape:         { key: "Escape" },
  undo:           { key: "z", ctrl: true },
  redo:           { key: "y", ctrl: true },
  navUp:          { key: "ArrowUp" },
  navDown:        { key: "ArrowDown" },
  navLeft:        { key: "ArrowLeft" },
  navRight:       { key: "ArrowRight" },
  reorderUp:      { key: "ArrowUp", shift: true },
  reorderDown:    { key: "ArrowDown", shift: true },
  moveToParent:   { key: "ArrowLeft", shift: true },
  moveToChild:    { key: "ArrowRight", shift: true },
  toggleCollapse: { key: " " },
};

// === 기본 설정 ===
export const DEFAULT_SETTINGS: NeroMindSettings = {
  saveFolderPath: "",
  theme: "default",
  fontFamily: "",
  canvasBgColor: "",
  keyBindings: DEFAULT_KEY_BINDINGS,
};

// === 레이아웃 ===
export const LAYOUT = {
  HORIZONTAL_GAP: 180,
  VERTICAL_GAP: 32,
  NODE_MIN_WIDTH: 80,
  NODE_HEIGHT: 44,          // 일반 노드: padding 12px*2 + font 14px + 여유
  ROOT_HEIGHT: 52,           // 루트 노드: padding 16px*2 + font 16px + 여유
  ROOT_MIN_WIDTH: 120,
  ROOT_PADDING_X: 18,
  ROOT_PADDING_Y: 16,
  NODE_PADDING_X: 12,
  NODE_PADDING_Y: 12,
} as const;

// === 뷰포트 ===
export const VIEWPORT = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5.0,
  ZOOM_STEP: 0.1,
  PAN_SPEED: 1,
} as const;

// === 자동 저장 ===
export const AUTO_SAVE_DEBOUNCE_MS = 1000;

// === 히스토리 ===
export const HISTORY_MAX_SIZE = 100;

// === 애니메이션 ===
export const ANIMATION = {
  LAYOUT_TRANSITION_MS: 300,
} as const;

// === 파일 포맷 버전 ===
export const FILE_FORMAT_VERSION = "1.0";
