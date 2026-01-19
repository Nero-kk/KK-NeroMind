# KK-NeroMind Coding Guidelines v5.2.1

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **문서명** | KK-NeroMind 코딩 가이드라인 |
| **버전** | v5.2.1 |
| **최종 수정일** | 2026-01-18 |
| **기반 아키텍처** | KK-NeroMind Architecture v5.2.0 |
| **대상 AI** | Claude Sonnet 4.5 / Google Antigravity |
| **목적** | AI 에이전트 안전 작동 보장 및 아키텍처 헌법 준수 |

---

## 🚨 TOP-LEVEL STOP RULE (최우선 규칙)

**AI는 다음 조건에서 즉시 THINKING을 중단하고 구현을 멈춘다:**

### STOP 조건 (ABSOLUTE)

1. ⛔ **Heartbeat 누락**
   - Boot Diagnostics에 모듈 등록이 안 되면 즉시 중단
   - Notice로 출력되지 않으면 존재하지 않는 것으로 간주

2. ⛔ **Rule 충돌 감지**
   - 구현 중 Architecture 규칙과 충돌 발견 시
   - Rule ID를 명시하고 인간에게 보고 후 중단

3. ⛔ **Phase Boundary 초과**
   - 현재 Phase에서 정의되지 않은 파일/모듈 접근 시도 시
   - 즉시 중단하고 Phase 범위 위반 보고

4. ⛔ **Schema 불일치**
   - 정의되지 않은 필드 발견 시
   - 자동 보정하지 않고 즉시 보고

### STOP 시 행동 규칙

```typescript
// AI 행동 패턴
if (STOP_CONDITION_DETECTED) {
  1. ⛔ 코딩 즉시 중단
  2. 📢 Rule ID + 충돌 사유 보고
  3. 🚫 임의 수정/우회 구현 금지
  4. 👤 인간 결정 대기
}
```

### 금지된 "계속 진행" 패턴

```typescript
// ❌ 절대 금지
- "일단 구현하고 나중에 수정"
- "TODO로 남기고 다음 진행"
- "임시 방편으로 우회"
- "비슷한 패턴으로 추측 구현"
```

---

## ⚠️ AI CONSTITUTION (ABSOLUTE)

**이 헌법은 모든 AI 에이전트의 최상위 행동 규범이다.**

### Section 1: THINKING MODE STOP CONDITIONS

AI는 다음 상황에서 **추론을 중단**한다:

```
STOP_IF:
  - Heartbeat missing from Console/Notice
  - Rule conflict detected (any Architecture rule)
  - Phase boundary exceeded
  - Schema mismatch found
  - Partial implementation required
  - Generic Node.js pattern needed (Obsidian adapter 필요)
  - File creation not in Target Files
  - Implicit optimization attempted
  - Auto-recovery without explicit design

THEN:
  - STOP all coding activity
  - REPORT Rule ID or condition
  - WAIT for human decision
  - DO NOT attempt workarounds
```

### Section 2: PROHIBITED ACTIONS (절대 금지)

```typescript
❌ NEVER:
1. Guess missing architecture rules
2. Complete partial implementations with TODO
3. Add placeholder code
4. Use generic Node.js I/O (fs, path 등)
5. Implement interfaces without bodies
6. Create "stub" functions
7. Add console.log without specific purpose
8. Modify files not in Target Files list
9. Cross Phase boundaries
10. Infer schema fields from context
11. Create utils/, helpers.ts, constants.ts without explicit request
12. Add caching, memoization, debouncing without explicit request
13. Use async without actual I/O
14. Auto-recover from errors silently
15. Jump between work units before completion
16. Import in reverse dependency direction

✅ ALWAYS:
1. Report conflicts immediately
2. Implement complete functionality only
3. Use Obsidian adapter exclusively
4. Follow Target Files list strictly
5. Stay within current Phase
6. Validate against schema explicitly
7. Write meaningful tests that verify behavior
8. Use async only for actual I/O
9. Propagate errors explicitly
10. Complete one work unit before starting next
11. Follow dependency direction in imports
```

### Section 3: AUTHORITY ORDER (권위 순서)

```
1. Architecture v5.2.0 (헌법)
   ↓
2. Coding Guidelines v5.2.0 (실행 규범)
   ↓
3. Phase Instruction (Phase별 세부사항)
   ↓
4. Human Prompt (현재 작업 지시)
```

**충돌 시 규칙**: 상위 문서가 절대 우선

### Section 4: COMPLETION RULE (완성 규칙)

```
"동작하지 않는 코드는 미완성이 아니라 규칙 위반이다."

❌ 금지:
- TODO 주석으로 남기기
- 인터페이스만 구현
- throw new Error("Not implemented")
- 빈 함수 body

✅ 허용:
- 완전히 동작하는 구현만
- 테스트 통과하는 코드만
```

---

## 🎯 핵심 아키텍처 원칙

구현 시 **절대 지켜야 할 원칙**:

### 도메인 원칙 (Domain Principles)

1. **노드는 움직이지 않는다. 카메라만 움직인다.**
2. **노드는 의미의 단위이고, 카메라는 시선의 단위다.**
3. **사용자의 의도가 언제나 자동 로직보다 우선한다.**

### 데이터 원칙 (Data Principles)

4. **File First** - 파일이 유일한 진실이다
5. **Schema is Law** - Schema가 법이다
6. **Engine Authority** - 메모리 Core State가 데이터 권위다
7. **Command is Truth** - Command만이 변화를 만든다

### 시스템 원칙 (System Principles)

8. **Fail Loudly** - 에러를 숨기지 않는다
9. **Executable or Nothing** - 실행되지 않는 코드는 존재하지 않는 코드다
10. **Notice-First** - 모든 실패는 가시화되어야 한다

---

## 📍 Phase Boundary Rule

### 규칙 정의

**AI는 현재 Phase에서 정의되지 않은 파일/모듈을 절대 생성·수정·참조할 수 없다.**

### Phase별 허용 범위

#### Phase 0: 환경 구축
```
허용:
- package.json
- tsconfig.json
- jest.config.js
- esbuild.config.mjs
- manifest.json
- .gitignore
- README.md

금지:
- src/ 하위 모든 파일
```

#### Phase 1: Zero-to-One
```
허용:
- src/schema/types.ts
- src/schema/validator.ts
- src/schema/validator.test.ts
- src/utils/diagnostic.ts
- src/utils/diagnostic.test.ts
- src/utils/disposable.ts
- src/utils/disposable.test.ts
- src/main.ts

금지:
- src/core/ (Phase 2+)
- src/commands/ (Phase 3+)
- src/services/ (Phase 2+)
- src/views/ (Phase 2+)
```

#### Phase 2 이후
```
각 Phase별 Target Files 명시적 선언 필수
```

### 위반 시 행동

```typescript
if (file_not_in_current_phase(filepath)) {
  STOP_IMMEDIATELY();
  REPORT(`File ${filepath} is not allowed in Phase ${current_phase}.`);
  REPORT(`This file belongs to Phase ${file.phase}.`);
  WAIT_FOR_HUMAN();
}
```

### 파일 생성 완전 봉쇄

```typescript
❌ 절대 금지:
- utils/ 디렉토리 자동 생성
- helpers.ts 파일 생성
- constants.ts 파일 생성
- types.ts 파일 분리 (Phase에서 명시 안 되면)
- shared/ 디렉토리 생성
- common/ 디렉토리 생성
- config/ 디렉토리 생성

✅ 유일한 예외:
- .test.ts 파일 (Target Files에 명시된 모듈에 대해서만)
```

---

## 🟢 Phase 0: 프로젝트 환경 구축

### 0.1 TypeScript 설정

#### ⚠️ 필수 컴파일러 옵션

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,                    // ⭐ 필수
    "noImplicitAny": true,             // ⭐ 필수
    "strictNullChecks": true,          // ⭐ 필수
    "strictFunctionTypes": true,       // ⭐ 필수
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

**이유**: 타입 안전성이 Runtime 에러를 줄임

### 0.2 Jest 설정

#### ⚠️ 커버리지 임계값 설정

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
```

**Phase별 목표**:
- Phase 1: 50%
- Phase 3: 70%
- Phase 6: 80% ⭐

### 0.3 esbuild 설정

```javascript
// esbuild.config.mjs
import esbuild from 'esbuild';

const production = process.argv[2] === 'production';

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/*',
    '@lezer/*'
  ],
  format: 'cjs',
  target: 'es2020',
  logLevel: 'info',
  sourcemap: production ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
}).catch(() => process.exit(1));
```

**주의**: Obsidian 제공 라이브러리는 번들링 제외

### 0.4 Package.json Scripts

```json
{
  "scripts": {
    "build": "node esbuild.config.mjs",
    "build:prod": "node esbuild.config.mjs production",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts"
  }
}
```

---

## 🔴 Phase 1: Zero-to-One (코어 인프라)

### 1.1 플러그인 진입점 (Plugin Entry Point)

#### ⚠️ 필수 구현 패턴

```typescript
// ❌ 잘못된 예
class KKNeroMindPlugin extends Plugin {
  onload() {
    // 바로 초기화 시작
    this.init();
  }
}

// ✅ 올바른 예
class KKNeroMindPlugin extends Plugin {
  private disposableRegistry: DisposableRegistry;
  private bootDiagnostics: BootDiagnostics;
  private mode: 'normal' | 'safe' = 'normal';
  
  async onload(): Promise<void> {
    // 1. Boot Diagnostics 초기화
    this.bootDiagnostics = new BootDiagnostics();
    
    // 2. Disposable Registry 초기화
    this.disposableRegistry = new DisposableRegistry();
    
    try {
      // 3. 설정 로드
      await this.loadSettings();
      this.bootDiagnostics.register('settings', 'success');
      
      // 4. 앱 준비 상태 확인
      this.app.workspace.onLayoutReady(() => {
        this.init();
      });
      
    } catch (error) {
      this.bootDiagnostics.register('core', 'failed', error);
      this.enterSafeMode('Boot failed: ' + error.message);
    }
  }
  
  private init(): void {
    try {
      // 핵심 모듈 초기화
      console.log('[KK-NeroMind] Initializing core modules...');
      
      // Schema Validator
      this.validator = new SchemaValidator();
      this.bootDiagnostics.register('schema-validator', 'success');
      
      // View 등록
      this.registerView(VIEW_TYPE_MINDMAP, /* ... */);
      this.bootDiagnostics.register('view-registration', 'success');
      
      // Command 등록
      this.registerCommands();
      this.bootDiagnostics.register('command-registration', 'success');
      
      // Boot 최종 확인
      const result = this.bootDiagnostics.checkAllModules();
      if (!result.success) {
        console.error('[KK-NeroMind] Boot failed:', result.failedModules);
        this.enterSafeMode('Some modules failed to load');
        return;
      }
      
      console.log('[KK-NeroMind] Plugin loaded successfully');
      new Notice('KK-NeroMind 플러그인이 로드되었습니다.');
      
    } catch (error) {
      console.error('[KK-NeroMind] Init failed:', error);
      this.enterSafeMode('Initialization failed');
    }
  }
  
  private enterSafeMode(reason: string): void {
    this.mode = 'safe';
    
    new Notice(
      `⚠️ KK-NeroMind: Safe Mode\n${reason}\n일부 기능이 비활성화됩니다.`,
      0
    );
    
    console.error('[KK-NeroMind] Entered Safe Mode:', reason);
  }
  
  async onunload(): Promise<void> {
    console.log('[KK-NeroMind] Unloading plugin...');
    this.disposableRegistry.disposeAll();
    console.log('[KK-NeroMind] Plugin unloaded');
  }
}
```

#### 🚨 주의사항

1. **onLayoutReady 사용 필수**
   - Obsidian의 workspace가 완전히 준비되기 전에 DOM 조작하면 오류 발생
   - `this.app.workspace.onLayoutReady()` 안에서 초기화

2. **Boot Diagnostics 필수**
   - 모든 핵심 모듈은 초기화 성공/실패 등록
   - 실패 시 즉시 가시화 (Notice + Console)

3. **async/await 주의**
   - `onload()`는 async여야 함
   - 설정 로드 등 비동기 작업 완료 후 초기화

---
### 1.2 Boot Diagnostics 시스템

#### ⚠️ 필수 구현

```typescript
// src/utils/diagnostic.ts
interface DiagnosticStatus {
  module: string;
  status: 'success' | 'failed';
  error?: Error;
  timestamp: number;
}

