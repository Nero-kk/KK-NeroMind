# KK-NeroMind Schema v5.2.1

> **버전**: 5.2.1  
> **최종 수정**: 2026-01-18  
> **상위 문서**: KK-NeroMind-Architecture-v5.2.0.md  
> **문서 지위**: .kknm 파일 포맷 공식 명세서 (Canonical Specification)

---

## 📋 문서 개요

### 목적

본 문서는 **KK-NeroMind 플러그인의 전용 파일 포맷 `.kknm`의 공식 명세서**다.

- 모든 읽기/쓰기/검증/마이그레이션 로직의 단일 진실의 원천
- SchemaValidator의 검증 기준
- 파일 호환성 판단의 유일한 근거

### 문서 권위

```
Architecture v5.2.0 (헌법)
  ↓
Roadmap v5.2.0 (MindMapSchema 정의)
  ↓
Schema v5.2.1 (본 문서 - .kknm 파일 형식)
  ↓
구현 코드 (SchemaValidator, FileService)
```

**이 문서에 정의되지 않은 필드나 구조는 존재할 수 없다.**

---

## 🎯 핵심 원칙

### 1. Single Source of Truth

```
.kknm 파일 자체가 유일한 진실의 원천이다.
메모리 상태, UI 상태, 임시 데이터는 파일보다 권위가 낮다.
```

### 2. Schema is Law

```
본 스키마에 정의되지 않은 데이터는 추측·보정·복구하지 않는다.
정의되지 않은 필드는 즉시 검증 실패를 유발한다.
```

### 3. Fail Loudly

```
규격 위반 데이터는 즉시 거부한다.
침묵 실패(Silent Corruption)는 허용되지 않는다.
검증 실패 시 3단계 프로세스 필수:
  1. Notice 표시 (사용자 알림)
  2. console.error 기록
  3. 로그 노트 기록 (/KK-NeroMind/02_Diagnostic_Log.md)
```

### 4. Schema Changes Require Version Increment

```
스키마 변경은 반드시 새로운 버전(v2, v3...)으로만 이루어진다.
v1 스키마는 불변이며, 하위 호환 유지를 위해 영구 보존된다.
```

---

## Part I: 스키마 구조

---

## 1. 전체 구조 (MindMapSchema)

### 1.1 TypeScript 인터페이스

```typescript
export interface MindMapSchema {
  schemaVersion: number;
  metadata: MindMapMetadata;
  nodes: Record<string, MindMapNode>;
  edges: Record<string, MindMapEdge>;
  camera: CameraState;
}

export const CURRENT_SCHEMA_VERSION = 1;
```

### 1.2 JSON 예시

```json
{
  "schemaVersion": 1,
  "metadata": {
    "created": 1705555200000,
    "modified": 1705555200000,
    "title": "My Mind Map"
  },
  "nodes": {
    "node-abc123": {
      "id": "node-abc123",
      "content": "Root Node",
      "position": { "x": 0, "y": 0 }
    },
    "node-def456": {
      "id": "node-def456",
      "content": "Child Node",
      "position": { "x": 300, "y": 100 }
    }
  },
  "edges": {
    "edge-xyz789": {
      "id": "edge-xyz789",
      "from": "node-abc123",
      "to": "node-def456"
    }
  },
  "camera": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  }
}
```

---

## 2. schemaVersion (필수)

### 2.1 타입 정의

```typescript
schemaVersion: number
```

### 2.2 허용 값

```
v1 스키마: schemaVersion = 1 (정수만 허용)
```

### 2.3 검증 규칙

| 조건 | 검증 결과 | 조치 |
|------|-----------|------|
| 필드 누락 | ❌ FAIL | 즉시 거부 |
| 타입이 number가 아님 | ❌ FAIL | 즉시 거부 |
| 소수점 포함 (1.5, 2.0) | ❌ FAIL | 정수만 허용 |
| 0 이하 | ❌ FAIL | 양의 정수만 |
| schemaVersion > 1 | ⚠️ WARNING | Section 2.4 참조 |
| schemaVersion = 1 | ✅ PASS | 정상 로드 |

### 2.4 schemaVersion > CURRENT_SCHEMA_VERSION 처리 ⭐ v5.2.1 신규

**상황**: 플러그인이 지원하지 않는 상위 버전의 파일

