# KK-NeroMind Development Roadmap v5.2.0

> **최종 업데이트**: 2026-01-18  
> **버전**: 5.2.0 (Execution-Guaranteed Roadmap)  
> **문서 지위**: Phase별 실행 가능 개발 로드맵  
> **기반**: Architecture v5.2.0

---

## 📜 Executive Summary

본 로드맵은 **Architecture v5.2.0의 실행 보증 원칙**을 구현하기 위한 단계별 실행 계획이다.

### 핵심 원칙

```
Phase = 실행 가능한 상태 단위 (기능 묶음 ❌)
Test = Phase Gate 통과 조건 (품질 확인 수단 ❌)
80% Coverage = Phase 6에서 달성 (점진적 증가)
Zero-to-One = Phase 1의 필수 통과 조건
```

### 로드맵 구조

```
Phase 0: 환경 구축 (2-3시간)
Phase 1: Zero-to-One (1-2일) ⭐ Obsidian 로드 성공
Phase 2: File I/O (2-3일) - TextFileView + Atomic Write
Phase 3: Command System (3-4일) - Undo/Redo 완성
Phase 4: UI Layer (3-4일) - Canvas 렌더링
Phase 5: Interaction (2-3일) - 드래그 & 편집
Phase 6: Layout Engine (2-3일) ⭐ 80% 커버리지 달성
Phase 7: Full Note (3-4일) - 양방향 동기화
Phase 8: Production (2-3일) - 배포 준비

총 예상 기간: 3-4주
```

---

## 🎯 Phase Gate 시스템

### Phase Gate 정의

모든 Phase는 다음 조건을 **모두** 만족해야 다음 Phase로 진행:

| 조건 | 설명 | 검증 방법 |
|------|------|-----------|
| `obsidianLoad` | 플러그인이 Obsidian에서 실제 로드됨 | 수동 테스트 |
| `unitTestPass` | 최소 1개 이상의 유닛 테스트 통과 | `npm test` |
| `failureVisible` | 실패 시 원인이 명확히 노출됨 | Notice/Console 확인 |
| `buildSuccess` | npm run build 에러 없음 | `npm run build` |
| `coverageTarget` | 해당 Phase 커버리지 목표 달성 | `npm run test:coverage` |

### Phase별 커버리지 목표

| Phase | 목표 | 누적 테스트 파일 | 주요 테스트 영역 |
|-------|------|------------------|-----------------|
| Phase 0 | - | 0 | 환경 설정 검증 |
| Phase 1 | 50% | 3+ | Boot, Validator, Disposable |
| Phase 2 | 60% | 8+ | FileService, Sanitizer, View 기초 |
| Phase 3 | 70% | 15+ | Commands, History, State |
| Phase 4 | 75% | 20+ | Renderer, Layout 기초 |
| Phase 5 | 78% | 25+ | Interaction, Event |
| Phase 6 | **80%** ⭐ | 30+ | **LayoutEngine 완성** |
| Phase 7 | 80% | 35+ | NoteSync, Integration |
| Phase 8 | 80%+ | 40+ | 전체 통합 & E2E |

---

## 📋 Phase 0: 프로젝트 초기화 및 환경 설정

### 목표
Obsidian 플러그인 개발을 위한 완전한 환경 구축

### 소요 시간
- 작업: 2-3시간
- 검증: 30분

### 디렉토리 구조

```
kk-neromind/
├── src/
│   ├── main.ts                 # 플러그인 진입점
│   ├── core/                   # 핵심 상태 관리
│   │   ├── MindMapState.ts
│   │   └── MindMapState.test.ts
│   ├── commands/               # Command 패턴
│   │   ├── base/
│   │   │   ├── Command.ts
│   │   │   └── UndoableCommand.ts
│   │   └── node/
│   ├── services/               # 서비스 레이어
│   │   ├── FileService.ts
│   │   ├── HistoryManager.ts
│   │   └── LayoutEngine.ts
│   ├── views/                  # UI 레이어
│   │   └── MindMapView.ts
│   ├── schema/                 # 데이터 스키마
│   │   ├── types.ts
│   │   └── validator.ts
│   └── utils/                  # 유틸리티
│       ├── diagnostic.ts
│       ├── disposable.ts
│       └── logger.ts
├── tests/
│   ├── integration/            # 통합 테스트
│   └── e2e/                    # E2E 테스트
├── docs/                       # 문서
│   └── KK-NeroMind-Architecture-v5.2.0.md
├── manifest.json
├── versions.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── esbuild.config.mjs
└── README.md
```

