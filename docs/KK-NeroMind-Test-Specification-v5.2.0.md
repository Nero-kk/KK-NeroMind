# KK-NeroMind Test Specification v5.2.0

> **버전**: 5.2.0  
> **최종 수정**: 2026-01-18  
> **상위 문서**: KK-NeroMind-Architecture-v5.2.0.md  
> **문서 지위**: 테스트 명세 및 검증 기준서

---

## 📋 문서 개요

### 목적

본 문서는 KK-NeroMind 플러그인의 **모든 테스트 요구사항**을 정의한다.

- 각 모듈의 테스트 케이스 정의
- Phase별 커버리지 목표
- Given-When-Then 템플릿 제공
- 테스트 품질 기준

### 문서 권위

```
Architecture v5.2.0 (헌법)
  ↓
Test Specification v5.2.0 (검증 기준)
  ↓
구현 코드 (테스트 통과 필수)
```

**이 문서에 정의된 테스트를 통과하지 못한 코드는 merge 불가.**

---

## Part I: 테스트 전략

---

## 1. 테스트 철학

### 1.1 핵심 원칙

```
"테스트는 품질 확인 수단이 아니라 Phase Gate 통과 조건이다"
"실행되지 않는 테스트는 존재하지 않는 테스트다"
"테스트는 존재가 아니라 검증이다"
```

### 1.2 테스트 우선순위

| 우선순위 | 대상 | 커버리지 |
|---------|------|----------|
| P0 (최우선) | SchemaValidator, MindMapState, 모든 Command | 100% |
| P1 (높음) | HistoryManager, FileService | 100% |
| P2 (중간) | BootDiagnostics, DisposableRegistry | 100% |
| P3 (낮음) | UI 컴포넌트, 렌더러 | 70% |

### 1.3 테스트 금지 원칙

```
❌ 절대 금지:
1. 존재만 확인하는 테스트
2. 타입만 확인하는 테스트
3. Mock만 확인하는 테스트
4. 실제 동작을 검증하지 않는 테스트

✅ 필수:
1. 실제 동작 검증
2. 경계 조건 검증
3. 상태 변화 검증
4. 에러 케이스 검증
```

---

## 2. 테스트 피라미드

### 2.1 계층 구조 (Architecture 준수)

```
       /\
      /E2E\        5% - Manual Smoke Test
     /------\
    /IntTest\     15% - Obsidian API Mock
   /----------\
  /Unit  Tests\  80% - Pure Logic Test
 /--------------\
```

### 2.2 계층별 상세

#### Level 1: Pure Logic Test (80%)

**대상**:
- MindMapState
- SchemaValidator
- Layout 계산
- Command execute/undo/redo
- Disposable Registry
- Boot Diagnostics

**특징**:
- Obsidian API 의존성 없음
- 순수 TypeScript 로직만
- 빠른 실행 (<1ms per test)
- CI/CD에서 자동 실행

#### Level 2: Obsidian API Mock Test (15%)

**대상**:
- FileService (Vault mock)
- Plugin onload (App mock)
- TextFileView (Workspace mock)

**특징**:
- Obsidian API를 Mock으로 대체
- 실제 파일 I/O 없음
- 중간 실행 속도 (<10ms per test)

#### Level 3: Manual Smoke Test (5%)

**대상**:
- 플러그인 로드 확인
- 실제 .kknm 파일 생성
- UI 인터랙션

**특징**:
- Obsidian에서 수동 실행
- Phase Gate 통과 조건
- 자동화 불가

---

## 3. Phase별 테스트 목표

### 3.1 커버리지 목표 (Roadmap 준수)

| Phase | 유닛 | 통합 | E2E | 총 커버리지 | 누적 테스트 파일 |
|-------|------|------|-----|-------------|-----------------|
| 0 | - | - | - | - | 0 |
| 1 | 50% | 0% | 0% | 50% | 3+ |
| 2 | 50% | 10% | 0% | 60% | 8+ |
| 3 | 60% | 10% | 0% | 70% | 15+ |
| 4 | 65% | 10% | 0% | 75% | 20+ |
| 5 | 68% | 10% | 0% | 78% | 25+ |
| 6 | 70% | 10% | 0% | **80%** ⭐ | 30+ |
| 7 | 70% | 10% | 0% | 80% | 35+ |
| 8 | 65% | 10% | 5% | 80%+ | 40+ |

### 3.2 100% 커버리지 필수 모듈

```
필수 100% 모듈:
1. SchemaValidator
2. MindMapState
3. 모든 Command 클래스
4. HistoryManager
5. FileService
6. DisposableRegistry
7. BootDiagnostics
```

### 3.3 테스트 제외 대상

```
커버리지 측정 제외:
- main.ts (플러그인 진입점)
- *.test.ts (테스트 파일 자체)
- types.ts (타입 정의만)
```

---

## 4. 커버리지 정책

### 4.1 측정 방법

```bash
# 커버리지 측정
npm run test:coverage

# 최소 임계값 (jest.config.js)
coverageThreshold: {
  global: {
    branches: 50,    # Phase별로 상승
    functions: 50,
    lines: 50,
    statements: 50
  }
}
```

### 4.2 Phase별 임계값 조정

| Phase | branches | functions | lines | statements |
|-------|----------|-----------|-------|------------|
| 1 | 50 | 50 | 50 | 50 |
| 2 | 60 | 60 | 60 | 60 |
| 3 | 70 | 70 | 70 | 70 |
| 6 | 80 | 80 | 80 | 80 |