**처리 절차**:

```typescript
function validateSchemaVersion(data: unknown): boolean {
  const version = data.schemaVersion;
  
  if (version > CURRENT_SCHEMA_VERSION) {
    // 1. Migration 가능 여부 확인
    if (!MigrationManager.canMigrate(version)) {
      
      // 2. Notice 표시 (사용자에게 알림)
      new Notice(
        `This file requires a newer plugin version.\n\n` +
        `File schema version: ${version}\n` +
        `Current plugin version: ${CURRENT_SCHEMA_VERSION}\n\n` +
        `Please update the KK-NeroMind plugin.\n` +
        `Your file is safe and has not been modified.`,
        0  // 사용자가 수동으로 닫을 때까지 표시
      );
      
      // 3. console.error 기록
      console.error(
        `[SchemaValidator] Unsupported schema version.\n` +
        `File version: ${version}\n` +
        `Supported version: ${CURRENT_SCHEMA_VERSION}\n` +
        `Migration unavailable.`
      );
      
      // 4. 로그 노트 기록
      await this.logToFile({
        level: 'ERROR',
        category: 'SchemaValidator',
        message: `Unsupported schema version ${version}`,
        details: {
          fileVersion: version,
          supportedVersion: CURRENT_SCHEMA_VERSION,
          timestamp: Date.now()
        }
      });
      
      // 5. 파일 로드 거부
      return false;
    }
    
    // Migration 가능하면 진행
    return MigrationManager.migrate(data);
  }
  
  return true;
}
```

**사용자 안내 원칙**:
- 명확한 문제 설명
- 구체적인 버전 정보 제공
- 해결 방법 제시 (플러그인 업데이트)
- 데이터 안전 보장 명시

---

### 2.5 Migration Authority

```
schemaVersion은 마이그레이션 판단의 유일한 기준이다.

- schemaVersion이 플러그인 지원 버전보다 높을 경우,
  Migration Layer가 개입하기 전까지 파일을 절대 메모리에 적재하지 않는다.
- 마이그레이션은 하위 → 상위로만 수행되며, 역방향 호환은 보장하지 않는다.
```

---

## 3. metadata (필수)

### 3.1 타입 정의

```typescript
export interface MindMapMetadata {
  created: number;      // Unix timestamp (milliseconds)
  modified: number;     // Unix timestamp (milliseconds)
  title: string;        // 마인드맵 제목
  author?: string;      // 작성자 (선택)
  tags?: string[];      // 태그 배열 (선택)
}
```

### 3.2 필수 필드

| 필드 | 타입 | 검증 규칙 |
|------|------|-----------|
| created | number | Unix timestamp, 0 이상, 정수 |
| modified | number | Unix timestamp, 0 이상, 정수 |
| title | string | 빈 문자열 허용, 최대 길이 제한 없음 |

### 3.3 선택 필드

| 필드 | 타입 | 검증 규칙 |
|------|------|-----------|
| author | string | 있으면 문자열, 없어도 됨 |
| tags | string[] | 있으면 배열, 없어도 됨 |

### 3.4 검증 예시

```typescript
// ✅ 유효한 metadata
{
  "created": 1705555200000,
  "modified": 1705555300000,
  "title": "Project Ideas"
}

// ✅ 선택 필드 포함
{
  "created": 1705555200000,
  "modified": 1705555300000,
  "title": "Project Ideas",
  "author": "Nero-kk",
  "tags": ["work", "ideas"]
}

// ❌ created 누락
{
  "modified": 1705555200000,
  "title": "Invalid"
}

// ❌ created가 음수
{
  "created": -1000,
  "modified": 1705555200000,
  "title": "Invalid"
}

// ❌ tags가 배열이 아님
{
  "created": 1705555200000,
  "modified": 1705555200000,
  "title": "Invalid",
  "tags": "tag1,tag2"  // 문자열
}
```

### 3.5 modified 타임스탬프 규칙 ⭐ v5.2.1 강화

**갱신 조건** (엄격 적용):

```
modified는 serialize()가 성공적으로 완료된 경우에만 갱신된다.
"성공"의 정의: 파일이 디스크에 영구 저장되고 검증이 완료된 시점.
```

