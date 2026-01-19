# KK-NeroMind Antigravity Phase 1 구현 전략

> **버전**: 1.0.0  
> **작성 일자**: 2026-01-19  
> **대상**: Google Antigravity Agent  
> **Phase**: Phase 1 (Zero-to-One)  
> **근거 문서**: Architecture v5.2.0, Roadmap v5.2.0, Phase 1 Instructions v5.2.0

---

## 📋 요약

본 문서는 Google Antigravity 에이전트를 사용하여 **Phase 1 Zero-to-One을 안전하게 구현**하기 위한 전략과 프롬프트를 정의합니다.

---

## 🎯 Phase 1 목표 재확인

### Zero-to-One 정의
```
Before: 프로젝트 폴더에 문서만 존재
After: Obsidian에서 플러그인 로드 + .kknm 파일 생성 가능
```

### 구현 파일 (5개)
1. `src/schema/types.ts` - 스키마 타입 정의
2. `src/schema/validator.ts` - 스키마 검증 (+ 테스트)
3. `src/utils/disposable.ts` - Disposable Registry (+ 테스트)
4. `src/utils/diagnostic.ts` - Boot Diagnostics (+ 테스트)
5. `src/main.ts` - 플러그인 진입점

### Phase Gate 기준
```
✅ npm run build 성공
✅ Obsidian 플러그인 로드 성공
✅ Command Palette에 명령 표시
✅ .kknm 파일 생성 가능
✅ Jest 테스트 50%+ 커버리지
✅ console.error 없음
```

---

## 🤖 AI 모델 특성 분석

### Claude Sonnet 4.5 (Thinking)

**강점**:
- ✅ Extended Thinking으로 심층 분석 가능
- ✅ 복잡한 아키텍처 문서 이해 탁월
- ✅ 긴 컨텍스트 (200K+ 토큰) 처리
- ✅ 높은 코드 품질
- ✅ 엄격한 규칙 준수

**약점**:
- ⚠️ 느린 응답 속도 (Thinking 모드)
- ⚠️ 높은 비용

**최적 사용 시나리오**:
- 복잡한 로직 구현 (validator.ts)
- 아키텍처 위배 검증
- 테스트 케이스 설계
- 최종 검증

---

### Gemini 3 Pro (High)

**강점**:
- ✅ 빠른 응답 속도
- ✅ 효율적인 코드 생성
- ✅ 우수한 TypeScript 지원
- ✅ 적절한 품질

**약점**:
- ⚠️ 매우 긴 문서 처리 시 품질 저하
- ⚠️ 복잡한 아키텍처 완전 이해 어려움

**최적 사용 시나리오**:
- 표준 패턴 구현 (disposable.ts, diagnostic.ts)
- 단순 파일 생성 (types.ts)
- 반복 작업

---

### Gemini 3 Pro (Low)

**강점**:
- ✅ 매우 빠른 속도
- ✅ 비용 효율적

**약점**:
- ⚠️ 낮은 품질
- ⚠️ 복잡한 작업 부적합

**최적 사용 시나리오**:
- 빌드 실행 (`npm run build`)
- 테스트 실행 (`npm test`)
- 파일 복사/이동
- 단순 검증

---

### GPT-OSS (120B)

**강점**:
- ✅ 오픈소스 생태계 이해
- ✅ 표준 패턴 구현

**약점**:
- ⚠️ 특정 아키텍처 준수 능력 불확실
- ⚠️ KK-NeroMind 규칙 학습 부족

**최적 사용 시나리오**:
- Obsidian API 표준 사용법 참조
- npm 패키지 설정
- 표준 툴체인 구성

---

## 📊 Phase 1 작업 분류 및 모델 배정

### 작업 복잡도 분석

| 파일 | 복잡도 | 시간 | 아키텍처 준수 | 추론 필요 | 테스트 |
|------|--------|------|---------------|-----------|--------|
| types.ts | ⭐ 단순 | 30분 | 높음 | 낮음 | 없음 |
| validator.ts | ⭐⭐⭐ 복잡 | 2시간 | **매우 높음** | 높음 | 100% |
| disposable.ts | ⭐⭐ 중간 | 1시간 | 중간 | 낮음 | 100% |
| diagnostic.ts | ⭐⭐ 중간 | 1.5시간 | 중간 | 낮음 | 100% |
| main.ts | ⭐⭐⭐ 복잡 | 1시간 | **매우 높음** | 중간 | 없음 |