---

## Part II: 테스트 작성 규범

---

## 5. Given-When-Then 템플릿

### 5.1 기본 구조

```typescript
describe('모듈명', () => {
  describe('기능 카테고리', () => {
    test('TC-XXX-YYY: 테스트 이름', () => {
      // Given: 초기 상태 설정
      const initialState = createTestState();
      
      // When: 동작 실행
      const result = performAction(initialState);
      
      // Then: 결과 검증
      expect(result).toMatchExpectedState();
    });
  });
});
```

### 5.2 테스트 ID 규칙

```
형식: TC-{MODULE}-{NUMBER}

예시:
- TC-VAL-001: Validator 테스트 #1
- TC-STATE-015: MindMapState 테스트 #15
- TC-CMD-003: Command 테스트 #3
```

### 5.3 테스트 이름 규칙

```typescript
// ✅ 좋은 예
test('TC-VAL-001: validates correct schema with all required fields');
test('TC-VAL-002: rejects schema when schemaVersion is missing');
test('TC-STATE-010: addNode updates nodes map correctly');

// ❌ 나쁜 예
test('validator works');
test('test1');
test('should be ok');
```

---

## 6. Mock 사용 가이드

### 6.1 Mock 허용 대상

```typescript
✅ Mock 허용:
1. Obsidian API (App, Vault, Workspace)
2. 파일 시스템 I/O
3. 외부 의존성
4. 시간 (Date.now, setTimeout)
```

### 6.2 Mock 금지 대상

```typescript
❌ Mock 금지:
1. 테스트 대상 모듈
2. 순수 함수
3. 데이터 구조 (Schema, State)
4. Command 클래스
```

### 6.3 Mock 작성 예시

```typescript
// ✅ 올바른 Mock: Obsidian API
const mockApp = {
  vault: {
    read: jest.fn().mockResolvedValue('{"schemaVersion":1}'),
    modify: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue({} as TFile)
  },
  workspace: {
    getLeaf: jest.fn().mockReturnValue({} as WorkspaceLeaf)
  }
} as unknown as App;

// ❌ 잘못된 Mock: 테스트 대상
const mockValidator = {
  validate: jest.fn().mockReturnValue(true)  // 절대 금지!
};
```

### 6.4 Mock 검증

```typescript
// Mock 호출 검증
expect(mockApp.vault.modify).toHaveBeenCalledWith(
  expect.any(TFile),
  expect.stringContaining('"schemaVersion":1')
);

// 호출 횟수 검증
expect(mockApp.vault.read).toHaveBeenCalledTimes(1);
```

---

## 7. 테스트 품질 기준

### 7.1 필수 검증 항목

```typescript
✅ 모든 테스트는 다음을 검증해야 함:

1. 실제 동작 (Behavior)
2. 상태 변화 (State Change)
3. 부작용 (Side Effects)
4. 반환값 (Return Value)
5. 에러 처리 (Error Handling)
```

### 7.2 테스트 품질 체크리스트

```
[ ] Given-When-Then 구조인가?
[ ] 실제 동작을 검증하는가?
[ ] 경계 조건을 확인하는가?
[ ] 테스트 이름이 명확한가?
[ ] 하나의 테스트가 하나만 검증하는가?
[ ] Mock 사용이 적절한가?
[ ] 테스트가 독립적인가? (순서 무관)
[ ] 테스트가 결정적인가? (항상 같은 결과)
```

### 7.3 테스트 독립성

```typescript
// ✅ 올바른 예: 독립적 테스트
describe('MindMapState', () => {
  let state: MindMapState;
  
  beforeEach(() => {
    state = new MindMapState(createEmptySchema());
  });
  
  test('TC-STATE-001: addNode adds to nodes map', () => {
    state.addNode(testNode);
    expect(state.nodes).toHaveProperty(testNode.id);
  });
  
  test('TC-STATE-002: removeNode removes from nodes map', () => {
    state.addNode(testNode);
    state.removeNode(testNode.id);
    expect(state.nodes).not.toHaveProperty(testNode.id);
  });
});

// ❌ 잘못된 예: 의존적 테스트
test('test1', () => {
  globalState.value = 10;  // 다음 테스트에 영향
});

test('test2', () => {
  expect(globalState.value).toBe(10);  // test1에 의존
});
```

---

## 8. 금지 패턴

### 8.1 존재 확인 테스트 (금지)

```typescript
// ❌ 금지: 존재만 확인
test('validator exists', () => {
  expect(SchemaValidator).toBeDefined();
});

test('can create instance', () => {
  const v = new SchemaValidator();
  expect(v).toBeInstanceOf(SchemaValidator);
});
```

### 8.2 타입 확인 테스트 (금지)

```typescript
// ❌ 금지: 타입만 확인
test('returns correct type', () => {
  const result = validator.validate(data);
  expect(typeof result).toBe('boolean');
});
```

### 8.3 Mock만 확인 테스트 (금지)

```typescript
// ❌ 금지: Mock 호출만 확인
test('calls vault.modify', () => {
  const mock = jest.fn();
  saveFile(mock);
  expect(mock).toHaveBeenCalled();
});
```

### 8.4 허용되는 테스트 패턴