**갱신하는 경우**:
- ✅ Command 실행으로 nodes/edges 변경
- ✅ 파일 저장 성공 (Atomic Write 완료)
- ✅ 모든 검증 통과

**갱신하지 않는 경우**:
- ❌ UI 상태만 변경 (camera 이동, 선택 변경)
- ❌ serialize() 호출했지만 JSON 직렬화 실패
- ❌ 파일 쓰기 실패 (I/O 에러)
- ❌ Conflict Lock 상태
- ❌ SchemaValidator 검증 실패
- ❌ Atomic Write 실패 (임시 파일 → 실제 파일 교체 실패)
- ❌ 쓰기 검증 실패 (written !== data)

**구현 예시**:

```typescript
async function saveFile(data: MindMapSchema): Promise<void> {
  try {
    // 1. Atomic Write (Section 12 참조)
    await atomicWrite(file, data);
    
    // 2. 저장 성공 후에만 modified 갱신
    data.metadata.modified = Date.now();
    
  } catch (error) {
    // 저장 실패 시 modified 유지
    console.error('[FileService] Save failed, modified not updated', error);
    throw error;
  }
}
```

**중요**: modified 갱신 실패는 저장 전체를 실패로 간주한다. 부분 저장 (파일은 쓰였지만 modified 미갱신) 금지.

---

## 4. nodes (필수)

### 4.1 타입 정의

```typescript
nodes: Record<string, MindMapNode>

export interface MindMapNode {
  id: string;
  content: string;
  position: Position;
  size?: Size;
  style?: NodeStyle;
  linkedNote?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NodeStyle {
  // v1에서는 빈 객체만 허용
}
```

### 4.2 데이터 구조

```
nodes는 Record<string, MindMapNode> 타입이다.
- Key: 노드 ID (문자열)
- Value: MindMapNode 객체
```

**중요**: Array가 아닌 Object(Record)를 사용하는 이유:
1. O(1) 노드 조회 (빠른 접근)
2. ID 중복 자동 방지
3. Command 실행 시 성능 최적화

### 4.3 필수 필드

| 필드 | 타입 | 검증 규칙 |
|------|------|-----------|
| id | string | 빈 문자열 ❌, Key와 일치 필수 |
| content | string | 빈 문자열 ✅ |
| position | Position | x, y 모두 number, NaN ❌ |

### 4.4 선택 필드

| 필드 | 타입 | 검증 규칙 |
|------|------|-----------|
| size | Size | width, height 모두 양수 |
| style | NodeStyle | v1에서는 빈 객체 {} 만 허용 |
| linkedNote | string | Full Note 연결 경로 |

### 4.5 ID 일치 규칙

```typescript
// ✅ 유효: Key와 id가 일치
{
  "nodes": {
    "node-123": {
      "id": "node-123",
      "content": "Test"
    }
  }
}

// ❌ 무효: Key와 id 불일치
{
  "nodes": {
    "node-123": {
      "id": "node-456",  // 불일치!
      "content": "Test"
    }
  }
}
```

### 4.6 style 객체 엄격 제한 ⭐ v5.2.1 강화

**v1 규칙** (현재):

```
style 객체는 v1에서 반드시 빈 객체 {} 여야 한다.

- style 객체에 단 하나의 키-값 쌍이라도 존재할 경우,
  Validator는 이를 Critical Error로 간주하고 즉시 로드를 중단한다.
- 자동 보정 금지. 자동 삭제 금지. 즉시 중단.
```

**이유**: 전역 테마나 공통 스타일은 파일 데이터에 저장하지 않음.

**v2 이후 확장 규칙** (미래 대비):

```
- style 확장은 schemaVersion 증가를 통해서만 허용된다.
- v1 파일에 style 속성 추가 → schemaVersion을 v2로 증가 필수.
- Migration 없이 v1 파일에 style 속성 추가 금지.
```

**Feature Detection 금지** (중요):

```
style의 키 존재 여부를 기능 감지 기준으로 사용해서는 안 된다.
모든 style 속성은 명시적 schemaVersion 검증 후 사용해야 한다.
```

**잘못된 구현 예시** (금지):