class BootDiagnostics {
  private diagnostics: Map<string, DiagnosticStatus> = new Map();
  
  register(module: string, status: 'success' | 'failed', error?: Error): void {
    this.diagnostics.set(module, {
      module,
      status,
      error,
      timestamp: Date.now()
    });
    
    if (status === 'failed') {
      console.error(`[Boot] Module failed: ${module}`, error);
      new Notice(`⚠️ 모듈 로드 실패: ${module}`, 0);
    } else {
      console.log(`[Boot] Module ready: ${module}`);
    }
  }
  
  checkAllModules(): { success: boolean; failedModules: string[] } {
    const failed: string[] = [];
    
    for (const [module, status] of this.diagnostics) {
      if (status.status === 'failed') {
        failed.push(module);
      }
    }
    
    return {
      success: failed.length === 0,
      failedModules: failed
    };
  }
  
  getStatus(module: string): DiagnosticStatus | undefined {
    return this.diagnostics.get(module);
  }
}
```

#### 🚨 주의사항

1. **실패 시 즉시 가시화**
   - Notice 표시 (duration: 0)
   - console.error 기록
   - Safe Mode 진입

2. **모든 핵심 모듈 등록**
   ```typescript
   필수 등록 대상:
   - settings
   - schema-validator
   - view-registration
   - command-registration
   - extension-registration
   - core-services
   ```

### 1.3 Disposable Registry

#### ⚠️ 모든 모듈에 Disposable 구현

```typescript
// src/utils/disposable.ts
interface Disposable {
  dispose(): void;
}

class DisposableRegistry {
  private disposables: Set<Disposable> = new Set();
  
  register(disposable: Disposable): void {
    this.disposables.add(disposable);
  }
  
  unregister(disposable: Disposable): void {
    this.disposables.delete(disposable);
  }
  
  disposeAll(): void {
    for (const disposable of this.disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('[Dispose] Failed to dispose:', error);
        // 에러를 throw하지 않음 (다른 리소스 정리 방해 금지)
      }
    }
    
    this.disposables.clear();
  }
  
  clear(): void {
    this.disposables.clear();
  }
}
```

```typescript
// 사용 예시
class HistoryManager implements Disposable {
  private listeners: Array<{ target: EventTarget; type: string; listener: EventListener }> = [];
  
  init(): void {
    const listener = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', listener);
    this.listeners.push({ target: window, type: 'keydown', listener });
  }
  
  dispose(): void {
    for (const { target, type, listener } of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners = [];
  }
}

// Plugin에서 등록
class KKNeroMindPlugin extends Plugin {
  private disposableRegistry: DisposableRegistry;
  
  async onload(): Promise<void> {
    this.disposableRegistry = new DisposableRegistry();
    
    const historyManager = new HistoryManager();
    historyManager.init();
    this.disposableRegistry.register(historyManager);
  }
  
  async onunload(): Promise<void> {
    this.disposableRegistry.disposeAll();  // 자동으로 모든 리소스 정리
  }
}
```

#### 🚨 주의사항

1. **역순 정리 불필요**
   - DisposableRegistry가 자동 처리
   - 개별 dispose() 실패해도 나머지 계속 진행

2. **에러 처리**
   ```typescript
   dispose(): void {
     try {
       // 정리 작업
     } catch (error) {
       console.error('[Dispose failed]', error);
       // 에러를 throw하지 않음
     }
   }
   ```

### 1.4 Safe Mode 정의

**Safe Mode는 "상태 값"이지 "동작 패턴"이 아니다.**

#### ❌ 금지된 Safe Mode 구현

```typescript
// ❌ 금지: 무한 루프
enterSafeMode(): void {
  while (true) {
    // 대기
  }
}

// ❌ 금지: Promise 대기
enterSafeMode(): void {
  return new Promise(() => {});  // 영원히 pending
}

// ❌ 금지: 이벤트 차단
enterSafeMode(): void {
  this.blockAllEvents();
  this.freezeUI();
}
```

#### ✅ 올바른 Safe Mode 구현

```typescript
class KKNeroMindPlugin extends Plugin {
  private mode: 'normal' | 'safe' = 'normal';
  
  enterSafeMode(reason: string): void {
    this.mode = 'safe';
    
    new Notice(
      `⚠️ KK-NeroMind: Safe Mode\n${reason}\n일부 기능이 비활성화됩니다.`,
      0
    );
    
    console.error('[KK-NeroMind] Entered Safe Mode:', reason);
  }
  
  // 모든 작업에서 상태 확인
  async executeCommand(command: Command): Promise<void> {
    if (this.mode === 'safe') {
      new Notice('Safe Mode에서는 편집할 수 없습니다.');
      return;
    }
    
    await command.execute();
  }
}
```

#### Safe Mode 동작 매트릭스

| 기능 | Normal | Safe |
|------|--------|------|
| 파일 읽기 | ✅ | ✅ |
| 파일 쓰기 | ✅ | ❌ |
| Command 실행 | ✅ | ❌ |
| View 표시 | ✅ | ✅ (Read-Only) |
| 설정 변경 | ✅ | ❌ |
| 플러그인 재시작 | ✅ | ✅ |

---

## 📊 Data Lifecycle (데이터 생명주기)

### 4단계 라이프사이클

```
[Raw File (.kknm)]
       ↓ deserialize()
[Canonical Model]  ← Single Source of Truth
       ↓ command.execute()
[Mutated Model]
       ↓ serialize()
[Persisted File]
```

### 계층별 권한 매트릭스

| 계층 | 읽기 | 쓰기 | 직접 수정 |
|------|------|------|-----------|
| Raw File | Storage만 | Storage만 | ❌ |
| Canonical Model | 모든 계층 | Command만 | ❌ |
| View/UI | ✅ | ❌ | ❌ |

### 코딩 규칙

#### ❌ 금지: UI에서 직접 수정

```typescript
// ❌ 잘못된 예
function onNodeDrag(node: MindMapNode, newPos: Position) {
  node.position = newPos;  // 직접 수정 금지!
  this.saveFile();
}
```

#### ✅ 올바름: Command 경유

```typescript
// ✅ 올바른 예
function onNodeDrag(node: MindMapNode, newPos: Position) {
  const command = new MoveNodeCommand(node.id, newPos);
  this.historyManager.execute(command);  // Command가 상태 변경
}
```

### Derived Data 정의

**파일에 저장하지 않는 데이터**:

```typescript
interface DerivedData {
  // ❌ 파일 저장 금지
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  dragPosition: Position | null;
  viewportBounds: Bounds;
  autoLayoutResult: LayoutResult;
}
```

**규칙**: Canonical Model로부터 항상 재생성 가능해야 함

### Non-Persistent UI State

```typescript
// ❌ isDirty 트리거 금지 항목
interface NonPersistentState {
  camera: CameraState;           // Ephemeral
  selection: Set<string>;        // UI 전용
  viewport: { width, height };   // 디바이스 의존
  isSearchOpen: boolean;         // UI 상태
  isMiniMapVisible: boolean;     // UI 상태
}
```

**주의**: 이들을 변경해도 파일 저장 트리거하지 않음

---

## 🔐 Schema is Law (스키마 검증)

### 절대 규칙

**Schema는 법이다**:
- 스키마에 정의되지 않은 필드는 **존재할 수 없다**
- 추측, 자동 보정, 암묵적 복구는 **전면 금지**
- 위반 시 **즉시 실패(Fail Loudly)**

### Validator 구현

```typescript
// ✅ 올바른 예: 엄격한 검증
class SchemaValidator {
  validate(data: unknown): data is MindMapSchema {
    // 1. 타입 체크
    if (typeof data !== 'object' || data === null) {
      console.error('[Validator] Data is not object');
      return false;
    }
    
    const schema = data as any;
    
    // 2. schemaVersion 검증
    if (typeof schema.schemaVersion !== 'number') {
      console.error('[Validator] Invalid schemaVersion');
      return false;
    }
    
    if (schema.schemaVersion !== 1) {
      console.error(`[Validator] Unsupported version: ${schema.schemaVersion}`);
      return false;
    }
    
    // 3. 필수 필드 검증
    if (!schema.metadata || !schema.nodes || !schema.edges || !schema.camera) {
      console.error('[Validator] Missing required fields');
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
    if (!this.validateEdges(schema.edges)) {
      return false;
    }
    
    // 7. camera 검증
    if (!this.validateCamera(schema.camera)) {
      return false;
    }
    
    return true;
  }
  
  sanitize(data: unknown): MindMapSchema | null {
    // ⚠️ 검증 실패 시 null 반환, 보정 금지
    return this.validate(data) ? (data as MindMapSchema) : null;
  }
  
  private validateMetadata(metadata: any): boolean {
    // 필수 필드 검증
    if (typeof metadata.created !== 'number') {
      console.error('[Validator] Invalid metadata.created');
      return false;
    }
    
    if (typeof metadata.modified !== 'number') {
      console.error('[Validator] Invalid metadata.modified');
      return false;
    }
    
    if (typeof metadata.title !== 'string') {
      console.error('[Validator] Invalid metadata.title');
      return false;
    }
    
    // 타임스탬프 범위 검증
    if (metadata.created < 0) {
      console.error('[Validator] created must be non-negative');
      return false;
    }
    
    if (metadata.modified < 0) {
      console.error('[Validator] modified must be non-negative');
      return false;
    }
    
    // 선택 필드 검증 (있으면)
    if (metadata.author !== undefined && typeof metadata.author !== 'string') {
      console.error('[Validator] Invalid metadata.author');
      return false;
    }
    
    if (metadata.tags !== undefined && !Array.isArray(metadata.tags)) {
      console.error('[Validator] metadata.tags must be array');
      return false;
    }
    
    return true;
  }
  
  // ... 나머지 검증 메서드
}
```

#### 🚨 주의사항

1. **보정 금지**
   ```typescript
   // ❌ 금지: 자동 보정
   if (!data.schemaVersion) {
     data.schemaVersion = 1;  // 절대 금지!
   }
   
   // ✅ 올바름: 즉시 실패
   if (!data.schemaVersion) {
     console.error('[Validator] Missing schemaVersion');
     return false;
   }
   ```

2. **Fail Loudly**
   ```typescript
   // 실패 시 3가지 동작
   1. console.error로 에러 기록
   2. Notice로 사용자에게 알림
   3. null 또는 false 반환 (throw 아님)
   ```

---

## ⚙️ Command 시스템

### Command 원자성 규칙

#### ⚠️ 필수: All-or-Nothing

```typescript
// ✅ 올바른 예: 원자적 실행
class AddNodeCommand implements UndoableCommand {
  private executed = false;
  
  constructor(
    private state: MindMapState,
    private node: MindMapNode
  ) {}
  
  async execute(): Promise<void> {
    try {
      // 1. 사전 검증
      if (!this.node.id || this.node.id.trim() === '') {
        throw new Error('Invalid node ID');
      }
      
      if (this.state.getNode(this.node.id)) {
        throw new Error(`Node ${this.node.id} already exists`);
      }
      
      // 2. 상태 변경
      this.state.addNode(this.node);
      
      // 3. 성공 표시
      this.executed = true;
      
    } catch (error) {
      // 4. 실패 시 롤백
      console.error('[Command failed]', error);
      throw error;  // History stack에 push 안 됨
    }
  }
  