```typescript
// ✅ 허용: 실제 동작 검증
test('TC-VAL-001: validates correct schema', () => {
  const schema: MindMapSchema = {
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
  
  const result = validator.validate(schema);
  
  expect(result).toBe(true);
});

// ✅ 허용: 경계 조건 검증
test('TC-VAL-002: rejects when schemaVersion is missing', () => {
  const invalidData = {
    metadata: {},
    nodes: {},
    edges: {},
    camera: {}
  };
  
  const result = validator.validate(invalidData);
  
  expect(result).toBe(false);
});

// ✅ 허용: 상태 변화 검증
test('TC-STATE-010: addNode updates metadata.modified', () => {
  const initialModified = state.metadata.modified;
  
  jest.advanceTimersByTime(1000);
  state.addNode(testNode);
  
  expect(state.metadata.modified).toBeGreaterThan(initialModified);
});
```

---

## Part III: Phase별 테스트 명세

---

## 9. Phase 1: Zero-to-One

### 9.1 Phase 1 목표

- Obsidian에서 플러그인 로드 성공
- .kknm 파일 생성 가능
- 커버리지 50% 달성
- 테스트 파일 3개 이상

### 9.2 Phase 1 모듈

| 모듈 | 파일 | 테스트 파일 | 커버리지 |
|------|------|-------------|----------|
| Schema | src/schema/types.ts | - | N/A |
| Validator | src/schema/validator.ts | validator.test.ts | 100% |
| Disposable | src/utils/disposable.ts | disposable.test.ts | 100% |
| Diagnostics | src/utils/diagnostic.ts | diagnostic.test.ts | 100% |
| Plugin | src/main.ts | - | N/A |

### 9.3 Phase 1 테스트 케이스 수

```
SchemaValidator: 30+ 테스트
DisposableRegistry: 10+ 테스트
BootDiagnostics: 12+ 테스트
────────────────────────────
총 52+ 테스트
```

---

## 10. Phase 2: File I/O

### 10.1 Phase 2 목표

- 파일 읽기/쓰기 안정화
- Atomic Write 검증
- TextFileView 동작 확인
- 커버리지 60% 달성

### 10.2 Phase 2 추가 모듈

| 모듈 | 커버리지 |
|------|----------|
| FileService | 100% |
| TextFileView | 70% |
| Sanitizer | 100% |

### 10.3 Phase 2 테스트 케이스 수

```
FileService: 20+ 테스트
TextFileView: 15+ 테스트
Sanitizer: 10+ 테스트
────────────────────────────
Phase 2 추가: 45+ 테스트
누적: 97+ 테스트
```

---

## 11. Phase 3: Command System

### 11.1 Phase 3 목표

- 모든 Command 테스트 100%
- Undo/Redo 사이클 검증
- HistoryManager 안정화
- 커버리지 70% 달성

### 11.2 Phase 3 추가 모듈

| 모듈 | 커버리지 |
|------|----------|
| 모든 Command 클래스 | 100% |
| HistoryManager | 100% |
| MindMapState | 100% |

### 11.3 Command 테스트 필수 사항

```typescript
// 모든 Command는 4가지 테스트 필수
interface CommandTestContract {
  testExecute(): void;         // execute → 상태 변화
  testUndo(): void;            // undo → 완전 복구
  testRedo(): void;            // redo → execute와 동일
  testFailureRollback(): void; // 실패 시 부분 변경 없음
}
```

---

## 12. Phase 4-8: 테스트 골격

### Phase 4: UI Layer

- Renderer 테스트 (75%)
- Layout 기초 테스트 (80%)

### Phase 5: Interaction

- Event Handler 테스트 (70%)
- Drag & Drop 테스트 (75%)

### Phase 6: Layout Engine

- LayoutEngine 테스트 (100%) ⭐
- AutoAligner 테스트 (100%)
- **커버리지 80% 달성** ⭐

### Phase 7: Full Note

- NoteSync 테스트 (80%)
- 양방향 동기화 테스트 (85%)

### Phase 8: Production

- E2E 테스트 (5%)
- 통합 테스트 완성 (15%)
- **최종 커버리지 80%+**

---

## Part IV: 모듈별 테스트 케이스

---

## 13. SchemaValidator 테스트

### 13.1 테스트 개요

**파일**: `src/schema/validator.test.ts`  
**커버리지 목표**: 100%  
**테스트 케이스 수**: 30+

### 13.2 테스트 카테고리

#### 13.2.1 유효한 스키마 (3개)

```typescript
describe('SchemaValidator - Valid Schema', () => {
  const validator = new SchemaValidator();
  
  test('TC-VAL-001: validates empty mind map', () => {
    // Given
    const schema: MindMapSchema = {
      schemaVersion: 1,
      metadata: {
        created: 1705555200000,
        modified: 1705555200000,
        title: 'Empty Map'
      },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(schema);
    
    // Then
    expect(result).toBe(true);
  });
  
  test('TC-VAL-002: validates mind map with nodes', () => {
    // Given
    const schema: MindMapSchema = {
      schemaVersion: 1,
      metadata: {
        created: 1705555200000,
        modified: 1705555200000,
        title: 'Map with Nodes'
      },
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Test Node',
          position: { x: 0, y: 0 }
        }
      },
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(schema);
    
    // Then
    expect(result).toBe(true);
  });
  
  test('TC-VAL-003: validates with optional fields', () => {
    // Given
    const schema: MindMapSchema = {
      schemaVersion: 1,
      metadata: {
        created: 1705555200000,
        modified: 1705555200000,
        title: 'Full Map',
        author: 'Test Author',
        tags: ['test', 'example']
      },
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Node',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
          linkedNote: 'note.md'
        }
      },
      edges: {
        'edge1': {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          type: 'dashed'
        }
      },
      camera: { x: 100, y: 200, zoom: 1.5 }
    };
    
    // When
    const result = validator.validate(schema);
    
    // Then
    expect(result).toBe(true);
  });
});
```

