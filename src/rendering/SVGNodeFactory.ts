import { MindMapNode, SVG_NS, NODE_CONSTANTS } from '../types';

/**
 * SVGNodeFactory
 *
 * Architecture v4.0 § 2.2 노드 렌더링 사양 기준
 *
 * 역할:
 * - 노드 SVG 요소 생성
 * - Apple Style Glassmorphism 적용
 * - 4방향 +/- 버튼 생성
 *
 * Phase 1: 기본 노드 형태만 구현
 * Phase 2+: 버튼, 인터랙션 추가
 */
export class SVGNodeFactory {
	/**
	 * 노드 SVG 요소 생성
	 */
	createNodeElement(node: MindMapNode): SVGGElement {
		const group = document.createElementNS(SVG_NS, 'g');
		group.setAttribute('id', `node-${node.id}`);
		group.setAttribute('class', 'neromind-node');
		group.setAttribute(
			'transform',
			`translate(${node.position.x}, ${node.position.y})`
		);

		// 노드 배경 (라운드 사각형)
		const rect = this.createNodeBackground(node);
		group.appendChild(rect);

		// 텍스트
		const text = this.createNodeText(node);
		group.appendChild(text);

		// Phase 2+: 버튼 추가
		// if (node.parentId === null) {
		//   // 루트노드: 4방향 버튼
		//   this.addDirectionButtons(group, node);
		// } else {
		//   // 일반노드: 방향에 따른 버튼
		//   this.addChildButton(group, node);
		// }

		return group;
	}

	/**
	 * 노드 배경 생성 (Glassmorphism)
	 */
	private createNodeBackground(node: MindMapNode): SVGRectElement {
		const rect = document.createElementNS(SVG_NS, 'rect');

		// 텍스트 길이 기반 너비 계산
		const textWidth = this.calculateTextWidth(node.content);
		const width = Math.max(NODE_CONSTANTS.MIN_WIDTH, textWidth + NODE_CONSTANTS.PADDING * 2);

		rect.setAttribute('x', String(-width / 2));
		rect.setAttribute('y', String(-NODE_CONSTANTS.HEIGHT / 2));
		rect.setAttribute('width', String(width));
		rect.setAttribute('height', String(NODE_CONSTANTS.HEIGHT));
		rect.setAttribute('rx', String(NODE_CONSTANTS.BORDER_RADIUS));

		// Apple Style Glassmorphism
		rect.setAttribute('fill', 'rgba(255, 255, 255, 0.72)');
		rect.setAttribute('stroke', 'rgba(0, 0, 0, 0.08)');
		rect.setAttribute('stroke-width', '1');

		// 선택 상태
		if (node.id === 'selected') {
			// Phase 2+: 선택 상태 스타일
			rect.setAttribute('stroke', '#007AFF');
			rect.setAttribute('stroke-width', '2');
		}

		// 핀 고정 상태
		if (node.isPinned) {
			rect.setAttribute('fill', 'rgba(255, 149, 0, 0.15)');
			rect.setAttribute('stroke', 'rgba(255, 149, 0, 0.3)');
		}

		return rect;
	}

	/**
	 * 노드 텍스트 생성
	 */
	private createNodeText(node: MindMapNode): SVGTextElement {
		const text = document.createElementNS(SVG_NS, 'text');

		text.setAttribute('x', '0');
		text.setAttribute('y', '5');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute(
			'font-family',
			'-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
		);
		text.setAttribute('font-size', '14');
		text.setAttribute('font-weight', '400');
		text.setAttribute('fill', '#1d1d1f');

		// [[노트]] 형식 처리
		const displayText = this.cleanNodeContent(node.content);
		text.textContent = displayText;

		return text;
	}

	/**
	 * 텍스트 너비 계산
	 */
	private calculateTextWidth(content: string): number {
		// 간단한 추정 (Phase 2+: canvas measureText 사용)
		const displayText = this.cleanNodeContent(content);
		return displayText.length * 8; // 대략 8px/char
	}

	/**
	 * 노드 내용 정리 ([[노트]] → 노트)
	 */
	private cleanNodeContent(content: string): string {
		return content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, path, __, alias) => {
			return alias || path;
		});
	}
}