### 작업 단계

#### 0.1 프로젝트 생성 및 패키지 설치

```bash
mkdir kk-neromind && cd kk-neromind
git init
npm init -y

# TypeScript
npm install -D typescript @types/node

# Obsidian API
npm install obsidian
npm install -D @types/obsidian

# 빌드 도구
npm install -D esbuild

# 테스트 프레임워크
npm install -D jest ts-jest @types/jest @testing-library/jest-dom
```

#### 0.2 설정 파일 작성

**package.json** - scripts 섹션:
```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc --noEmit && node esbuild.config.mjs production",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "clean": "rm -rf dist main.js main.js.map"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "types": ["jest", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "dist"]
}
```

**jest.config.js**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/main.ts'
  ],
  coverageThreshold: {
    global: { branches: 50, functions: 50, lines: 50, statements: 50 }
  },
  verbose: true
};
```

**esbuild.config.mjs**:
```javascript
import esbuild from 'esbuild';
import process from 'process';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'],
  format: 'cjs',
  target: 'es2020',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod
});

if (prod) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
```

**manifest.json**:
```json
{
  "id": "kk-neromind",
  "name": "KK-NeroMind",
  "version": "0.1.0",
  "minAppVersion": "1.4.0",
  "description": "Apple-style mind mapping with Full Note integration",
  "author": "Nero-kk",
  "authorUrl": "https://github.com/Nero-kk",
  "isDesktopOnly": false
}
```

### Phase 0 완료 기준

```
[ ] npm install 에러 없음
[ ] npm run build 성공
[ ] TypeScript 컴파일 에러 없음
[ ] 모든 설정 파일 생성 완료
[ ] Git 초기화 완료
```

---

## 📋 Phase 1: 최소 실행 가능 플러그인 (Zero-to-One)

### 목표
Obsidian에서 플러그인이 로드되고, Command가 표시되며, .kknm 파일 생성 가능

### 소요 시간
- 작업: 4-6시간
- 테스트: 2-3시간
- 검증: 1시간
- **총 1-2일**

### 핵심 구현 파일

1. **src/schema/types.ts** - 스키마 타입 정의
2. **src/schema/validator.ts** - 스키마 검증
3. **src/utils/disposable.ts** - Disposable Registry
4. **src/utils/diagnostic.ts** - Boot Diagnostics
5. **src/main.ts** - 플러그인 진입점

### 구현 순서

```
1. types.ts 작성 (30분)
2. validator.ts + test 작성 (2시간)
3. disposable.ts + test 작성 (1시간)
4. diagnostic.ts + test 작성 (1.5시간)
5. main.ts 작성 (1시간)
6. Obsidian 테스트 (1시간)
7. 문제 해결 및 조정 (1-2시간)
```

### 1.1 Schema Types 구현

**src/schema/types.ts** - 핵심 내용:

```typescript
export interface MindMapSchema {
  schemaVersion: number;
  metadata: MindMapMetadata;
  nodes: Record<string, MindMapNode>;
  edges: Record<string, MindMapEdge>;
  camera: CameraState;
}

export interface MindMapMetadata {
  created: number;
  modified: number;
  title: string;
  author?: string;
  tags?: string[];
}

export interface MindMapNode {
  id: string;
  content: string;
  position: Position;
  size?: Size;
  style?: NodeStyle;
  linkedNote?: string;  // Full Note 연결
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
  type?: 'solid' | 'dashed' | 'dotted';
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export const CURRENT_SCHEMA_VERSION = 1;
```

### 1.2 Schema Validator 구현

**src/schema/validator.ts** - 핵심 검증 로직:

```typescript
export class SchemaValidator {
  validate(data: unknown): data is MindMapSchema {
    // 1. schemaVersion 검증
    // 2. metadata 검증
    // 3. nodes 검증
    // 4. edges 검증
    // 5. camera 검증
  }
  
