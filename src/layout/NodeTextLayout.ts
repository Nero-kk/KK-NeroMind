/**
 * NodeTextLayout - 노드 텍스트 레이아웃 계산
 *
 * 책임:
 * - 텍스트를 maxWidth에 맞춰 word wrapping
 * - 줄바꿈된 텍스트의 실제 width/height 계산
 * - Renderer가 사용할 lines 배열 반환
 *
 * 비책임:
 * - SVG 렌더링 (Renderer의 책임)
 * - 좌표 계산 (CenterRootLayout의 책임)
 */

export interface TextLayoutResult {
	lines: string[];
	width: number;
	height: number;
}

interface TextMetrics {
	fontSize: number;
	fontFamily: string;
}

/**
 * 노드 텍스트 레이아웃 계산
 *
 * @param text - 원본 텍스트
 * @param maxWidth - 최대 너비 (픽셀)
 * @param metrics - 폰트 메트릭 (fontSize, fontFamily)
 * @returns TextLayoutResult { lines, width, height }
 */
export function computeTextLayout(
	text: string,
	maxWidth: number,
	metrics: TextMetrics = { fontSize: 12, fontFamily: 'sans-serif' }
): TextLayoutResult {
	const { fontSize } = metrics;
	const lineHeight = fontSize * 1.4; // 줄 간격 (140%)

	// 빈 텍스트 처리
	if (!text || text.trim() === '') {
		return {
			lines: [''],
			width: 0,
			height: lineHeight,
		};
	}

	// 단어 단위로 분할 (공백 기준)
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		// 현재 줄에 단어 추가 시도
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		const testWidth = estimateTextWidth(testLine, fontSize);

		if (testWidth <= maxWidth) {
			// 추가 가능
			currentLine = testLine;
		} else {
			// 현재 줄이 비어있고 단어가 maxWidth보다 긴 경우: 강제 분할
			if (currentLine === '') {
				// 단어 강제 분할
				const parts = splitLongWord(word, maxWidth, fontSize);
				for (let i = 0; i < parts.length - 1; i++) {
					lines.push(parts[i]);
				}
				currentLine = parts[parts.length - 1];
			} else {
				// 현재 줄 완성 후 새 줄 시작
				lines.push(currentLine);
				currentLine = word;
			}
		}
	}

	// 마지막 줄 추가
	if (currentLine) {
		lines.push(currentLine);
	}

	// 최종 width/height 계산
	const actualWidth = Math.max(
		...lines.map((line) => estimateTextWidth(line, fontSize))
	);
	const actualHeight = lines.length * lineHeight;

	return {
		lines,
		width: actualWidth,
		height: actualHeight,
	};
}

/**
 * 텍스트 너비 추정 (근사값)
 *
 * 실제 브라우저 렌더링과 정확히 일치하지 않지만,
 * 레이아웃 계산용으로 충분한 근사값 제공
 *
 * @param text - 텍스트
 * @param fontSize - 폰트 크기
 * @returns 예상 너비 (픽셀)
 */
function estimateTextWidth(text: string, fontSize: number): number {
	// 평균 문자 너비: fontSize * 0.6
	// 영문 소문자 평균, 한글은 약 1.0
	// 단순 근사: 각 문자를 fontSize * 0.6으로 계산

	let totalWidth = 0;
	for (const char of text) {
		// 한글 범위 (U+AC00 ~ U+D7A3)
		const code = char.charCodeAt(0);
		if (code >= 0xAC00 && code <= 0xD7A3) {
			totalWidth += fontSize * 1.0; // 한글: fontSize와 동일
		} else {
			totalWidth += fontSize * 0.6; // 영문/숫자: 60%
		}
	}

	return totalWidth;
}

/**
 * 긴 단어를 maxWidth에 맞춰 강제 분할
 *
 * @param word - 긴 단어
 * @param maxWidth - 최대 너비
 * @param fontSize - 폰트 크기
 * @returns 분할된 문자열 배열
 */
function splitLongWord(
	word: string,
	maxWidth: number,
	fontSize: number
): string[] {
	const parts: string[] = [];
	let current = '';

	for (const char of word) {
		const testWord = current + char;
		const testWidth = estimateTextWidth(testWord, fontSize);

		if (testWidth <= maxWidth) {
			current += char;
		} else {
			if (current) {
				parts.push(current);
			}
			current = char;
		}
	}

	if (current) {
		parts.push(current);
	}

	return parts.length > 0 ? parts : [word];
}
