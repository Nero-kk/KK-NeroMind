# KK-NeroMind Phase 1 Instructions v5.2.0

> **버전**: 5.2.0  
> **최종 수정**: 2026-01-19  
> **상위 문서**: KK-NeroMind-Development-Roadmap-v5.2.0.md  
> **문서 지위**: Phase 1 구현 필수 가이드 (Mandatory Implementation Guide)

---

## 📋 문서 개요

### 목적

본 문서는 **KK-NeroMind Phase 1 (Zero-to-One)** 구현을 위한 **단계별 실행 지침서**다.

- AI 에이전트와 인간 개발자 모두를 위한 명확한 구현 가이드
- Roadmap v5.2.0 Phase 1의 구체화된 실행 계획
- Phase Gate 통과를 위한 필수 체크리스트

### Phase 1 정의

**Phase 1: 최소 실행 가능 플러그인 (Zero-to-One)**

```
목표: Obsidian에서 플러그인이 로드되고, 
     Command가 표시되며, .kknm 파일 생성 가능

Zero-to-One: 0 (프로젝트 없음) → 1 (Obsidian에서 실행됨)
```

### 문서 권위

```
Architecture v5.2.0 (헌법)
  ↓
Roadmap v5.2.0 (Phase 계획)
  ↓
Phase 1 Instructions v5.2.0 (본 문서 - 실행 지침)
  ↓
구현 코드 (5개 파일)
```

**본 문서는 Phase 1 구현의 유일한 진실의 원천이다.**

---

## 🎯 Phase 1 목표

### Zero-to-One 달성 기준

Phase 1 완료 = 다음 8가지 조건을 **모두** 만족:

| # | 조건 | 검증 방법 |
|---|------|-----------|
| 1 | npm run build 성공 | `npm run build` 에러 없음 |
| 2 | Obsidian 플러그인 로드 성공 | 플러그인 활성화 에러 없음 |
| 3 | Command Palette 명령 노출 | "Create New Mind Map" 표시 |
| 4 | .kknm 파일 생성 가능 | 명령 실행 시 파일 생성 |
| 5 | Jest 유닛 테스트 통과 | 3+ 테스트 파일, 모두 PASS |
| 6 | 테스트 커버리지 50%+ | `npm run test:coverage` |
| 7 | console.error 없음 | Obsidian 개발자 콘솔 확인 |
| 8 | Zero-to-One Checklist 통과 | Section 7 체크리스트 |

### Phase 1의 의미

**Phase 1은 기능 구현이 아니라 실행 가능성 검증이다.**

```
❌ 아닌 것:
- 완전한 마인드맵 기능
- UI 렌더링
- Command 시스템
- Layout Engine

✅ 맞는 것:
- 플러그인이 Obsidian에서 로드됨
- .kknm 파일을 생성할 수 있음
- Schema 검증이 작동함
- 테스트가 통과함
```

---

## ⏱️ 소요 시간 및 구성

### 예상 소요 시간

| 단계 | 시간 | 누적 |
|------|------|------|
| 1. types.ts 작성 | 30분 | 30분 |
| 2. validator.ts + test | 2시간 | 2.5시간 |
| 3. disposable.ts + test | 1시간 | 3.5시간 |
| 4. diagnostic.ts + test | 1.5시간 | 5시간 |
| 5. main.ts 작성 | 1시간 | 6시간 |
| 6. Obsidian 테스트 | 1시간 | 7시간 |
| 7. 문제 해결 | 1-2시간 | 8-9시간 |

**총 예상 시간**: 1-2일 (8-9시간 순수 작업)

### 구현 파일 (5개)

```
src/
├── schema/
│   ├── types.ts           # [1] 스키마 타입 정의
│   ├── validator.ts       # [2] 스키마 검증 (중요!)
│   └── validator.test.ts  # [2] 검증 테스트
├── utils/
│   ├── disposable.ts      # [3] Disposable Registry
│   ├── disposable.test.ts # [3] Registry 테스트
│   ├── diagnostic.ts      # [4] Boot Diagnostics
│   └── diagnostic.test.ts # [4] Diagnostics 테스트
└── main.ts                # [5] 플러그인 진입점
```

**총 8개 파일** (5개 구현 + 3개 테스트)

---

## 📂 Part I: 파일별 구현 가이드

---

## 1. Schema Types 정의 (types.ts)

### 파일 위치
```
src/schema/types.ts
```

### 소요 시간
**30분**

### 목적
Schema v5.2.1의 TypeScript 인터페이스를 정확히 구현

### 구현 내용

**전체 코드**:

```typescript
/**
 * KK-NeroMind Schema Types v1
 * 
 * 근거: KK-NeroMind-Schema-v5.2.1.md
 * 
 * CRITICAL: 이 파일은 Schema v5.2.1의 TypeScript 구현이다.
 * 필드명, 타입, 구조를 절대 변경하지 말 것.
 */

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * 최상위 Mind Map 스키마
 */
export interface MindMapSchema {
  schemaVersion: number;
  metadata: MindMapMetadata;
  nodes: Record<string, MindMapNode>;
  edges: Record<string, MindMapEdge>;
  camera: CameraState;
}

/**
 * Mind Map 메타데이터
 * 
 * CRITICAL: 필드명 주의
 * - created (NOT createdAt)
 * - modified (NOT updatedAt)
 * - title (필수)
 */
export interface MindMapMetadata {
  created: number;      // Unix timestamp (milliseconds)
  modified: number;     // Unix timestamp (milliseconds)
  title: string;        // Mind Map 제목
  author?: string;      // 작성자 (선택)
  tags?: string[];      // 태그 배열 (선택)
}

/**
 * Mind Map 노드
 */
export interface MindMapNode {
  id: string;
  content: string;
  position: Position;
  size?: Size;
  style?: NodeStyle;
  linkedNote?: string;  // Full Note 연결 (Phase 7에서 사용)
}

/**
 * Mind Map 엣지 (연결선)
 */
export interface MindMapEdge {
  id: string;
  from: string;         // 시작 노드 ID
  to: string;           // 종료 노드 ID
  type?: 'solid' | 'dashed' | 'dotted';
}

/**
 * 2D 위치
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 노드 크기
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 노드 스타일
 * 
 * CRITICAL: v1에서는 반드시 빈 객체 {}
 * 키가 존재하면 검증 실패
 */
export interface NodeStyle {
  // v1: 빈 인터페이스 (확장 금지)
}

/**
 * 카메라 상태
 */
export interface CameraState {
  x: number;            // 카메라 X 위치
  y: number;            // 카메라 Y 위치
  zoom: number;         // 확대/축소 (양수만)
}
```

