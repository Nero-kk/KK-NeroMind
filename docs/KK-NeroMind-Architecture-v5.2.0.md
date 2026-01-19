# KK-NeroMind Architecture v5.2.0

> **최종 업데이트**: 2026-01-18  
> **버전**: 5.2.0 (Execution-Guaranteed Architecture)  
> **문서 지위**: **아키텍처 헌법 (Architectural Constitution)**  
> **기반**: v5.1.0 + GPT/Gemini/Claude 통합 보완

---

## ⚠️ AI IMPLEMENTATION CONSTRAINTS (최상위 규칙)

**이 블록은 모든 AI 에이전트가 반드시 준수해야 하는 최상위 규칙이다.**

```
❌ DO NOT mutate Canonical Model outside Command
❌ DO NOT infer missing schema fields
❌ DO NOT auto-fix invalid data
❌ DO NOT write UI state into file
❌ DO NOT create partial success states
❌ DO NOT bypass architecture for convenience
❌ DO NOT modify files not listed in Target Files

✅ PREFER rejection over correction
✅ PREFER explicit failure over silent success
✅ PREFER verbose code over clever code
✅ ALWAYS report Rule ID when conflict detected
```

**위 규칙을 위반한 코드는 정상 동작하더라도 폐기 대상이다.**

---

## 📜 Executive Declaration (핵심 선언)

> **KK-NeroMind는 '기능 완성도'보다 '실행 가능성과 검증 가능성'을 우선한다.**

- **Phase는 구현 단계가 아니라 실행 가능한 상태 단위**이다.
- **테스트는 품질 확인 수단이 아니라 다음 Phase로 이동하기 위한 진입 조건**이다.
- **실패는 은폐 대상이 아니라 즉시 관측·설명·기록되어야 할 신호**이다.
- **데이터는 신성하고, UI는 일시적이며, Command만이 변화를 만든다.** ⭐ v5.2.0

> **⚠️ Thinking 모델은 "똑똑한 개발자"가 아니라**  
> **"통제되지 않으면 설계를 파괴하는 엔진"이다.**

---

## 📜 문서의 지위 및 효력

### 본 문서는 "설명서"가 아니라 "헌법"이다

본 문서는 **KK-NeroMind Architecture v5.2.0의 최상위 헌법 문서**다.

- 본 문서는 설계 문서가 아니다 ❌
- 본 문서는 가이드가 아니다 ❌
- 본 문서는 **아키텍처 헌법(Architectural Constitution)** 이다 ✅
- 본 문서는 **AI 통제 규약(AI Control Protocol)** 이다 ✅✅
- 본 문서는 **실행 보증 계약(Execution Guarantee Contract)** 이다 ✅✅✅

**강제력**:
- ✅ **필수 준수 사항** - 위반 시 명세 위반 버그로 간주
- ✅ **강제 규범** - 구현자의 재량을 허용하지 않음
- ✅ **단일 진실의 원천** - 모든 아키텍처 논의의 최종 기준
- ✅ **실행 가능성 검증 필수** - Phase Gate 미통과 시 진행 불가

**본 헌법과 충돌하는 모든 구현은 명세 위반 버그이며,**  
**본 헌법과 충돌하는 모든 해석은 무효다.**

---

## 🎯 핵심 설계 철학

### 절대 불변 원칙 (Immutable Core Principles)

> **1. 노드는 움직이지 않는다. 카메라만 움직인다.**  
> **2. 노드는 의미의 단위이고, 카메라는 시선의 단위다.**  
> **3. 사용자의 의도가 언제나 자동 로직보다 우선한다.**  
> **4. 파일이 유일한 진실이다 (File First)**  
> **5. Schema가 법이다 (Schema is Law)**  
> **6. 에러를 숨기지 않는다 (Fail Loudly)**  
> **7. 실행되지 않는 코드는 존재하지 않는 코드다 (Executable or Nothing)**  
> **8. 메모리 Core State가 데이터 권위다 (Engine Authority)**  
> **9. Command만이 변화를 만든다 (Command is Truth)** ⭐ v5.2.0

### 이 원칙으로 해결되는 문제

- ✅ 좌표 시스템 완성
- ✅ 파일 저장/동기화 안정화
- ✅ 데이터 손실 방지
- ✅ 다중 뷰 일관성 보장
- ✅ Excalidraw 수준 UX
- ✅ **"코딩은 됐는데 실행은 안 됨" 구조적 차단**
- ✅ **AI 에이전트 폭주 방지**
- ✅ **Sanitation/Undo 책임 경계 확정**
- ✅ **Conflict Lock 완전 봉인**
- ✅ **Phase 1 Zero-to-One 검증 보장** ⭐ v5.2.0

---

## 🖥️ 플랫폼 요구사항 ⭐ v5.2.0 신규

| 항목 | 버전 | 비고 |
|------|------|------|
| Obsidian | >= 1.4.0 | TextFileView 지원 필수 |
| Node.js | >= 18.0.0 | 개발 환경 |
| TypeScript | >= 5.0.0 | strict 모드 필수 |
| esbuild | >= 0.17.0 | 번들러 |

- manifest.json의 `minAppVersion`은 **"1.4.0"** 이상으로 설정
- deprecated API 사용 시 **빌드 경고 → 에러로 처리**