#### 13.2.2 schemaVersion 검증 (6개)

```typescript
describe('SchemaValidator - schemaVersion', () => {
  const validator = new SchemaValidator();
  
  test('TC-VAL-010: rejects when schemaVersion is missing', () => {
    // Given
    const invalidData = {
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-011: rejects when schemaVersion is not a number', () => {
    // Given
    const invalidData = {
      schemaVersion: '1',  // 문자열
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-012: rejects when schemaVersion is a decimal', () => {
    // Given
    const invalidData = {
      schemaVersion: 1.5,  // 소수
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-013: rejects when schemaVersion is 0', () => {
    // Given
    const invalidData = {
      schemaVersion: 0,
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-014: rejects when schemaVersion is negative', () => {
    // Given
    const invalidData = {
      schemaVersion: -1,
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-015: rejects when schemaVersion is greater than 1', () => {
    // Given
    const invalidData = {
      schemaVersion: 2,  // v1만 지원
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
});
```

#### 13.2.3 metadata 검증 (8개)

```typescript
describe('SchemaValidator - metadata', () => {
  const validator = new SchemaValidator();
  const baseSchema = {
    schemaVersion: 1,
    nodes: {},
    edges: {},
    camera: { x: 0, y: 0, zoom: 1 }
  };
  
  test('TC-VAL-020: rejects when metadata is missing', () => {
    // Given
    const invalidData = { ...baseSchema };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-021: rejects when created is missing', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      metadata: {
        modified: 1705555200000,
        title: 'Test'
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-022: rejects when modified is missing', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      metadata: {
        created: 1705555200000,
        title: 'Test'
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-023: rejects when title is missing', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      metadata: {
        created: 1705555200000,
        modified: 1705555200000
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-024: rejects when created is negative', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      metadata: {
        created: -1,
        modified: 1705555200000,
        title: 'Test'
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-025: rejects when created is not a number', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      metadata: {
        created: '1705555200000',
        modified: 1705555200000,
        title: 'Test'
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-026: rejects when tags is not an array', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      metadata: {
        created: 1705555200000,
        modified: 1705555200000,
        title: 'Test',
        tags: 'tag1,tag2'  // 문자열
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-027: accepts empty tags array', () => {
    // Given
    const validData = {
      ...baseSchema,
      metadata: {
        created: 1705555200000,
        modified: 1705555200000,
        title: 'Test',
        tags: []
      }
    };
    
    // When
    const result = validator.validate(validData);
    
    // Then
    expect(result).toBe(true);
  });
});
```

#### 13.2.4 nodes 검증 (8개)

```typescript
describe('SchemaValidator - nodes', () => {
  const validator = new SchemaValidator();
  const baseSchema = {
    schemaVersion: 1,
    metadata: {
      created: 1705555200000,
      modified: 1705555200000,
      title: 'Test'
    },
    edges: {},
    camera: { x: 0, y: 0, zoom: 1 }
  };
  
  test('TC-VAL-030: accepts empty nodes object', () => {
    // Given
    const validData = {
      ...baseSchema,
      nodes: {}
    };
    
    // When
    const result = validator.validate(validData);
    
    // Then
    expect(result).toBe(true);
  });
  
  test('TC-VAL-031: rejects when node id mismatch', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node2',  // 불일치
          content: 'Test',
          position: { x: 0, y: 0 }
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-032: rejects when node content is missing', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node1',
          position: { x: 0, y: 0 }
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-033: rejects when position is missing', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Test'
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-034: rejects when position.x is NaN', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Test',
          position: { x: NaN, y: 0 }
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-035: rejects when size.width is negative', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Test',
          position: { x: 0, y: 0 },
          size: { width: -100, height: 50 }
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-036: accepts node with all optional fields', () => {
    // Given
    const validData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Test',
          position: { x: 100, y: 200 },
          size: { width: 150, height: 80 },
          linkedNote: 'note.md'
        }
      }
    };
    
    // When
    const result = validator.validate(validData);
    
    // Then
    expect(result).toBe(true);
  });
  
  test('TC-VAL-037: rejects when linkedNote is not a string', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      nodes: {
        'node1': {
          id: 'node1',
          content: 'Test',
          position: { x: 0, y: 0 },
          linkedNote: 123  // 숫자
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
});
```

#### 13.2.5 edges 검증 (5개)

```typescript
describe('SchemaValidator - edges', () => {
  const validator = new SchemaValidator();
  const baseSchema = {
    schemaVersion: 1,
    metadata: {
      created: 1705555200000,
      modified: 1705555200000,
      title: 'Test'
    },
    nodes: {},
    camera: { x: 0, y: 0, zoom: 1 }
  };
  
  test('TC-VAL-040: accepts empty edges object', () => {
    // Given
    const validData = {
      ...baseSchema,
      edges: {}
    };
    
    // When
    const result = validator.validate(validData);
    
    // Then
    expect(result).toBe(true);
  });
  
  test('TC-VAL-041: rejects when edge id mismatch', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      edges: {
        'edge1': {
          id: 'edge2',  // 불일치
          from: 'node1',
          to: 'node2'
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-042: rejects when from is missing', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      edges: {
        'edge1': {
          id: 'edge1',
          to: 'node2'
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-043: accepts edge with type', () => {
    // Given
    const validData = {
      ...baseSchema,
      edges: {
        'edge1': {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          type: 'dashed'
        }
      }
    };
    
    // When
    const result = validator.validate(validData);
    
    // Then
    expect(result).toBe(true);
  });
  
  test('TC-VAL-044: rejects when type is invalid', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      edges: {
        'edge1': {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          type: 'wavy'  // 허용되지 않는 타입
        }
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
});
```