  async undo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot undo - not executed');
    }
    
    this.state.removeNode(this.node.id);
    this.executed = false;
  }
  
  async redo(): Promise<void> {
    await this.execute();
  }
}
```

#### 🚨 주의사항

1. **부분 변경 금지**
   ```typescript
   // ❌ 금지: 부분 성공 상태
   execute(): void {
     this.state.addNode(node);     // 여기서 에러 나면?
     this.state.addEdge(edge);     // 노드만 추가된 상태
   }
   
   // ✅ 올바름: 검증 후 일괄 적용
   execute(): void {
     // 1. 사전 검증
     if (!this.isValid()) {
       throw new Error('Invalid command');
     }
     
     // 2. 원자적 적용
     this.state.addNode(node);
     this.state.addEdge(edge);
   }
   ```

2. **History stack 관리**
   ```typescript
   class HistoryManager {
     async execute(command: UndoableCommand): Promise<void> {
       try {
         await command.execute();
         this.undoStack.push(command);  // 성공 시만 push
         this.redoStack = [];
       } catch (error) {
         // 실패 시 stack에 추가하지 않음
         console.error('[Execute failed]', error);
         new Notice('작업 실패: ' + error.message);
       }
     }
   }
   ```

### Sanitation과 Command 관계

#### ⚠️ Sanitation은 Command에 귀속

```typescript
// ✅ 올바른 예: Command가 Sanitation 포함
class RemoveNodeCommand implements UndoableCommand {
  private removedNode: MindMapNode;
  private removedEdges: Edge[] = [];
  
  constructor(
    private state: MindMapState,
    private nodeId: string
  ) {}
  
  execute(): void {
    // 1. 노드 백업
    const node = this.state.getNode(this.nodeId);
    if (!node) {
      throw new Error(`Node ${this.nodeId} not found`);
    }
    this.removedNode = node;
    
    // 2. 노드 제거
    this.state.removeNode(this.nodeId);
    
    // 3. 고아 엣지 제거 (Sanitation)
    this.removedEdges = this.state.removeOrphanEdges(this.nodeId);
  }
  
  undo(): void {
    // 1. 노드 복원
    this.state.addNode(this.removedNode);
    
    // 2. 엣지도 함께 복원
    for (const edge of this.removedEdges) {
      this.state.addEdge(edge);
    }
  }
}
```

**규칙**: Sanitation은 별도 Command가 아니라 유발한 Command에 포함됨

---
## 💾 Atomic Write (파일 저장)

### 3단계 쓰기

```typescript
// ✅ 올바른 예: Atomic Write
class FileService {
  async atomicWrite(file: TFile, data: string): Promise<void> {
    const tmpPath = `${file.path}.tmp`;
    
    try {
      // 1. 임시 파일 쓰기
      await this.app.vault.adapter.write(tmpPath, data);
      
      // 2. 쓰기 검증
      const written = await this.app.vault.adapter.read(tmpPath);
      if (written !== data) {
        throw new Error('Write verification failed');
      }
      
      // 3. 원자적 교체
      await this.app.vault.adapter.rename(tmpPath, file.path);
      
    } catch (error) {
      // 임시 파일 정리
      try {
        await this.app.vault.adapter.remove(tmpPath);
      } catch {}
      
      throw new Error(`Atomic write failed: ${error.message}`);
    }
  }
}
```

#### 🚨 주의사항

1. **실패 시 정리**
   - .tmp 파일이 남지 않도록 정리
   - 원본 파일은 절대 손상되지 않음

2. **검증 필수**
   ```typescript
   // 쓰기 후 반드시 읽어서 검증
   const written = await read(tmpPath);
   if (written !== data) {
     throw new Error('Data corruption detected');
   }
   ```

---

## 👁️ Observability Rule (가시성 규칙)

### 핵심 원칙

**"보이지 않으면 존재하지 않는다"**

### 3-Layer Visibility

모든 실패/성공은 **최소 2곳 이상**에 기록되어야 함:

```typescript
interface ObservabilityLayers {
  1. Notice: 사용자 가시화 (UI)
  2. Console: 개발자 디버깅 (DevTools)
  3. DiagnosticRegistry: 시스템 상태 추적
}

// 필수: 최소 2개 이상
if (event.critical) {
  new Notice(message, 0);              // Layer 1
  console.error('[Critical]', error);  // Layer 2
  diagnostics.register(id, 'failed');  // Layer 3
}
```

### Console Output Protocol

| 레벨 | 사용 시점 | 프로덕션 | 형식 |
|------|-----------|----------|------|
| `console.error` | 복구 불가능한 오류 | ✅ 유지 | `[Module] Error: message` |
| `console.warn` | 복구 가능하지만 비정상 | ✅ 유지 | `[Module] Warning: message` |
| `console.log` | Phase 완료 확인 | ❌ 제거 | `[Module] Action completed` |
| `console.debug` | 상세 디버깅 | ❌ 제거 | `[Module] Detail: ...` |

### Notice 표시 기준

```typescript
// ✅ Notice 필수
- Boot 실패
- 파일 로드 실패
- Schema 검증 실패
- Command 실행 실패
- 저장 실패

// ❌ Notice 금지
- 정상 동작
- Debug 정보
- Progress 정보
```

### Diagnostic Registry 등록

```typescript
// 모든 핵심 모듈은 등록 필수
class CoreModule {
  init(): void {
    try {
      // 초기화 로직
      this.diagnostics.register('module-name', 'success');
    } catch (error) {
      this.diagnostics.register('module-name', 'failed', error);
      throw error;
    }
  }
}
```

### Heartbeat 규칙

```typescript
// ✅ 올바른 Heartbeat
onload(): void {
  console.log('[KK-NeroMind] Plugin loading...');
  
  // 각 모듈 초기화
  this.initCore();
  console.log('[KK-NeroMind] Core initialized');
  
  this.registerCommands();
  console.log('[KK-NeroMind] Commands registered');
  
  // 최종 확인
  console.log('[KK-NeroMind] Plugin loaded successfully');
}

// ❌ 잘못된 Heartbeat (침묵)
onload(): void {
  this.initCore();
  this.registerCommands();
  // 아무 출력 없음 → 실패로 간주
}
```

---

## ❌ Error State Rule (에러 상태 규칙)

### 핵심 원칙

**Error는 예외가 아니라 "상태"다.**

### Error를 삼키지 말 것

```typescript
// ❌ 금지: Silent Catch
try {
  await dangerousOperation();
} catch (error) {
  // 아무것도 하지 않음
}

// ❌ 금지: Generic Catch
try {
  await operation();
} catch (error) {
  console.log('Failed');  // 너무 모호
}

// ✅ 올바름: Explicit Error State
try {
  await operation();
} catch (error) {
  console.error('[Module] Operation failed:', error);
  new Notice(`작업 실패: ${error.message}`, 5000);
  diagnostics.register('module', 'failed', error);
  
  // 상태를 명시적으로 설정
  this.state = 'error';
  this.lastError = error;
  
  throw error;  // 상위로 전파
}
```

### Error Propagation 규칙

```typescript
// 1. 복구 가능: 처리 후 계속
async loadData(): Promise<Data | null> {
  try {
    return await this.fetch();
  } catch (error) {
    console.warn('[Load] Using fallback');
    return this.getFallback();
  }
}

// 2. 복구 불가: 즉시 전파
async criticalInit(): Promise<void> {
  try {
    await this.initialize();
  } catch (error) {
    console.error('[Init] Critical failure');
    diagnostics.register('init', 'failed', error);
    throw error;  // 반드시 throw
  }
}
```

### Partial Success 금지

```typescript
// ❌ 금지: 부분 성공
async batchOperation() {
  for (const item of items) {
    try {
      await process(item);
    } catch {
      continue;  // 일부만 성공
    }
  }
}

// ✅ 올바름: All-or-Nothing
async batchOperation() {
  const results = [];
  
  for (const item of items) {
    const result = await process(item);
    results.push(result);
  }
  
  // 모두 성공했을 때만 적용
  this.applyResults(results);
}
```

---

## 🎲 Determinism Rule (결정성 규칙)

### 핵심 원칙

**같은 Command 시퀀스 → 같은 결과 상태**

### Testable Determinism

```typescript
// ✅ 결정적 (Deterministic)
class AddNodeCommand {
  constructor(
    private state: MindMapState,
    private nodeId: string,        // 입력으로 받음
    private content: string,       // 입력으로 받음
    private position: Position     // 입력으로 받음
  ) {}
  
  execute(): void {
    const node = {
      id: this.nodeId,
      content: this.content,
      position: this.position
    };
    
    this.state.addNode(node);
  }
}

// ❌ 비결정적 (Non-deterministic)
class AddNodeCommand {
  execute(): void {
    const node = {
      id: generateUUID(),           // 매번 다름
      content: this.content,
      position: {
        x: Math.random() * 100,     // 매번 다름
        y: Date.now()               // 매번 다름
      }
    };
    
    this.state.addNode(node);
  }
}
```

### 금지된 비결정적 소스

```typescript
❌ 금지:
- Math.random()
- Date.now() (Command 내부)
- UUID 생성 (Command 내부)
- 외부 API 호출
- 파일 시스템 상태 의존

✅ 허용:
- Command 생성자 인자
- Canonical Model 상태
- 순수 함수 계산
```

### 테스트 가능성

```typescript
// 모든 Command는 테스트 가능해야 함
describe('AddNodeCommand', () => {
  test('동일 입력 → 동일 결과', () => {
    const state1 = new MindMapState(initialSchema);
    const state2 = new MindMapState(initialSchema);
    
    const node = { id: '1', content: 'test', position: {x:0, y:0} };
    const cmd1 = new AddNodeCommand(state1, node.id, node.content, node.position);
    const cmd2 = new AddNodeCommand(state2, node.id, node.content, node.position);
    
    cmd1.execute();
    cmd2.execute();
    
    expect(state1.toSchema()).toEqual(state2.toSchema());
  });
});
```

### 로그 검증 가능성

```typescript
// 모든 상태 변경은 로그로 추적 가능
class MindMapState {
  addNode(node: MindMapNode): void {
    console.log(`[State] Adding node: ${node.id}`);
    this.nodes[node.id] = node;
    this.metadata.modified = Date.now();
  }
}

// 테스트에서 로그 확인
const logs = captureConsoleLogs();
state.addNode(node);
expect(logs).toContain('[State] Adding node: node1');
```

---

## 🚫 Partial Implementation 금지

### 핵심 원칙

**"부분 구현은 완성이 아니라 위반이다"**

### 금지 패턴

```typescript
// ❌ 금지: TODO 주석
class HistoryManager {
  execute(command: Command): void {
    // TODO: implement undo/redo
    command.execute();
  }
}

// ❌ 금지: 빈 구현
class LayoutEngine {
  calculate(): void {
    // 나중에 구현
  }
}

// ❌ 금지: Not Implemented throw
class FileService {
  async save(): Promise<void> {
    throw new Error('Not implemented yet');
  }
}

// ❌ 금지: 인터페이스만 구현
interface Command {
  execute(): void;
  undo(): void;
}