---

# Part I: 실행 보증 아키텍처

## 1. Phase Gate 시스템 (Phase as Executable State)

### 1.1 Phase의 새로운 정의

```
Phase = Obsidian에서 실제 로드되며,
        테스트로 검증되고,
        실패 시 원인을 즉시 확인할 수 있는 상태 단위
```

**Phase ≠ 기능 묶음**  
**Phase = 실행 가능한 상태 단위**

### 1.2 Phase Gate (통과 조건)

모든 Phase 종료 시 아래 조건을 **모두 만족**해야 다음 Phase로 이동할 수 있다.

```typescript
interface PhaseGate {
  conditions: {
    obsidianLoad: boolean;    // 플러그인이 Obsidian에서 실제 로드됨
    unitTestPass: boolean;    // 최소 1개 이상의 유닛 테스트 통과
    failureVisible: boolean;  // 실패 시 원인이 로그/Notice/UI로 명확히 노출됨
    buildSuccess: boolean;    // npm run build 에러 없음 ⭐ v5.2.0
  };
  
  status: 'not_started' | 'in_progress' | 'gate_passed' | 'failed';
}
```

### 1.3 Phase 1 Zero-to-One Checklist ⭐ v5.2.0 신규

다음 항목이 **모두** 통과해야 Phase 1 완료:

```
[ ] npm run build 에러 없이 완료
[ ] main.js 파일이 생성됨
[ ] Obsidian에서 플러그인 활성화 시 에러 없음
[ ] Command Palette에 "KK-NeroMind: Create New Mind Map" 노출
[ ] 해당 명령 실행 시 .kknm 파일 생성됨
[ ] 생성된 파일을 다시 열 때 에러 없음
[ ] console.error 출력 없음
[ ] Jest 테스트 1개 이상 통과 (예: Schema validation)
```

### 1.4 Phase별 Gate 체크리스트

#### Phase 1 Gate
- [ ] Plugin이 Obsidian에서 로드됨 (에러 없음)
- [ ] Command Palette에 명령 1개 이상 노출
- [ ] Jest 테스트 1개 이상 통과
- [ ] console.error 없이 로드됨
- [ ] Zero-to-One Checklist 전체 통과 ⭐ v5.2.0

#### Phase 2 Gate
- [ ] .kknm 파일 생성 가능
- [ ] 파일 로드/저장 동작 확인
- [ ] TextFileView 테스트 통과
- [ ] Sanitation 로직 테스트 통과
- [ ] Atomic Write 검증 완료 ⭐ v5.2.0

#### Phase 3 Gate
- [ ] 모든 UndoableCommand 테스트 통과
- [ ] execute → undo → redo 사이클 검증
- [ ] HistoryManager 상태 일관성 테스트
- [ ] Intent → Schema 변환 테스트 통과
- [ ] Command 실패 시 롤백 검증 ⭐ v5.2.0

#### Phase 4+ Gate
- [ ] 해당 Phase 기능 단위 테스트 전체 통과
- [ ] 이전 Phase 테스트 회귀 없음
- [ ] Obsidian 내 수동 Smoke Test 완료

---

## 2. Test Architecture (Phase 기반 검증 구조)

### 2.1 테스트 계층 구조 (Plugin 현실 버전)

```
Level 1: Pure Logic Test (80%)
├── MindMapState
├── NodeModel
├── Layout 계산
├── Command undo/redo
└── Intent → Schema 변환

Level 2: Obsidian API Mock Test (15%)
├── Obsidian API mock
├── onload 시 서비스 초기화
├── TextFileView 동작
└── 파일 I/O 로직

Level 3: Manual Smoke Test (5%)
└── 실제 Obsidian에서 실행 확인
```

### 2.2 테스트 파일 규약 ⭐ v5.2.0 신규

```
/src
  /core
    MindMapState.ts
    MindMapState.test.ts    ← 동일 폴더, .test.ts 접미사
  /commands
    MoveNodeCommand.ts
    MoveNodeCommand.test.ts
/tests
  /integration              ← Level 2 테스트
  /e2e                      ← Level 3 테스트 (수동)
```

- 단위 테스트: 대상 파일과 **동일 폴더**
- 통합 테스트: `/tests/integration`
- 파일명: `{TargetName}.test.ts`

### 2.3 테스트 기본 계약

```typescript
/**
 * [Architecture Rule]
 * UndoableCommand는 테스트 없이는 merge 불가
 */

interface CommandTestContract {
  testExecute(): void;      // execute → 상태 변화
  testUndo(): void;         // undo → 상태 완전 복구
  testRedo(): void;         // redo → execute와 동일 결과
  testFailureRollback(): void;  // ⭐ v5.2.0: 실패 시 부분 변경 없음
}
```

### 2.4 AI 출력 검증 체크리스트

```typescript
interface AICodeVerification {
  hasRealTestCoverage: boolean;      // 테스트가 실제 검증하는가
  mockMatchesRealAPI: boolean;       // Mock이 실제 API와 일치하는가
  noSideEffectsOnLoad: boolean;      // onload 시 부작용 없는가
  noConsoleErrors: boolean;          // console.error 없는가
  buildSuccessful: boolean;          // ⭐ v5.2.0: 빌드 성공하는가
}
```