  sanitize(data: unknown): MindMapSchema | null {
    return this.validate(data) ? (data as MindMapSchema) : null;
  }
}
```

**테스트 커버리지 목표**: 100%

**src/schema/validator.test.ts** - 주요 테스트:

```typescript
describe('SchemaValidator', () => {
  describe('유효한 스키마', () => {
    test('빈 Mind Map 검증 성공');
    test('노드 있는 Mind Map 검증 성공');
    test('선택적 필드 포함 검증 성공');
  });
  
  describe('schemaVersion 검증', () => {
    test('schemaVersion 없으면 실패');
    test('문자열이면 실패');
    test('소수면 실패');
    test('범위 밖이면 실패');
  });
  
  describe('metadata 검증', () => {
    test('created/modified/title 필수');
    test('created 음수면 실패');
    test('tags 배열 아니면 실패');
  });
  
  describe('nodes 검증', () => {
    test('노드 ID 불일치 실패');
    test('content 없으면 실패');
    test('position NaN 실패');
    test('size 음수 실패');
  });
  
  // ... 총 30+ 테스트
});
```

### 1.3 Disposable Registry 구현

**src/utils/disposable.ts**:

```typescript
export interface Disposable {
  dispose(): void;
}

export class DisposableRegistry implements Disposable {
  private disposables = new Set<Disposable>();
  
  register(disposable: Disposable): void;
  unregister(disposable: Disposable): void;
  dispose(): void;  // 모두 정리, 실패해도 계속 진행
  get count(): number;
}
```

**테스트 커버리지 목표**: 100%

### 1.4 Boot Diagnostics 구현

**src/utils/diagnostic.ts**:

```typescript
export interface ModuleStatus {
  id: string;
  status: 'success' | 'failed';
  error?: Error;
  timestamp: number;
}

export class BootDiagnostics {
  register(moduleId: string, status: 'success' | 'failed', error?: Error);
  checkAllModules(): BootResult;
  getModuleStatus(moduleId: string): ModuleStatus | undefined;
}
```

**핵심 기능**:
- 실패 시 즉시 Notice 표시 (duration: 0)
- console.error 기록
- 성공 시 console.log 기록

**테스트 커버리지 목표**: 100%

### 1.5 Plugin Entry Point 구현

**src/main.ts** - 핵심 구조:

```typescript
export default class KKNeroMindPlugin extends Plugin {
  private bootDiagnostics: BootDiagnostics;
  private disposableRegistry: DisposableRegistry;
  private schemaValidator: SchemaValidator;

  async onload(): Promise<void> {
    // 1. 진단 시스템 초기화
    this.bootDiagnostics = new BootDiagnostics();
    this.disposableRegistry = new DisposableRegistry();
    
    // 2. 핵심 모듈 초기화
    this.initializeCore();
    
    // 3. Command 등록
    this.registerCommands();
    
    // 4. 확장자 등록
    this.registerExtensions(['kknm']);
    
    // 5. Boot 진단
    const bootResult = this.bootDiagnostics.checkAllModules();
    if (!bootResult.success) {
      this.enterSafeMode();
      return;
    }
  }
  
  private async createNewMindMap(): Promise<void> {
    const initialData = {
      schemaVersion: 1,
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        title: 'New Mind Map'
      },
      nodes: {},
      edges: {},
      camera: { x: 0, y: 0, zoom: 1 }
    };
    
    const content = JSON.stringify(initialData, null, 2);
    await this.app.vault.create(`MindMap-${Date.now()}.kknm`, content);
  }
  
  async onunload(): Promise<void> {
    this.disposableRegistry.dispose();
  }
}
```

### Phase 1 Obsidian 수동 테스트 (Zero-to-One Checklist)

```
Phase 1 Zero-to-One Checklist:

[ ] npm run build 에러 없이 완료
[ ] main.js 파일 생성됨
[ ] Obsidian에서 플러그인 활성화 에러 없음
[ ] Command Palette에 "KK-NeroMind: Create New Mind Map" 노출
[ ] 명령 실행 시 .kknm 파일 생성됨
[ ] 파일 재오픈 시 에러 없음
[ ] console.error 없음
[ ] Jest 테스트 3개 이상 통과

세부 테스트:
1. 개발자 콘솔 (Ctrl+Shift+I) 열기
2. 다음 메시지 확인:
   [KK-NeroMind] Plugin loading...
   [KK-NeroMind] Core modules initialized
   [KK-NeroMind] Commands registered
   [KK-NeroMind] Plugin loaded successfully
3. 빨간색 에러 없음 확인
4. Command Palette (Ctrl+P) 열기
5. "KK-NeroMind" 검색
6. "Create New Mind Map" 선택
7. 파일 생성 알림 확인
8. File Explorer에서 .kknm 파일 확인
9. 파일 클릭하여 열기 (텍스트로 표시됨)
10. JSON 형식 확인
```

### Phase 1 완료 기준 (Phase Gate)

```
✅ 필수 조건:
[ ] npm run build 성공
[ ] Obsidian에서 플러그인 로드 성공
[ ] Command Palette에 명령 표시
[ ] .kknm 파일 생성 가능
[ ] Jest 유닛 테스트 전체 통과 (3+ 파일)
[ ] 테스트 커버리지 50% 이상
[ ] console.error 없음
[ ] Zero-to-One Checklist 전체 통과

Git 커밋:
git add .
git commit -m "[Phase 1] Zero-to-One complete"
```

---

## 📋 Phase 2: File I/O 및 TextFileView 구현

### 목표
.kknm 파일을 읽고 쓸 수 있으며, TextFileView로 파일을 열 수 있는 상태

### 소요 시간
- 작업: 5-6시간
- 테스트: 3-4시간
- **총 2-3일**

### 핵심 구현 파일

1. **src/views/MindMapView.ts** - TextFileView 구현
2. **src/services/FileService.ts** - Atomic Write
3. **src/core/Sanitizer.ts** - 데이터 정제
4. **src/main.ts** - View 등록

### 2.1 MindMapView 구현

**src/views/MindMapView.ts** - TextFileView 상속:

```typescript
export const VIEW_TYPE_MINDMAP = 'kknm-mindmap-view';

export class MindMapView extends TextFileView {
  private validator: SchemaValidator;
  private currentData: MindMapSchema | null = null;
  private isDirty = false;

  getViewType(): string {
    return VIEW_TYPE_MINDMAP;
  }

  async onLoadFile(file: TFile): Promise<void> {
    const content = await this.app.vault.read(file);
    const parsed = JSON.parse(content);
    const sanitized = this.validator.sanitize(parsed);
    
    if (!sanitized) {
      throw new Error('Invalid schema');
    }
    
    this.currentData = sanitized;
    this.renderView();
  }

  getViewData(): string {
    return JSON.stringify(this.currentData, null, 2);
  }

  setViewData(data: string, clear: boolean): void {
    if (clear) {
      this.currentData = null;
      return;
    }
    
    const parsed = JSON.parse(data);
    const sanitized = this.validator.sanitize(parsed);
    if (sanitized) {
      this.currentData = sanitized;
      this.renderView();
    }
  }

  clear(): void {
    this.currentData = null;
    this.contentEl.empty();
  }
}
```

### 2.2 FileService with Atomic Write

**src/services/FileService.ts**:

```typescript
export class FileService {
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
      throw error;
    }
  }
}
```

**테스트 커버리지 목표**: 100%

### 2.3 Sanitizer 구현

**src/core/Sanitizer.ts**:

```typescript
export class Sanitizer {
  sanitizeSchema(schema: MindMapSchema): MindMapSchema {
    return {
      schemaVersion: schema.schemaVersion,
      metadata: this.sanitizeMetadata(schema.metadata),
      nodes: this.sanitizeNodes(schema.nodes),
      edges: this.sanitizeEdges(schema.edges),
      camera: this.sanitizeCamera(schema.camera)
    };
  }

