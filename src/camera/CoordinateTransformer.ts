/**
 * CoordinateTransformer
 * 
 * 책임:
 * - World ↔ Screen 좌표 변환
 * - 순수 함수 (상태 없음)
 * 
 * 비책임:
 * - 카메라 상태 변경
 * - 렌더링
 * - 이벤트 처리
 * 
 * 핵심 공식:
 * - ScreenPosition = (WorldPosition × scale) + offset
 * - WorldPosition = (ScreenPosition - offset) / scale
 */

import { CameraState, Point } from '../types/camera';

export class CoordinateTransformer {
	/**
	 * World 좌표 → Screen 좌표 변환
	 * 
	 * @param worldX - 월드 좌표 X
	 * @param worldY - 월드 좌표 Y
	 * @param camera - 카메라 상태
	 * @returns Screen 좌표
	 */
	worldToScreen(worldX: number, worldY: number, camera: CameraState): Point {
		return {
			x: worldX * camera.scale + camera.offsetX,
			y: worldY * camera.scale + camera.offsetY
		};
	}

	/**
	 * Screen 좌표 → World 좌표 변환
	 * 
	 * @param screenX - 스크린 좌표 X
	 * @param screenY - 스크린 좌표 Y
	 * @param camera - 카메라 상태
	 * @returns World 좌표
	 */
	screenToWorld(screenX: number, screenY: number, camera: CameraState): Point {
		return {
			x: (screenX - camera.offsetX) / camera.scale,
			y: (screenY - camera.offsetY) / camera.scale
		};
	}

	/**
	 * Point 객체를 받는 World → Screen 변환
	 */
	worldPointToScreen(worldPoint: Point, camera: CameraState): Point {
		return this.worldToScreen(worldPoint.x, worldPoint.y, camera);
	}

	/**
	 * Point 객체를 받는 Screen → World 변환
	 */
	screenPointToWorld(screenPoint: Point, camera: CameraState): Point {
		return this.screenToWorld(screenPoint.x, screenPoint.y, camera);
	}
}