```typescript
// ❌ 금지: Feature Detection
if (node.style.color) {
  applyColor(node.style.color);
}

// ❌ 금지: 키 존재 확인으로 기능 분기
if ('backgroundColor' in node.style) {
  applyBackground(node.style.backgroundColor);
}

// ✅ 올바른 구현: schemaVersion 검증 필수
if (schemaVersion >= 2 && node.style.color) {
  applyColor(node.style.color);
}
```

**검증 로직**:

```typescript
function validateNodeStyle(style: unknown, schemaVersion: number): boolean {
  if (schemaVersion === 1) {
    // v1: 빈 객체만 허용
    if (Object.keys(style).length > 0) {
      console.error('[Validator] style must be empty in v1. Fail Loudly.');
      return false;
    }
  }
  // v2 이후: 별도 검증 로직
  return true;
}
```

### 4.7 검증 예시

```json
// ✅ 최소 노드
{
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Root",
      "position": { "x": 0, "y": 0 }
    }
  }
}

// ✅ 모든 선택 필드 포함
{
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Root",
      "position": { "x": 0, "y": 0 },
      "size": { "width": 200, "height": 100 },
      "style": {},
      "linkedNote": "notes/idea.md"
    }
  }
}

// ❌ position 누락
{
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Invalid"
    }
  }
}

// ❌ position.x가 NaN
{
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Invalid",
      "position": { "x": NaN, "y": 0 }
    }
  }
}

// ❌ size.width가 음수
{
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Invalid",
      "position": { "x": 0, "y": 0 },
      "size": { "width": -100, "height": 50 }
    }
  }
}

// ❌ style 객체에 값 포함
{
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Invalid",
      "position": { "x": 0, "y": 0 },
      "style": { "color": "red" }  // 금지!
    }
  }
}
```

---

## 5. edges (필수)

### 5.1 타입 정의

```typescript
edges: Record<string, MindMapEdge>

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
  type?: 'solid' | 'dashed' | 'dotted';
}
```

### 5.2 데이터 구조

```
edges는 Record<string, MindMapEdge> 타입이다.
- Key: 엣지 ID (문자열)
- Value: MindMapEdge 객체
```

### 5.3 필수 필드

| 필드 | 타입 | 검증 규칙 |
|------|------|-----------|
| id | string | 빈 문자열 ❌, Key와 일치 필수 |
| from | string | nodes에 존재하는 노드 ID |
| to | string | nodes에 존재하는 노드 ID |

### 5.4 선택 필드

| 필드 | 타입 | 허용 값 |
|------|------|---------|
| type | string | 'solid', 'dashed', 'dotted' 만 |

### 5.5 Reference Integrity (참조 무결성) ⭐ v5.2.1 강화

**책임 분리** (명확화):

#### SchemaValidator 책임 (구조 검증)

**검증 대상**:
- Edge 타입 검증 (id, from, to가 string인지)
- 필수 필드 존재 여부 (id, from, to)
- type enum 값 검증 ('solid', 'dashed', 'dotted')
- Key와 id 일치 여부

**검증 실패 시**: 파일 로드 거부 (Fail Loudly)

```typescript
function validateEdgeStructure(edge: unknown): boolean {
  // 타입 검증
  if (typeof edge.id !== 'string') return false;
  if (typeof edge.from !== 'string') return false;
  if (typeof edge.to !== 'string') return false;
  
  // enum 검증
  if (edge.type && !['solid', 'dashed', 'dotted'].includes(edge.type)) {
    return false;
  }
  
  return true;
}
```

#### Sanitizer 책임 (무결성 회복)

**처리 대상**:
- from/to가 nodes에 존재하는지 확인
- 존재하지 않는 노드를 참조하는 Edge 삭제
- Sanitation 로그 기록

**Sanitation 실행 시**: 파일 로드 계속, Edge만 제거

```typescript
function sanitizeEdges(edges: Record<string, MindMapEdge>, nodes: Record<string, MindMapNode>) {
  const sanitized = { ...edges };
  const removedEdges: string[] = [];
  
  for (const [edgeId, edge] of Object.entries(edges)) {
    // 참조 무결성 검사
    if (!nodes[edge.from] || !nodes[edge.to]) {
      delete sanitized[edgeId];
      removedEdges.push(edgeId);
    }
  }
  
  // 로그 기록
  if (removedEdges.length > 0) {
    console.warn(`[Sanitizer] Removed ${removedEdges.length} edges with invalid references`);
    this.logSanitation({
      triggeredBy: 'file-load',
      removedEdges,
      timestamp: Date.now()
    });
  }
  
  return sanitized;
}
```