---

## 3. Runtime Diagnostic Layer

### 3.1 Boot-Diagnostic Registry ⭐ v5.2.0 신규

```typescript
/**
 * 모든 핵심 모듈은 초기화 성공 여부를 Registry에 등록해야 한다.
 * 하나라도 등록되지 않으면 플러그인은 Safe Mode로 진입한다.
 */
interface BootDiagnosticRegistry {
  modules: Map<string, ModuleStatus>;
  
  register(moduleId: string, status: 'success' | 'failed', error?: Error): void;
  
  checkAllModules(): BootResult;
}

interface ModuleStatus {
  id: string;
  status: 'success' | 'failed';
  error?: Error;
  timestamp: number;
}

class BootDiagnostics {
  private registry = new Map<string, ModuleStatus>();
  
  register(moduleId: string, status: 'success' | 'failed', error?: Error): void {
    this.registry.set(moduleId, { id: moduleId, status, error, timestamp: Date.now() });
    
    if (status === 'failed') {
      // 즉시 대형 Notice 표시
      new Notice(`⛔ Critical: Module [${moduleId}] Initialize Failed\n${error?.message}`, 0);
      console.error(`[KK-NeroMind Boot] ${moduleId} failed:`, error);
    }
  }
  
  checkAllModules(): BootResult {
    const failed = [...this.registry.values()].filter(m => m.status === 'failed');
    
    if (failed.length > 0) {
      return { success: false, failedModules: failed };
    }
    
    return { success: true, failedModules: [] };
  }
}
```

### 3.2 Diagnostic Contract

플러그인 로드 시 **자동 진단**을 수행한다.

```typescript
interface DiagnosticCheck {
  id: string;
  description: string;
  run(): DiagnosticResult;
}

interface DiagnosticResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}
```

### 3.3 실패 시 필수 조치

```typescript
class FailureHandler {
  handleDiagnosticFailure(result: DiagnosticResult): void {
    // 1. Notice 우선 (사용자 인지) ⭐ v5.2.0 강조
    new Notice(`KK-NeroMind: ${result.message}`, 5000);
    
    // 2. console.error 기록
    console.error(`[KK-NeroMind Diagnostic] ${result.message}`, result.details);
    
    // 3. Obsidian 로그 노트 기록
    this.logToNote(result);
  }
}
```

---

## 4. 상태 가시성 아키텍처

### 4.1 공식 노트 구조

```
/KK-NeroMind/
├── 00_Project_Status.md      # 전체 프로젝트 상태
├── 01_Phase_Log.md           # Phase별 진행 기록
├── 02_Diagnostic_Log.md      # 진단 결과 기록
├── 03_Test_Report.md         # 테스트 결과 기록
├── 04_Recovery_Log.md        # 복구 기록 ⭐ v5.2.0
├── AI_Work_Log.md            # AI 작업 로그
└── AI_Failure_Patterns.md    # AI 실패 패턴 기록
```

### 4.2 Phase별 상태 표시

```markdown
## Phase Status
| Phase | Status | Gate Passed | Last Updated |
|-------|--------|-------------|--------------|
| Phase 1 | 🟢 Gate Passed | 2026-01-18 | 2026-01-18 |
| Phase 2 | 🟡 In Progress | - | 2026-01-18 |

## Status Legend
- ⛔ Not Started
- 🟡 In Progress  
- 🟢 Gate Passed
- 🔴 Failed
```

### 4.3 Status Bar 표시 (Phase 2~3)

- `KKNM: OK` - 정상 상태
- `KKNM: ERROR` - 오류 상태 (클릭 시 오류 요약)

---

## 5. Execution Path Architecture

### 5.1 View Type Contract

```typescript
// ✅ 올바른 방식: 단일 상수 선언
const VIEW_TYPE_KKNM = 'kk-neromind-view';

// registerView에서 사용
this.registerView(VIEW_TYPE_KKNM, (leaf) => new NeroMindView(leaf));

// registerExtensions에서 사용
this.registerExtensions(['kknm'], VIEW_TYPE_KKNM);

// TextFileView.getViewType()에서 사용
getViewType(): string {
  return VIEW_TYPE_KKNM;
}

// ❌ 금지: 중복 선언 또는 하드코딩
```

### 5.2 Extension Registration Rule

```typescript
async onload(): Promise<void> {
  // 1. Boot Diagnostic Registry 초기화 ⭐ v5.2.0
  this.bootDiagnostics = new BootDiagnostics();
  
  // 2. registerView 완료
  this.registerView(VIEW_TYPE_KKNM, (leaf) => new NeroMindView(leaf));
  this.bootDiagnostics.register('ViewRegistration', 'success');
  
  // 3. registerExtensions
  this.registerExtensions(['kknm'], VIEW_TYPE_KKNM);
  this.bootDiagnostics.register('ExtensionRegistration', 'success');
  
  // 4. 모든 모듈 체크
  const bootResult = this.bootDiagnostics.checkAllModules();
  if (!bootResult.success) {
    // Safe Mode 진입
    return;
  }
}
```

### 5.3 Ready Guard (Layout Timing Protection)

```typescript
class ReadyGuard {
  async waitForLayout(): Promise<void> {
    if (this.app.workspace.layoutReady) {
      return;
    }
    
    return new Promise((resolve) => {
      this.app.workspace.onLayoutReady(() => resolve());
    });
  }
}
```