  private sanitizeNodes(nodes: Record<string, MindMapNode>) {
    const result: Record<string, MindMapNode> = {};
    
    for (const [id, node] of Object.entries(nodes)) {
      if (!this.isValidId(id)) continue;
      
      result[id] = {
        id: node.id,
        content: this.sanitizeString(node.content),
        position: {
          x: this.sanitizeNumber(node.position.x),
          y: this.sanitizeNumber(node.position.y)
        },
        size: node.size ? {
          width: this.sanitizeNumber(node.size.width),
          height: this.sanitizeNumber(node.size.height)
        } : undefined
      };
    }
    
    return result;
  }

  private sanitizeNumber(value: number): number {
    return typeof value === 'number' && isFinite(value) ? value : 0;
  }

  private sanitizeZoom(zoom: number): number {
    return Math.max(0.1, Math.min(5, this.sanitizeNumber(zoom)));
  }
}
```

**테스트**: NaN, Infinity, 범위 초과 등 엣지 케이스 검증

### 2.4 View 등록 (main.ts 수정)

```typescript
async onload(): Promise<void> {
  // ... 기존 코드
  
  // View 등록
  this.registerView(
    VIEW_TYPE_MINDMAP,
    (leaf) => new MindMapView(this)
  );
  
  // 확장자 연결
  this.registerExtensions(['kknm'], VIEW_TYPE_MINDMAP);
  
  this.bootDiagnostics.register('view', 'success');
}

private async createNewMindMap(): Promise<void> {
  // ... 파일 생성 코드
  
  // 생성한 파일 열기
  const leaf = this.app.workspace.getLeaf(false);
  await leaf.openFile(file);
}
```

### Phase 2 Obsidian 수동 테스트

```
[ ] .kknm 파일 생성 후 자동으로 열림
[ ] 파일 내용이 JSON으로 표시됨 (Phase 2는 텍스트 표시)
[ ] 파일 닫고 다시 열어도 내용 유지
[ ] 잘못된 JSON 파일 열기 시 에러 메시지 표시
[ ] Atomic Write 동작 확인 (.tmp 파일 생성 확인)
```

### Phase 2 완료 기준 (Phase Gate)

```
✅ 필수 조건:
[ ] .kknm 파일 생성 및 열기 성공
[ ] TextFileView 정상 동작
[ ] Atomic Write 검증 완료 (유닛 테스트)
[ ] Sanitation 로직 테스트 통과
[ ] Phase 1 테스트 회귀 없음
[ ] 테스트 커버리지 60% 이상
[ ] 테스트 파일 8개 이상

Git 커밋:
git commit -m "[Phase 2] File I/O and TextFileView complete"
```

---

## 📋 Phase 3: Command 시스템 및 Undo/Redo

### 목표
모든 데이터 변경이 Command를 통해 이루어지며, Undo/Redo가 완벽하게 동작

### 소요 시간
- 작업: 6-8시간
- 테스트: 4-5시간
- **총 3-4일**

### 핵심 구현 파일

1. **src/core/MindMapState.ts** - 상태 관리
2. **src/commands/base/Command.ts** - Command 인터페이스
3. **src/commands/node/AddNodeCommand.ts** - 노드 추가
4. **src/commands/node/UpdateNodeCommand.ts** - 노드 수정
5. **src/services/HistoryManager.ts** - Undo/Redo 관리

### 3.1 MindMapState 구현

**src/core/MindMapState.ts** - 핵심 메서드:

```typescript
export class MindMapState {
  private schema: MindMapSchema;

  // Getters (Read-only)
  get nodes(): Record<string, MindMapNode>;
  get edges(): Record<string, MindMapEdge>;
  get camera(): CameraState;
  getNode(id: string): MindMapNode | undefined;

  // Mutation methods (Command에서만 호출)
  addNode(node: MindMapNode): void;
  removeNode(id: string): void;
  updateNode(id: string, updates: Partial<MindMapNode>): void;
  
  addEdge(edge: MindMapEdge): void;
  removeEdge(id: string): void;
  
  updateCamera(camera: Partial<CameraState>): void;
  