#### 13.2.6 camera 검증 (3개)

```typescript
describe('SchemaValidator - camera', () => {
  const validator = new SchemaValidator();
  const baseSchema = {
    schemaVersion: 1,
    metadata: {
      created: 1705555200000,
      modified: 1705555200000,
      title: 'Test'
    },
    nodes: {},
    edges: {}
  };
  
  test('TC-VAL-050: rejects when camera is missing', () => {
    // Given
    const invalidData = { ...baseSchema };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-051: rejects when camera.zoom is not a number', () => {
    // Given
    const invalidData = {
      ...baseSchema,
      camera: {
        x: 0,
        y: 0,
        zoom: '1'  // 문자열
      }
    };
    
    // When
    const result = validator.validate(invalidData);
    
    // Then
    expect(result).toBe(false);
  });
  
  test('TC-VAL-052: accepts negative camera coordinates', () => {
    // Given
    const validData = {
      ...baseSchema,
      camera: {
        x: -100,
        y: -200,
        zoom: 0.5
      }
    };
    
    // When
    const result = validator.validate(validData);
    
    // Then
    expect(result).toBe(true);
  });
});
```

### 13.3 에러 로깅 검증

```typescript
describe('SchemaValidator - Error Logging', () => {
  const validator = new SchemaValidator();
  
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('TC-VAL-060: logs error when validation fails', () => {
    // Given
    const invalidData = { schemaVersion: 'invalid' };
    
    // When
    validator.validate(invalidData);
    
    // Then
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[Validator]'),
      expect.any(String)
    );
  });
  
  test('TC-VAL-061: does not log when validation succeeds', () => {
    // Given
    const validSchema = {
      schemaVersion: 1,
      metadata: { created: 0, modified: 0, title: '' },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    // When
    validator.validate(validSchema);
    
    // Then
    expect(console.error).not.toHaveBeenCalled();
  });
});
```

---

## 14. BootDiagnostics 테스트

### 14.1 테스트 개요

**파일**: `src/utils/diagnostic.test.ts`  
**커버리지 목표**: 100%  
**테스트 케이스 수**: 12+

### 14.2 테스트 케이스

```typescript
describe('BootDiagnostics', () => {
  let diagnostics: BootDiagnostics;
  
  beforeEach(() => {
    diagnostics = new BootDiagnostics();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Module Registration', () => {
    test('TC-DIAG-001: registers successful module', () => {
      // Given & When
      diagnostics.register('test-module', 'success');
      
      // Then
      const status = diagnostics.getModuleStatus('test-module');
      expect(status).toBeDefined();
      expect(status?.status).toBe('success');
    });
    
    test('TC-DIAG-002: registers failed module with error', () => {
      // Given
      const error = new Error('Test error');
      
      // When
      diagnostics.register('test-module', 'failed', error);
      
      // Then
      const status = diagnostics.getModuleStatus('test-module');
      expect(status?.status).toBe('failed');
      expect(status?.error).toBe(error);
    });
    
    test('TC-DIAG-003: logs error when module fails', () => {
      // Given
      const error = new Error('Test error');
      
      // When
      diagnostics.register('test-module', 'failed', error);
      
      // Then
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[KK-NeroMind Boot]'),
        expect.stringContaining('test-module'),
        error
      );
    });
    
    test('TC-DIAG-004: does not log error when module succeeds', () => {
      // When
      diagnostics.register('test-module', 'success');
      
      // Then
      expect(console.error).not.toHaveBeenCalled();
    });
    
    test('TC-DIAG-005: records timestamp for each registration', () => {
      // Given
      const before = Date.now();
      
      // When
      diagnostics.register('test-module', 'success');
      
      // Then
      const after = Date.now();
      const status = diagnostics.getModuleStatus('test-module');
      expect(status?.timestamp).toBeGreaterThanOrEqual(before);
      expect(status?.timestamp).toBeLessThanOrEqual(after);
    });
  });
  
  describe('Check All Modules', () => {
    test('TC-DIAG-010: returns success when all modules succeed', () => {
      // Given
      diagnostics.register('module1', 'success');
      diagnostics.register('module2', 'success');
      
      // When
      const result = diagnostics.checkAllModules();
      
      // Then
      expect(result.success).toBe(true);
      expect(result.failedModules).toHaveLength(0);
    });
    
    test('TC-DIAG-011: returns failure when any module fails', () => {
      // Given
      diagnostics.register('module1', 'success');
      diagnostics.register('module2', 'failed', new Error('Test'));
      diagnostics.register('module3', 'success');
      
      // When
      const result = diagnostics.checkAllModules();
      
      // Then
      expect(result.success).toBe(false);
      expect(result.failedModules).toContain('module2');
    });
    
    test('TC-DIAG-012: lists all failed modules', () => {
      // Given
      diagnostics.register('module1', 'failed', new Error('Error 1'));
      diagnostics.register('module2', 'success');
      diagnostics.register('module3', 'failed', new Error('Error 3'));
      
      // When
      const result = diagnostics.checkAllModules();
      
      // Then
      expect(result.failedModules).toContain('module1');
      expect(result.failedModules).toContain('module3');
      expect(result.failedModules).toHaveLength(2);
    });
    
    test('TC-DIAG-013: returns success when no modules registered', () => {
      // When
      const result = diagnostics.checkAllModules();
      
      // Then
      expect(result.success).toBe(true);
      expect(result.failedModules).toHaveLength(0);
    });
  });
  
  describe('Get Module Status', () => {
    test('TC-DIAG-020: returns undefined for non-existent module', () => {
      // When
      const status = diagnostics.getModuleStatus('non-existent');
      
      // Then
      expect(status).toBeUndefined();
    });
    
    test('TC-DIAG-021: returns correct status for registered module', () => {
      // Given
      diagnostics.register('test-module', 'success');
      
      // When
      const status = diagnostics.getModuleStatus('test-module');
      
      // Then
      expect(status).toMatchObject({
        id: 'test-module',
        status: 'success'
      });
    });
  });
});
```