class MyCommand implements Command {
  execute(): void { }  // 빈 body
  undo(): void { }     // 빈 body
}
```

### 허용 패턴

```typescript
// ✅ 완전한 구현만
class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  
  async execute(command: Command): Promise<void> {
    await command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }
  
  async undo(): Promise<void> {
    const command = this.undoStack.pop();
    if (!command) return;
    
    await command.undo();
    this.redoStack.push(command);
  }
  
  async redo(): Promise<void> {
    const command = this.redoStack.pop();
    if (!command) return;
    
    await command.execute();
    this.undoStack.push(command);
  }
}
```

### 검증 방법

```typescript
// 모든 구현은 테스트로 검증
describe('HistoryManager', () => {
  test('execute → undo → redo 사이클', async () => {
    const state = new MindMapState(initialSchema);
    const manager = new HistoryManager();
    const node = { id: '1', content: 'test', position: {x:0, y:0} };
    
    const command = new AddNodeCommand(state, node.id, node.content, node.position);
    
    // Execute
    await manager.execute(command);
    expect(state.getNode('1')).toBeDefined();
    
    // Undo
    await manager.undo();
    expect(state.getNode('1')).toBeUndefined();
    
    // Redo
    await manager.redo();
    expect(state.getNode('1')).toBeDefined();
  });
});
```

### Phase Gate 검증

```
Phase 완료 전 체크:
[ ] TODO 주석 없음
[ ] 빈 함수 없음
[ ] Not Implemented throw 없음
[ ] 모든 public method 테스트 존재
[ ] 테스트 전체 통과
```

---

## ⚡ No Implicit Optimization (암묵적 최적화 금지)

### 절대 규칙

**명시되지 않은 최적화는 금지다.**

### 금지된 최적화

```typescript
❌ 금지:
1. Caching (캐싱)
   - Map, WeakMap, Set을 사용한 결과 캐싱
   - 메모이제이션
   
2. Debouncing/Throttling
   - 자동 디바운싱
   - 자동 스로틀링
   
3. Lazy Loading
   - 자동 지연 로딩
   - Dynamic import
   
4. Batching
   - 자동 배치 처리
   - 요청 묶기
   
5. Hashing
   - 자동 해시 생성
   - Checksum 계산
```

### 허용되는 경우

```typescript
✅ 명시적 요청이 있을 때만:
- "캐싱을 추가해줘"
- "디바운싱을 구현해줘"
- "Lazy loading을 적용해줘"

// 명시된 경우에도 별도 파일/클래스로 분리
class CacheManager {  // 명시적 요청 후
  private cache = new Map();
  
  get(key: string): any {
    return this.cache.get(key);
  }
  
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
}
```

### STOP 조건

```typescript
if (adding_optimization_not_requested) {
  STOP_IMMEDIATELY();
  REPORT("Implicit optimization detected");
  REPORT("Optimization: ${optimization_type}");
  WAIT_FOR_HUMAN();
}
```

---

## 🧪 Test Quality Gate (테스트 품질 게이트)

### 절대 규칙

**테스트는 존재하는 것이 아니라 검증하는 것이다.**

### 금지된 테스트 패턴

```typescript
❌ 의미 없는 테스트:

// 패턴 1: Existence Test
test('class exists', () => {
  expect(MyClass).toBeDefined();  // ❌
});

// 패턴 2: Instantiation Test
test('can create instance', () => {
  const instance = new MyClass();
  expect(instance).toBeInstanceOf(MyClass);  // ❌
});

// 패턴 3: Type Check Only
test('returns correct type', () => {
  const result = myFunction();
  expect(typeof result).toBe('string');  // ❌
});

// 패턴 4: Mock Everything
test('method called', () => {
  const mock = jest.fn();
  mock();
  expect(mock).toHaveBeenCalled();  // ❌ 실제 로직 테스트 없음
});
```

### 필수 테스트 패턴

```typescript
✅ 의미 있는 테스트:

// 패턴 1: 실제 동작 검증
test('adds node to state', () => {
  const state = new MindMapState(initialSchema);
  const node = { id: '1', content: 'test', position: {x:0, y:0} };
  
  state.addNode(node);
  
  expect(state.getNode('1')).toEqual(node);
  expect(state.nodes).toHaveProperty('1');
});

// 패턴 2: 경계 조건 검증
test('rejects invalid node ID', () => {
  const state = new MindMapState(initialSchema);
  const invalidNode = { id: '', content: 'test', position: {x:0, y:0} };
  
  expect(() => state.addNode(invalidNode)).toThrow('Invalid node ID');
});

// 패턴 3: 상태 변화 검증
test('modified timestamp updates on change', () => {
  const state = new MindMapState(initialSchema);
  const initialTime = state.metadata.modified;
  
  state.addNode(node);
  
  expect(state.metadata.modified).toBeGreaterThan(initialTime);
});
```

### Test Quality Checklist

```
각 테스트는 반드시:
[ ] 실제 동작을 검증하는가?
[ ] 경계 조건을 확인하는가?
[ ] 예상 결과를 명확히 검증하는가?
[ ] Mock 사용이 최소화되었는가?
[ ] 테스트 이름이 검증 내용을 설명하는가?
```

### STOP 조건

```typescript
if (test_only_checks_existence || test_only_checks_type) {
  STOP_IMMEDIATELY();
  REPORT("Low-quality test detected");
  REPORT("Tests must verify actual behavior, not just existence");
  WAIT_FOR_HUMAN();
}
```

---

## ⏱️ Explicit Async Only (명시적 비동기만)

### 절대 규칙

**I/O가 없으면 async를 사용하지 않는다.**

### async 사용 금지

```typescript
❌ 불필요한 async:

// 순수 계산
async function add(a: number, b: number): Promise<number> {  // ❌
  return a + b;
}

// 동기 검증
async function validate(data: unknown): Promise<boolean> {  // ❌
  return typeof data === 'object';
}

// 메모리 접근
async function getNode(id: string): Promise<Node | undefined> {  // ❌
  return this.nodes[id];
}
```

### async 사용 허용

```typescript
✅ 진정한 비동기만:

// 파일 I/O
async function loadFile(path: string): Promise<string> {  // ✅
  return await this.app.vault.read(path);
}

// 네트워크 (현재 프로젝트에서는 사용 안 함)
async function fetchData(url: string): Promise<Data> {  // ✅
  return await fetch(url);
}

// Promise 체인
async function processFile(file: TFile): Promise<void> {  // ✅
  const content = await this.loadFile(file);
  await this.saveFile(file, content);
}
```

### 검증 규칙

```typescript
// async 사용 전 체크리스트
function needsAsync(func): boolean {
  return (
    usesFileIO(func) ||
    usesNetworkIO(func) ||
    callsAsyncFunction(func) ||
    usesObsidianAPI(func)
  );
}

if (isAsync(func) && !needsAsync(func)) {
  STOP_IMMEDIATELY();
  REPORT("Unnecessary async detected");
  WAIT_FOR_HUMAN();
}
```

---
## 🚫 No Auto-Recovery (자동 복구 금지)

### 절대 규칙

**에러는 복구하지 않고 보고한다.**

### 금지된 패턴

```typescript
❌ 자동 복구 시도:

// 패턴 1: Silent Fallback
async loadData(): Promise<Data> {
  try {
    return await this.loadFromFile();
  } catch {
    return this.getDefaultData();  // ❌ 자동 복구
  }
}

// 패턴 2: Retry Loop
async operation() {
  for (let i = 0; i < 3; i++) {  // ❌ 자동 재시도
    try {
      return await this.execute();
    } catch {
      await sleep(1000);
    }
  }
}

// 패턴 3: Alternative Path
async loadConfig() {
  try {
    return await this.loadFromVault();
  } catch {
    try {
      return await this.loadFromStorage();  // ❌ 대안 경로
    } catch {
      return this.getBuiltinConfig();
    }
  }
}
```

### 허용된 패턴

```typescript
✅ 명시적 에러 전파:

// 복구 불가능 → 즉시 전파
async loadFile(path: string): Promise<string> {
  try {
    return await this.vault.read(path);
  } catch (error) {
    console.error(`[FileService] Failed to load: ${path}`, error);
    new Notice(`파일 로드 실패: ${path}`);
    throw error;  // ✅ 전파
  }
}

// 복구 가능 → 명시적 처리
async loadSettings(): Promise<Settings> {
  try {
    return await this.loadFromFile();
  } catch (error) {
    console.warn('[Settings] File not found, using defaults');
    new Notice('설정 파일이 없어 기본값을 사용합니다.');
    return this.getDefaultSettings();  // ✅ 명시적 의도
  }
}
```

### STOP 조건

```typescript
if (auto_recovery_without_explicit_fallback_design) {
  STOP_IMMEDIATELY();
  REPORT("Auto-recovery detected");
  REPORT("Errors must be reported, not silently recovered");
  WAIT_FOR_HUMAN();
}
```

---

## 🔒 Context Stability Check (컨텍스트 안정성 체크)

### 배경

Google Antigravity는 비선형적 컨텍스트 점프 경향이 있음:
- Phase 1 작업 중 갑자기 Phase 3 파일 참조
- 한 파일 작업 중 관련 없는 파일로 점프
- 테스트 작성 중 구현으로 돌아가 수정

### 절대 규칙

**한 번에 하나의 작업 단위만 처리한다.**

### 작업 단위 정의

```typescript
interface WorkUnit {
  type: 'implement' | 'test' | 'refactor';
  targetFiles: string[];  // 정확히 이 파일들만
  dependencies: string[]; // Read-only
  phase: number;
}

// 규칙
1. WorkUnit 완료 전 다른 WorkUnit 시작 금지
2. targetFiles 외 파일 수정 금지
3. dependencies는 읽기만 가능
```

### 금지된 점프 패턴

```typescript
❌ 금지:

// 패턴 1: 구현 중 테스트로 점프
- MindMapState.ts 작성 중
  → MindMapState.test.ts로 점프
    → 다시 MindMapState.ts로 돌아가 수정
      → 무한 왕복

// 패턴 2: 테스트 중 새 파일 생성
- MindMapState.test.ts 작성 중
  → "helper 필요하다" 판단
    → utils/testHelper.ts 생성  // ❌

// 패턴 3: Phase 경계 넘기
- Phase 1: validator.ts 작업 중
  → "Command도 검증 필요" 판단
    → commands/base/Command.ts 참조  // ❌ Phase 3
```

### 허용된 패턴

```typescript
✅ 순차 처리:

// Step 1: 구현 완료
WORK_UNIT_1: {
  type: 'implement',
  targetFiles: ['src/core/MindMapState.ts'],
  status: 'complete'
}

// Step 2: 테스트 작성
WORK_UNIT_2: {
  type: 'test',
  targetFiles: ['src/core/MindMapState.test.ts'],
  dependencies: ['src/core/MindMapState.ts'],  // Read-only
  status: 'complete'
}
```

### STOP 조건

```typescript
if (jumping_to_different_work_unit_before_completion) {
  STOP_IMMEDIATELY();
  REPORT("Context jump detected");
  REPORT("Complete current work unit first");
  WAIT_FOR_HUMAN();
}
```

---

## 📦 Import Discipline (Import 규율)

### 배경

Antigravity는 편의를 위해 import를 자유롭게 추가하는 경향

### 절대 규칙

**Import는 의존성 방향을 따른다.**

### 의존성 방향 (재확인)

```
View → ViewModel → Command → Model ← Storage
                                ↑
                              Schema
```

### 금지된 Import

```typescript
❌ 역방향 Import:

// Model이 View import (금지)
// src/core/MindMapState.ts
import { MindMapView } from '../views/MindMapView';  // ❌

// Storage가 Command import (금지)
// src/services/FileService.ts
import { AddNodeCommand } from '../commands/node/AddNodeCommand';  // ❌

// Schema가 View import (금지)
// src/schema/validator.ts
import { MindMapView } from '../views/MindMapView';  // ❌
```

### 허용된 Import

```typescript
✅ 정방향 Import:

// View가 Model import (허용)
// src/views/MindMapView.ts
import { MindMapState } from '../core/MindMapState';  // ✅

// Command가 Model import (허용)
// src/commands/node/AddNodeCommand.ts
import { MindMapState } from '../../core/MindMapState';  // ✅