  // Serialization
  toSchema(): MindMapSchema;
  clone(): MindMapState;
}
```

**테스트 커버리지 목표**: 100%

### 3.2 Command Base 클래스

**src/commands/base/Command.ts**:

```typescript
export interface Command {
  execute(): void | Promise<void>;
}

export interface UndoableCommand extends Command {
  undo(): void | Promise<void>;
  redo(): void | Promise<void>;
}
```

**src/commands/base/BaseCommand.ts**:

```typescript
export abstract class BaseUndoableCommand implements UndoableCommand {
  protected state: MindMapState;
  protected executed = false;

  abstract execute(): void | Promise<void>;
  abstract undo(): void | Promise<void>;

  async redo(): Promise<void> {
    if (!this.executed) {
      throw new Error('Cannot redo before execute');
    }
    await this.execute();
  }

  protected markExecuted(): void {
    this.executed = true;
  }

  protected ensureExecuted(): void {
    if (!this.executed) {
      throw new Error('Command not executed');
    }
  }
}
```

### 3.3 Command 구현 예시

**src/commands/node/AddNodeCommand.ts**:

```typescript
export class AddNodeCommand extends BaseUndoableCommand {
  private node: MindMapNode;

  constructor(state: MindMapState, node: MindMapNode) {
    super(state);
    this.node = node;
  }

  execute(): void {
    this.state.addNode(this.node);
    this.markExecuted();
  }

  undo(): void {
    this.ensureExecuted();
    this.state.removeNode(this.node.id);
  }
}
```

**테스트**:
```typescript
describe('AddNodeCommand', () => {
  test('execute: 노드 추가');
  test('undo: 노드 제거');
  test('redo: 노드 재추가');
  test('execute 전 undo 시 에러');
});
```

### 3.4 HistoryManager 구현

**src/services/HistoryManager.ts**:

```typescript
export class HistoryManager {
  private undoStack: UndoableCommand[] = [];
  private redoStack: UndoableCommand[] = [];
  private maxHistorySize = 100;

  async execute(command: UndoableCommand): Promise<void> {
    await command.execute();
    this.undoStack.push(command);
    this.redoStack = []; // redo 스택 초기화
    
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }

  async undo(): Promise<boolean> {
    const command = this.undoStack.pop();
    if (!command) return false;
    
    await command.undo();
    this.redoStack.push(command);
    return true;
  }

  async redo(): Promise<boolean> {
    const command = this.redoStack.pop();
    if (!command) return false;
    
    await command.redo();
    this.undoStack.push(command);
    return true;
  }

  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}
```

**테스트 커버리지 목표**: 100%

### Phase 3 Obsidian 수동 테스트

```
[ ] 노드 추가 → Undo → 노드 사라짐
[ ] 노드 추가 → Undo → Redo → 노드 다시 나타남
[ ] 노드 수정 → Undo → 이전 내용 복원
[ ] 여러 작업 후 Undo 여러 번 → 순차 복원
[ ] Command 실패 시 상태 변경 없음
```

### Phase 3 완료 기준 (Phase Gate)

```
✅ 필수 조건:
[ ] 모든 UndoableCommand 테스트 통과
[ ] execute → undo → redo 사이클 검증
[ ] HistoryManager 상태 일관성 테스트
[ ] Command 실패 시 롤백 검증
[ ] Phase 1-2 테스트 회귀 없음
[ ] 테스트 커버리지 70% 이상
[ ] 테스트 파일 15개 이상