---

## 🎯 최적 모델 배정 전략

### 전략 1: 안전 우선 (권장) ✅

**모든 파일을 Claude Sonnet 4.5 (Thinking)으로 구현**

**이유**:
1. **Phase 1은 기반 코드** - 이후 모든 Phase의 토대
2. **아키텍처 준수가 최우선** - 한 번 잘못되면 전체 무너짐
3. **비용보다 품질** - Phase 1 실패 시 재작업 비용이 더 큼
4. **문서량 방대** - 303KB+, 13,484줄 문서 완전 이해 필요

**장점**:
- ✅ 최고 품질 보장
- ✅ 아키텍처 위배 최소화
- ✅ 한 번에 성공 확률 높음
- ✅ 일관된 코드 스타일

**단점**:
- ⚠️ 느린 속도 (총 6-9시간 예상)
- ⚠️ 높은 비용

**구현 순서**:
```
1. Claude Thinking: types.ts
2. Claude Thinking: validator.ts + test
3. Claude Thinking: disposable.ts + test
4. Claude Thinking: diagnostic.ts + test
5. Claude Thinking: main.ts
6. Gemini Low: npm run build 실행
7. Claude Thinking: 최종 검증
```

---

### 전략 2: 하이브리드 (효율성 고려)

**복잡도에 따라 모델 차등 배정**

| 작업 | 모델 | 이유 |
|------|------|------|
| types.ts | Gemini High | 단순 변환, 추론 불필요 |
| validator.ts | **Claude Thinking** | 가장 복잡, 아키텍처 핵심 |
| disposable.ts | Gemini High | 표준 패턴 |
| diagnostic.ts | Gemini High | 표준 패턴 |
| main.ts | **Claude Thinking** | Obsidian API, 아키텍처 핵심 |
| 테스트 실행 | Gemini Low | 단순 실행 |
| 최종 검증 | **Claude Thinking** | 품질 보증 |

**장점**:
- ✅ 빠른 속도
- ✅ 비용 효율적
- ✅ 핵심 부분만 Thinking 사용

**단점**:
- ⚠️ Gemini가 아키텍처 위배 가능
- ⚠️ 재작업 위험
- ⚠️ 일관성 저하 가능

---

### 전략 3: GPT-OSS 활용 (비추천) ❌

**이유**:
- ❌ KK-NeroMind 아키텍처 학습 안 됨
- ❌ 특정 규칙 (created/modified 필드명) 준수 불확실
- ❌ 위배 시 전체 재작업 필요

**사용 가능한 경우**:
- Obsidian API 표준 사용법 참조용
- npm 설정 참고용
- 전략 1-2의 보조 도구로만

---

## ✅ 최종 권장: 전략 1 (안전 우선)

### 권장 이유

1. **Phase 1의 중요성**
   ```
   Phase 1 실패 = 프로젝트 전체 실패
   Phase 1 성공 = Phase 2-8의 안정적 토대
   ```

2. **문서 복잡도**
   ```
   303KB+, 13,484줄 문서
   → Claude Thinking만이 완전 이해 가능
   ```

3. **비용 vs 리스크**
   ```
   Claude Thinking 비용 < 재작업 비용
   한 번에 성공 = 시간 절약
   ```

4. **아키텍처 준수**
   ```
   created/modified (NOT createdAt/updatedAt)
   nodes: Record (NOT Array)
   → Gemini가 놓칠 수 있는 세부사항
   ```

---

## 📝 Antigravity 프롬프트 템플릿

### Mission 1: types.ts 작성