---

# Part II: AI Agent 개발 헌법

## 6. AI Agent Constraint

### 6.1 기본 원칙

```typescript
/**
 * [AI Agent Constraint]
 * 
 * - AI는 전체 아키텍처를 이해한다고 가정하지 않는다
 * - 모든 작업은 명시된 Contract와 파일 단위 지시를 따른다
 * - 암묵적 추론에 의존하는 설계는 금지한다
 */
```

### 6.2 File Immutability Rule

```typescript
/**
 * [File Immutability Rule]
 * 
 * - 명시되지 않은 파일 수정 금지
 * - 수정 대상 파일은 항상 리스트로 선언
 * - 구조 변경은 별도 Phase에서만 허용
 */

interface AITaskRequest {
  targetFiles: string[];      // 수정 대상 파일 명시 (필수)
  readOnlyFiles: string[];    // 참조만 가능한 파일
  expectedChanges: string;    // 예상 변경 사항
}
```

### 6.3 Decision Authority Rule

```typescript
/**
 * [Decision Authority Rule]
 * 
 * - 설계 결정 권한: 인간
 * - 구현 세부 사항: AI
 * - 옳고 그름의 최종 판단: 테스트 결과
 */
```

### 6.4 AI Task Unit

```typescript
/**
 * [AI Task Unit]
 * 
 * 1. 단일 책임
 * 2. 테스트 코드 포함
 * 3. 실행 여부를 확인할 수 있는 진입점 존재
 */

interface AITaskUnit {
  responsibility: string;
  testCode: string;
  entryPoint: string;
  targetFiles: string[];
}
```

### 6.5 Parallel Agent Safety Rule

```typescript
/**
 * [Parallel Agent Safety Rule]
 * 
 * - 에이전트 1개 = 파일 그룹 1개
 * - 공유 파일은 오직 Read-only
 * - 병합은 인간이 수행
 * - 자동 병합은 금지
 */
```

### 6.6 Context Trimming Rule

```typescript
/**
 * [Context Trimming Rule]
 * 
 * 현재 Phase와 무관한 파일은
 * 에이전트의 활성 컨텍스트에서 제거한다.
 */
```

### 6.7 Atomic Commit Rule

```typescript
/**
 * [Atomic Commit Rule]
 * 
 * 하나의 미션은 하나의 파일 또는
 * 강하게 연관된 모듈 단위로 제한한다.
 */
```

### 6.8 AI Notice-First Enforcement ⭐ v5.2.0 신규

```typescript
/**
 * [Rule 28-A: AI Notice-First Enforcement]
 * 
 * AI 에이전트가 구현 중 아키텍처 Rule과 충돌을 감지할 경우,
 * 즉시 구현을 중단해야 한다.
 * 
 * 에이전트는 충돌한 Rule ID와 중단 사유를 명시적으로 보고해야 하며,
 * 임의 수정이나 우회 구현을 시도해서는 안 된다.
 */
```

### 6.9 단방향 의존성 규칙 ⭐ v5.2.0 신규

```typescript
/**
 * [Dependency Direction Rule]
 * 
 * 의존성 방향: View → ViewModel → Command → Model ← Storage
 * 
 * - 역방향 의존 금지
 * - View는 Model을 직접 import 금지
 * - Storage는 View를 알지 못한다
 */
```

---

## 7. AI Task Request Template ⭐ v5.2.0 신규

Claude에게 작업 요청 시 다음 형식을 사용한다:

```markdown
## Mission
[한 줄로 명확한 목표]

## Target Files (수정 대상)
- src/core/MindMapState.ts
- src/core/MindMapState.test.ts

## Read-Only Files (참조만)
- KK-NeroMind-Architecture-v5.2.0.md

## Constraints
- [이 작업에서 특별히 지켜야 할 것]

## Success Criteria
- [ ] 빌드 성공
- [ ] 테스트 통과
- [ ] [기능별 체크]

## Out of Scope
- [이 작업에서 하지 말아야 할 것]
```

---

## 8. AI 작업 로그 및 실패 패턴

### 8.1 AI 작업 로그 구조

```
/KK-NeroMind/
├── AI_Work_Log.md
└── AI_Failure_Patterns.md
```

### 8.2 AI_Work_Log.md 템플릿

```markdown
# AI Work Log

## 2026-01-18 Session

### Task 1: [작업 설명]
- **Prompt**: [사용한 프롬프트]
- **Target Files**: [수정 대상 파일]
- **Result**: ✅ Success / ❌ Failed
- **Notes**: [참고 사항]
```

---

# Part III: 데이터 아키텍처

## 9. Data Lifecycle (데이터 생명주기) ⭐ v5.2.0 신규

### 9.1 4단계 라이프사이클

```
[Raw File (.kknm)]
       ↓ deserialize()
[Canonical Model]  ← Single Source of Truth
       ↓ command.execute()
[Mutated Model]
       ↓ serialize()
[Persisted File]
```

### 9.2 계층별 권한

| 계층 | 읽기 | 쓰기 | 직접 수정 |
|------|------|------|-----------|
| Raw File | Storage만 | Storage만 | ❌ |
| Canonical Model | 모든 계층 | Command만 | ❌ |
| Mutated Model | Engine만 | Engine만 | ❌ |
| View/UI | ✅ | ❌ | ❌ |

