import { Notice } from 'obsidian';
import { MindMapData, CURRENT_SCHEMA_VERSION, FILE_SIGNATURE } from '../types/MindMapData';

/**
 * Schema 검증기
 * 
 * KK-NeroMind Architecture v4.2.8 § 2 Schema is Law 준수
 * 
 * 책임:
 * - 파일 시그니처 검증 (createdWith)
 * - 스키마 버전 호환성 검증 (정수 비교만)
 * - 필수 필드 존재 여부 검증
 * - Fail Loudly 원칙 준수
 * 
 * 비책임:
 * - 데이터 정화 (SchemaSanitizer 책임)
 * - 데이터 마이그레이션 (별도 Migrator 책임)
 * - 추측, 보정, 생성 (명시적 금지)
 */
export class SchemaValidator {
	/**
	 * Schema 검증
	 * 
	 * @throws Error - 검증 실패 시 즉시 throw (Fail Loudly)
	 */
	validate(data: any): asserts data is MindMapData {
		// 1. 파일 시그니처 검증
		if (data.meta?.createdWith !== FILE_SIGNATURE) {
			const error = 'Not a KK-NeroMind file';
			new Notice(error, 0);
			throw new Error(error);
		}

		// 2. schemaVersion 타입 검증 (정수만 허용)
		if (typeof data.meta?.schemaVersion !== 'number') {
			const error = 'Invalid schemaVersion type (must be number)';
			new Notice(error, 0);
			throw new Error(error);
		}

		// 3. schemaVersion 호환성 검증 (단순 정수 비교)
		// v4.2.8 헌법: Semantic Versioning 명시적 금지
		if (data.meta.schemaVersion > CURRENT_SCHEMA_VERSION) {
			const error = `Incompatible schema version: ${data.meta.schemaVersion} (current: ${CURRENT_SCHEMA_VERSION})`;
			new Notice(error, 0);
			throw new Error(error);
		}

		// 4. 필수 필드 검증
		if (!data.rootNodeId) {
			const error = 'Missing root node';
			new Notice('파일이 손상되었습니다: 루트 노드 없음', 0);
			throw new Error(error);
		}

		if (!data.nodes || typeof data.nodes !== 'object') {
			const error = 'Invalid nodes structure';
			new Notice('파일이 손상되었습니다: 노드 구조 오류', 0);
			throw new Error(error);
		}

		if (!data.edges || typeof data.edges !== 'object') {
			const error = 'Invalid edges structure';
			new Notice('파일이 손상되었습니다: 엣지 구조 오류', 0);
			throw new Error(error);
		}

		// 5. 루트 노드 존재 검증
		if (!data.nodes[data.rootNodeId]) {
			const error = 'Root node does not exist in nodes';
			new Notice('파일이 손상되었습니다: 루트 노드가 존재하지 않음', 0);
			throw new Error(error);
		}

		// ❌ 금지: 추측, 보정, 생성
		// - 누락된 필드를 기본값으로 채우지 않음
		// - 잘못된 데이터를 자동으로 보정하지 않음
		// - "보통 이런 경우" 판단 금지
	}

	/**
	 * 버전 호환성 검증 (정수 비교만)
	 * 
	 * v4.2.8 헌법: schemaVersion은 단조 증가하는 정수
	 */
	isCompatible(fileVersion: number, currentVersion: number): boolean {
		// 단순 정수 비교만 허용
		return fileVersion <= currentVersion;
	}
}