Git 커밋:
git commit -m "[Phase 3] Command system and Undo/Redo complete"
```

---

## 📋 Phase 4: UI 레이어 및 Canvas 렌더링

### 목표
Canvas에 노드와 엣지를 렌더링하고, 기본 표시 기능 동작

### 소요 시간
- 작업: 6-7시간
- 테스트: 3-4시간
- **총 3-4일**

### 핵심 구현 파일

1. **src/views/CanvasRenderer.ts** - Canvas 렌더링
2. **src/views/MindMapView.ts** - View 확장
3. **styles.css** - CSS 스타일

### 4.1 CanvasRenderer 구현

```typescript
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: MindMapState;

  render(): void {
    this.clear();
    this.applyCamera();
    this.renderEdges();
    this.renderNodes();
  }

  private renderNode(node: MindMapNode): void {
    // 배경, 테두리, 텍스트 렌더링
  }

  resize(width: number, height: number): void;
}
```

### 4.2 MindMapView 확장

```typescript
export class MindMapView extends TextFileView {
  private renderer: CanvasRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private renderView(): void {
    this.contentEl.empty();
    
    const container = this.contentEl.createDiv({ cls: 'kknm-canvas-container' });
    this.canvas = container.createEl('canvas');
    
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    this.renderer = new CanvasRenderer(this.canvas, this.state);
    this.renderer.render();
    
    // 리사이즈 옵저버
    const resizeObserver = new ResizeObserver(() => {
      if (this.canvas && this.renderer) {
        this.renderer.resize(container.clientWidth, container.clientHeight);
      }
    });
    resizeObserver.observe(container);
  }
}
```

### Phase 4 완료 기준

```
✅ 필수 조건:
[ ] Canvas 렌더링 정상 동작
[ ] 노드 표시 확인
[ ] 엣지 표시 확인
[ ] 리사이즈 동작 확인
[ ] Phase 1-3 테스트 회귀 없음
[ ] 테스트 커버리지 75% 이상
```

---

## 📋 Phase 5: 인터랙션 및 편집 기능

### 목표
마우스/터치로 노드를 드래그하고 편집할 수 있는 상태

### 소요 시간: 2-3일

### 핵심 구현

1. **src/services/InteractionManager.ts** - 드래그 처리
2. Command 기반 상태 변경

### Phase 5 완료 기준

```
[ ] 노드 드래그 동작
[ ] 드래그 후 Undo/Redo 정상 동작
[ ] 테스트 커버리지 78% 이상
```

---

## 📋 Phase 6: Layout Engine 및 자동 정렬 ⭐

### 목표
노드 자동 배치 및 레이아웃 알고리즘 구현, **80% 커버리지 달성**

### 소요 시간: 2-3일

### 핵심 구현

1. **src/services/LayoutEngine.ts** - 레이아웃 알고리즘
2. Auto Align Command

### Phase 6 완료 기준 ⭐

```
[ ] LayoutEngine 유닛 테스트 통과
[ ] 자동 배치 동작 확인
[ ] 테스트 커버리지 80% 달성
[ ] 테스트 파일 30개 이상
```

---

## 📋 Phase 7: Full Note 통합

### 목표
Mind Map 노드와 Obsidian 노트 양방향 동기화

### 소요 시간: 3-4일

### 핵심 구현

1. **src/services/NoteSync.ts** - 노트 동기화
2. 양방향 업데이트

### Phase 7 완료 기준

```
[ ] Full Note 생성 동작
[ ] 양방향 동기화 동작
[ ] 테스트 커버리지 80% 유지
```

---

## 📋 Phase 8: 최종 통합 및 배포 준비

### 목표
프로덕션 배포 가능 상태

### 소요 시간: 2-3일

### 배포 전 체크리스트

```
[ ] manifest.json 정보 검증
[ ] README.md 작성
[ ] CHANGELOG.md 작성
[ ] 라이선스 파일
[ ] Author 정보 검증
[ ] 프로덕션 빌드 성공
[ ] 테스트 커버리지 80% 이상
[ ] 모든 Phase Gate 통과
```

---

## 📊 전체 테스트 커버리지 전략

### 핵심 로직 100% 커버리지

```
- MindMapState.ts: 100%
- Command 클래스들: 100%
- HistoryManager.ts: 100%
- FileService.ts: 100%
- Sanitizer.ts: 100%
```

### 서비스 레이어 80% 커버리지

```
- LayoutEngine.ts: 80%
- NoteSync.ts: 80%
- InteractionManager.ts: 70%
```

### UI 레이어 60% 커버리지

```
- MindMapView.ts: 70%
- CanvasRenderer.ts: 60%
```

---

**Author**: Nero-kk  
**GitHub**: https://github.com/Nero-kk  
**YouTube**: https://www.youtube.com/@Nero-kkk

---

**Development Roadmap v5.2.0 - Execution-Guaranteed Edition** 🚀