### 검증 포인트

**자체 검증 체크리스트**:

```
[ ] CURRENT_SCHEMA_VERSION = 1 (상수)
[ ] MindMapMetadata에 "created" (NOT createdAt)
[ ] MindMapMetadata에 "modified" (NOT updatedAt)
[ ] MindMapMetadata.title은 string (필수)
[ ] nodes는 Record<string, MindMapNode>
[ ] edges는 Record<string, MindMapEdge>
[ ] NodeStyle은 빈 인터페이스
[ ] 모든 주석 포함
```

### 금지 사항

```
❌ createdAt, updatedAt 사용 금지
❌ createdWith 필드 추가 금지
❌ _reserved 필드 추가 금지
❌ nodes를 Array로 변경 금지
❌ NodeStyle에 속성 추가 금지
```

---

## 2. Schema Validator 구현 (validator.ts)

### 파일 위치
```
src/schema/validator.ts
src/schema/validator.test.ts
```

### 소요 시간
**2시간** (구현 1시간 + 테스트 1시간)

### 목적
Schema v5.2.1 검증 로직 구현 및 100% 테스트 커버리지 달성

### 중요도
🔴 **Phase 1에서 가장 중요한 파일**

### 구현 내용

**src/schema/validator.ts**:

```typescript
import { MindMapSchema, MindMapMetadata, CURRENT_SCHEMA_VERSION } from './types';

/**
 * Schema Validator
 * 
 * 근거: KK-NeroMind-Schema-v5.2.1.md Section 7
 * 
 * 원칙:
 * 1. Schema is Law - 정의되지 않은 것은 거부
 * 2. Fail Loudly - 실패 시 명확히 알림
 * 3. No Auto-Correction - 자동 수정 금지
 */
export class SchemaValidator {
  /**
   * 스키마 검증
   * 
   * @returns true if valid, false otherwise
   */
  validate(data: unknown): data is MindMapSchema {
    // 1. 타입 체크
    if (typeof data !== 'object' || data === null) {
      console.error('[SchemaValidator] Data is not an object');
      return false;
    }
    
    const schema = data as any;
    
    // 2. schemaVersion 검증
    if (!this.validateSchemaVersion(schema)) {
      return false;
    }
    
    // 3. 필수 필드 존재 검증
    if (!schema.metadata || !schema.nodes || !schema.edges || !schema.camera) {
      console.error('[SchemaValidator] Missing required top-level fields');
      return false;
    }
    
    // 4. metadata 검증
    if (!this.validateMetadata(schema.metadata)) {
      return false;
    }
    
    // 5. nodes 검증
    if (!this.validateNodes(schema.nodes)) {
      return false;
    }
    
    // 6. edges 검증
    if (!this.validateEdges(schema.edges, schema.nodes)) {
      return false;
    }
    
    // 7. camera 검증
    if (!this.validateCamera(schema.camera)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Sanitize (Phase 1에서는 검증만)
   * 
   * @returns data if valid, null otherwise
   */
  sanitize(data: unknown): MindMapSchema | null {
    return this.validate(data) ? (data as MindMapSchema) : null;
  }
  
  /**
   * schemaVersion 검증
   */
  private validateSchemaVersion(schema: any): boolean {
    if (typeof schema.schemaVersion !== 'number') {
      console.error('[SchemaValidator] schemaVersion is not a number');
      return false;
    }
    
    if (!Number.isInteger(schema.schemaVersion)) {
      console.error('[SchemaValidator] schemaVersion must be an integer');
      return false;
    }
    
    if (schema.schemaVersion <= 0) {
      console.error('[SchemaValidator] schemaVersion must be positive');
      return false;
    }
    
    if (schema.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      console.error(`[SchemaValidator] Unsupported schema version: ${schema.schemaVersion}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * metadata 검증
   * 
   * CRITICAL: 필드명 주의
   * - created (NOT createdAt)
   * - modified (NOT updatedAt)
   * - title (필수)
   */
  private validateMetadata(metadata: any): boolean {
    // 필수 필드 타입 검증
    if (typeof metadata.created !== 'number') {
      console.error('[SchemaValidator] metadata.created must be number');
      return false;
    }
    
    if (typeof metadata.modified !== 'number') {
      console.error('[SchemaValidator] metadata.modified must be number');
      return false;
    }
    
    if (typeof metadata.title !== 'string') {
      console.error('[SchemaValidator] metadata.title must be string');
      return false;
    }
    
    // 타임스탬프 범위 검증
    if (metadata.created < 0) {
      console.error('[SchemaValidator] metadata.created must be non-negative');
      return false;
    }
    
    if (metadata.modified < 0) {
      console.error('[SchemaValidator] metadata.modified must be non-negative');
      return false;
    }
    
    // 선택 필드 검증
    if (metadata.author !== undefined && typeof metadata.author !== 'string') {
      console.error('[SchemaValidator] metadata.author must be string');
      return false;
    }
    
    if (metadata.tags !== undefined) {
      if (!Array.isArray(metadata.tags)) {
        console.error('[SchemaValidator] metadata.tags must be array');
        return false;
      }
      
      for (const tag of metadata.tags) {
        if (typeof tag !== 'string') {
          console.error('[SchemaValidator] metadata.tags items must be strings');
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * nodes 검증
   */
  private validateNodes(nodes: any): boolean {
    if (typeof nodes !== 'object' || nodes === null) {
      console.error('[SchemaValidator] nodes must be an object');
      return false;
    }
    
    if (Array.isArray(nodes)) {
      console.error('[SchemaValidator] nodes must be Record, not Array');
      return false;
    }
    
    for (const [key, node] of Object.entries(nodes)) {
      if (!this.validateNode(key, node as any)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 개별 노드 검증
   */
  private validateNode(key: string, node: any): boolean {
    // ID 검증
    if (typeof node.id !== 'string') {
      console.error(`[SchemaValidator] Node ${key}: id must be string`);
      return false;
    }
    
    // Key와 ID 일치 검증
    if (node.id !== key) {
      console.error(`[SchemaValidator] Node ${key}: id mismatch`);
      return false;
    }
    
    // content 검증
    if (typeof node.content !== 'string') {
      console.error(`[SchemaValidator] Node ${key}: content must be string`);
      return false;
    }
    
    // position 검증
    if (!this.validatePosition(node.position)) {
      console.error(`[SchemaValidator] Node ${key}: invalid position`);
      return false;
    }
    
    // 선택 필드: size
    if (node.size !== undefined) {
      if (!this.validateSize(node.size)) {
        console.error(`[SchemaValidator] Node ${key}: invalid size`);
        return false;
      }
    }
    
    // 선택 필드: style (v1에서는 빈 객체만 허용)
    if (node.style !== undefined) {
      if (typeof node.style !== 'object' || node.style === null) {
        console.error(`[SchemaValidator] Node ${key}: style must be object`);
        return false;
      }
      
      if (Object.keys(node.style).length > 0) {
        console.error(`[SchemaValidator] Node ${key}: style must be empty in v1`);
        return false;
      }
    }
    
    // 선택 필드: linkedNote
    if (node.linkedNote !== undefined && typeof node.linkedNote !== 'string') {
      console.error(`[SchemaValidator] Node ${key}: linkedNote must be string`);
      return false;
    }
    
    return true;
  }
  
  /**
   * position 검증
   */
  private validatePosition(position: any): boolean {
    if (typeof position !== 'object' || position === null) {
      return false;
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      return false;
    }
    
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * size 검증
   */
  private validateSize(size: any): boolean {
    if (typeof size !== 'object' || size === null) {
      return false;
    }
    
    if (typeof size.width !== 'number' || typeof size.height !== 'number') {
      return false;
    }
    
    if (size.width <= 0 || size.height <= 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * edges 검증
   */
  private validateEdges(edges: any, nodes: any): boolean {
    if (typeof edges !== 'object' || edges === null) {
      console.error('[SchemaValidator] edges must be an object');
      return false;
    }
    
    if (Array.isArray(edges)) {
      console.error('[SchemaValidator] edges must be Record, not Array');
      return false;
    }
    
    for (const [key, edge] of Object.entries(edges)) {
      if (!this.validateEdge(key, edge as any, nodes)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 개별 엣지 검증
   */
  private validateEdge(key: string, edge: any, nodes: any): boolean {
    // ID 검증
    if (typeof edge.id !== 'string') {
      console.error(`[SchemaValidator] Edge ${key}: id must be string`);
      return false;
    }
    
    // Key와 ID 일치
    if (edge.id !== key) {
      console.error(`[SchemaValidator] Edge ${key}: id mismatch`);
      return false;
    }
    
    // from, to 검증
    if (typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      console.error(`[SchemaValidator] Edge ${key}: from/to must be strings`);
      return false;
    }
    
    // 참조 무결성 (Phase 1에서는 검증만, Sanitation은 Phase 2)
    if (!nodes[edge.from]) {
      console.warn(`[SchemaValidator] Edge ${key}: from node not found (will be sanitized in Phase 2)`);
    }
    
    if (!nodes[edge.to]) {
      console.warn(`[SchemaValidator] Edge ${key}: to node not found (will be sanitized in Phase 2)`);
    }
    
    // type 검증 (선택)
    if (edge.type !== undefined) {
      const validTypes = ['solid', 'dashed', 'dotted'];
      if (!validTypes.includes(edge.type)) {
        console.error(`[SchemaValidator] Edge ${key}: invalid type`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * camera 검증
   */
  private validateCamera(camera: any): boolean {
    if (typeof camera !== 'object' || camera === null) {
      console.error('[SchemaValidator] camera must be an object');
      return false;
    }
    
    if (typeof camera.x !== 'number' || 
        typeof camera.y !== 'number' || 
        typeof camera.zoom !== 'number') {
      console.error('[SchemaValidator] camera x/y/zoom must be numbers');
      return false;
    }
    
    if (!Number.isFinite(camera.x) || 
        !Number.isFinite(camera.y) || 
        !Number.isFinite(camera.zoom)) {
      console.error('[SchemaValidator] camera values must be finite');
      return false;
    }
    
    if (camera.zoom <= 0) {
      console.error('[SchemaValidator] camera.zoom must be positive');
      return false;
    }
    
    return true;
  }
}
```

### 테스트 구현

**src/schema/validator.test.ts**:

```typescript
import { SchemaValidator } from './validator';
import { CURRENT_SCHEMA_VERSION } from './types';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;
  
  beforeEach(() => {
    validator = new SchemaValidator();
  });
  
  // 기본 스키마 템플릿
  const validSchema = {
    schemaVersion: 1,
    metadata: {
      created: 1705555200000,
      modified: 1705555200000,
      title: 'Test Map'
    },
    nodes: {},
    edges: {},
    camera: { x: 0, y: 0, zoom: 1 }
  };
  
  describe('유효한 스키마', () => {
    test('빈 Mind Map 검증 성공', () => {
      expect(validator.validate(validSchema)).toBe(true);
    });
    
    test('노드 있는 Mind Map 검증 성공', () => {
      const schema = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: 0, y: 0 }
          }
        }
      };
      expect(validator.validate(schema)).toBe(true);
    });
    
    test('선택 필드 포함 검증 성공', () => {
      const schema = {
        ...validSchema,
        metadata: {
          ...validSchema.metadata,
          author: 'Test Author',
          tags: ['test', 'mindmap']
        }
      };
      expect(validator.validate(schema)).toBe(true);
    });
  });
  
  describe('schemaVersion 검증', () => {
    test('schemaVersion 없으면 실패', () => {
      const invalid = { ...validSchema };
      delete (invalid as any).schemaVersion;
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('문자열이면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: '1' };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('소수면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: 1.5 };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('0 이하면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: 0 };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('지원하지 않는 버전이면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: 99 };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('metadata 검증', () => {
    test('created 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          modified: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('modified 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('title 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          modified: 1705555200000
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('created 음수면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: -1,
          modified: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('tags가 배열이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          ...validSchema.metadata,
          tags: 'not-an-array'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('nodes 검증', () => {
    test('Array면 실패', () => {
      const invalid = { ...validSchema, nodes: [] };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('노드 ID 불일치 시 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-2',  // 불일치!
            content: 'Test',
            position: { x: 0, y: 0 }
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('position NaN이면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: NaN, y: 0 }
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('style에 값 있으면 실패 (v1)', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: 0, y: 0 },
            style: { color: 'red' }  // v1에서 금지!
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('edges 검증', () => {
    test('Array면 실패', () => {
      const invalid = { ...validSchema, edges: [] };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('type이 허용 범위 밖이면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': { id: 'node-1', content: 'A', position: { x: 0, y: 0 } },
          'node-2': { id: 'node-2', content: 'B', position: { x: 100, y: 0 } }
        },
        edges: {
          'edge-1': {
            id: 'edge-1',
            from: 'node-1',
            to: 'node-2',
            type: 'wavy'  // 허용 안 됨
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('camera 검증', () => {
    test('zoom이 0이면 실패', () => {
      const invalid = {
        ...validSchema,
        camera: { x: 0, y: 0, zoom: 0 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('NaN이면 실패', () => {
      const invalid = {
        ...validSchema,
        camera: { x: NaN, y: 0, zoom: 1 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('sanitize', () => {
    test('유효하면 객체 반환', () => {
      const result = validator.sanitize(validSchema);
      expect(result).not.toBeNull();
      expect(result).toEqual(validSchema);
    });
    
    test('무효하면 null 반환', () => {
      const invalid = { invalid: 'data' };
      const result = validator.sanitize(invalid);
      expect(result).toBeNull();
    });
  });
});
```

### 테스트 실행

```bash
# 테스트 실행
npm test src/schema/validator.test.ts

# 커버리지 확인
npm run test:coverage -- src/schema/validator.test.ts
```

### 검증 포인트

```
[ ] 모든 테스트 통과 (30+ 테스트)
[ ] 커버리지 100%
[ ] console.error 호출 검증
[ ] created/modified 필드명 (NOT createdAt/updatedAt)
[ ] style 빈 객체 검증
[ ] nodes/edges Record 검증 (not Array)
```

### 금지 사항

```
❌ Auto-correction 금지
❌ Silent fallback 금지
❌ Partial success 금지
❌ 추측 기반 복구 금지
```

---

## 3. Disposable Registry 구현 (disposable.ts)

### 파일 위치
```
src/utils/disposable.ts
src/utils/disposable.test.ts
```

### 소요 시간
**1시간** (구현 30분 + 테스트 30분)

### 목적
플러그인 언로드 시 모든 리소스 정리를 위한 Registry

### 구현 내용

**src/utils/disposable.ts**:

```typescript
/**
 * Disposable Interface & Registry
 * 
 * 근거: KK-NeroMind-Architecture-v5.2.0.md Section 17
 * 
 * 목적: onunload 시 모든 리소스 자동 정리
 */

export interface Disposable {
  dispose(): void;
}

/**
 * Disposable Registry
 * 
 * 모든 Disposable 리소스를 추적하고 일괄 정리
 */
export class DisposableRegistry implements Disposable {
  private disposables = new Set<Disposable>();
  
  /**
   * Disposable 등록
   */
  register(disposable: Disposable): void {
    this.disposables.add(disposable);
  }
  
  /**
   * Disposable 등록 해제
   */
  unregister(disposable: Disposable): void {
    this.disposables.delete(disposable);
  }
  
  /**
   * 모든 Disposable 정리
   * 
   * CRITICAL: 하나 실패해도 나머지 계속 진행
   */
  dispose(): void {
    const errors: Error[] = [];
    
    for (const disposable of this.disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('[DisposableRegistry] Dispose failed', error);
        errors.push(error as Error);
      }
    }
    
    this.disposables.clear();
    
    if (errors.length > 0) {
      console.warn(`[DisposableRegistry] ${errors.length} disposables failed to clean up`);
    }
  }
  
  /**
   * 등록된 Disposable 개수
   */
  get count(): number {
    return this.disposables.size;
  }
}
```

### 테스트 구현

**src/utils/disposable.test.ts**:

```typescript
import { Disposable, DisposableRegistry } from './disposable';

describe('DisposableRegistry', () => {
  let registry: DisposableRegistry;
  
  beforeEach(() => {
    registry = new DisposableRegistry();
  });
  
  test('초기 count는 0', () => {
    expect(registry.count).toBe(0);
  });
  
  test('register로 Disposable 추가', () => {
    const disposable: Disposable = {
      dispose: jest.fn()
    };
    
    registry.register(disposable);
    expect(registry.count).toBe(1);
  });
  
  test('unregister로 Disposable 제거', () => {
    const disposable: Disposable = {
      dispose: jest.fn()
    };
    
    registry.register(disposable);
    registry.unregister(disposable);
    expect(registry.count).toBe(0);
  });
  
  test('dispose 호출 시 모든 Disposable.dispose 실행', () => {
    const d1: Disposable = { dispose: jest.fn() };
    const d2: Disposable = { dispose: jest.fn() };
    
    registry.register(d1);
    registry.register(d2);
    registry.dispose();
    
    expect(d1.dispose).toHaveBeenCalled();
    expect(d2.dispose).toHaveBeenCalled();
  });
  
  test('dispose 후 count는 0', () => {
    const disposable: Disposable = {
      dispose: jest.fn()
    };
    
    registry.register(disposable);
    registry.dispose();
    expect(registry.count).toBe(0);
  });
  
  test('하나 실패해도 나머지 계속 진행', () => {
    const d1: Disposable = {
      dispose: jest.fn(() => { throw new Error('Test error'); })
    };
    const d2: Disposable = { dispose: jest.fn() };
    
    registry.register(d1);
    registry.register(d2);
    
    // 에러 throw 안 함
    expect(() => registry.dispose()).not.toThrow();
    
    // d2는 정상 실행됨
    expect(d2.dispose).toHaveBeenCalled();
  });
});
```

### 검증 포인트

```
[ ] 모든 테스트 통과
[ ] 커버리지 100%
[ ] 에러 발생 시 계속 진행 확인
```

---

## 4. Boot Diagnostics 구현 (diagnostic.ts)

### 파일 위치
```
src/utils/diagnostic.ts
src/utils/diagnostic.test.ts
```

### 소요 시간
**1.5시간** (구현 45분 + 테스트 45분)

### 목적
부팅 시 모듈 로드 상태 추적 및 진단

### 구현 내용

**src/utils/diagnostic.ts**:

```typescript
/**
 * Boot Diagnostics
 * 
 * 근거: KK-NeroMind-Architecture-v5.2.0.md Section 3
 * 
 * 목적: 각 모듈 로드 성공/실패 추적
 */

export interface ModuleStatus {
  id: string;
  status: 'success' | 'failed';
  error?: Error;
  timestamp: number;
}

export interface BootResult {
  success: boolean;
  modules: ModuleStatus[];
  failedCount: number;
}

/**
 * Boot Diagnostics Manager
 */
export class BootDiagnostics {
  private modules = new Map<string, ModuleStatus>();
  
  /**
   * 모듈 상태 등록
   */
  register(moduleId: string, status: 'success' | 'failed', error?: Error): void {
    const moduleStatus: ModuleStatus = {
      id: moduleId,
      status,
      error,
      timestamp: Date.now()
    };
    
    this.modules.set(moduleId, moduleStatus);
    
    // 로깅
    if (status === 'success') {
      console.log(`[BootDiagnostics] ${moduleId}: SUCCESS`);
    } else {
      console.error(`[BootDiagnostics] ${moduleId}: FAILED`, error);
    }
  }
  
  /**
   * 전체 모듈 체크
   */
  checkAllModules(): BootResult {
    const modules = Array.from(this.modules.values());
    const failedModules = modules.filter(m => m.status === 'failed');
    
    return {
      success: failedModules.length === 0,
      modules,
      failedCount: failedModules.length
    };
  }
  
  /**
   * 특정 모듈 상태 조회
   */
  getModuleStatus(moduleId: string): ModuleStatus | undefined {
    return this.modules.get(moduleId);
  }
  
  /**
   * 등록된 모듈 수
   */
  get moduleCount(): number {
    return this.modules.size;
  }
}
```

### 테스트 구현

**src/utils/diagnostic.test.ts**:

```typescript
import { BootDiagnostics } from './diagnostic';

describe('BootDiagnostics', () => {
  let diagnostics: BootDiagnostics;
  
  beforeEach(() => {
    diagnostics = new BootDiagnostics();
  });
  
  test('초기 moduleCount는 0', () => {
    expect(diagnostics.moduleCount).toBe(0);
  });
  
  test('성공 모듈 등록', () => {
    diagnostics.register('test-module', 'success');
    
    const status = diagnostics.getModuleStatus('test-module');
    expect(status).toBeDefined();
    expect(status?.status).toBe('success');
  });
  
  test('실패 모듈 등록 with error', () => {
    const error = new Error('Test error');
    diagnostics.register('failing-module', 'failed', error);
    
    const status = diagnostics.getModuleStatus('failing-module');
    expect(status?.status).toBe('failed');
    expect(status?.error).toBe(error);
  });
  
  test('모든 모듈 성공 시 checkAllModules 성공', () => {
    diagnostics.register('module-1', 'success');
    diagnostics.register('module-2', 'success');
    
    const result = diagnostics.checkAllModules();
    expect(result.success).toBe(true);
    expect(result.failedCount).toBe(0);
  });
  
  test('하나라도 실패 시 checkAllModules 실패', () => {
    diagnostics.register('module-1', 'success');
    diagnostics.register('module-2', 'failed', new Error('Test'));
    
    const result = diagnostics.checkAllModules();
    expect(result.success).toBe(false);
    expect(result.failedCount).toBe(1);
  });
  
  test('timestamp 기록 확인', () => {
    const before = Date.now();
    diagnostics.register('test', 'success');
    const after = Date.now();
    
    const status = diagnostics.getModuleStatus('test');
    expect(status?.timestamp).toBeGreaterThanOrEqual(before);
    expect(status?.timestamp).toBeLessThanOrEqual(after);
  });
});
```

### 검증 포인트

```
[ ] 모든 테스트 통과
[ ] 커버리지 100%
[ ] console.log/error 호출 확인
```

---

## 5. Plugin Entry Point 구현 (main.ts)

### 파일 위치
```
src/main.ts
```

### 소요 시간
**1시간**

### 목적
Obsidian 플러그인 진입점 및 Command 등록

### 구현 내용

**src/main.ts**:

```typescript
import { Plugin } from 'obsidian';
import { SchemaValidator } from './schema/validator';
import { DisposableRegistry } from './utils/disposable';
import { BootDiagnostics } from './utils/diagnostic';
import { CURRENT_SCHEMA_VERSION } from './schema/types';

/**
 * KK-NeroMind Plugin
 * 
 * Phase 1: Zero-to-One
 * - Plugin loads in Obsidian
 * - Command appears in palette
 * - .kknm file creation works
 */
export default class KKNeroMindPlugin extends Plugin {
  private bootDiagnostics!: BootDiagnostics;
  private disposableRegistry!: DisposableRegistry;
  private schemaValidator!: SchemaValidator;
  
  async onload(): Promise<void> {
    console.log('[KK-NeroMind] Plugin loading...');
    
    // 1. Initialize diagnostics
    this.bootDiagnostics = new BootDiagnostics();
    this.disposableRegistry = new DisposableRegistry();
    
    // 2. Initialize core modules
    try {
      this.initializeCore();
      this.bootDiagnostics.register('core-init', 'success');
    } catch (error) {
      this.bootDiagnostics.register('core-init', 'failed', error as Error);
      this.enterSafeMode();
      return;
    }
    
    // 3. Register commands
    try {
      this.registerCommands();
      this.bootDiagnostics.register('commands', 'success');
    } catch (error) {
      this.bootDiagnostics.register('commands', 'failed', error as Error);
      this.enterSafeMode();
      return;
    }
    
    // 4. Register file extensions
    try {
      this.registerExtensions(['kknm']);
      this.bootDiagnostics.register('extensions', 'success');
    } catch (error) {
      this.bootDiagnostics.register('extensions', 'failed', error as Error);
      this.enterSafeMode();
      return;
    }
    
    // 5. Boot diagnostic check
    const bootResult = this.bootDiagnostics.checkAllModules();
    if (!bootResult.success) {
      console.error('[KK-NeroMind] Boot failed', bootResult);
      this.enterSafeMode();
      return;
    }
    
    console.log('[KK-NeroMind] Plugin loaded successfully');
  }
  
  /**
   * Initialize core modules
   */
  private initializeCore(): void {
    this.schemaValidator = new SchemaValidator();
    console.log('[KK-NeroMind] Core modules initialized');
  }
  
  /**
   * Register commands
   */
  private registerCommands(): void {
    this.addCommand({
      id: 'create-new-mindmap',
      name: 'Create New Mind Map',
      callback: () => this.createNewMindMap()
    });
    
    console.log('[KK-NeroMind] Commands registered');
  }
  
  /**
   * Create new mind map file
   */
  private async createNewMindMap(): Promise<void> {
    try {
      const initialData = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        metadata: {
          created: Date.now(),
          modified: Date.now(),
          title: 'New Mind Map'
        },
        nodes: {},
        edges: {},
        camera: { x: 0, y: 0, zoom: 1.0 }
      };
      
      // Validate before creating
      if (!this.schemaValidator.validate(initialData)) {
        console.error('[KK-NeroMind] Invalid initial data');
        return;
      }
      
      const content = JSON.stringify(initialData, null, 2);
      const filename = `MindMap-${Date.now()}.kknm`;
      
      await this.app.vault.create(filename, content);
      console.log(`[KK-NeroMind] Created: ${filename}`);
      
    } catch (error) {
      console.error('[KK-NeroMind] Failed to create mind map', error);
    }
  }
  
  /**
   * Enter safe mode (Phase 1에서는 로그만)
   */
  private enterSafeMode(): void {
    console.error('[KK-NeroMind] Entering safe mode - plugin disabled');
    // Phase 2+: Conflict Lock 처리
  }
  
  async onunload(): Promise<void> {
    console.log('[KK-NeroMind] Plugin unloading...');
    this.disposableRegistry.dispose();
    console.log('[KK-NeroMind] Plugin unloaded');
  }
}
```

### 검증 포인트

```
[ ] npm run build 성공
[ ] console.log 메시지 확인
[ ] Command 등록 확인
[ ] .kknm 파일 생성 확인
```

---

## 📂 Part II: 테스트 및 검증

---

## 6. Jest 유닛 테스트

### 테스트 파일 (3개)

```
src/schema/validator.test.ts    (30+ 테스트)
src/utils/disposable.test.ts    (6+ 테스트)
src/utils/diagnostic.test.ts    (6+ 테스트)
```

### 테스트 실행

```bash
# 전체 테스트
npm test

# 특정 파일
npm test validator.test.ts

# Watch 모드
npm test -- --watch

# 커버리지
npm run test:coverage
```

### 커버리지 목표

```
Overall:     50%+ ✅
validator:   100% ✅
disposable:  100% ✅
diagnostic:  100% ✅
```

### 테스트 통과 기준

```
✅ 모든 테스트 PASS
✅ 0 failed
✅ 커버리지 50% 이상
```

---

## 7. Obsidian 수동 테스트

### Zero-to-One Checklist

**Phase 1 완료를 위한 필수 체크리스트**:

```
빌드 테스트:
[ ] npm run build 에러 없이 완료
[ ] main.js 파일 생성됨 (확인: ls main.js)
[ ] manifest.json 유효함

Obsidian 로드 테스트:
[ ] Obsidian 설정 > Community plugins에서 활성화 가능
[ ] 활성화 시 에러 없음
[ ] 개발자 콘솔에 "[KK-NeroMind] Plugin loaded successfully" 표시

Command 테스트:
[ ] Ctrl+P (Command Palette) 열기
[ ] "KK-NeroMind" 검색
[ ] "Create New Mind Map" 명령 표시됨

파일 생성 테스트:
[ ] "Create New Mind Map" 실행
[ ] File Explorer에 .kknm 파일 생성 확인
[ ] 파일명 형식: MindMap-[timestamp].kknm
[ ] 파일 클릭 시 JSON 내용 표시

파일 내용 검증:
[ ] schemaVersion: 1
[ ] metadata.created 존재
[ ] metadata.modified 존재
[ ] metadata.title: "New Mind Map"
[ ] nodes: {}
[ ] edges: {}
[ ] camera: {x:0, y:0, zoom:1}

재오픈 테스트:
[ ] Obsidian 재시작
[ ] .kknm 파일 다시 열기
[ ] 에러 없음

콘솔 테스트:
[ ] 개발자 콘솔 (Ctrl+Shift+I) 열기
[ ] 빨간색 에러 없음
[ ] 다음 로그 확인:
    - [KK-NeroMind] Plugin loading...
    - [BootDiagnostics] core-init: SUCCESS
    - [BootDiagnostics] commands: SUCCESS
    - [BootDiagnostics] extensions: SUCCESS
    - [KK-NeroMind] Plugin loaded successfully
```

### 수동 테스트 절차

**Step 1: 빌드**
```bash
npm run build
ls -la main.js  # 파일 존재 확인
```

**Step 2: Obsidian 설치**
```bash
# 플러그인 폴더로 복사
cp -r . /path/to/vault/.obsidian/plugins/kk-neromind/

# 또는 심볼릭 링크
ln -s $(pwd) /path/to/vault/.obsidian/plugins/kk-neromind
```

**Step 3: 활성화**
1. Obsidian 열기
2. Settings (⚙️) → Community plugins
3. Installed plugins에서 "KK-NeroMind" 찾기
4. Toggle 켜기

**Step 4: 개발자 콘솔 확인**
1. Ctrl+Shift+I (Windows/Linux) 또는 Cmd+Option+I (Mac)
2. Console 탭 선택
3. "[KK-NeroMind] Plugin loaded successfully" 확인

**Step 5: Command 테스트**
1. Ctrl+P (Command Palette)
2. "KK-NeroMind" 입력
3. "Create New Mind Map" 선택
4. File Explorer에서 생성된 파일 확인

**Step 6: 파일 내용 검증**
1. 생성된 .kknm 파일 클릭
2. JSON 형식 확인
3. 필수 필드 존재 확인

---

## 8. Phase Gate 체크리스트

### Phase 1 완료 기준

**모든 항목을 체크해야 Phase 2로 진행 가능**:

```
코드 품질:
[ ] npm run build 성공 (에러 0개)
[ ] npm test 전체 통과 (실패 0개)
[ ] npm run test:coverage 50% 이상
[ ] ESLint 에러 없음
[ ] TypeScript 컴파일 에러 없음

파일 구조:
[ ] src/schema/types.ts 작성 완료
[ ] src/schema/validator.ts 작성 완료
[ ] src/schema/validator.test.ts 작성 완료
[ ] src/utils/disposable.ts 작성 완료
[ ] src/utils/disposable.test.ts 작성 완료
[ ] src/utils/diagnostic.ts 작성 완료
[ ] src/utils/diagnostic.test.ts 작성 완료
[ ] src/main.ts 작성 완료

기능 동작:
[ ] Obsidian에서 플러그인 로드 성공
[ ] Command Palette에 명령 표시
[ ] .kknm 파일 생성 가능
[ ] 파일 재오픈 시 에러 없음

검증 확인:
[ ] SchemaValidator 모든 필드 검증 구현
[ ] metadata.created/modified 검증 (NOT createdAt/updatedAt)
[ ] nodes/edges Record 검증 (NOT Array)
[ ] style 빈 객체 검증

테스트 확인:
[ ] validator.test.ts 30+ 테스트 통과
[ ] disposable.test.ts 6+ 테스트 통과
[ ] diagnostic.test.ts 6+ 테스트 통과
[ ] 커버리지 validator: 100%
[ ] 커버리지 disposable: 100%
[ ] 커버리지 diagnostic: 100%

Obsidian 테스트:
[ ] Zero-to-One Checklist 전체 통과
[ ] 개발자 콘솔 에러 없음
[ ] 로그 메시지 정상 출력

문서 확인:
[ ] README.md 업데이트 (Phase 1 완료 표시)
[ ] CHANGELOG.md 작성 (Phase 1 내용)
```

### Git 커밋

```bash
# Phase 1 완료 커밋
git add .
git commit -m "[Phase 1] Zero-to-One complete

- Schema types implemented
- SchemaValidator with 100% coverage
- Disposable Registry
- Boot Diagnostics
- Plugin loads in Obsidian
- .kknm file creation works

Phase Gate: ✅ PASSED
Test Coverage: 50%+
Manual Test: ✅ PASSED"

git tag phase-1-complete
```

---

## 📂 Part III: 제약사항 및 가이드

---

## 9. 금지 사항 (Forbidden)

### AI Implementation Constraints

**Phase 1에서 절대 하지 말아야 할 것**:

```
❌ DO NOT:
1. Command 시스템 구현 (Phase 3)
2. TextFileView 구현 (Phase 2)
3. UI 렌더링 (Phase 4)
4. Layout Engine (Phase 6)
5. Full Note 연동 (Phase 7)
6. Auto-correction (자동 수정)
7. Partial success states (부분 성공)
8. Schema 필드 추론 (infer missing fields)
9. nodes/edges를 Array로 변경
10. metadata 필드명 변경 (createdAt/updatedAt 금지)
```

### Schema 제약

```
❌ 금지:
- createdAt, updatedAt 사용
- createdWith 필드 추가
- _reserved 필드 추가 (v1)
- nodes/edges를 Array로 구현
- NodeStyle에 속성 추가
- 정의되지 않은 필드 추가

✅ 필수:
- created, modified 사용
- nodes/edges는 Record
- NodeStyle은 빈 객체
- Schema v5.2.1 정확히 따름
```

### 코딩 제약

```
❌ 금지:
- 빈 함수 (empty body)
- TODO 주석으로 구현 대체
- console.log 프로덕션 코드
- try-catch로 에러 삼키기

✅ 필수:
- 모든 함수 구현 완료
- console.error로 에러 기록
- Fail Loudly 원칙 준수
- 테스트 작성 필수
```

---

## 10. 트러블슈팅

### 문제: npm run build 실패

**증상**:
```
Error: Cannot find module '@types/node'
```

**해결**:
```bash
npm install --save-dev @types/node
```

---

### 문제: Obsidian에서 플러그인 활성화 실패

**증상**:
- Toggle 켜도 바로 꺼짐
- 에러 메시지 없음

**확인 사항**:
1. manifest.json 유효한지 확인
2. main.js 존재하는지 확인
3. 개발자 콘솔에서 에러 확인

**해결**:
```bash
# manifest.json 검증
cat manifest.json

# 필수 필드 확인:
# - id
# - name
# - version
# - minAppVersion
# - description
```

---

### 문제: Command가 표시 안 됨

**증상**:
- Command Palette에 "KK-NeroMind" 없음

**확인 사항**:
1. `this.addCommand()` 호출 확인
2. onload() 완료 확인
3. console.log 출력 확인

**해결**:
```typescript
// main.ts에서 확인
private registerCommands(): void {
  console.log('[DEBUG] Registering commands...');
  this.addCommand({
    id: 'create-new-mindmap',
    name: 'Create New Mind Map',
    callback: () => this.createNewMindMap()
  });
  console.log('[DEBUG] Commands registered');
}
```

---

### 문제: 테스트 실패

**증상**:
```
FAIL src/schema/validator.test.ts
  ● validates metadata › created 누락 시 실패
    expect(received).toBe(expected)
    Expected: false
    Received: true
```

**원인**:
- validateMetadata에서 created 검증 누락

**해결**:
```typescript
// validator.ts 확인
private validateMetadata(metadata: any): boolean {
  // ✅ 이 부분 반드시 있어야 함
  if (typeof metadata.created !== 'number') {
    console.error('[SchemaValidator] metadata.created must be number');
    return false;
  }
  // ...
}
```

---

### 문제: 커버리지 50% 미달

**증상**:
```
All files      |   45.23 |
```

**원인**:
- main.ts 테스트 없음

**Phase 1 대응**:
- validator, disposable, diagnostic만 100% 달성
- main.ts는 Phase 2에서 통합 테스트 작성
- 전체 50%는 충분

---

## 11. 참고 문서

### 필수 참고 문서

| 문서 | 섹션 | 내용 |
|------|------|------|
| Architecture v5.2.0 | Section 10 | AI Implementation Constraints |
| Architecture v5.2.0 | Section 16 | Fail Loudly |
| Architecture v5.2.0 | Section 17 | Disposable Registry |
| Roadmap v5.2.0 | Phase 1 | 구현 계획 |
| Schema v5.2.1 | Section 1-6 | 스키마 정의 |
| Schema v5.2.1 | Section 7 | SchemaValidator 요구사항 |
| Coding Guidelines v5.2.1 | validateMetadata | 올바른 구현 예시 |
| Test Specification v5.2.0 | TC-VAL-021~026 | metadata 테스트 |

### 문서 읽기 순서

**구현 전 (필수)**:
1. Architecture v5.2.0 Section 10, 16, 17
2. Schema v5.2.1 Section 1-7
3. Roadmap v5.2.0 Phase 1

**구현 중 (참고)**:
4. Coding Guidelines v5.2.1 (validator 부분)
5. Test Specification v5.2.0 (테스트 케이스)

---

## 📝 부록

### A. 최종 체크리스트 요약

```
구현 파일 (5개):
[ ] src/schema/types.ts
[ ] src/schema/validator.ts
[ ] src/utils/disposable.ts
[ ] src/utils/diagnostic.ts
[ ] src/main.ts

테스트 파일 (3개):
[ ] src/schema/validator.test.ts
[ ] src/utils/disposable.test.ts
[ ] src/utils/diagnostic.test.ts

빌드 & 테스트:
[ ] npm run build 성공
[ ] npm test 전체 통과
[ ] npm run test:coverage 50%+

Obsidian 테스트:
[ ] 플러그인 로드 성공
[ ] Command 표시
[ ] .kknm 파일 생성
[ ] Zero-to-One Checklist 통과

Phase Gate:
[ ] 8개 조건 모두 만족
[ ] Git 커밋 완료
```

### B. 예상 산출물

**파일 개수**: 8개
**코드 라인**: ~800줄
**테스트 케이스**: 40+개
**커버리지**: 50%+

---

## 🎉 Phase 1 완료 후

Phase 1 완료 시:
1. Git tag 생성: `phase-1-complete`
2. README.md 업데이트
3. Phase 2 Instructions 읽기 시작
4. 1-2일 휴식 (선택) 😊

**축하합니다! Zero-to-One을 달성했습니다! 🚀**

---

**문서 끝**

<!-- 
Phase 1 Instructions v5.2.0
작성: 2026-01-19
근거: Roadmap v5.2.0, Architecture v5.2.0, Schema v5.2.1
-->