// 모두가 Schema import (허용)
// src/core/MindMapState.ts
import { MindMapSchema } from '../schema/types';  // ✅
```

### Obsidian API Import 규칙

```typescript
// ✅ 허용 (Obsidian 기본 제공)
import { Plugin, TFile, Notice, TextFileView } from 'obsidian';

// ❌ 금지 (Obsidian 내부)
import { Workspace } from 'obsidian-internal';  // ❌
import { Vault } from '@types/obsidian';  // ❌
```

### Node.js 기본 모듈 금지

```typescript
// ❌ 절대 금지
import * as fs from 'fs';        // ❌ Obsidian adapter 사용
import * as path from 'path';    // ❌ Obsidian API 사용
import { readFile } from 'fs/promises';  // ❌

// ✅ 대신 사용
// Obsidian Vault API
await this.app.vault.read(file);
await this.app.vault.adapter.write(path, data);
```

### STOP 조건

```typescript
if (import_violates_dependency_direction) {
  STOP_IMMEDIATELY();
  REPORT("Import direction violation");
  REPORT("Importing: ${importPath}");
  REPORT("From: ${currentFile}");
  WAIT_FOR_HUMAN();
}

if (import_uses_nodejs_builtin) {
  STOP_IMMEDIATELY();
  REPORT("Node.js builtin import detected");
  REPORT("Use Obsidian adapter instead");
  WAIT_FOR_HUMAN();
}
```

---

## 🔵 좌표 시스템 주의사항 (핵심)

### 월드 좌표 불변 원칙

#### ⚠️ 절대 규칙

```typescript
// ❌ 잘못된 예: 렌더러가 노드 좌표 수정
function renderNode(node: MindMapNode) {
  node.position.x = screenX / camera.scale - camera.offsetX;  // 절대 금지!
  node.position.y = screenY / camera.scale - camera.offsetY;
}

// ✅ 올바른 예: 노드 좌표는 월드 좌표 그대로, 렌더링만 변환
function renderNode(node: MindMapNode) {
  const screenX = node.position.x * camera.scale + camera.offsetX;
  const screenY = node.position.y * camera.scale + camera.offsetY;
  
  // 렌더링만 수행
  ctx.fillRect(screenX, screenY, node.width, node.height);
}
```

#### 좌표 변환 공식

```typescript
// World → Screen
screenX = worldX * camera.scale + camera.offsetX
screenY = worldY * camera.scale + camera.offsetY

// Screen → World
worldX = (screenX - camera.offsetX) / camera.scale
worldY = (screenY - camera.offsetY) / camera.scale
```

### 카메라 상태 관리

```typescript
// ✅ 올바른 예: 카메라는 Ephemeral State
interface EphemeralState {
  camera: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
  selection: Set<string>;
  hoveredNodeId: string | null;
}

// ❌ 금지: 카메라를 파일에 저장
interface MindMapSchema {
  nodes: Record<string, MindMapNode>;
  edges: Edge[];
  camera: CameraState;  // ❌ Ephemeral이므로 저장 금지
}
```

---

## 🟣 레이아웃 제어 (layoutControlled)

### layoutControlled 플래그

```typescript
interface MindMapNode {
  id: string;
  content: string;
  position: Position;
  layoutControlled: boolean;  // true: 자동 배치, false: 사용자 고정
}
```

### 기본 동작

```typescript
// ✅ 올바른 예: layoutControlled 필터링
class AutoAligner {
  align(nodes: MindMapNode[]): void {
    // layoutControlled === true인 노드만 정렬
    const controllableNodes = nodes.filter(n => n.layoutControlled);
    
    if (controllableNodes.length === 0) {
      console.log('No nodes to auto-align');
      return;
    }
    
    // 자동 배치 계산 및 적용
    controllableNodes.forEach(node => {
      node.position = this.calculatePosition(node);
    });
    
    // layoutControlled === false 노드는 절대 건드리지 않음!
  }
}

// ❌ 잘못된 예: 모든 노드 정렬
function align(nodes: MindMapNode[]): void {
  nodes.forEach(node => {
    node.position = this.calculatePosition(node);  // 사용자 배치 덮어씀!
  });
}
```

### 드래그 시 상태 전환

```typescript
// ✅ 올바른 예: 드래그 시 false로 전환
function onNodeDragEnd(nodeId: string, newPosition: Position) {
  const command = new MoveNodeCommand(
    nodeId,
    newPosition,
    false  // layoutControlled를 false로 설정
  );
  
  this.historyManager.execute(command);
}
```

---

## 📊 공통 주의사항

### 메모리 누수 방지

```typescript
// 이벤트 리스너는 반드시 제거
class SomeComponent implements Disposable {
  private listeners: Array<{ target: EventTarget; type: string; listener: EventListener }> = [];
  
  init(): void {
    const handler = this.handleEvent.bind(this);
    window.addEventListener('resize', handler);
    this.listeners.push({ target: window, type: 'resize', listener: handler });
  }
  
  dispose(): void {
    for (const { target, type, listener } of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners = [];
  }
}
```

### 타입 안전성

```typescript
// Non-null assertion (!) 사용 최소화
// ❌
const node = this.nodes.get(id)!;

// ✅
const node = this.nodes.get(id);
if (!node) {
  throw new Error(`Node not found: ${id}`);
}
```

### 에러 처리

```typescript
// 사용자에게 친절한 에러 메시지
try {
  await this.saveToFile();
} catch (error) {
  console.error('저장 실패:', error);
  new Notice('파일 저장에 실패했습니다. 다시 시도해주세요.');
}
```

---

## ✅ AI 에이전트 작업 체크리스트

### 작업 시작 전

```
[ ] Target Files 리스트를 명확히 받았는가?
[ ] 현재 Phase가 무엇인지 확인했는가?
[ ] Read-only Files와 Target Files를 구분했는가?
[ ] 의존성 방향을 확인했는가?
[ ] Boot Diagnostics에 등록할 모듈 이름을 알고 있는가?
```

### 구현 중

```
[ ] 새 파일을 생성하려는가? → STOP, 확인 필요
[ ] 최적화를 추가하려는가? → STOP, 명시 확인 필요
[ ] async를 추가하려는가? → I/O 있는지 확인
[ ] try/catch로 감싸려는가? → 복구 전략 확인
[ ] import 추가하려는가? → 의존성 방향 확인
[ ] helper 함수를 만들려는가? → STOP, 확인 필요
[ ] TODO 주석을 남기려는가? → STOP, 금지됨
[ ] 빈 함수를 만들려는가? → STOP, 금지됨
```

### 테스트 작성 중

```
[ ] 존재만 확인하는 테스트인가? → 삭제
[ ] 타입만 확인하는 테스트인가? → 삭제
[ ] Mock만 확인하는 테스트인가? → 삭제
[ ] 실제 동작을 검증하는가? → 유지
[ ] 경계 조건을 확인하는가? → 유지
[ ] 테스트 이름이 검증 내용을 설명하는가? → 확인
```

### 완료 전

```
[ ] Target Files만 수정했는가?
[ ] 불필요한 async가 없는가?
[ ] 자동 복구 로직이 없는가?
[ ] 암묵적 최적화가 없는가?
[ ] Import 방향이 올바른가?
[ ] Node.js builtin import가 없는가?
[ ] TODO 주석이 없는가?
[ ] 빈 함수가 없는가?
[ ] 모든 public method에 테스트가 있는가?
[ ] 테스트가 전체 통과하는가?
[ ] npm run build가 성공하는가?
[ ] Obsidian에서 플러그인이 로드되는가?
[ ] console.error가 없는가?
[ ] Boot Diagnostics에 모든 모듈이 등록되었는가?
```

### Phase Gate 통과 조건

```
Phase 완료 전 필수:
[ ] npm run build 성공
[ ] npm test 전체 통과
[ ] 커버리지 목표 달성 (Phase별 목표 참조)
[ ] Obsidian에서 플러그인 로드 성공
[ ] console.error 없음
[ ] Boot Diagnostics 전체 성공
[ ] TODO/빈 함수/Not Implemented 없음
[ ] Phase 범위 내 파일만 수정
```

---

## 🎯 핵심 규칙 요약

### Golden Rules (절대 규칙)

```
1.  File First - 파일이 유일한 진실이다
2.  Schema is Law - 규율이 편의보다 우선한다
3.  Engine Authority - 메모리 Core State가 데이터 권위다
4.  Command is Truth - Command만이 변화를 만든다
5.  Fail Loudly - 에러를 숨기지 않는다
6.  Executable or Nothing - 실행되지 않는 코드는 존재하지 않는 코드다
7.  Notice-First - 모든 실패는 가시화되어야 한다
8.  No Auto-Merge - 자동 병합을 절대 하지 않는다
9.  Atomic Write - 파일 쓰기는 항상 원자적이다
10. No Silent Correction - 암묵적 보정을 절대 하지 않는다
11. Projection Only - View는 파일의 투영일 뿐이다
12. AI Must Not Guess - AI는 추측, 보정, 생성을 하지 않는다
13. Phase Gate Required - Phase Gate 미통과 시 다음 Phase 진입 불가
14. Test Before Merge - 테스트 없는 코드는 merge 불가
15. AI File Boundary - AI는 명시된 파일 범위만 수정한다
16. Human Decision Authority - 설계 결정 권한은 인간에게 있다
17. No Partial Implementation - 부분 구현은 위반이다
18. No Implicit Optimization - 암묵적 최적화는 금지다
19. Test Quality First - 테스트는 존재가 아니라 검증이다
20. Explicit Async Only - I/O 없으면 async 금지
21. No Auto-Recovery - 에러는 복구하지 않고 보고한다
22. Context Stability - 한 번에 하나의 WorkUnit만
23. Import Direction - Import는 의존성 방향을 따른다
```

### AI 에이전트 핵심 제약

```
STOP_IF:
1. Heartbeat missing
2. Rule conflict detected
3. Phase boundary exceeded
4. Schema mismatch found
5. Partial implementation required
6. Implicit optimization attempted
7. Auto-recovery without explicit design
8. File creation not in Target Files
9. Import violates dependency direction
10. Unnecessary async detected

THEN:
- STOP coding immediately
- REPORT Rule ID and reason
- WAIT for human decision
- DO NOT attempt workarounds
```

---

## 📚 참고 문서

- **KK-NeroMind Architecture v5.2.0** - 헌법 문서 (최상위 권위)
- **KK-NeroMind Development Roadmap v5.2.0** - Phase별 구현 계획
- **KK-NeroMind Test Guide v5.2.0** - 테스트 작성 가이드

---

## 📝 문서 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 |
|------|------|---------------|
| v5.2.0 | 2026-01-18 | Architecture v5.2.0 반영, AI 에이전트 안전 규칙 강화 |
| v3.1 | 2026-01-18 | Claude Thinking 모드 대응 |
| v3.0 | 2026-01-18 | Architecture v5.2.0 기본 반영 |
| v2.0 | 2026-01-15 | Architecture v4.2.3 기반 |

---

**문서 끝**
## 🎲 Determinism Rule

### 핵심 원칙

**같은 Command 시퀀스 → 같은 결과 상태**

### Testable Determinism

```typescript
// ✅ 결정적 (Deterministic)
class AddNodeCommand {
  constructor(
    private state: MindMapState,
    private nodeId: string,        // 외부에서 받음
    private content: string,
    private position: Position
  ) {}
  
