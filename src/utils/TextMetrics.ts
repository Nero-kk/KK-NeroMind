/**
 * Canvas API 기반 텍스트 폭 측정.
 * 브라우저의 실제 폰트 렌더링 엔진을 사용하여 정확한 폭을 계산한다.
 * 모든 노드에서 동일한 여백을 보장하기 위해 근사치 대신 정밀 측정을 사용한다.
 *
 * LayoutEngine과 NodeRenderer에서 동일 로직을 사용하여
 * 레이아웃 계산과 실제 렌더링 폭이 일치하도록 한다.
 */

let ctx: CanvasRenderingContext2D | null = null;

export function measureText(text: string, fontSize: number): number {
  if (!text) return 0;

  if (!ctx) {
    const canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
  }

  if (ctx) {
    // Obsidian 기본 폰트 스택 + 노드 라벨의 font-weight 500
    ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    // Canvas API는 Electron 렌더러보다 텍스트를 좁게 측정하는 경향이 있음
    // 텍스트 길이에 비례하여 오차가 커지므로 비율 기반 보정 적용
    return ctx.measureText(text).width * 1.1;
  }

  // Canvas 사용 불가 시 폴백 (근사치)
  let width = 0;
  for (const char of text) {
    width += char.charCodeAt(0) > 127 ? fontSize * 1.15 : fontSize * 0.65;
  }
  return width;
}