### 9.3 명시적 규칙

- **UI는 Canonical Model 직접 수정 금지**
- **모든 변경은 Command 경유**
- **View는 읽기 전용 캐시**
- **deserialize 중 데이터 수정 금지**

---

## 10. Single Source of Truth (SSOT)

### 10.1 File-First 원칙

`.kknm` 파일은 **유일한 진실의 원천(Single Source of Truth)** 이다.

```
파일 상태 ─── 절대적 권위 (Absolute Authority)
    ↓
메모리 상태 ─── 캐시 (Cache)
    ↓
UI 상태 ─── 투영 (Projection)
    ↓
ViewModel ─── 파생물 (Derivative)
```

### 10.2 Authority (권위) 원칙

```typescript
/**
 * KK-NeroMind의 데이터 권위는 메모리 내 Core State에 존재한다.
 * 
 * - 파일 시스템 쓰기 이벤트는 권위가 아니라 검증 신호이다.
 * - updatedAt 필드는 참고용 메타데이터이며, 충돌 해결의 결정자가 될 수 없다.
 * - 문자열 기반 diff, 포맷 차이, 메타데이터 재정렬 등은
 *   단독으로 Conflict Lock을 유발해서는 안 된다.
 */
```

### 10.3 Projection Only 원칙

```typescript
// ❌ 금지: UI → 파일 직접 수정
function onNodeDrag(node: MindMapNode, newPos: Position) {
  node.position = newPos;  // 직접 수정 금지!
}

// ✅ 올바름: UI → Intent → Engine → 파일
function onNodeDrag(node: MindMapNode, newPos: Position) {
  const intent = new MoveNodeIntent(node.id, newPos);
  this.intentProcessor.process(intent);
}
```

### 10.4 Derived Data 정의 ⭐ v5.2.0 신규

다음은 **Derived Data**로 분류되며, 파일 저장 대상이 아니다:

```typescript
interface DerivedData {
  // 파일에 저장하지 않음
  edges: Edge[];              // Canonical Model에서 재생성
  autoLayoutResult: LayoutResult;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  focusedNodeId: string | null;
  dragPosition: Position | null;
  viewportBounds: Bounds;
}
```

**규칙**: Derived Data는 Canonical Model로부터 항상 재생성 가능해야 한다.

### 10.5 Non-Persistent UI State

```typescript
// ❌ isDirty 트리거 금지 항목
interface NonPersistentState {
  camera: { offsetX: number; offsetY: number; scale: number; };
  selection: Set<string>;
  highlightedNodeId: string | null;
  viewport: { width: number; height: number; };
  isSearchOpen: boolean;
  isMiniMapVisible: boolean;
  focusedNodeId: string | null;
  currentView: 'canvas' | 'outline';
}
```

---

## 11. Schema is Law & Sanitation

### 11.1 Schema is Law

Schema는 **법**이다.

**강제 규칙**:
- 스키마에 정의되지 않은 필드는 **존재할 수 없다**
- 추측, 자동 보정, 암묵적 복구는 **전면 금지**
- 위반 시 **즉시 실패(Fail Loudly)**

### 11.2 View 확장 원칙 (Additive Only)

```typescript
/**
 * view 섹션은 렌더링 및 UI 표현을 위한 힌트 레이어이며,
 * 노드의 의미(Semantics)나 데이터 해석에 관여하지 않는다.
 * 
 * - view 필드는 최소 기능만을 포함한 상태로 시작한다.
 * - 모든 View 확장은 Additive 방식으로만 확장한다.
 * - View 필드의 존재 여부는 엔진 동작이나 데이터 무결성 판단에 영향을 주지 않는다.
 */
```

### 11.3 Style 필드 제어 규칙

```typescript
/**
 * style 필드는 현재 의미를 가지지 않는 예약 영역이다.
 * 
 * - 화이트리스트에 명시되지 않은 Style 속성이 발견될 경우,
 *   엔진은 즉시 오류를 발생시키고 실행을 중단한다.
 * - 현재 버전에서는 의미 있는 Style 속성은 존재하지 않는다.
 */

const ALLOWED_STYLE_PROPERTIES: string[] = [];  // v5.2.0: 비어있음

class StyleValidator {
  validate(style: Record<string, any>): void {
    for (const key of Object.keys(style)) {
      if (!ALLOWED_STYLE_PROPERTIES.includes(key)) {
        throw new Error(`Unknown style property: ${key}. Fail Loudly.`);
      }
    }
  }
}
```

### 11.4 Schema Extension Slot ⭐ v5.2.0 신규

```json
"meta": {
  "createdWith": "KK-NeroMind",
  "createdAt": 1705555200000,
  "updatedAt": 1705555200000,
  "_reserved": {}
}
```

**규칙**:
- v1에서 `_reserved`는 **반드시 빈 객체**여야 한다
- 값이 있으면 **Fail Loudly**
- v2부터 하위 호환 확장용

### 11.5 Sanitation 처리 원칙