  execute(): void {
    const node = {
      id: this.nodeId,        // 입력으로 받음
      content: this.content,  // 입력으로 받음
      position: this.position // 입력으로 받음
    };
    
    this.state.addNode(node);
  }
}

// ❌ 비결정적 (Non-deterministic)
class AddNodeCommand {
  execute(): void {
    const node = {
      id: generateUUID(),           // ❌ 매번 다름
      content: this.content,
      position: {
        x: Math.random() * 100,     // ❌ 매번 다름
        y: Date.now()               // ❌ 매번 다름
      }
    };
    
    this.state.addNode(node);
  }
}
```

### 금지된 비결정적 소스

```typescript
❌ 금지:
- Math.random()
- Date.now() (Command 내부)
- UUID 생성 (Command 내부)
- 외부 API 호출
- 파일 시스템 상태 의존

✅ 허용:
- Command 생성자 인자
- Canonical Model 상태
- 순수 함수 계산
```

### 테스트 가능성

```typescript
// 모든 Command는 테스트 가능해야 함
describe('AddNodeCommand', () => {
  test('동일 입력 → 동일 결과', () => {
    const initialSchema = createEmptySchema();
    const state1 = new MindMapState(initialSchema);
    const state2 = new MindMapState(initialSchema);
    
    const node = { id: 'node1', content: 'test', position: {x:0, y:0} };
    const cmd1 = new AddNodeCommand(state1, node.id, node.content, node.position);
    const cmd2 = new AddNodeCommand(state2, node.id, node.content, node.position);
    
    cmd1.execute();
    cmd2.execute();
    
    expect(state1.toSchema()).toEqual(state2.toSchema());
  });
});
```

---

## 🚫 Partial Implementation 금지

### 핵심 원칙

**"부분 구현은 완성이 아니라 위반이다"**

### 금지 패턴

```typescript
// ❌ 금지: TODO 주석
class HistoryManager {
  execute(command: Command): void {
    // TODO: implement undo/redo
    command.execute();
  }
}

// ❌ 금지: 빈 구현
class LayoutEngine {
  calculate(): void {
    // 나중에 구현
  }
}

// ❌ 금지: Not Implemented throw
class FileService {
  async save(): Promise<void> {
    throw new Error('Not implemented yet');
  }
}

// ❌ 금지: 인터페이스만 구현
interface Command {
  execute(): void;
  undo(): void;
}

class MyCommand implements Command {
  execute(): void { }  // 빈 body
  undo(): void { }     // 빈 body
}
```

### 허용 패턴

```typescript
// ✅ 완전한 구현만
class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize = 100;
  
  async execute(command: Command): Promise<void> {
    await command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    
    // 스택 크기 제한
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }
  
  async undo(): Promise<void> {
    const command = this.undoStack.pop();
    if (!command) return;
    
    await command.undo();
    this.redoStack.push(command);
  }
  
  async redo(): Promise<void> {
    const command = this.redoStack.pop();
    if (!command) return;
    
    await command.execute();
    this.undoStack.push(command);
  }
}
```

### Phase Gate 검증

```
Phase 완료 전 체크:
[ ] TODO 주석 없음
[ ] 빈 함수 없음
[ ] Not Implemented throw 없음
[ ] 모든 public method 테스트 존재
[ ] 테스트 전체 통과
[ ] 커버리지 목표 달성
```

---

## ⚡ No Implicit Optimization (Antigravity 전용)

### 절대 규칙

**명시되지 않은 최적화는 금지다.**

### 금지된 최적화

```typescript
❌ 금지:
1. Caching (캐싱)
   - Map, WeakMap, Set을 사용한 결과 캐싱
   - 메모이제이션
   
2. Debouncing/Throttling
   - 자동 디바운싱
   - 자동 스로틀링
   
3. Lazy Loading
   - 자동 지연 로딩
   - Dynamic import
   
4. Batching
   - 자동 배치 처리
   - 요청 묶기
   
5. Hashing
   - 자동 해시 생성
   - Checksum 계산

// ❌ 금지 예시
class SchemaValidator {
  private cache = new Map();  // ❌ 명시 안 된 캐싱
  
  validate(data: unknown): boolean {
    const hash = this.hash(data);  // ❌ 명시 안 된 해싱
    
    if (this.cache.has(hash)) {
      return this.cache.get(hash);  // ❌ Determinism 위반
    }
    
    const result = this.doValidate(data);
    this.cache.set(hash, result);
    return result;
  }
}
```

### 허용되는 경우

```typescript
✅ 명시적 요청이 있을 때만:
- "캐싱을 추가해줘"
- "디바운싱을 구현해줘"
- "Lazy loading을 적용해줘"

// 명시된 경우에도 별도 파일/클래스로 분리
// src/services/CacheManager.ts (명시적 요청 후 생성)
class CacheManager {
  // 캐싱 로직
}
```

### STOP 조건

```typescript
if (adding_optimization_not_requested) {
  STOP_IMMEDIATELY();
  REPORT("No Implicit Optimization Violation");
  REPORT(`Optimization type: ${optimization_type}`);
  REPORT("Optimization was not explicitly requested");
  WAIT_FOR_HUMAN();
}
```

---

## 🧪 Test Quality Gate (Antigravity 전용)

### 절대 규칙

**테스트는 존재하는 것이 아니라 검증하는 것이다.**

### 금지된 테스트 패턴

```typescript
❌ 의미 없는 테스트:

// 패턴 1: Existence Test
test('class exists', () => {
  expect(MyClass).toBeDefined();  // ❌
});

// 패턴 2: Instantiation Test
test('can create instance', () => {
  const instance = new MyClass();
  expect(instance).toBeInstanceOf(MyClass);  // ❌
});

// 패턴 3: Type Check Only
test('returns correct type', () => {
  const result = myFunction();
  expect(typeof result).toBe('string');  // ❌
});

// 패턴 4: Mock Everything
test('method called', () => {
  const mock = jest.fn();
  mock();
  expect(mock).toHaveBeenCalled();  // ❌ 실제 로직 테스트 없음
});
```

### 필수 테스트 패턴

```typescript
✅ 의미 있는 테스트:

// 패턴 1: 실제 동작 검증
test('adds node to state', () => {
  const state = new MindMapState(createEmptySchema());
  const node: MindMapNode = { 
    id: 'node1', 
    content: 'test', 
    position: {x:0, y:0},
    parentId: null,
    direction: 'right',
    layoutControlled: true
  };
  
  state.addNode(node);
  
  expect(state.getNode('node1')).toEqual(node);
  expect(state.nodes).toHaveProperty('node1');
});

// 패턴 2: 경계 조건 검증
test('rejects invalid node ID', () => {
  const state = new MindMapState(createEmptySchema());
  const invalidNode = { 
    id: '', 
    content: 'test', 
    position: {x:0, y:0},
    parentId: null,
    direction: 'right',
    layoutControlled: true
  };
  
  expect(() => state.addNode(invalidNode)).toThrow('Invalid node ID');
});

// 패턴 3: 상태 변화 검증
test('modified timestamp updates on change', () => {
  const state = new MindMapState(createEmptySchema());
  const initialTime = state.metadata.modified;
  
  // 약간의 시간 차이를 보장
  jest.advanceTimersByTime(10);
  
  state.addNode(node);
  
  expect(state.metadata.modified).toBeGreaterThan(initialTime);
});
```

### Test Quality Checklist

```
각 테스트는 반드시:
[ ] 실제 동작을 검증하는가?
[ ] 경계 조건을 확인하는가?
[ ] 예상 결과를 명확히 검증하는가?
[ ] Mock 사용이 최소화되었는가?
[ ] 테스트 이름이 검증 내용을 설명하는가?
[ ] Given-When-Then 구조를 따르는가?
```

### STOP 조건

```typescript
if (test_only_checks_existence || test_only_checks_type) {
  STOP_IMMEDIATELY();
  REPORT("Test Quality Gate Violation");
  REPORT("Low-quality test detected");
  REPORT("Tests must verify actual behavior, not just existence");
  WAIT_FOR_HUMAN();
}
```

---

## ⏱️ Explicit Async Only (Antigravity 전용)

### 절대 규칙

**I/O가 없으면 async를 사용하지 않는다.**

### async 사용 금지

```typescript
❌ 불필요한 async:

// 순수 계산
async function add(a: number, b: number): Promise<number> {  // ❌
  return a + b;
}

// 동기 검증
async function validate(data: unknown): Promise<boolean> {  // ❌
  return typeof data === 'object';
}

// 메모리 접근
async function getNode(id: string): Promise<Node | undefined> {  // ❌
  return this.nodes[id];
}

// 동기 변환
async function worldToScreen(pos: Position): Promise<Position> {  // ❌
  return {
    x: pos.x * this.camera.scale + this.camera.offsetX,
    y: pos.y * this.camera.scale + this.camera.offsetY
  };
}
```

### async 사용 허용

```typescript
✅ 진정한 비동기만:

// 파일 I/O
async function loadFile(path: string): Promise<string> {  // ✅
  return await this.app.vault.adapter.read(path);
}

// 네트워크 (현재 프로젝트에서는 사용 안 함)
async function fetchData(url: string): Promise<Data> {  // ✅
  return await fetch(url);
}

// Promise 체인
async function processFile(file: TFile): Promise<void> {  // ✅
  const content = await this.loadFile(file);
  const validated = await this.validate(content);
  await this.saveFile(file, validated);
}

// Obsidian API (대부분 async)
async function createFile(path: string): Promise<TFile> {  // ✅
  return await this.app.vault.create(path, '');
}
```

### 검증 규칙

```typescript
// async 사용 전 체크리스트
function needsAsync(func): boolean {
  return (
    usesFileIO(func) ||
    usesNetworkIO(func) ||
    callsAsyncFunction(func) ||
    usesObsidianAPI(func)
  );
}

if (isAsync(func) && !needsAsync(func)) {
  STOP_IMMEDIATELY();
  REPORT("Explicit Async Only Violation");
  REPORT(`Function ${func.name} uses async without I/O`);
  WAIT_FOR_HUMAN();
}
```

---

## 🚫 No Auto-Recovery (Antigravity 전용)

### 절대 규칙

**에러는 복구하지 않고 보고한다.**

### 금지된 패턴

```typescript
❌ 자동 복구 시도:

// 패턴 1: Silent Fallback
async loadData(): Promise<Data> {
  try {
    return await this.loadFromFile();
  } catch {
    return this.getDefaultData();  // ❌ 자동 복구
  }
}

// 패턴 2: Retry Loop
async operation() {
  for (let i = 0; i < 3; i++) {  // ❌ 자동 재시도
    try {
      return await this.execute();
    } catch {
      await sleep(1000);
    }
  }
  throw new Error('Failed after 3 attempts');
}

// 패턴 3: Alternative Path
async loadConfig() {
  try {
    return await this.loadFromVault();
  } catch {
    try {
      return await this.loadFromStorage();  // ❌ 대안 경로
    } catch {
      return this.getBuiltinConfig();
    }
  }
}
```

### 허용된 패턴

```typescript
✅ 명시적 에러 전파:

// 복구 불가능 → 즉시 전파
async loadFile(path: string): Promise<string> {
  try {
    return await this.app.vault.adapter.read(path);
  } catch (error) {
    console.error(`[FileService] Failed to load: ${path}`, error);
    new Notice(`파일 로드 실패: ${path}`);
    throw error;  // ✅ 전파
  }
}

// 복구 가능 → 명시적 의도 표현
async loadSettings(): Promise<Settings> {
  try {
    return await this.loadFromFile();
  } catch (error) {
    // ✅ 명시적으로 기본값 사용 의도 표현
    console.warn('[Settings] File not found, using defaults');
    new Notice('설정 파일이 없어 기본값을 사용합니다.');
    return this.getDefaultSettings();
  }
}
```

### STOP 조건

```typescript
if (auto_recovery_without_explicit_fallback_design) {
  STOP_IMMEDIATELY();
  REPORT("No Auto-Recovery Violation");
  REPORT("Errors must be reported, not silently recovered");
  REPORT("If recovery is intended, it must be explicitly designed");
  WAIT_FOR_HUMAN();
}
```

---

## 🔒 Context Stability Check (Antigravity 전용)

### 배경

Antigravity는 비선형적 컨텍스트 점프 경향이 있음:
- Phase 1 작업 중 갑자기 Phase 3 파일 참조
- 한 파일 작업 중 관련 없는 파일로 점프
- 테스트 작성 중 구현으로 돌아가 수정

### 절대 규칙

**한 번에 하나의 작업 단위만 처리한다.**

### 작업 단위 정의

```typescript
interface WorkUnit {
  type: 'implement' | 'test' | 'refactor';
  targetFiles: string[];  // 정확히 이 파일들만
  dependencies: string[]; // Read-only
  phase: number;
}