---

## 15. DisposableRegistry 테스트

### 15.1 테스트 개요

**파일**: `src/utils/disposable.test.ts`  
**커버리지 목표**: 100%  
**테스트 케이스 수**: 10+

### 15.2 테스트 케이스

```typescript
describe('DisposableRegistry', () => {
  let registry: DisposableRegistry;
  
  beforeEach(() => {
    registry = new DisposableRegistry();
  });
  
  describe('Registration', () => {
    test('TC-DIS-001: registers disposable', () => {
      // Given
      const disposable = { dispose: jest.fn() };
      
      // When
      registry.register(disposable);
      
      // Then
      expect(registry.count).toBe(1);
    });
    
    test('TC-DIS-002: registers multiple disposables', () => {
      // Given
      const d1 = { dispose: jest.fn() };
      const d2 = { dispose: jest.fn() };
      
      // When
      registry.register(d1);
      registry.register(d2);
      
      // Then
      expect(registry.count).toBe(2);
    });
    
    test('TC-DIS-003: does not register same disposable twice', () => {
      // Given
      const disposable = { dispose: jest.fn() };
      
      // When
      registry.register(disposable);
      registry.register(disposable);
      
      // Then
      expect(registry.count).toBe(1);
    });
  });
  
  describe('Unregistration', () => {
    test('TC-DIS-010: unregisters disposable', () => {
      // Given
      const disposable = { dispose: jest.fn() };
      registry.register(disposable);
      
      // When
      registry.unregister(disposable);
      
      // Then
      expect(registry.count).toBe(0);
    });
    
    test('TC-DIS-011: does not error when unregistering non-existent', () => {
      // Given
      const disposable = { dispose: jest.fn() };
      
      // When & Then
      expect(() => registry.unregister(disposable)).not.toThrow();
    });
  });
  
  describe('Dispose All', () => {
    test('TC-DIS-020: calls dispose on all registered', () => {
      // Given
      const d1 = { dispose: jest.fn() };
      const d2 = { dispose: jest.fn() };
      registry.register(d1);
      registry.register(d2);
      
      // When
      registry.dispose();
      
      // Then
      expect(d1.dispose).toHaveBeenCalled();
      expect(d2.dispose).toHaveBeenCalled();
    });
    
    test('TC-DIS-021: disposes in reverse order', () => {
      // Given
      const callOrder: number[] = [];
      const d1 = { dispose: () => callOrder.push(1) };
      const d2 = { dispose: () => callOrder.push(2) };
      const d3 = { dispose: () => callOrder.push(3) };
      
      registry.register(d1);
      registry.register(d2);
      registry.register(d3);
      
      // When
      registry.dispose();
      
      // Then
      expect(callOrder).toEqual([3, 2, 1]);
    });
    
    test('TC-DIS-022: continues disposing even if one fails', () => {
      // Given
      const d1 = { dispose: jest.fn() };
      const d2 = { dispose: jest.fn().mockImplementation(() => {
        throw new Error('Dispose failed');
      }) };
      const d3 = { dispose: jest.fn() };
      
      registry.register(d1);
      registry.register(d2);
      registry.register(d3);
      
      // When
      registry.dispose();
      
      // Then
      expect(d1.dispose).toHaveBeenCalled();
      expect(d2.dispose).toHaveBeenCalled();
      expect(d3.dispose).toHaveBeenCalled();
    });
    
    test('TC-DIS-023: clears registry after dispose', () => {
      // Given
      const disposable = { dispose: jest.fn() };
      registry.register(disposable);
      
      // When
      registry.dispose();
      
      // Then
      expect(registry.count).toBe(0);
    });
    
    test('TC-DIS-024: logs error but does not throw', () => {
      // Given
      const disposable = { dispose: () => {
        throw new Error('Test error');
      }};
      registry.register(disposable);
      
      jest.spyOn(console, 'error').mockImplementation();
      
      // When & Then
      expect(() => registry.dispose()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
      
      jest.restoreAllMocks();
    });
  });
});
```

---

## 16. Command 클래스 테스트

### 16.1 테스트 계약

모든 Command 클래스는 다음 4가지 테스트를 **반드시** 구현해야 함:

```typescript
interface CommandTestContract {
  testExecute(): void;         // execute → 상태 변화
  testUndo(): void;            // undo → 완전 복구
  testRedo(): void;            // redo → execute와 동일
  testFailureRollback(): void; // 실패 시 부분 변경 없음
}
```

### 16.2 Command 테스트 템플릿