```typescript
/**
 * Sanitation(참조 무결성 정리)은 엔진의 내부 유지보수 동작이다.
 * 
 * - Sanitation은 독립적인 Undo Command로 기록하지 않는다.
 * - Sanitation은 반드시 이를 유발한 사용자 Command에 귀속된다.
 * - Command가 Undo될 경우, Sanitation 결과도 함께 복원된다.
 */

interface SanitationLog {
  triggeredBy: string;      // 유발한 Command ID
  removedEdges: string[];   // 정리된 엣지 ID 목록
  timestamp: number;
}
```

### 11.6 Sanitation 허용 시점 (Strict Timing Rule)

✅ **허용**: 파일 로드, 명시적 검증, 마이그레이션

❌ **금지**: 렌더링, 인터랙션, 편집, Projection

---

## 12. Command System

### 12.1 Command 원자성 규칙 ⭐ v5.2.0 신규

```typescript
/**
 * Command는 반드시 원자적(Atomic)이어야 한다.
 * 
 * execute() 중 예외 발생 시:
 * - 부분 변경 금지
 * - History stack push 금지
 * - 실패는 UI에만 전달, 데이터는 그대로 유지
 */

abstract class UndoableCommand {
  abstract execute(): CommandResult;
  abstract undo(): void;
  abstract redo(): void;
  
  // ⭐ v5.2.0: 실패 시 롤백 보장
  protected executeWithRollback(action: () => void): CommandResult {
    const snapshot = this.createSnapshot();
    
    try {
      action();
      return { success: true };
    } catch (e) {
      this.restoreSnapshot(snapshot);
      return { success: false, error: e };
    }
  }
}
```

### 12.2 Intent 순수성 규약

Intent는 **선언적이며 부작용이 없어야** 한다.

**Intent는 절대 다음을 수행하지 않는다**:
- 데이터 정규화
- 스키마 보정
- Sanitation
- 상태 변경
- 추론 또는 보완

---

## 13. Dirty State, Timestamp & Undo/Redo

### 13.1 Timestamp의 권위

`updatedAt`은 **오직 직렬화 시점**에만 갱신된다.

### 13.2 Undo/Redo 연계

Undo/Redo 결과가 마지막 직렬화 상태와 동일해질 경우, **isDirty는 반드시 해제**되어야 한다.

---

## 14. 파일 시스템 아키텍처

### 14.1 TextFileView 상속 (필수)

```typescript
export class NeroMindView extends TextFileView {
  allowNoFile = false;
  
  getViewData(): string {
    const data = this.serialize();
    data.meta.updatedAt = Date.now();
    return JSON.stringify(data, null, 2);
  }
  
  setViewData(data: string, clear: boolean): void {
    // Schema 검증 → Sanitation → 상태 복원 → Projection 갱신
  }
}
```

### 14.2 Atomic Persistence (원자적 저장) ⭐ v5.2.0 강화

```typescript
/**
 * [Rule 26: Atomic Persistence]
 * 
 * 모든 .kknm 파일 저장은 직접 덮어쓰기를 금지한다.
 * serialize 결과는 반드시 임시 파일에 기록되며,
 * 저장 성공이 확인된 경우에만 기존 파일과 교체된다.
 */

class AtomicFileWriter {
  async save(file: TFile, data: string): Promise<void> {
    const tmpPath = file.path + '.tmp';
    
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
      
      // 4. isDirty 해제
      this.isDirty = false;
      
    } catch (e) {
      // 임시 파일 정리
      try {
        await this.app.vault.adapter.remove(tmpPath);
      } catch {}
      
      throw new Error(`File write failed: ${e.message}`);
    }
  }
}
```

---

## 15. 동기화 및 충돌 정책

### 15.1 Conflict Lock 상태 규칙 (v5.2.0 완전 봉인)

```typescript
/**
 * Conflict Lock 상태에서는 데이터 보호를 최우선으로 한다.
 * 
 * - 모든 자동 저장(Auto-Save) 메커니즘은 즉시 중단된다.
 * - 디바운스 저장(Debounced Save)은 허용되지 않는다.
 * - 앱 종료 시 실행되는 강제 저장 로직은 차단된다.
 * - Conflict Lock 상태에서는 어떠한 Serialization 파이프라인에도 진입할 수 없다.
 */
```

### 15.2 상태별 행동 매트릭스 ⭐ v5.2.0 신규

| 상태 | 편집 | 커맨드 | 저장 | UI |
|------|------|--------|------|-----|
| Normal | ✅ | ✅ | ✅ | Full |
| Readonly | ❌ | ❌ | ❌ | 탐색만 |
| Conflict | ❌ | ❌ | ❌ | 배너 + 복구 유도 |
| Locked | ❌ | ❌ | ❌ | 대기 표시 |

---

## 16. Fail Loudly 규약

```typescript
/**
 * Fail Loudly means:
 * - Immediate error surfacing to the user (Notice First)
 * - Immediate termination of the current operation context
 * - No partial continuation is allowed
 */
```

✅ **필수**: Notice 표시 → console.error → 로그 노트 기록

❌ **금지**: Silent fallback, Silent correction, Partial Continuation

---

## 17. Disposable Registry ⭐ v5.2.0 신규