**원칙**:

```
Edges는 Nodes로부터 파생되는 데이터다.

- from 또는 to가 nodes에 존재하지 않을 경우,
  해당 Edge는 deserialize() 단계에서 즉시 영구 삭제(Drop)된다.
- 삭제된 Edge는 Sanitation 로그에 기록된다.
- 삭제된 Edge는 엔진에 의해 자동 복구되지 않는다.
- Edge의 복구는 오직 사용자의 명시적 Command로만 수행된다.
```

**Sanitation ≠ Data Loss**  
이는 데이터 손실이 아니라 무결성 회복 과정으로 간주한다.

**예시**:

```typescript
// ❌ SchemaValidator FAIL (구조 오류)
{
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": 123,  // 타입 오류: number
      "to": "node-2"
    }
  }
}
// → 파일 로드 거부, Fail Loudly

// ✅ SchemaValidator PASS → ⚠️ Sanitizer DROP
{
  "nodes": {
    "node-2": { "id": "node-2", "content": "B", "position": { "x": 0, "y": 0 } }
  },
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": "node-1",  // 구조는 OK, 하지만 node-1 없음
      "to": "node-2"
    }
  }
}
// → 파일 로드 성공, edge-1 삭제, 로그 기록
```

### 5.6 검증 예시

```json
// ✅ 유효한 엣지
{
  "nodes": {
    "node-1": { "id": "node-1", "content": "A", "position": { "x": 0, "y": 0 } },
    "node-2": { "id": "node-2", "content": "B", "position": { "x": 100, "y": 0 } }
  },
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": "node-1",
      "to": "node-2",
      "type": "solid"
    }
  }
}

// ❌ SchemaValidator FAIL: from 노드 없음
{
  "nodes": {
    "node-2": { "id": "node-2", "content": "B", "position": { "x": 0, "y": 0 } }
  },
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": "node-1",  // 존재하지 않음 → Sanitation으로 삭제
      "to": "node-2"
    }
  }
}

// ❌ type 값이 허용 범위 밖
{
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": "node-1",
      "to": "node-2",
      "type": "wavy"  // 'solid', 'dashed', 'dotted'만 허용
    }
  }
}
```

---

## 6. camera (필수)

### 6.1 타입 정의

```typescript
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}
```

### 6.2 필수 필드

| 필드 | 타입 | 검증 규칙 |
|------|------|-----------|
| x | number | NaN ❌, Infinity ❌ |
| y | number | NaN ❌, Infinity ❌ |
| zoom | number | NaN ❌, Infinity ❌, 0 이하 ❌ |

### 6.3 허용 범위

```
x, y: 음수 허용 (카메라 위치는 음수 가능)
zoom: 양수만 (0 이하 금지)
```

### 6.4 검증 예시

```json
// ✅ 유효한 camera
{
  "camera": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  }
}

// ✅ 음수 좌표 허용
{
  "camera": {
    "x": -100,
    "y": -200,
    "zoom": 0.5
  }
}

// ❌ zoom이 0
{
  "camera": {
    "x": 0,
    "y": 0,
    "zoom": 0
  }
}

// ❌ x가 NaN
{
  "camera": {
    "x": NaN,
    "y": 0,
    "zoom": 1.0
  }
}
```

---

## Part II: 검증 및 처리 규칙

---

## 7. SchemaValidator 요구사항

### 7.1 검증 순서

```
1. schemaVersion 검증 (최우선)
2. metadata 검증
3. nodes 검증
4. edges 검증
5. camera 검증
```

### 7.2 검증 실패 처리

```typescript
class SchemaValidator {
  validate(data: unknown): data is MindMapSchema {
    // 1. 타입 가드
    if (typeof data !== 'object' || data === null) {
      this.failLoudly('Data is not an object');
      return false;
    }
    
    // 2. schemaVersion 우선 검증
    if (!this.validateSchemaVersion(data)) {
      this.failLoudly('Invalid schemaVersion');
      return false;
    }
    
    // 3. 각 섹션 검증
    if (!this.validateMetadata(data.metadata)) {
      this.failLoudly('Invalid metadata');
      return false;
    }
    
    // ... 나머지 검증
    
    return true;
  }
}
```