```typescript
describe('AddNodeCommand', () => {
  let state: MindMapState;
  let command: AddNodeCommand;
  
  beforeEach(() => {
    state = new MindMapState(createEmptySchema());
    command = new AddNodeCommand(
      state,
      'node1',
      'Test Node',
      { x: 100, y: 200 }
    );
  });
  
  test('TC-CMD-001: execute adds node to state', () => {
    // When
    command.execute();
    
    // Then
    const node = state.getNode('node1');
    expect(node).toBeDefined();
    expect(node?.content).toBe('Test Node');
    expect(node?.position).toEqual({ x: 100, y: 200 });
  });
  
  test('TC-CMD-002: undo removes node completely', () => {
    // Given
    command.execute();
    
    // When
    command.undo();
    
    // Then
    const node = state.getNode('node1');
    expect(node).toBeUndefined();
    expect(state.nodes).not.toHaveProperty('node1');
  });
  
  test('TC-CMD-003: redo produces same result as execute', () => {
    // Given
    command.execute();
    const afterExecute = JSON.parse(JSON.stringify(state.toSchema()));
    
    command.undo();
    
    // When
    command.redo();
    
    // Then
    const afterRedo = state.toSchema();
    expect(afterRedo).toEqual(afterExecute);
  });
  
  test('TC-CMD-004: execute failure leaves state unchanged', () => {
    // Given
    const duplicateCommand = new AddNodeCommand(
      state,
      'node1',
      'Duplicate',
      { x: 0, y: 0 }
    );
    
    command.execute();
    const stateBefore = JSON.parse(JSON.stringify(state.toSchema()));
    
    // When & Then
    expect(() => duplicateCommand.execute()).toThrow();
    
    const stateAfter = state.toSchema();
    expect(stateAfter).toEqual(stateBefore);
  });
});
```

---

## 17. MindMapState 테스트

### 17.1 테스트 개요

**파일**: `src/core/MindMapState.test.ts`  
**커버리지 목표**: 100%  
**Phase**: Phase 3

### 17.2 테스트 카테고리

```typescript
describe('MindMapState', () => {
  describe('Node Operations', () => {
    // addNode, removeNode, getNode, updateNode
  });
  
  describe('Edge Operations', () => {
    // addEdge, removeEdge, getEdge
  });
  
  describe('Metadata Updates', () => {
    // modified timestamp 자동 업데이트
  });
  
  describe('State Serialization', () => {
    // toSchema()
  });
});
```

---

## 18. FileService 테스트

### 18.1 테스트 개요

**파일**: `src/services/FileService.test.ts`  
**커버리지 목표**: 100%  
**Phase**: Phase 2

### 18.2 Atomic Write 테스트

```typescript
describe('FileService - Atomic Write', () => {
  let fileService: FileService;
  let mockVault: any;
  
  beforeEach(() => {
    mockVault = {
      adapter: {
        write: jest.fn().mockResolvedValue(undefined),
        read: jest.fn(),
        rename: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined)
      }
    };
    
    fileService = new FileService(mockVault);
  });
  
  test('TC-FILE-001: writes to temp file first', async () => {
    // Given
    const data = 'test data';
    const filePath = 'test.kknm';
    
    // When
    await fileService.atomicWrite(filePath, data);
    
    // Then
    expect(mockVault.adapter.write).toHaveBeenCalledWith(
      'test.kknm.tmp',
      data
    );
  });
  
  test('TC-FILE-002: verifies write before rename', async () => {
    // Given
    const data = 'test data';
    mockVault.adapter.read.mockResolvedValue(data);
    
    // When
    await fileService.atomicWrite('test.kknm', data);
    
    // Then
    expect(mockVault.adapter.read).toHaveBeenCalledWith('test.kknm.tmp');
  });
  
  test('TC-FILE-003: renames temp to target on success', async () => {
    // Given
    const data = 'test data';
    mockVault.adapter.read.mockResolvedValue(data);
    
    // When
    await fileService.atomicWrite('test.kknm', data);
    
    // Then
    expect(mockVault.adapter.rename).toHaveBeenCalledWith(
      'test.kknm.tmp',
      'test.kknm'
    );
  });
  
  test('TC-FILE-004: cleans up temp file on failure', async () => {
    // Given
    const data = 'test data';
    mockVault.adapter.read.mockResolvedValue('different data');
    
    // When & Then
    await expect(
      fileService.atomicWrite('test.kknm', data)
    ).rejects.toThrow();
    
    expect(mockVault.adapter.remove).toHaveBeenCalledWith('test.kknm.tmp');
  });
});
```

---

## 19. HistoryManager 테스트

### 19.1 테스트 개요

**파일**: `src/services/HistoryManager.test.ts`  
**커버리지 목표**: 100%  
**Phase**: Phase 3

### 19.2 Undo/Redo 사이클 테스트