// 규칙
1. WorkUnit 완료 전 다른 WorkUnit 시작 금지
2. targetFiles 외 파일 수정 금지
3. dependencies는 읽기만 가능
```

### 금지된 점프 패턴

```typescript
❌ 금지:

// 패턴 1: 구현 중 테스트로 점프
- MindMapState.ts 작성 중
  → MindMapState.test.ts로 점프
    → 다시 MindMapState.ts로 돌아가 수정
      → 무한 왕복

// 패턴 2: 테스트 중 새 파일 생성
- MindMapState.test.ts 작성 중
  → "helper 필요하다" 판단
    → utils/testHelper.ts 생성  // ❌

// 패턴 3: Phase 경계 넘기
- Phase 1: validator.ts 작업 중
  → "Command도 검증 필요" 판단
    → commands/base/Command.ts 참조  // ❌ Phase 3
```

### 허용된 패턴

```typescript
✅ 순차 처리:

// Work Unit 1: 구현 완료
WORK_UNIT_1: {
  type: 'implement',
  targetFiles: ['src/core/MindMapState.ts'],
  dependencies: ['src/schema/types.ts'],
  phase: 2,
  status: 'complete'
}

// Work Unit 2: 테스트 작성
WORK_UNIT_2: {
  type: 'test',
  targetFiles: ['src/core/MindMapState.test.ts'],
  dependencies: ['src/core/MindMapState.ts', 'src/schema/types.ts'],
  phase: 2,
  status: 'in-progress'
}
```

### STOP 조건

```typescript
if (jumping_to_different_work_unit_before_completion) {
  STOP_IMMEDIATELY();
  REPORT("Context Stability Violation");
  REPORT("Context jump detected");
  REPORT(`Current Work Unit: ${currentWorkUnit.id}`);
  REPORT(`Attempted jump to: ${attemptedFile}`);
  REPORT("Complete current work unit first");
  WAIT_FOR_HUMAN();
}
```

---

## 📦 Import Discipline (Antigravity 전용)

### 배경

Antigravity는 편의를 위해 import를 자유롭게 추가하는 경향

### 절대 규칙

**Import는 의존성 방향을 따른다.**

### 의존성 방향 (재확인)

```
View → ViewModel → Command → Model ← Storage
                                ↑
                              Schema
```

### 금지된 Import

```typescript
❌ 역방향 Import:

// Model이 View import (금지)
// src/core/MindMapState.ts
import { MindMapView } from '../views/MindMapView';  // ❌

// Storage가 Command import (금지)
// src/services/FileService.ts
import { AddNodeCommand } from '../commands/node/AddNodeCommand';  // ❌

// Schema가 View import (금지)
// src/schema/validator.ts
import { MindMapView } from '../views/MindMapView';  // ❌

// Command가 View import (금지)
// src/commands/node/AddNodeCommand.ts
import { MindMapView } from '../../views/MindMapView';  // ❌
```

### 허용된 Import

```typescript
✅ 정방향 Import:

// View가 Model import (허용)
// src/views/MindMapView.ts
import { MindMapState } from '../core/MindMapState';  // ✅

// Command가 Model import (허용)
// src/commands/node/AddNodeCommand.ts
import { MindMapState } from '../../core/MindMapState';  // ✅

// 모두가 Schema import (허용)
// src/core/MindMapState.ts
import { MindMapSchema, MindMapNode } from '../schema/types';  // ✅

// Storage가 Schema import (허용)
// src/services/FileService.ts
import { MindMapSchema } from '../schema/types';  // ✅
```

### Obsidian API Import 규칙

```typescript
// ✅ 허용 (Obsidian 기본 제공)
import { Plugin, TFile, Notice, MarkdownView } from 'obsidian';

// ❌ 금지 (Obsidian 내부)
import { Workspace } from 'obsidian-internal';  // ❌
import { Vault } from '@types/obsidian';  // ❌
```

### Node.js 기본 모듈 금지

```typescript
// ❌ 절대 금지
import * as fs from 'fs';                    // ❌ Obsidian adapter 사용
import * as path from 'path';                // ❌ Obsidian API 사용
import { readFile } from 'fs/promises';      // ❌
import { join } from 'path';                 // ❌

// ✅ 대신 사용
this.app.vault.adapter.read(filePath);       // ✅
this.app.vault.adapter.write(filePath, data);// ✅
```

### STOP 조건

```typescript
if (import_violates_dependency_direction) {
  STOP_IMMEDIATELY();
  REPORT("Import Discipline Violation");
  REPORT(`Importing: ${importPath}`);
  REPORT(`From: ${currentFile}`);
  REPORT("This violates dependency direction");
  WAIT_FOR_HUMAN();
}

if (import_uses_nodejs_builtin) {
  STOP_IMMEDIATELY();
  REPORT("Import Discipline Violation");
  REPORT(`Node.js builtin import detected: ${importModule}`);
  REPORT("Use Obsidian adapter instead");
  WAIT_FOR_HUMAN();
}
```

---

## 🟡 레이아웃 제어 (layoutControlled)

### 자동 정렬 필터링

#### ⚠️ 기본 규칙

```typescript
// ✅ 올바른 예: layoutControlled 필터링
class AutoAligner {
  align(nodes: MindMapNode[]): void {
    // layoutControlled === true인 노드만 정렬
    const controllableNodes = nodes.filter(node => node.layoutControlled);
    
    if (controllableNodes.length === 0) {
      console.log('[AutoAligner] No controllable nodes');
      return;
    }
    
    // 자동 배치 계산 및 적용
    controllableNodes.forEach(node => {
      node.position = this.calculatePosition(node);
    });
  }
}

// ❌ 잘못된 예: 모든 노드 정렬
class AutoAligner {
  align(nodes: MindMapNode[]): void {
    nodes.forEach(node => {
      node.position = this.calculatePosition(node);  // 사용자 배치 덮어씀!
    });
  }
}
```

#### 🚨 주의사항

1. **드래그 시 layoutControlled 전환**
   ```typescript
   onNodeDragStart(node: MindMapNode): void {
     // 드래그 시작 시 제어 해제
     node.layoutControlled = false;
   }
   ```

2. **Subtree 이동 시 전체 가지 제어 해제**
   ```typescript
   class MoveSubtreeCommand {
     execute(): void {
       const nodesToMove = [
         this.rootNodeId,
         ...getAllDescendants(this.rootNodeId)
       ];
       
       nodesToMove.forEach(nodeId => {
         const node = getNode(nodeId);
         node.position.x += this.deltaX;
         node.position.y += this.deltaY;
         node.layoutControlled = false;  // 전체 가지 제어 해제
       });
     }
   }
   ```

---

## 🟣 인터랙션 우선순위

### Interaction Priority Table

```
1. Reparenting (Alt + Drag)          ← 최우선
2. Camera Lock Toggle (Spacebar)     ← 우선
3. Node Dragging (Subtree)           ← 기본
4. Canvas Panning                    ← 후순위
5. Selection Change                   ← 최하위
```

#### ⚠️ 우선순위 구현

```typescript
function handleMouseDown(event: MouseEvent): void {
  // 1. Reparenting 체크
  if (event.altKey && clickedNode) {
    startReparenting(clickedNode);
    return;  // 다른 작업 중단
  }
  
  // 2. Camera Lock 체크
  if (event.key === ' ') {
    toggleCameraLock();
    return;
  }
  
  // 3. Node Dragging 체크
  if (clickedNode) {
    startNodeDrag(clickedNode);
    return;
  }
  
  // 4. Canvas Panning
  startCanvasPan();
}
```

### 드래그 중 선택 변경 금지

```typescript
// ❌ 잘못된 예: 드래그 중 선택 변경
onMouseMove(event: MouseEvent): void {
  if (this.isDragging) {
    this.updateDragPosition(event);
    this.changeSelection(hoveredNode);  // 금지!
  }
}

// ✅ 올바른 예: 드래그 완료 후 선택
onMouseUp(event: MouseEvent): void {
  if (this.isDragging) {
    this.finishDrag();
    this.changeSelection(this.draggedNode);  // 드래그 완료 후
  }
}
```

---

## 🟢 수동 패닝과 자동 포커싱 충돌 방지

### Manual Pan Suppresses Follow

#### ⚠️ 억제 시간 체크

```typescript
interface EphemeralState {
  lastManualPanAt: number;          // timestamp
  manualPanSuppressionMs: number;   // default: 2000
  isCameraLocked: boolean;
}

function onManualPan(deltaX: number, deltaY: number): void {
  ephemeral.lastManualPanAt = Date.now();
  
  cameraController.applyCameraChange(
    {
      offsetX: camera.offsetX + deltaX,
      offsetY: camera.offsetY + deltaY
    },
    CameraChangeReason.UserPan
  );
}

function centerCameraOnNode(node: MindMapNode): void {
  if (!settings.followSelection) return;
  if (ephemeral.isCameraLocked) return;
  
  // 수동 패닝 직후 체크
  const timeSinceManualPan = Date.now() - ephemeral.lastManualPanAt;
  if (timeSinceManualPan < ephemeral.manualPanSuppressionMs) {
    console.log(`[Camera] Auto-focus suppressed (${timeSinceManualPan}ms ago)`);
    return;
  }
  
  // 포커싱 수행
  cameraController.applyCameraChange(
    {
      offsetX: viewport.width / 2 - node.position.x * camera.scale,
      offsetY: viewport.height / 2 - node.position.y * camera.scale
    },
    CameraChangeReason.AutoFollow
  );
}
```

#### 🚨 주의사항

1. **검색 점프 후에도 억제 적용**
   ```typescript
   function jumpToNode(nodeId: string): void {
     const node = getNode(nodeId);
     
     // 점프 직후 수동 패닝으로 인식
     ephemeral.lastManualPanAt = Date.now();
     
     cameraController.applyCameraChange(
       calculateCenterCamera(node),
       CameraChangeReason.SearchJump
     );
   }
   ```

---

## 🔵 렌더링 주의사항

### SVG Transform Layer

#### ⚠️ 카메라는 transform-layer에만 적용

```typescript
// ✅ 올바른 예: transform-layer 분리
function render(): JSX.Element {
  return (
    <svg width={viewport.width} height={viewport.height}>
      <g 
        id="camera-transform-layer"
        transform={`translate(${camera.offsetX}, ${camera.offsetY}) scale(${camera.scale})`}
      >
        {/* 노드는 월드 좌표 그대로 */}
        {nodes.map(node => (
          <Node 
            key={node.id}
            x={node.position.x}  // 월드 좌표
            y={node.position.y}
            width={node.width}
            height={node.height}
          />
        ))}
      </g>
    </svg>
  );
}