```typescript
/**
 * [Rule 32: Disposable Registry]
 * 
 * 모든 모듈은 Disposable 인터페이스를 구현해야 하며,
 * onunload 시점에 자신의 모든 리스너와 타이머를 Registry에서 자동으로 제거해야 한다.
 */

interface Disposable {
  dispose(): void;
}

class DisposableRegistry {
  private disposables: Set<Disposable> = new Set();
  
  register(disposable: Disposable): void {
    this.disposables.add(disposable);
  }
  
  disposeAll(): void {
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch (e) {
        console.error('[KK-NeroMind] Dispose failed:', e);
      }
    }
    this.disposables.clear();
  }
}

// onunload에서 호출
async onunload(): Promise<void> {
  this.disposableRegistry.disposeAll();
}
```

---

## 18. Emergency Recovery Protocol ⭐ v5.2.0 신규

### 18.1 플러그인 로드 실패 시

```
1. Obsidian 설정 → Community plugins → KK-NeroMind 비활성화
2. .obsidian/plugins/kk-neromind/ 폴더 삭제
3. 플러그인 재설치
```

### 18.2 .kknm 파일 손상 시

```
1. 손상된 파일을 .kknm.backup으로 복사
2. JSON 유효성 검사 (https://jsonlint.com)
3. 복구 불가 시 /KK-NeroMind/04_Recovery_Log.md에 기록
```

### 18.3 데이터 완전 손실 시

```
- .kknm.tmp 파일 존재 여부 확인 (Atomic Write 중간 파일)
- Obsidian Sync 또는 Git 히스토리에서 복구
```

---

# Part IV: 규범 및 체크리스트

## 19. Constitution Addendum

### [규범 16] Availability Guard
- 핵심 엔진 모듈 누락 시 **플러그인을 비활성화**한다.

### [규범 17] Explicit Lifecycle Binding
- 모든 비동기 작업은 **AbortController로 관리**한다.
- 이벤트 리스너는 **registerEvent로만 관리**한다.

### [규범 18] Serialization Safety
- 파일 쓰기 실패 시 메모리 상태를 유지한다.

### [규범 19] Phase Gate Enforcement
- Phase Gate 미통과 시 **다음 Phase 진입 금지**

### [규범 20] AI Work Isolation
- AI 작업은 **명시된 파일 범위 내에서만** 수행

### [규범 21] External Dependency Lock
- 외부 라이브러리는 **esbuild 번들링 정합성을 우선 검증**

### [규범 22] Sanitation Binding
- Sanitation은 **유발한 Command에 귀속**

### [규범 23] Build Failure Protocol ⭐ v5.2.0 신규
- `npm run build` 실패 시:
  1. 해당 라이브러리 **즉시 제거**
  2. 대안 검토 전 **인간에게 보고**
  3. 임의 우회 구현 **금지**

### [규범 24] Console Output Protocol ⭐ v5.2.0 신규

| 레벨 | 사용 시점 | 프로덕션 허용 |
|------|-----------|---------------|
| `console.error` | 복구 불가능한 오류 | ✅ |
| `console.warn` | 복구 가능하지만 비정상 | ✅ |
| `console.log` | 개발 중 디버깅 | ❌ |
| `console.debug` | 상세 디버깅 | ❌ |

### [규범 25] Boot Diagnostic ⭐ v5.2.0 신규
- 모든 핵심 모듈은 **초기화 성공 여부를 Registry에 등록**

### [규범 26] Disposable Enforcement ⭐ v5.2.0 신규
- 모든 모듈은 **Disposable 인터페이스 구현 필수**

---

## 20. Golden Rules

### 절대 규칙 (Absolute Rules)

```
1.  File First - 파일이 유일한 진실이다
2.  Schema is Law - 규율이 편의보다 우선한다
3.  Intent is Pure - Intent는 선언적이며 부작용이 없다
4.  Sanitation is Explicit - Sanitation은 정해진 시점에만 수행한다
5.  Fail Loudly - 에러를 숨기지 않는다
6.  UI is Isolated - UI는 뷰 내부에만 존재한다
7.  Export is Projection - Export는 파일 상태를 변경하지 않는다
8.  No Auto-Merge - 자동 병합을 절대 하지 않는다
9.  Atomic Write - 파일 쓰기는 항상 원자적이다
10. No Silent Correction - 암묵적 보정을 절대 하지 않는다
11. Projection Only - View는 파일의 투영일 뿐이다
12. AI Must Not Guess - AI는 추측, 보정, 생성을 하지 않는다
13. Context Termination - 에러 발생 시 작업 컨텍스트를 즉각 중단한다
14. Conflict Suspension - Conflict 시 모든 저장 메커니즘을 즉시 중단한다
15. Integer Versioning - schemaVersion은 정수이며 단순 비교만 허용한다
16. Phase Gate Required - Phase Gate 미통과 시 다음 Phase 진입 불가
17. Test Before Merge - 테스트 없는 코드는 merge 불가
18. Executable or Nothing - 실행되지 않는 코드는 존재하지 않는 코드다
19. AI File Boundary - AI는 명시된 파일 범위만 수정한다
20. Human Decision Authority - 설계 결정 권한은 인간에게 있다
21. External Dependency Lock - 외부 라이브러리는 esbuild 번들링 정합성 우선
22. Notice-First Debugging - 모든 비동기 실패는 Notice로 즉시 가시화
23. Context Trimming - 현재 Phase와 무관한 파일은 컨텍스트에서 제거
24. Atomic Commit - 하나의 미션은 하나의 파일/모듈 단위로 제한
25. Author & Links Integrity - 배포 전 Author 정보와 링크 검증

⭐ v5.2.0 신규 Golden Rules:

26. Atomic Persistence - 파일 저장은 임시 파일 → 검증 → 교체 순서
27. Boot Diagnostic - 핵심 모듈은 초기화 성공 여부를 Registry에 등록
28. Disposable Registry - 모든 모듈은 Disposable 인터페이스 구현
29. Command Atomicity - Command 실패 시 부분 변경 금지
30. Build Gate - npm run build 실패 시 즉시 중단 및 보고
```