### 7.3 Fail Loudly 규칙 ⭐ v5.2.1 강화

**검증 실패 시 필수 3단계 프로세스**:

```typescript
async failLoudly(message: string, details?: any): Promise<void> {
  // 1. Notice 표시 (사용자에게 즉시 알림)
  new Notice(
    `Schema Validation Failed\n\n${message}\n\n` +
    `The file cannot be loaded.`,
    10000  // 10초 표시
  );
  
  // 2. console.error 기록
  console.error(`[SchemaValidator] ${message}`, details);
  
  // 3. 로그 노트 기록 (Obsidian 노트에 영구 기록)
  await this.logToFile({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    category: 'SchemaValidator',
    message: message,
    details: details,
    file: this.currentFile?.path || 'unknown'
  });
  
  // 4. 로드 중단 (파일 메모리 적재 금지)
  throw new ValidationError(message);
}
```

**로그 노트 경로**:
```
/KK-NeroMind/02_Diagnostic_Log.md
```

**로그 포맷**:
```markdown
## [2026-01-18 15:45:23] Schema Validation Failed

**File**: `path/to/file.kknm`  
**Error**: Invalid schemaVersion  
**Details**:
- Expected: 1
- Received: 2
- Migration: Unavailable

**Action**: Plugin update required
```

**금지 사항**:
- ❌ Silent fallback (조용히 기본값 사용)
- ❌ Silent correction (자동 수정 후 계속)
- ❌ Partial Continuation (일부만 로드)

---

## 8. Sanitation 규칙

### 8.1 Sanitation 정의

```
Sanitation은 참조 무결성을 복구하는 과정이다.
- 존재하지 않는 노드를 참조하는 엣지를 삭제
- 데이터 손실이 아니라 무결성 회복 과정
```

### 8.2 Sanitation 허용 시점

```
✅ 허용:
- 파일 로드 (deserialize)
- 명시적 검증 (validate)
- 마이그레이션 (migration)

❌ 금지:
- 렌더링
- 인터랙션
- 편집
- Projection (UI 상태 변환)
```

### 8.3 Sanitation 로그

```typescript
interface SanitationLog {
  triggeredBy: string;      // "file-load" | "migration"
  removedEdges: string[];   // 삭제된 엣지 ID 목록
  timestamp: number;
}
```

---

## 9. 금지 사항 (Restrictions)

### 9.1 스키마 확장 금지

```
❌ 정의되지 않은 필드 추가 금지
❌ extraData 필드 금지
❌ _reserved 필드 금지 (v1에서)
❌ meta 확장 슬롯 금지
```

### 9.2 암묵적 처리 금지

```
❌ 누락된 필드 자동 추가 금지
❌ 잘못된 타입 자동 변환 금지
❌ 규격 위반 데이터 자동 보정 금지
❌ 추측 기반 복구 금지
```

### 9.3 파일 구조 변경 금지

```
❌ nodes/edges를 Array로 변환 금지
❌ metadata를 meta로 변경 금지
❌ camera를 view로 변경 금지
❌ Record<string, T>를 Array로 변경 금지
```

---

## Part III: 마이그레이션

---

## 10. 버전 관리 정책

### 10.1 버전 증가 규칙

```
스키마 변경 = 버전 증가 필수

예시:
- 필드 추가 → v2
- 필드 타입 변경 → v2
- 필수 필드 추가 → v2
- 선택 필드 추가 → v2 (하위 호환 불가능)
```

### 10.2 마이그레이션 방향

```
하위 → 상위만 지원 (v1 → v2 → v3)
역방향 마이그레이션 미지원 (v2 → v1 불가)
```

### 10.3 Forward-only Migration

```typescript
class MigrationManager {
  migrate(data: any): MindMapSchema {
    const version = data.schemaVersion;
    
    if (version > CURRENT_SCHEMA_VERSION) {
      throw new Error(
        `Unsupported schema version ${version}. ` +
        `Current version: ${CURRENT_SCHEMA_VERSION}`
      );
    }
    
    // v1 → v2 migration (미래)
    // v2 → v3 migration (미래)
    
    return data;
  }
}
```

---

