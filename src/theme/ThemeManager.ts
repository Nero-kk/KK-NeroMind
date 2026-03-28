import type { ThemeId } from "../types";

/**
 * 테마별 CSS 변수 정의.
 * styles.css에서 var(--nm-*) 형태로 참조한다.
 */
interface ThemeVars {
  // 캔버스
  readonly "--nm-canvas-bg": string;

  // 엣지
  readonly "--nm-edge-color": string;

  // 텍스트
  readonly "--nm-text-color": string;
  readonly "--nm-text-root-color": string;

  // 일반 노드
  readonly "--nm-node-bg": string;
  readonly "--nm-node-border": string;
  readonly "--nm-node-shadow": string;

  // 루트 노드
  readonly "--nm-root-bg": string;
  readonly "--nm-root-border": string;
  readonly "--nm-root-shadow": string;

  // 노트 연결 노드
  readonly "--nm-note-bg": string;
  readonly "--nm-note-border": string;
  readonly "--nm-note-shadow": string;

  // 선택 상태
  readonly "--nm-select-ring": string;
  readonly "--nm-select-glow": string;

  // 툴바
  readonly "--nm-toolbar-bg": string;
  readonly "--nm-toolbar-border": string;
  readonly "--nm-toolbar-text": string;
  readonly "--nm-toolbar-btn-bg": string;
  readonly "--nm-toolbar-btn-border": string;
  readonly "--nm-toolbar-btn-text": string;

  // 검색 패널
  readonly "--nm-search-bg": string;
  readonly "--nm-search-border": string;
  readonly "--nm-search-input-bg": string;
  readonly "--nm-search-text": string;
}

/** Frost — 기본 테마. 차가운 블루/퍼플 글래스모피즘 */
const FROST: ThemeVars = {
  "--nm-canvas-bg": "#ffffff",
  "--nm-edge-color": "#4a4a6a",
  "--nm-text-color": "rgba(255, 255, 255, 0.9)",
  "--nm-text-root-color": "rgba(255, 255, 255, 0.95)",

  "--nm-node-bg": "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
  "--nm-node-border": "rgba(255, 255, 255, 0.4)",
  "--nm-node-shadow": "0 8px 32px rgba(0,0,0,0.15), inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.1)",

  "--nm-root-bg": "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 100%)",
  "--nm-root-border": "rgba(255, 255, 255, 0.5)",
  "--nm-root-shadow": "0 12px 40px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.8), inset 0 -2px 6px rgba(0,0,0,0.15)",

  "--nm-note-bg": "linear-gradient(135deg, rgba(255,200,150,0.3) 0%, rgba(255,180,120,0.08) 100%)",
  "--nm-note-border": "rgba(255, 200, 150, 0.5)",
  "--nm-note-shadow": "0 8px 32px rgba(255,160,80,0.15), inset 0 3px 6px rgba(255,220,180,0.7), inset 0 -2px 4px rgba(0,0,0,0.1)",

  "--nm-select-ring": "rgba(99, 102, 241, 0.7)",
  "--nm-select-glow": "rgba(99, 102, 241, 0.2)",

  "--nm-toolbar-bg": "transparent",
  "--nm-toolbar-border": "rgba(255, 255, 255, 0.25)",
  "--nm-toolbar-text": "rgba(255, 255, 255, 0.8)",
  "--nm-toolbar-btn-bg": "rgba(255, 255, 255, 0.15)",
  "--nm-toolbar-btn-border": "rgba(255, 255, 255, 0.3)",
  "--nm-toolbar-btn-text": "rgba(255, 255, 255, 0.9)",

  "--nm-search-bg": "rgba(30, 30, 50, 0.95)",
  "--nm-search-border": "rgba(255, 255, 255, 0.2)",
  "--nm-search-input-bg": "rgba(255, 255, 255, 0.12)",
  "--nm-search-text": "rgba(255, 255, 255, 0.9)",
};