```markdown
# Mission: Schema Types 정의

## Context
KK-NeroMind Phase 1 Zero-to-One 구현의 첫 번째 단계입니다.
Schema v5.2.1을 TypeScript 인터페이스로 정확히 변환해야 합니다.

## Model Selection
**Claude Sonnet 4.5 (Thinking)**

## Required Documents (반드시 읽기)
1. /docs/KK-NeroMind-Schema-v5.2.1.md (전체)
2. /docs/KK-NeroMind-Phase1-Instructions-v5.2.0.md (Section 1)
3. /docs/KK-NeroMind-AI-Agent-Prompt.md (전체)

## Target File
- `src/schema/types.ts` (신규 생성)

## Critical Constraints
⚠️ **절대 위반 금지**:
1. 필드명: `created`, `modified` (NOT createdAt, updatedAt, createdWith)
2. `_reserved` 필드 추가 금지 (v1에 없음)
3. `nodes`와 `edges`는 `Record<string, T>` (NOT Array)
4. `NodeStyle`은 빈 인터페이스 (v1)
5. `CURRENT_SCHEMA_VERSION = 1` (상수)

## Implementation Requirements
```typescript
// Phase 1 Instructions Section 1 코드 그대로 구현
// 모든 주석 포함
// 필드 순서 유지
```

## Success Criteria
- [ ] TypeScript 컴파일 성공
- [ ] MindMapMetadata에 created, modified, title 존재
- [ ] nodes: Record<string, MindMapNode>
- [ ] edges: Record<string, MindMapEdge>
- [ ] NodeStyle 빈 인터페이스
- [ ] 모든 주석 포함

## Out of Scope
- ❌ 테스트 파일 (이번 Mission에 없음)
- ❌ Validator 구현 (다음 Mission)
- ❌ 필드 추가/수정 (Schema v5.2.1 그대로)

## Verification Steps
1. 파일 생성 확인: `ls src/schema/types.ts`
2. TypeScript 컴파일: `npx tsc --noEmit src/schema/types.ts`
3. created/modified 필드명 검증: `grep "created:" src/schema/types.ts`
4. _reserved 없음 확인: `grep "_reserved" src/schema/types.ts` (결과 없어야 함)

## Expected Output
```
✅ src/schema/types.ts 생성 완료
✅ 컴파일 에러 없음
✅ 필드명 검증 완료
✅ Schema v5.2.1 완벽 일치
```

## Conflict Detection
다음 상황 발생 시 **즉시 중단하고 보고**:
- Schema 문서와 필드명 불일치
- createdAt/updatedAt 언급 발견
- _reserved 필드 요구 발견
- Array 타입 권장 발견
```

---

### Mission 2: validator.ts + test 작성

```markdown
# Mission: Schema Validator 구현 및 테스트

## Context
Phase 1의 가장 중요한 파일입니다. 모든 .kknm 파일 검증의 기반이 됩니다.
100% 테스트 커버리지가 필수입니다.

## Model Selection
**Claude Sonnet 4.5 (Thinking)**

## Required Documents (반드시 읽기)
1. /docs/KK-NeroMind-Schema-v5.2.1.md (Section 7: SchemaValidator)
2. /docs/KK-NeroMind-Phase1-Instructions-v5.2.0.md (Section 2)
3. /docs/KK-NeroMind-Coding-Guidelines-v5.2.1.md (validateMetadata 섹션)
4. /docs/KK-NeroMind-Test-Specification-v5.2.0.md (TC-VAL-021~026)
5. /docs/KK-NeroMind-AI-Agent-Prompt.md (전체)

## Target Files
- `src/schema/validator.ts` (신규 생성)
- `src/schema/validator.test.ts` (신규 생성)

## Critical Constraints
⚠️ **절대 위반 금지**:
1. metadata.created, metadata.modified 검증 (NOT createdAt/updatedAt)
2. Auto-correction 금지 (invalid → null 반환)
3. console.error로 Fail Loudly
4. nodes/edges가 Array면 거부
5. style에 속성 있으면 거부 (v1)

## Implementation Requirements

### validator.ts
```typescript
// Phase 1 Instructions Section 2 전체 코드 구현
// 모든 private method 포함
// console.error 메시지 포함
// 주석 포함
```

### validator.test.ts
```typescript
// Phase 1 Instructions Section 2 테스트 코드 구현
// 최소 30+ 테스트 케이스
// Given-When-Then 패턴 준수
// 모든 TC-VAL-021~026 커버
```

## Success Criteria
- [ ] TypeScript 컴파일 성공
- [ ] `npm test validator.test.ts` 전체 통과
- [ ] 테스트 커버리지 100%
- [ ] TC-VAL-021: created 누락 → false
- [ ] TC-VAL-022: modified 누락 → false
- [ ] TC-VAL-023: title 누락 → false
- [ ] TC-VAL-024: created 음수 → false
- [ ] nodes Array → false
- [ ] edges Array → false
- [ ] style 속성 있음 → false

## Out of Scope
- ❌ Sanitation (Phase 2)
- ❌ Migration (Phase 2+)
- ❌ UI 통합 (Phase 4+)

## Verification Steps
1. 컴파일: `npx tsc --noEmit src/schema/validator.ts`
2. 테스트: `npm test src/schema/validator.test.ts`
3. 커버리지: `npm run test:coverage -- src/schema/validator.test.ts`
4. 필드명 검증: `grep "metadata.created" src/schema/validator.ts`
5. Auto-fix 없음: `grep -i "default\|fallback\|auto" src/schema/validator.ts` (없어야 함)

## Expected Output
```
✅ validator.ts 구현 완료
✅ validator.test.ts 30+ 테스트
✅ 모든 테스트 PASS
✅ 커버리지 100%
✅ console.error 메시지 확인
```

## Conflict Detection
다음 상황 발생 시 **즉시 중단하고 보고**:
- Auto-correction 로직 발견
- createdAt/updatedAt 사용 시도
- Silent failure (console.error 없음)
- Partial success (일부만 검증)
```

