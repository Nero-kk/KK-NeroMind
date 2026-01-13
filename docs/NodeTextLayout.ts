export class NodeTextLayout {
    private static measureContext: CanvasRenderingContext2D | null = null;
  
    private static getContext(fontSize: number, fontFamily: string) {
      if (!this.measureContext) {
        const canvas = document.createElement('canvas');
        this.measureContext = canvas.getContext('2d')!;
      }
      this.measureContext.font = `${fontSize}px ${fontFamily}`;
      return this.measureContext;
    }
  
    static layout(input: TextLayoutInput): TextLayoutResult {
      const {
        text,
        maxLineWidth,
        fontSize,
        fontFamily,
        lineHeight,
        paddingX,
        paddingY,
      } = input;
  
      const ctx = this.getContext(fontSize, fontFamily);
      const words = text.split(/\s+/);
      const lines: string[] = [];
  
      let currentLine = '';
  
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = ctx.measureText(testLine).width;
  
        if (width <= maxLineWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
  
      if (currentLine) lines.push(currentLine);
  
      // 실제 가장 긴 줄 기준 width 계산
      let maxTextWidth = 0;
      for (const line of lines) {
        maxTextWidth = Math.max(
          maxTextWidth,
          ctx.measureText(line).width
        );
      }
  
      return {
        lines,
        width: Math.ceil(maxTextWidth + paddingX * 2),
        height: Math.ceil(lines.length * lineHeight + paddingY * 2),
      };
    }
  }
  