import type { ViewportState, Position } from "../types";
import { VIEWPORT } from "../constants";

/**
 * 뷰포트 좌표 변환 및 줌/팬 상태 관리.
 * 화면 좌표 (Screen) ↔ 월드 좌표 (World) 변환을 담당한다.
 */
export class ViewportManager {
  private state: ViewportState;

  constructor(initial?: Partial<ViewportState>) {
    this.state = {
      x: initial?.x ?? 0,
      y: initial?.y ?? 0,
      zoom: initial?.zoom ?? 1.0,
    };
  }

  getState(): ViewportState {
    return this.state;
  }

  setState(partial: Partial<ViewportState>): void {
    this.state = { ...this.state, ...partial };
  }

  /** 화면 좌표 → 월드 좌표 */
  screenToWorld(screenX: number, screenY: number): Position {
    return {
      x: (screenX - this.state.x) / this.state.zoom,
      y: (screenY - this.state.y) / this.state.zoom,
    };
  }

  /** 월드 좌표 → 화면 좌표 */
  worldToScreen(worldX: number, worldY: number): Position {
    return {
      x: worldX * this.state.zoom + this.state.x,
      y: worldY * this.state.zoom + this.state.y,
    };
  }

  /** 마우스 포인터 중심 줌 */
  zoomAt(delta: number, screenX: number, screenY: number): ViewportState {
    const oldZoom = this.state.zoom;
    const newZoom = Math.min(
      VIEWPORT.MAX_ZOOM,
      Math.max(VIEWPORT.MIN_ZOOM, oldZoom + delta),
    );
    if (newZoom === oldZoom) return this.state;

    // 줌 전 마우스 위치의 월드 좌표
    const worldX = (screenX - this.state.x) / oldZoom;
    const worldY = (screenY - this.state.y) / oldZoom;

    // 줌 후 동일한 월드 좌표가 같은 화면 위치에 오도록 팬 보정
    const newX = screenX - worldX * newZoom;
    const newY = screenY - worldY * newZoom;

    this.state = { x: newX, y: newY, zoom: newZoom };
    return this.state;
  }

  /** 팬 (이동) */
  pan(deltaX: number, deltaY: number): ViewportState {
    this.state = {
      ...this.state,
      x: this.state.x + deltaX,
      y: this.state.y + deltaY,
    };
    return this.state;
  }

  /** 특정 월드 좌표를 화면 중앙으로 이동 */
  centerOn(worldX: number, worldY: number, canvasWidth: number, canvasHeight: number): ViewportState {
    this.state = {
      ...this.state,
      x: canvasWidth / 2 - worldX * this.state.zoom,
      y: canvasHeight / 2 - worldY * this.state.zoom,
    };
    return this.state;
  }

  /** 주어진 바운딩 박스가 화면에 맞도록 줌/팬 조정 */
  fitBounds(
    minX: number, minY: number, maxX: number, maxY: number,
    canvasWidth: number, canvasHeight: number, padding: number = 40,
  ): ViewportState {
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0) return this.state;

    const availW = canvasWidth - padding * 2;
    const availH = canvasHeight - padding * 2;
    const zoom = Math.min(
      availW / contentW,
      availH / contentH,
      VIEWPORT.MAX_ZOOM,
    );
    const clampedZoom = Math.max(VIEWPORT.MIN_ZOOM, zoom);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.state = {
      x: canvasWidth / 2 - centerX * clampedZoom,
      y: canvasHeight / 2 - centerY * clampedZoom,
      zoom: clampedZoom,
    };
    return this.state;
  }

  /** SVG transform 문자열 생성 */
  toSvgTransform(): string {
    return `translate(${this.state.x}, ${this.state.y}) scale(${this.state.zoom})`;
  }
}