---

### Mission 3: disposable.ts + test 작성

```markdown
# Mission: Disposable Registry 구현 및 테스트

## Context
플러그인 언로드 시 모든 리소스를 안전하게 정리하기 위한 Registry입니다.
에러 발생 시에도 나머지 리소스를 계속 정리해야 합니다.

## Model Selection
**Claude Sonnet 4.5 (Thinking)**

## Required Documents (반드시 읽기)
1. /docs/KK-NeroMind-Architecture-v5.2.0.md (Section 17: Disposable)
2. /docs/KK-NeroMind-Phase1-Instructions-v5.2.0.md (Section 3)
3. /docs/KK-NeroMind-AI-Agent-Prompt.md (전체)

## Target Files
- `src/utils/disposable.ts` (신규 생성)
- `src/utils/disposable.test.ts` (신규 생성)

## Critical Constraints
⚠️ **절대 위반 금지**:
1. dispose() 중 하나 실패해도 나머지 계속 진행
2. 모든 에러 catch하고 console.error
3. 최종적으로 disposables.clear() 호출

## Implementation Requirements
```typescript
// Phase 1 Instructions Section 3 코드 그대로 구현
// Set<Disposable> 사용
// try-catch로 각 disposable 보호
// errors 배열에 수집
```

## Success Criteria
- [ ] TypeScript 컴파일 성공
- [ ] `npm test disposable.test.ts` 전체 통과
- [ ] 테스트 커버리지 100%
- [ ] 하나 실패해도 나머지 실행 테스트 통과
- [ ] dispose() 후 count = 0

## Verification Steps
1. 컴파일: `npx tsc --noEmit src/utils/disposable.ts`
2. 테스트: `npm test src/utils/disposable.test.ts`
3. 커버리지: `npm run test:coverage -- src/utils/disposable.test.ts`

## Expected Output
```
✅ disposable.ts 구현 완료
✅ disposable.test.ts 6+ 테스트
✅ 모든 테스트 PASS
✅ 커버리지 100%
```
```

---

### Mission 4: diagnostic.ts + test 작성

```markdown
# Mission: Boot Diagnostics 구현 및 테스트

## Context
부팅 시 각 모듈의 로드 상태를 추적하고 진단하는 시스템입니다.
실패 시 console.error로 명확히 알려야 합니다.

## Model Selection
**Claude Sonnet 4.5 (Thinking)**

## Required Documents (반드시 읽기)
1. /docs/KK-NeroMind-Architecture-v5.2.0.md (Section 3: Boot Process)
2. /docs/KK-NeroMind-Phase1-Instructions-v5.2.0.md (Section 4)
3. /docs/KK-NeroMind-AI-Agent-Prompt.md (전체)

## Target Files
- `src/utils/diagnostic.ts` (신규 생성)
- `src/utils/diagnostic.test.ts` (신규 생성)

## Critical Constraints
⚠️ **절대 위반 금지**:
1. 성공 시 console.log
2. 실패 시 console.error
3. timestamp 정확히 기록

## Implementation Requirements
```typescript
// Phase 1 Instructions Section 4 코드 그대로 구현
// Map<string, ModuleStatus> 사용
// register() 시 즉시 로깅
```

## Success Criteria
- [ ] TypeScript 컴파일 성공
- [ ] `npm test diagnostic.test.ts` 전체 통과
- [ ] 테스트 커버리지 100%
- [ ] console.log/error 호출 확인

## Verification Steps
1. 컴파일: `npx tsc --noEmit src/utils/diagnostic.ts`
2. 테스트: `npm test src/utils/diagnostic.test.ts`
3. 커버리지: `npm run test:coverage -- src/utils/diagnostic.test.ts`

## Expected Output
```
✅ diagnostic.ts 구현 완료
✅ diagnostic.test.ts 6+ 테스트
✅ 모든 테스트 PASS
✅ 커버리지 100%
```
```

