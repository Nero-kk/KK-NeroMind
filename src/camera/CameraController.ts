/**
 * CameraController
 *
 * 책임:
 * - 카메라 상태 관리 (단일 진입점)
 * - 카메라 잠금 메커니즘
 * - Resize 처리
 * - 좌표 변환 위임
 *
 * 비책임:
 * - 노드 좌표 변경
 * - 상태 영속화
 * - 레이아웃 계산
 * - 렌더링 (렌더러에 통지만)
 *
 * 핵심 규칙:
 * - 모든 카메라 변경은 applyCameraChange()를 통해서만 수행
 * - 직접 camera 속성 수정 절대 금지
 */

import {
  CameraState,
  CameraChangeReason,
  Viewport,
  Point,
} from "../types/camera";
import { CoordinateTransformer } from "./CoordinateTransformer";
import { Disposable } from "../core/Disposable";

/**
 * 카메라 잠금 사유
 */
type LockReason =
  | "dragging"
  | "layout"
  | "reparenting"
  | "animation"
  | "manual-pan"
  | "camera-drag";

export class CameraController implements Disposable {
  private camera: CameraState;
  private viewport: Viewport;
  private transformer: CoordinateTransformer;

  // 잠금 메커니즘
  private lockCount = 0;
  private currentLockReason?: LockReason;

  // ResizeObserver
  private resizeObserver: ResizeObserver | null = null;

  // 렌더러 콜백 (stub 허용)
  private onCameraChanged?: (camera: Readonly<CameraState>) => void;

  // 잠금 상태 변경 콜백 (EphemeralState 연계용)
  private onLockChanged?: (isLocked: boolean, reason?: LockReason) => void;

  constructor(
    private containerEl: HTMLElement,
    initialCamera?: Partial<CameraState>
  ) {
    // 초기 카메라 상태
    this.camera = {
      offsetX: initialCamera?.offsetX ?? 0,
      offsetY: initialCamera?.offsetY ?? 0,
      scale: initialCamera?.scale ?? 1.0,
    };

    // 뷰포트 초기화
    this.viewport = {
      width: containerEl.clientWidth,
      height: containerEl.clientHeight,
    };

    // 좌표 변환기
    this.transformer = new CoordinateTransformer();

    // ResizeObserver 설정
    this.setupResizeObserver();
  }

  /**
   * ResizeObserver 설정
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.onResize(entry.contentRect);
      }
    });

    this.resizeObserver.observe(this.containerEl);
  }

  /**
   * Resize 처리
   *
   * 규칙:
   * - 화면 중앙의 월드 좌표를 유지
   * - 카메라 잠금 시 무시
   */
  private onResize(newRect: DOMRectReadOnly): void {
    // 잠금 체크
    if (this.isLocked()) {
      console.log("Resize ignored: camera locked");
      return;
    }

    // 화면 중앙의 월드 좌표 계산 (리사이즈 전)
    const centerWorld = this.transformer.screenToWorld(
      this.viewport.width / 2,
      this.viewport.height / 2,
      this.camera
    );

    // Viewport 갱신
    this.viewport = {
      width: newRect.width,
      height: newRect.height,
    };

    // 같은 월드 좌표가 중앙에 오도록 offset 보정
    this.applyCameraChange(
      {
        offsetX: this.viewport.width / 2 - centerWorld.x * this.camera.scale,
        offsetY: this.viewport.height / 2 - centerWorld.y * this.camera.scale,
      },
      CameraChangeReason.ResizeAdjustment
    );
  }

  /**
   * 카메라 상태 변경 (단일 진입점)
   *
   * ⚠️ 모든 카메라 변경은 반드시 이 메서드를 통해야 함
   *
   * @param partial - 변경할 카메라 속성 (부분 업데이트 가능)
   * @param reason - 변경 사유 (로깅 및 디버깅용)
   * @returns 변경 성공 여부
   */
  applyCameraChange(
    partial: Partial<CameraState>,
    reason: CameraChangeReason
  ): boolean {
    // 잠금 체크 (초기화는 예외)
    if (this.isLocked() && reason !== CameraChangeReason.InitialViewport) {
      console.warn(
        `Camera change blocked: ${this.currentLockReason}, attempted: ${reason}`
      );
      return false;
    }

    // 로깅 (디버깅용)
    console.log(`Camera change: ${reason}`, partial);

    // 상태 업데이트 (불변성 유지)
    this.camera = { ...this.camera, ...partial };

    // scale 범위 제한
    this.camera.scale = this.clampScale(this.camera.scale);

    // 렌더러에 통지 (복사본 전달: 단일 진입점 보호)
    this.onCameraChanged?.({ ...this.camera });

    return true;
  }

  /**
   * 카메라 잠금
   *
   * @param reason - 잠금 사유
   */
  lock(reason: LockReason): void {
    this.lockCount++;
    this.currentLockReason = reason;
    console.log(`Camera locked: ${reason} (count: ${this.lockCount})`);
    this.onLockChanged?.(true, reason);
  }

  /**
   * 카메라 잠금 해제
   *
   * @param reason - 잠금 사유 (로깅용)
   */
  unlock(reason: LockReason): void {
    this.lockCount = Math.max(0, this.lockCount - 1);

    if (this.lockCount === 0) {
      this.currentLockReason = undefined;
      console.log(`Camera unlocked: ${reason}`);
      this.onLockChanged?.(false);
    }
  }

  /**
   * 카메라 잠금 여부
   */
  isLocked(): boolean {
    return this.lockCount > 0;
  }

  /**
   * 현재 카메라 상태 조회 (읽기 전용)
   */
  getCamera(): Readonly<CameraState> {
    return { ...this.camera };
  }

  /**
   * 현재 뷰포트 조회 (읽기 전용)
   */
  getViewport(): Readonly<Viewport> {
    return { ...this.viewport };
  }

  /**
   * 좌표 변환기 조회
   */
  getTransformer(): CoordinateTransformer {
    return this.transformer;
  }

  /**
   * 렌더러 콜백 등록
   *
   * @param callback - 카메라 변경 시 호출될 콜백
   */
  onCameraChange(callback: (camera: Readonly<CameraState>) => void): void {
    this.onCameraChanged = callback;
  }

  /**
   * 잠금 상태 변경 콜백 등록
   *
   * @param callback - 잠금 상태 변경 시 호출될 콜백
   */
  onLockChange(
    callback: (isLocked: boolean, reason?: LockReason) => void
  ): void {
    this.onLockChanged = callback;
  }

  /**
   * scale 범위 제한 (0.1 ~ 5.0)
   */
  private clampScale(scale: number): number {
    return Math.max(0.1, Math.min(5.0, scale));
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.onCameraChanged = undefined;
  }
}