/** Midnight — 딥 다크 테마. 남색/사이안 톤 */
const MIDNIGHT: ThemeVars = {
  "--nm-canvas-bg": "#ffffff",
  "--nm-edge-color": "rgba(56, 189, 248, 0.7)",
  "--nm-text-color": "rgba(180, 220, 255, 0.9)",
  "--nm-text-root-color": "rgba(200, 230, 255, 0.95)",

  "--nm-node-bg": "linear-gradient(135deg, rgba(60,120,200,0.2) 0%, rgba(30,60,120,0.05) 100%)",
  "--nm-node-border": "rgba(80, 160, 255, 0.4)",
  "--nm-node-shadow": "0 8px 32px rgba(0,0,20,0.3), inset 0 3px 6px rgba(100,180,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)",

  "--nm-root-bg": "linear-gradient(135deg, rgba(80,150,230,0.25) 0%, rgba(40,80,160,0.08) 100%)",
  "--nm-root-border": "rgba(100, 180, 255, 0.5)",
  "--nm-root-shadow": "0 12px 40px rgba(0,0,30,0.35), inset 0 4px 8px rgba(120,200,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.2)",

  "--nm-note-bg": "linear-gradient(135deg, rgba(100,220,200,0.25) 0%, rgba(50,180,160,0.08) 100%)",
  "--nm-note-border": "rgba(100, 220, 200, 0.5)",
  "--nm-note-shadow": "0 8px 32px rgba(0,180,160,0.15), inset 0 3px 6px rgba(120,240,220,0.5), inset 0 -2px 4px rgba(0,0,0,0.15)",

  "--nm-select-ring": "rgba(56, 189, 248, 0.7)",
  "--nm-select-glow": "rgba(56, 189, 248, 0.2)",

  "--nm-toolbar-bg": "transparent",
  "--nm-toolbar-border": "rgba(80, 160, 255, 0.3)",
  "--nm-toolbar-text": "rgba(160, 200, 255, 0.8)",
  "--nm-toolbar-btn-bg": "rgba(30, 60, 120, 0.4)",
  "--nm-toolbar-btn-border": "rgba(80, 160, 255, 0.4)",
  "--nm-toolbar-btn-text": "rgba(180, 220, 255, 0.9)",

  "--nm-search-bg": "rgba(10, 15, 35, 0.95)",
  "--nm-search-border": "rgba(80, 160, 255, 0.25)",
  "--nm-search-input-bg": "rgba(40, 80, 160, 0.25)",
  "--nm-search-text": "rgba(180, 220, 255, 0.9)",
};

/** Dawn — 새벽/일출 테마. 따뜻한 코랄/골드 톤, 보랏빛 어둠에서 금빛으로 */
const DAWN: ThemeVars = {
  "--nm-canvas-bg": "#ffffff",
  "--nm-edge-color": "rgba(232, 132, 92, 0.7)",
  "--nm-text-color": "#faf0e6",
  "--nm-text-root-color": "#fff5eb",

  "--nm-node-bg": "linear-gradient(135deg, rgba(224,122,95,0.25) 0%, rgba(200,140,60,0.08) 100%)",
  "--nm-node-border": "rgba(224, 122, 95, 0.5)",
  "--nm-node-shadow": "0 8px 32px rgba(26,26,46,0.3), inset 0 3px 6px rgba(255,220,160,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)",

  "--nm-root-bg": "linear-gradient(135deg, rgba(232,132,92,0.3) 0%, rgba(244,162,97,0.1) 100%)",
  "--nm-root-border": "rgba(232, 132, 92, 0.6)",
  "--nm-root-shadow": "0 12px 40px rgba(26,26,46,0.35), inset 0 4px 8px rgba(255,230,170,0.5), inset 0 -2px 6px rgba(0,0,0,0.15)",

  "--nm-note-bg": "linear-gradient(135deg, rgba(129,178,154,0.25) 0%, rgba(100,160,130,0.08) 100%)",
  "--nm-note-border": "rgba(129, 178, 154, 0.55)",
  "--nm-note-shadow": "0 8px 32px rgba(26,26,46,0.25), inset 0 3px 6px rgba(160,220,180,0.4), inset 0 -2px 4px rgba(0,0,0,0.1)",

  "--nm-select-ring": "rgba(232, 132, 92, 0.7)",
  "--nm-select-glow": "rgba(232, 132, 92, 0.2)",

  "--nm-toolbar-bg": "transparent",
  "--nm-toolbar-border": "rgba(200, 155, 123, 0.35)",
  "--nm-toolbar-text": "#d4b8a0",
  "--nm-toolbar-btn-bg": "rgba(80, 50, 30, 0.5)",
  "--nm-toolbar-btn-border": "rgba(200, 155, 123, 0.45)",
  "--nm-toolbar-btn-text": "#faf0e6",

  "--nm-search-bg": "rgba(45, 32, 64, 0.95)",
  "--nm-search-border": "rgba(200, 155, 123, 0.3)",
  "--nm-search-input-bg": "rgba(80, 50, 30, 0.4)",
  "--nm-search-text": "#faf0e6",
};