---

### Mission 5: main.ts 작성

```markdown
# Mission: Plugin Entry Point 구현

## Context
Obsidian 플러그인의 진입점입니다. Phase 1의 최종 파일입니다.
모든 모듈을 통합하고 플러그인을 로드합니다.

## Model Selection
**Claude Sonnet 4.5 (Thinking)**

## Required Documents (반드시 읽기)
1. /docs/KK-NeroMind-Architecture-v5.2.0.md (Section 5: View Registration)
2. /docs/KK-NeroMind-Phase1-Instructions-v5.2.0.md (Section 5)
3. /docs/KK-NeroMind-AI-Agent-Prompt.md (전체)
4. Obsidian API 문서 (필요 시 참조)

## Target File
- `src/main.ts` (신규 생성)

## Critical Constraints
⚠️ **절대 위반 금지**:
1. Boot 실패 시 enterSafeMode() 호출
2. SchemaValidator로 검증 후 파일 생성
3. Disposable Registry에 모든 리소스 등록
4. created/modified 필드명 사용

## Implementation Requirements
```typescript
// Phase 1 Instructions Section 5 코드 그대로 구현
// Plugin 클래스 상속
// onload/onunload 구현
// createNewMindMap 메서드
```

## Success Criteria
- [ ] TypeScript 컴파일 성공
- [ ] npm run build 성공
- [ ] main.js 생성 확인

## Verification Steps
1. 컴파일: `npx tsc --noEmit src/main.ts`
2. 빌드: `npm run build`
3. 파일 확인: `ls main.js`
4. created/modified 검증: `grep "created:" src/main.ts`

## Expected Output
```
✅ main.ts 구현 완료
✅ npm run build 성공
✅ main.js 생성됨
```

## Conflict Detection
다음 상황 발생 시 **즉시 중단하고 보고**:
- Obsidian API 사용 오류
- 필드명 불일치
- Boot 로직 누락
```

---

### Mission 6: 최종 통합 테스트

```markdown
# Mission: Phase 1 Zero-to-One 검증

## Context
Phase 1의 모든 파일이 완성되었습니다.
Obsidian에서 실제로 동작하는지 검증합니다.

## Model Selection
**Gemini 3 Pro (Low)** - 테스트 실행
**Claude Sonnet 4.5 (Thinking)** - 결과 분석

## Target
- Obsidian 수동 테스트
- Phase Gate 체크리스트

## Steps

### 1. 빌드 (Gemini Low)
```bash
npm run build
```

### 2. 테스트 실행 (Gemini Low)
```bash
npm test
npm run test:coverage
```

### 3. Obsidian 테스트 (수동)
```
Phase 1 Instructions Section 7 체크리스트 따라 수행
```

### 4. 최종 검증 (Claude Thinking)
```
Phase Gate 8개 조건 모두 확인
```

## Success Criteria
- [ ] npm run build 성공
- [ ] npm test 전체 통과
- [ ] 커버리지 50%+
- [ ] Obsidian 플러그인 로드
- [ ] Command 표시
- [ ] .kknm 파일 생성
- [ ] console.error 없음
- [ ] Zero-to-One Checklist 전체 통과

## Expected Output
```
✅ Phase 1 Zero-to-One 완료
✅ Phase Gate 통과
✅ Git 커밋 준비 완료
```
```

---

## 🔄 실행 순서 (권장)

### Day 1 (4-5시간)

**Morning (2-3시간)**:
```
1. Claude Thinking: Mission 1 (types.ts) - 30분
2. Claude Thinking: Mission 2 (validator.ts + test) - 2시간
```

**Afternoon (2시간)**:
```
3. Claude Thinking: Mission 3 (disposable.ts + test) - 1시간
4. Claude Thinking: Mission 4 시작 (diagnostic.ts) - 1시간
```

---

### Day 2 (3-4시간)