---

## 21. Git Commit Convention ⭐ v5.2.0 신규

```
[Phase X.Y] <type>: <description>

type:
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링
- test: 테스트 추가
- docs: 문서 수정
- chore: 빌드/설정

예시:
[Phase 1.0] feat: implement TextFileView skeleton
[Phase 1.0] test: add MindMapState serialization test
[Phase 1.0] fix: resolve extension registration order
```

---

## 22. 문서 권위 계층 (Authority Hierarchy)

```
1. KK-NeroMind-Architecture-v5.2.0.md (본 문서)
   └─ 아키텍처 헌법

2. KK-NeroMind-AI-Agent-Prompt.md
   └─ AI Agent System Prompt

3. KK-NeroMind-Claude-Checklist.md
   └─ Claude 허용/금지 체크리스트

4. kknm-schema-v1.md
   └─ 데이터 구조 법

5. textfileview-skeleton.md
   └─ 파일 I/O 규범

6. KK-NeroMind-Coding-Guidelines-v2.1.md
   └─ 구현 가이드라인

7. KK-NeroMind-Development-Roadmap-v2.1.md
   └─ 개발 로드맵
```

---

## 23. 구현 체크리스트

### Phase 0: 파일 시스템 (최우선)
- [ ] TextFileView 상속
- [ ] getViewData() / setViewData() 구현
- [ ] .kknm 확장자 등록
- [ ] Atomic Write 구현 (Rule 26)
- [ ] Boot Diagnostic Registry 구현 (Rule 27)
- [ ] Disposable Registry 구현 (Rule 28)

### Phase 0.5: Intent & Sanitation
- [ ] Intent는 선언적이며 부작용 없음
- [ ] Sanitation은 Command에 귀속
- [ ] Command 실패 시 롤백 (Rule 29)

### Phase 0.7: 충돌 해결
- [ ] Conflict State 구현
- [ ] 상태별 행동 매트릭스 구현
- [ ] 앱 종료 시 저장 차단

### Phase 0.9: AI 제어 & 실행 보증
- [ ] Phase 1 Zero-to-One Checklist 통과
- [ ] AI Task Request Template 적용
- [ ] Build Gate 적용 (Rule 30)

### Phase 0.95: 배포 전 검증
- [ ] External Dependency esbuild 번들링 검증
- [ ] Author 정보 검증
- [ ] 공식 링크 검증

---

## 24. 종결 선언 (Final Declaration)

본 문서는 **KK-NeroMind v5.2.0의 아키텍처 헌법**을 최종 확정한다.

**본 헌법을 어기는 구현은 즉시 버그로 처리한다.**

**v5.2.0은 Execution-Guaranteed 버전이다.**  
**본 버전부터 Phase 1 Zero-to-One이 구조적으로 보장된다.**

**아키텍처 헌법 완전 봉인 완료 (Fully Sealed).**

---

**Author**: Nero-kk  
**GitHub**: [https://github.com/Nero-kk](https://github.com/Nero-kk)  
**YouTube**: [https://www.youtube.com/@Nero-kkk](https://www.youtube.com/@Nero-kkk)  
**Blog**: [http://nero-k.tistory.com](http://nero-k.tistory.com/)  
**Buy Me a Coffee**: [https://buymeacoffee.com/nerokk](https://buymeacoffee.com/nerokk)

---

## 🔄 v5.1.0 → v5.2.0 변경사항

| 항목 | v5.1.0 | v5.2.0 |
|-----|--------|--------|
| **AI Constraints 블록** | 분산 | **문서 최상단 통합** ⭐ |
| **Data Lifecycle** | 암묵적 | **4단계 명문화** ⭐ |
| **Derived Data** | 미정의 | **명시적 목록** ⭐ |
| **Command 실패** | 미정의 | **롤백 규칙 격상** ⭐ |
| **상태별 행동** | 텍스트 | **매트릭스 표** ⭐ |
| **Boot Diagnostic** | 미정의 | **Registry 필수** ⭐ |
| **Disposable** | 암묵적 | **인터페이스 강제** ⭐ |
| **Phase 1 Gate** | 추상적 | **Zero-to-One 체크리스트** ⭐ |
| **플랫폼 요구사항** | 미정의 | **버전 명시** ⭐ |
| **Emergency Recovery** | 미정의 | **복구 절차 명시** ⭐ |
| **Golden Rules** | 25개 | **30개** ⭐ |
| **규범** | 22개 | **26개** ⭐ |

---

**Architecture v5.2.0 - Execution-Guaranteed Edition** 🚀⚖️🔒✅