/** Square — 미니멀 플랫 테마. 흰 배경 + 직사각형 노드 + 얇은 회색 테두리 */
const SQUARE: ThemeVars = {
  "--nm-canvas-bg": "#ffffff",
  "--nm-edge-color": "rgba(0, 0, 0, 0.15)",
  "--nm-text-color": "rgba(55, 55, 55, 1)",
  "--nm-text-root-color": "rgba(33, 33, 33, 1)",

  "--nm-node-bg": "#ffffff",
  "--nm-node-border": "rgba(210, 210, 210, 1)",
  "--nm-node-shadow": "none",

  "--nm-root-bg": "#ffffff",
  "--nm-root-border": "rgba(180, 180, 180, 1)",
  "--nm-root-shadow": "none",

  "--nm-note-bg": "#fafafa",
  "--nm-note-border": "rgba(200, 200, 200, 1)",
  "--nm-note-shadow": "none",

  "--nm-select-ring": "rgba(66, 133, 244, 0.7)",
  "--nm-select-glow": "rgba(66, 133, 244, 0.1)",

  "--nm-toolbar-bg": "transparent",
  "--nm-toolbar-border": "rgba(220, 220, 220, 1)",
  "--nm-toolbar-text": "rgba(80, 80, 80, 1)",
  "--nm-toolbar-btn-bg": "#ffffff",
  "--nm-toolbar-btn-border": "rgba(210, 210, 210, 1)",
  "--nm-toolbar-btn-text": "rgba(55, 55, 55, 1)",

  "--nm-search-bg": "rgba(255, 255, 255, 0.98)",
  "--nm-search-border": "rgba(210, 210, 210, 1)",
  "--nm-search-input-bg": "#f5f5f5",
  "--nm-search-text": "rgba(33, 33, 33, 1)",
};

/** Toss Dark — 토스 다크모드 디자인. 소프트 다크 + 토스 블루 액센트 */
const TOSS_DARK: ThemeVars = {
  "--nm-canvas-bg": "#1B1D1F",
  "--nm-edge-color": "rgba(255, 255, 255, 0.08)",
  "--nm-text-color": "#F2F4F6",
  "--nm-text-root-color": "#F2F4F6",

  "--nm-node-bg": "#26282B",
  "--nm-node-border": "#35373A",
  "--nm-node-shadow": "none",

  "--nm-root-bg": "#2C2D2F",
  "--nm-root-border": "#3A3D40",
  "--nm-root-shadow": "none",

  "--nm-note-bg": "#1A2A4A",
  "--nm-note-border": "rgba(49, 130, 246, 0.25)",
  "--nm-note-shadow": "none",

  "--nm-select-ring": "#3182F6",
  "--nm-select-glow": "rgba(49, 130, 246, 0.15)",

  "--nm-toolbar-bg": "transparent",
  "--nm-toolbar-border": "#35373A",
  "--nm-toolbar-text": "#8B8F93",
  "--nm-toolbar-btn-bg": "#26282B",
  "--nm-toolbar-btn-border": "#35373A",
  "--nm-toolbar-btn-text": "#F2F4F6",

  "--nm-search-bg": "#212325",
  "--nm-search-border": "#35373A",
  "--nm-search-input-bg": "#2C2D2F",
  "--nm-search-text": "#F2F4F6",
};