## Part IV: 파일 저장 규칙

---

## 12. 파일 저장 규칙 ⭐ v5.2.1 신규

### 12.1 Atomic Write (원자적 쓰기)

**원칙**:

```
모든 .kknm 파일 저장은 직접 덮어쓰기를 금지한다.
임시 파일 → 검증 → 원자적 교체 순서를 따른다.
```

**저장 프로세스**:

```typescript
async function saveFile(
  path: string,
  data: MindMapSchema
): Promise<void> {
  const tmpPath = path + '.tmp';
  
  try {
    // 1. JSON 직렬화
    const json = JSON.stringify(data, null, 2);
    
    // 2. 임시 파일 쓰기
    await this.vault.adapter.write(tmpPath, json);
    
    // 3. 쓰기 검증
    const written = await this.vault.adapter.read(tmpPath);
    if (written !== json) {
      throw new Error('Write verification failed');
    }
    
    // 4. 원자적 교체 (rename은 원자적 연산)
    await this.vault.adapter.rename(tmpPath, path);
    
    // 5. modified 타임스탬프 갱신 (성공 후에만)
    data.metadata.modified = Date.now();
    
  } catch (error) {
    // 6. 임시 파일 정리
    try {
      await this.vault.adapter.remove(tmpPath);
    } catch (cleanupError) {
      console.warn('[FileService] Tmp file cleanup failed', cleanupError);
    }
    
    // 7. 에러 전파
    throw new Error(`File save failed: ${error.message}`);
  }
}
```

### 12.2 실패 처리

**실패 시나리오별 처리**:

| 시나리오 | 원본 파일 | 임시 파일 | modified |
|----------|-----------|-----------|----------|
| JSON 직렬화 실패 | 보존 | 생성 안 됨 | 유지 |
| 임시 파일 쓰기 실패 | 보존 | 생성 안 됨 | 유지 |
| 검증 실패 | 보존 | 삭제 | 유지 |
| 교체 실패 | 보존 | 삭제 | 유지 |

**데이터 안전 보장**:

```
저장 실패 시 원본 파일은 절대 손상되지 않는다.
모든 실패 단계에서 원본 파일 보존이 최우선이다.
```

### 12.3 Conflict Lock 상태에서의 저장 금지

```typescript
async function saveFile(data: MindMapSchema): Promise<void> {
  // 1. Conflict Lock 확인
  if (this.isConflictLocked) {
    throw new Error(
      'Cannot save in Conflict Lock state. ' +
      'Resolve conflicts first.'
    );
  }
  
  // 2. 저장 진행
  await this.atomicWrite(data);
}
```

---

## Part V: 파일 예시

---

## 11. 완전한 .kknm 파일 예시

### 11.1 최소 파일

```json
{
  "schemaVersion": 1,
  "metadata": {
    "created": 1705555200000,
    "modified": 1705555200000,
    "title": "Empty Mind Map"
  },
  "nodes": {},
  "edges": {},
  "camera": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  }
}
```

### 11.2 기본 파일

```json
{
  "schemaVersion": 1,
  "metadata": {
    "created": 1705555200000,
    "modified": 1705555300000,
    "title": "Project Planning"
  },
  "nodes": {
    "node-root": {
      "id": "node-root",
      "content": "Project Goals",
      "position": { "x": 0, "y": 0 }
    },
    "node-child1": {
      "id": "node-child1",
      "content": "Research Phase",
      "position": { "x": 300, "y": -100 }
    },
    "node-child2": {
      "id": "node-child2",
      "content": "Development Phase",
      "position": { "x": 300, "y": 100 }
    }
  },
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": "node-root",
      "to": "node-child1",
      "type": "solid"
    },
    "edge-2": {
      "id": "edge-2",
      "from": "node-root",
      "to": "node-child2",
      "type": "solid"
    }
  },
  "camera": {
    "x": 0,
    "y": 0,
    "zoom": 1.0
  }
}
```

### 11.3 전체 기능 파일