// ❌ 잘못된 예: 노드 DOM에 transform 적용
{nodes.map(node => (
  <Node 
    transform={`translate(${node.position.x * camera.scale}, ${node.position.y * camera.scale})`}
  />
))}
```

#### 🚨 주의사항

1. **단 하나의 transform-layer만 사용**
   - 모든 카메라 변환은 최상위 g 요소에만 적용
   - 개별 노드에는 transform 금지

2. **노드 좌표 계산 금지**
   ```typescript
   // ❌ 렌더러에서 좌표 계산 금지
   <Node x={node.position.x * camera.scale + camera.offsetX} />
   
   // ✅ 월드 좌표 그대로
   <Node x={node.position.x} y={node.position.y} />
   ```

### Fixed Node 시각적 피드백

#### ⚠️ Pin 아이콘 표시

```typescript
// ✅ 올바른 예: layoutControlled 상태 표시
function renderNode(node: MindMapNode): JSX.Element {
  return (
    <g className="node">
      {/* 노드 본체 */}
      <rect 
        x={node.position.x} 
        y={node.position.y}
        width={node.width}
        height={node.height}
      />
      
      {/* Fixed Node 표시 */}
      {!node.layoutControlled && (
        <g className="pin-indicator" 
           transform={`translate(${node.position.x + node.width - 20}, ${node.position.y - 20})`}>
          <text fontSize="16">📌</text>
        </g>
      )}
    </g>
  );
}
```

---

## 🟠 방향성 관리 (DirectionManager)

### 방향 상속 로직

```typescript
// ❌ 잘못된 예: 자식에서 방향 임의 설정
function createChild(parent: MindMapNode, direction: Direction): MindMapNode {
  return { 
    ...newNode, 
    direction  // 부모 방향 무시
  };
}

// ✅ 올바른 예: 부모 방향 상속
function createChild(parent: MindMapNode): MindMapNode {
  // 루트노드가 아니면 부모 방향 상속
  const direction = parent.parentId === null 
    ? determineDirectionByPosition(parent, clickPosition)
    : parent.direction;
  
  return {
    ...newNode,
    direction,
    parentId: parent.id
  };
}
```

### 루트 노드만 방향 선택

```typescript
// ✅ 루트 노드의 자식은 클릭 위치로 방향 결정
function determineDirectionByPosition(
  rootNode: MindMapNode, 
  clickPosition: Position
): Direction {
  return clickPosition.x > rootNode.position.x ? 'right' : 'left';
}
```

---

## 📊 공통 주의사항

### 메모리 누수 방지

```typescript
// ✅ 올바른 예: Disposable 패턴 사용
class SomeComponent implements Disposable {
  private listeners: Array<{ target: EventTarget; type: string; listener: EventListener }> = [];
  
  init(): void {
    const handler = this.handleEvent.bind(this);
    window.addEventListener('resize', handler);
    this.listeners.push({ target: window, type: 'resize', listener: handler });
  }
  
  dispose(): void {
    for (const { target, type, listener } of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners = [];
  }
  
  private handleEvent(e: Event): void {
    // 처리 로직
  }
}
```

### 타입 안전성

```typescript
// ❌ 금지: Non-null assertion (!)
const node = this.nodes.get(id)!;

// ✅ 올바름: 명시적 체크
const node = this.nodes.get(id);
if (!node) {
  throw new Error(`Node not found: ${id}`);
}

// 또는 Optional 처리
const node = this.nodes.get(id);
return node?.content ?? 'No content';
```

### 에러 처리

```typescript
// ✅ 사용자 친화적 에러 메시지
try {
  await this.saveToFile(file, data);
} catch (error) {
  console.error('[FileService] Save failed:', error);
  new Notice(`파일 저장에 실패했습니다: ${error.message}`, 5000);
  throw error;  // 상위로 전파
}
```

---

## 📊 Antigravity 전용 체크리스트

### 작업 시작 전

```
[ ] Target Files 리스트를 명확히 받았는가?
[ ] 현재 Phase가 무엇인지 확인했는가?
[ ] Read-only Files와 Target Files를 구분했는가?
[ ] 의존성 방향을 확인했는가?
[ ] Work Unit 범위를 명확히 정의했는가?
```

### 구현 중

```
[ ] 새 파일을 생성하려는가? → STOP, 확인 필요
[ ] 최적화를 추가하려는가? → STOP, 명시 확인 필요
[ ] async를 추가하려는가? → I/O 있는지 확인
[ ] try/catch로 감싸려는가? → 복구 전략 명시 확인
[ ] import 추가하려는가? → 의존성 방향 확인
[ ] helper 함수를 만들려는가? → STOP, 확인 필요
[ ] 다른 파일로 점프하려는가? → Work Unit 완료 확인
```

### 테스트 작성 중

```
[ ] 존재만 확인하는 테스트인가? → 삭제
[ ] 타입만 확인하는 테스트인가? → 삭제
[ ] Mock만 확인하는 테스트인가? → 삭제
[ ] 실제 동작을 검증하는가? → 유지
[ ] Given-When-Then 구조인가? → 확인
```

### 완료 전

```
[ ] Target Files만 수정했는가?
[ ] 불필요한 async가 없는가?
[ ] 자동 복구 로직이 없는가?
[ ] 암묵적 최적화가 없는가?
[ ] Import 방향이 올바른가?
[ ] Node.js builtin import가 없는가?
[ ] TODO 주석이 없는가?
[ ] 빈 함수가 없는가?
[ ] 모든 public method에 테스트가 있는가?
```

---

## ✅ 통합 체크리스트

### Phase Gate 필수 조건

```
모든 Phase 완료 시 반드시 확인:

[ ] npm run build 성공하는가?
[ ] npm test 전체 통과하는가?
[ ] 커버리지 목표 달성했는가?
[ ] Obsidian에서 플러그인 로드되는가?
[ ] console.error 없는가?
[ ] Safe Mode 진입하지 않는가?
```

### Boot Diagnostics

```
[ ] 모든 핵심 모듈이 등록되었는가?
[ ] 실패 시 Notice 표시되는가?
[ ] Safe Mode 진입 로직이 있는가?
[ ] Heartbeat가 출력되는가?
```

### Disposable Registry

```
[ ] 모든 모듈이 Disposable 구현했는가?
[ ] onunload에서 disposeAll() 호출하는가?
[ ] 이벤트 리스너가 정리되는가?
[ ] 타이머가 정리되는가?
```

### Data Lifecycle

```
[ ] UI에서 직접 state 수정하지 않는가?
[ ] 모든 변경이 Command를 거치는가?
[ ] Derived Data를 파일에 저장하지 않는가?
[ ] Non-Persistent State를 파일에 저장하지 않는가?
```

### Schema 검증

```
[ ] 모든 파일 로드 시 validate() 호출하는가?
[ ] 검증 실패 시 null 반환하는가? (보정 안 함)
[ ] 정의되지 않은 필드가 없는가?
```

### Command 시스템

```
[ ] execute() 실패 시 부분 변경 없는가?
[ ] undo/redo가 정확히 동작하는가?
[ ] Sanitation이 Command에 포함되는가?
[ ] History stack 관리가 올바른가?
```

### Atomic Write

```
[ ] 임시 파일로 먼저 쓰는가?
[ ] 쓰기 후 검증하는가?
[ ] rename으로 교체하는가?
[ ] 실패 시 임시 파일 정리하는가?
```

### Observability

```
[ ] 3-Layer Visibility (Notice, Console, Diagnostics) 사용하는가?
[ ] console.error가 적절히 사용되는가?
[ ] Heartbeat가 출력되는가?
[ ] 실패가 즉시 가시화되는가?
```

### Error Handling

```
[ ] Silent catch가 없는가?
[ ] Generic catch가 없는가?
[ ] Error를 상태로 관리하는가?
[ ] 자동 복구가 없는가?
```

### 좌표 시스템

```
[ ] 노드 좌표는 월드 좌표만 사용하는가?
[ ] Renderer가 노드 좌표를 수정하지 않는가?
[ ] Camera는 Ephemeral State인가?
[ ] 좌표 변환 공식이 올바른가?
```

### 카메라 제어

```
[ ] 모든 카메라 변경이 applyCameraChange()를 사용하는가?
[ ] CameraChangeReason이 명시되어 있는가?
[ ] 직접 camera.offsetX 수정이 없는가?
[ ] 카메라 잠금/해제 쌍이 맞는가?
```

### 레이아웃

```
[ ] AutoAligner가 layoutControlled 필터링을 하는가?
[ ] 드래그 시 layoutControlled가 false로 전환되는가?
[ ] Command에서 layoutControlled 상태를 저장/복원하는가?
```

### 인터랙션

```
[ ] Interaction Priority Table 순서를 지키는가?
[ ] 기본 이동 모드가 Subtree인가?
[ ] 드래그 중 선택 변경이 금지되는가?
[ ] 수동 패닝 후 자동 포커싱이 억제되는가?
```

### 시각화

```
[ ] Fixed Node에 Pin 아이콘이 표시되는가?
[ ] transform-layer가 단 하나만 존재하는가?
[ ] 노드 DOM에 transform이 적용되지 않는가?
```

### AI 작업 (Antigravity)

```
[ ] Target Files가 명시되었는가?
[ ] 명시되지 않은 파일 수정하지 않았는가?
[ ] Rule 충돌 시 즉시 보고했는가?
[ ] 테스트 코드가 포함되었는가?
[ ] TODO가 없는가?
[ ] 빈 함수가 없는가?
[ ] 암묵적 최적화가 없는가?
[ ] 불필요한 async가 없는가?
[ ] 자동 복구가 없는가?
[ ] Context jump가 없는가?
[ ] Import 방향이 올바른가?
```

---

## 🎯 버전 정보

### v5.2.0 변경 사항 요약

#### 신규 추가 (v2.0 대비)

1. **TOP-LEVEL STOP RULE** - AI 중단 조건 명시
2. **AI CONSTITUTION** - 4개 Section으로 구조화
3. **Phase 0: 환경 구축** - TypeScript, Jest, esbuild 설정
4. **Boot Diagnostics** - 모듈 초기화 추적
5. **Disposable Registry** - 자동 리소스 정리
6. **Safe Mode 정의** - 상태 기반 정의
7. **Phase Boundary Rule** - Phase별 파일 접근 제한
8. **Data Lifecycle** - 4단계 생명주기
9. **Schema is Law** - 엄격한 검증 규칙
10. **Command 원자성** - All-or-Nothing
11. **Atomic Write** - 3단계 안전 쓰기
12. **Observability Rule** - 3-Layer Visibility
13. **Error State Rule** - Error는 상태
14. **Determinism Rule** - 테스트 가능성
15. **Partial Implementation 금지** - 완전한 구현만

#### Antigravity 전용 규칙 (신규)

1. **File Creation Lockdown** - 파일 생성 봉쇄
2. **No Implicit Optimization** - 암묵적 최적화 금지
3. **Test Quality Gate** - 의미 있는 테스트만
4. **Explicit Async Only** - I/O 없으면 async 금지
5. **No Auto-Recovery** - 자동 복구 금지
6. **Context Stability Check** - 순차 처리 강제
7. **Import Discipline** - 의존성 방향 강제

#### 유지된 규칙 (v2.0)

1. 핵심 아키텍처 원칙 (3개)
2. 좌표 시스템 (월드 좌표)
3. 카메라 제어
4. 레이아웃 제어 (layoutControlled)
5. 인터랙션 우선순위
6. 렌더링 (SVG transform-layer)
7. 방향성 관리

### 진화 과정

```
v2.0 (2026-01-15)
  - Architecture v4.2.3 기반
  - 인간 개발자를 위한 가이드
  ↓
v5.2.1 (2026-01-18)
  - metadata 필드명 수정 (created, modified, title)
  - _reserved 필드 규칙 삭제 (v1에 없음)
  - Schema v5.2.1 기준 정합성 확보
  - Test Specification v5.2.0과 완벽 일치
  ↓
v5.2.0 (2026-01-18)
  - Architecture v5.2.0 기반
  - AI 에이전트 안전 보증
  - Google Antigravity 특화
  - Claude Sonnet 4.5 Thinking 대응
```

---

**문서 끝**

<!-- 
총 라인 수: ~3,700 줄
섹션 수: 40+
체크리스트 항목: 150+
코드 예시: 100+
-->