```typescript
describe('HistoryManager', () => {
  let state: MindMapState;
  let historyManager: HistoryManager;
  
  beforeEach(() => {
    state = new MindMapState(createEmptySchema());
    historyManager = new HistoryManager(state);
  });
  
  test('TC-HIST-001: execute pushes command to undo stack', async () => {
    // Given
    const command = new AddNodeCommand(state, 'node1', 'Test', {x:0, y:0});
    
    // When
    await historyManager.execute(command);
    
    // Then
    expect(historyManager.canUndo()).toBe(true);
  });
  
  test('TC-HIST-002: undo restores previous state', async () => {
    // Given
    const command = new AddNodeCommand(state, 'node1', 'Test', {x:0, y:0});
    const before = JSON.parse(JSON.stringify(state.toSchema()));
    
    await historyManager.execute(command);
    
    // When
    await historyManager.undo();
    
    // Then
    const after = state.toSchema();
    expect(after).toEqual(before);
  });
  
  test('TC-HIST-003: redo applies command again', async () => {
    // Given
    const command = new AddNodeCommand(state, 'node1', 'Test', {x:0, y:0});
    
    await historyManager.execute(command);
    const afterExecute = JSON.parse(JSON.stringify(state.toSchema()));
    
    await historyManager.undo();
    
    // When
    await historyManager.redo();
    
    // Then
    const afterRedo = state.toSchema();
    expect(afterRedo).toEqual(afterExecute);
  });
  
  test('TC-HIST-004: clears redo stack on new execute', async () => {
    // Given
    const cmd1 = new AddNodeCommand(state, 'node1', 'Test', {x:0, y:0});
    const cmd2 = new AddNodeCommand(state, 'node2', 'Test', {x:0, y:0});
    
    await historyManager.execute(cmd1);
    await historyManager.undo();
    
    // When
    await historyManager.execute(cmd2);
    
    // Then
    expect(historyManager.canRedo()).toBe(false);
  });
  
  test('TC-HIST-005: limits undo stack size', async () => {
    // Given
    const maxSize = 100;
    
    // When
    for (let i = 0; i < 150; i++) {
      const cmd = new AddNodeCommand(state, `node${i}`, 'Test', {x:0, y:0});
      await historyManager.execute(cmd);
    }
    
    // Then
    let undoCount = 0;
    while (historyManager.canUndo()) {
      await historyManager.undo();
      undoCount++;
    }
    
    expect(undoCount).toBe(maxSize);
  });
});
```

---

## Part V: 검증 도구

---

## 20. 테스트 실행 가이드

### 20.1 로컬 환경

```bash
# 전체 테스트 실행
npm test

# Watch 모드 (개발 중)
npm run test:watch

# 커버리지 측정
npm run test:coverage

# 특정 파일만 테스트
npm test -- validator.test.ts

# 특정 패턴 테스트
npm test -- --testNamePattern="TC-VAL"
```

### 20.2 CI/CD 환경

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:coverage
      - name: Check coverage threshold
        run: |
          if [ $(jq -r '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 50 ]; then
            echo "Coverage below threshold"
            exit 1
          fi
```

---

## 21. 커버리지 측정

### 21.1 커버리지 보고서

```bash
# HTML 보고서 생성
npm run test:coverage

# 브라우저에서 확인
open coverage/lcov-report/index.html
```

### 21.2 커버리지 해석

```
Coverage Summary:
-----------------
Statements   : 85.5% ( 342/400 )
Branches     : 78.3% ( 94/120 )
Functions    : 92.1% ( 35/38 )
Lines        : 84.2% ( 320/380 )

✅ All metrics above threshold (50%)
```

### 21.3 커버리지 개선

```typescript
// 커버리지가 낮은 부분 확인
npm run test:coverage -- --verbose

// 특정 파일 커버리지 확인
npm run test:coverage -- validator.test.ts
```

---

## 22. Phase Gate 체크리스트

### 22.1 Phase 1 Gate

```
Phase 1 완료 조건:
[ ] npm run build 성공
[ ] npm test 전체 통과
[ ] 테스트 커버리지 50% 이상
[ ] SchemaValidator 테스트 100%
[ ] DisposableRegistry 테스트 100%
[ ] BootDiagnostics 테스트 100%
[ ] Obsidian에서 플러그인 로드 성공
[ ] Command Palette에 명령 표시
[ ] .kknm 파일 생성 가능
[ ] console.error 없음
[ ] Boot Diagnostics 모든 모듈 success
```

### 22.2 Phase 2 Gate

```
Phase 2 완료 조건:
[ ] Phase 1 조건 유지
[ ] 테스트 커버리지 60% 이상
[ ] FileService 테스트 100%
[ ] Atomic Write 검증 완료
[ ] TextFileView 테스트 통과
[ ] 파일 저장/로드 동작 확인
[ ] 회귀 테스트 통과
```

### 22.3 Phase 3 Gate

```
Phase 3 완료 조건:
[ ] Phase 2 조건 유지
[ ] 테스트 커버리지 70% 이상
[ ] 모든 Command 테스트 100%
[ ] MindMapState 테스트 100%
[ ] HistoryManager 테스트 100%
[ ] execute → undo → redo 사이클 검증
[ ] Command 실패 시 롤백 검증
```

### 22.4 Phase 6 Gate (최종)

```
Phase 6 완료 조건:
[ ] Phase 5 조건 유지
[ ] 테스트 커버리지 80% 이상 ⭐
[ ] LayoutEngine 테스트 100%
[ ] AutoAligner 테스트 100%
[ ] 모든 P0/P1 모듈 100% 커버리지
[ ] 회귀 테스트 전체 통과
[ ] Obsidian 수동 테스트 통과
```

---

## 📚 참고 문서

- **KK-NeroMind Architecture v5.2.0** - 헌법 문서 (최상위 권위)
- **KK-NeroMind Coding Guidelines v5.2.0** - 구현 규범
- **KK-NeroMind Development Roadmap v5.2.0** - Phase별 구현 계획
- **Jest Documentation** - https://jestjs.io/docs/getting-started

---

## 📝 문서 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 |
|------|------|---------------|
| v5.2.0 | 2026-01-18 | 초판 작성, Architecture v5.2.0 기반 |

---

**문서 끝**