**Morning (2시간)**:
```
4. Claude Thinking: Mission 4 완료 (diagnostic.ts + test) - 0.5시간
5. Claude Thinking: Mission 5 (main.ts) - 1.5시간
```

**Afternoon (1-2시간)**:
```
6. Gemini Low: npm run build - 5분
7. Gemini Low: npm test - 5분
8. 수동: Obsidian 테스트 - 30분
9. Claude Thinking: Mission 6 (최종 검증) - 30분
```

---

## 📋 체크리스트

### Mission 시작 전 (매번)
```
[ ] Required Documents 모두 읽음
[ ] Model Selection 확인
[ ] Critical Constraints 숙지
[ ] Out of Scope 확인
```

### Mission 완료 후 (매번)
```
[ ] Success Criteria 모두 통과
[ ] Verification Steps 실행
[ ] Conflict 없음 확인
[ ] 다음 Mission 준비
```

### Phase 1 완료 후
```
[ ] Phase Gate 8개 조건 통과
[ ] Git 커밋
[ ] README 업데이트
[ ] Phase 2 준비
```

---

## 🚨 주의사항

### Critical Warnings

⚠️ **절대 위반 금지**:
```
1. createdAt, updatedAt, createdWith 사용 금지
   → created, modified 사용

2. _reserved 필드 추가 금지
   → v1에 없음

3. nodes/edges를 Array로 구현 금지
   → Record<string, T> 사용

4. Auto-correction 금지
   → Invalid data는 null 반환

5. Silent failure 금지
   → console.error 필수
```

### Conflict Detection

다음 상황 발생 시 **즉시 중단**:
```
❌ Schema 문서와 필드명 불일치
❌ AI가 "더 나은 방법" 제안
❌ 아키텍처 우회 시도
❌ 부분 성공 상태 생성
❌ 테스트 없이 구현 완료
```

**중단 후 행동**:
```
1. 구현 중단
2. 충돌 Rule ID 보고
3. 중단 사유 설명
4. 인간 결정 대기
```

---

## 📊 예상 결과

### 성공 시나리오

**Day 1 완료**:
```
✅ types.ts
✅ validator.ts + test (100% 커버리지)
✅ disposable.ts + test (100% 커버리지)
✅ diagnostic.ts 진행 중
```

**Day 2 완료**:
```
✅ diagnostic.ts + test (100% 커버리지)
✅ main.ts
✅ npm run build 성공
✅ npm test 통과 (50%+ 커버리지)
✅ Obsidian 플러그인 로드
✅ .kknm 파일 생성 가능
✅ Phase Gate 통과
```

---

## 🎯 최종 권고

### 권장 전략

**✅ 전략 1 채택 (안전 우선)**

**모든 Mission에 Claude Sonnet 4.5 (Thinking) 사용**

**이유**:
1. Phase 1은 기반 코드 - 실패 불가
2. 303KB+ 문서 완전 이해 필요
3. 아키텍처 위배 시 전체 재작업
4. 비용 < 재작업 리스크

**대안**:
- 필요 시 Gemini Low로 테스트 실행
- GPT-OSS는 참고용으로만

---

## 📝 추가 참고사항

### Antigravity Agent 설정

```json
{
  "agent": "antigravity",
  "models": {
    "primary": "claude-sonnet-4.5-thinking",
    "test_runner": "gemini-3-pro-low",
    "validator": "claude-sonnet-4.5-thinking"
  },
  "context_files": [
    "docs/KK-NeroMind-Architecture-v5.2.0.md",
    "docs/KK-NeroMind-AI-Agent-Prompt.md",
    "docs/KK-NeroMind-Phase1-Instructions-v5.2.0.md"
  ],
  "constraints": {
    "max_files_per_mission": 2,
    "require_tests": true,
    "fail_on_architecture_violation": true
  }
}
```

### 문서 읽기 순서

**모든 Mission 시작 전**:
1. KK-NeroMind-AI-Agent-Prompt.md (필수)
2. KK-NeroMind-Architecture-v5.2.0.md (Section 10, 16, 17)
3. KK-NeroMind-Phase1-Instructions-v5.2.0.md (해당 Section)

---

**문서 끝**

---

**작성자**: Claude (Anthropic)  
**작성 일자**: 2026-01-19  
**버전**: 1.0.0  
**근거 문서**: Architecture v5.2.0, Roadmap v5.2.0, Phase 1 Instructions v5.2.0, AI Agent Prompt