```json
{
  "schemaVersion": 1,
  "metadata": {
    "created": 1705555200000,
    "modified": 1705555600000,
    "title": "Research Notes",
    "author": "Nero-kk",
    "tags": ["research", "AI", "robotics"]
  },
  "nodes": {
    "node-abc123": {
      "id": "node-abc123",
      "content": "Humanoid Robotics",
      "position": { "x": 0, "y": 0 },
      "size": { "width": 250, "height": 120 },
      "style": {},
      "linkedNote": "notes/robotics-overview.md"
    },
    "node-def456": {
      "id": "node-def456",
      "content": "Motion Control",
      "position": { "x": 400, "y": -150 },
      "size": { "width": 200, "height": 100 },
      "style": {},
      "linkedNote": "notes/motion-control.md"
    },
    "node-ghi789": {
      "id": "node-ghi789",
      "content": "Computer Vision",
      "position": { "x": 400, "y": 150 },
      "size": { "width": 200, "height": 100 },
      "style": {}
    }
  },
  "edges": {
    "edge-xyz001": {
      "id": "edge-xyz001",
      "from": "node-abc123",
      "to": "node-def456",
      "type": "solid"
    },
    "edge-xyz002": {
      "id": "edge-xyz002",
      "from": "node-abc123",
      "to": "node-ghi789",
      "type": "dashed"
    }
  },
  "camera": {
    "x": -100,
    "y": 50,
    "zoom": 1.2
  }
}
```

---

## 📚 참고 문서

### 상위 문서

1. **KK-NeroMind-Architecture-v5.2.0.md**
   - Section 11: "Schema is Law"
   - Section 14.2: "Atomic Persistence"
   - Section 16: "Fail Loudly"

2. **KK-NeroMind-Development-Roadmap-v5.2.0.md**
   - Phase 1: Schema Types 구현 (Line 289-333)
   - MindMapSchema 타입 정의

3. **KK-NeroMind-Coding-Guidelines-v5.2.0.md**
   - "No Auto-Correction" 원칙
   - "Schema is Law" 규칙

---

## 📝 문서 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 |
|------|------|---------------|
| v5.2.1 | 2026-01-18 | 6개 보완: modified 규칙, Edge 책임 분리, NodeStyle 확장 규칙, schemaVersion 처리, Fail Loudly 강화, Atomic Write 추가 |
| v5.2.0 | 2026-01-18 | 초판 작성, Roadmap v5.2.0 기반 |

---

## 🔄 v5.2.0 → v5.2.1 변경사항

### 추가된 Section

1. **Section 2.4**: schemaVersion > CURRENT_SCHEMA_VERSION 처리
2. **Section 12**: 파일 저장 규칙 (Atomic Write)

### 강화된 Section

3. **Section 3.5**: modified 타임스탬프 규칙 (갱신 조건 명확화)
4. **Section 4.6**: NodeStyle 객체 (미래 확장 규칙 추가)
5. **Section 5.5**: Reference Integrity (검증 vs Sanitation 책임 분리)
6. **Section 7.3**: Fail Loudly 규칙 (3단계 프로세스 명시)

### 변경 없는 Section

- Section 1: 전체 구조
- Section 2.1-2.3: schemaVersion 기본 검증
- Section 3.1-3.4: metadata 기본 정의
- Section 4.1-4.5: nodes 기본 정의
- Section 5.1-5.4: edges 기본 정의
- Section 6: camera
- Section 7.1-7.2: SchemaValidator 기본
- Section 8-10: Sanitation, 금지사항, 마이그레이션
- Section 11: 파일 예시

---

## ⚠️ 중요 공지

### 구버전 Schema 문서 폐기

```
kknm-schema-v1.md (TextFileView Skeleton v4.2.5 기반)는 폐기됨.

이유:
1. Roadmap v5.2.0과 15개 항목 불일치
2. 구조 차이 (Array vs Record)
3. 필드명 차이 (meta vs metadata, view vs camera)
4. 타입 차이 (ISO-8601 vs Unix timestamp)

본 문서(Schema v5.2.1)가 유일한 공식 명세서임.
```

### Phase 1 구현 시 주의사항

```
1. src/schema/types.ts는 본 문서의 TypeScript 정의와 정확히 일치해야 함
2. SchemaValidator는 본 문서의 검증 규칙을 모두 구현해야 함
3. Fail Loudly 3단계 프로세스 필수 구현
4. Atomic Write 프로세스 필수 구현
5. Array 구조 사용 금지 (Record<string, T> 필수)
```

---

**문서 끝**