/** Neon — 사이버펑크 네온 글로우 테마. 시안/핑크/퍼플 발광 */
const NEON: ThemeVars = {
  "--nm-canvas-bg": "#0a0a0f",
  "--nm-edge-color": "rgba(77, 77, 255, 0.4)",
  "--nm-text-color": "#e0e0ff",
  "--nm-text-root-color": "#ffffff",

  "--nm-node-bg": "#141420",
  "--nm-node-border": "rgba(0, 240, 255, 0.3)",
  "--nm-node-shadow": "0 0 8px rgba(0, 240, 255, 0.15), inset 0 1px 2px rgba(0, 240, 255, 0.1)",

  "--nm-root-bg": "#1a1a2e",
  "--nm-root-border": "rgba(0, 240, 255, 0.5)",
  "--nm-root-shadow": "0 0 12px rgba(0, 240, 255, 0.25), 0 0 24px rgba(0, 240, 255, 0.1)",

  "--nm-note-bg": "rgba(176, 38, 255, 0.1)",
  "--nm-note-border": "rgba(176, 38, 255, 0.4)",
  "--nm-note-shadow": "0 0 8px rgba(176, 38, 255, 0.2), inset 0 1px 2px rgba(176, 38, 255, 0.1)",

  "--nm-select-ring": "#00f0ff",
  "--nm-select-glow": "rgba(0, 240, 255, 0.25)",

  "--nm-toolbar-bg": "transparent",
  "--nm-toolbar-border": "rgba(0, 240, 255, 0.15)",
  "--nm-toolbar-text": "#e0e0ff",
  "--nm-toolbar-btn-bg": "#141420",
  "--nm-toolbar-btn-border": "rgba(0, 240, 255, 0.3)",
  "--nm-toolbar-btn-text": "#e0e0ff",

  "--nm-search-bg": "rgba(10, 10, 20, 0.95)",
  "--nm-search-border": "rgba(0, 240, 255, 0.2)",
  "--nm-search-input-bg": "#141420",
  "--nm-search-text": "#e0e0ff",
};

const THEME_MAP: Record<ThemeId, ThemeVars> = {
  default: FROST,
  dark: MIDNIGHT,
  warm: DAWN,
  square: SQUARE,
  "toss-dark": TOSS_DARK,
  neon: NEON,
};

/**
 * 테마 관리자.
 * 컨테이너 요소에 CSS 커스텀 속성을 적용하여 테마를 전환한다.
 */
export class ThemeManager {
  private containerEl: HTMLElement;
  private currentTheme: ThemeId;

  constructor(containerEl: HTMLElement, initialTheme: ThemeId) {
    this.containerEl = containerEl;
    this.currentTheme = initialTheme;
    this.applyTheme(initialTheme);
  }

  /** 테마 전환 */
  applyTheme(themeId: ThemeId): void {
    this.currentTheme = themeId;
    const vars = THEME_MAP[themeId];

    for (const [key, value] of Object.entries(vars)) {
      this.containerEl.style.setProperty(key, value);
    }

    // 배경색을 인라인 important로 직접 적용
    const canvasBg = vars["--nm-canvas-bg"];
    if (canvasBg) {
      this.containerEl.style.setProperty("background", canvasBg, "important");
    }

    // data-nm-theme 속성으로 CSS 셀렉터 대응
    this.containerEl.setAttribute("data-nm-theme", themeId);
  }

  getCurrentTheme(): ThemeId {
    return this.currentTheme;
  }
}
