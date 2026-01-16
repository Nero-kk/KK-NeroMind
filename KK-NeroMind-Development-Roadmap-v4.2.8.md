# KK-NeroMind Development Roadmap v4.2.8

> **최종 업데이트**: 2026-01-16  
> **버전**: 4.2.8 (Architecture Constitution Fully Ratified)  
> **기반**: Architecture v4.2.8 완전 준수  
> **목표**: Excalidraw급 안정성과 Obsidian Native 일체화 달성

---

## 📜 로드맵 설계 원칙 (비협상)

### 절대 우선순위

```
1. 안정성 > 기능
2. 파일 무결성 > UX
3. 추측 금지 > 편의성
4. Fail Loudly > Silent Recovery
5. Undo/Redo는 기능이 아니라 생존 장치
```

**이 원칙을 위반하는 기능은 완성도가 높아도 폐기 대상이다.**

---

## Phase 0 — File System Foundation (필수 생존 단계)

### 🎯 목표

Obsidian의 `TextFileView` 기반에서 **파일 무결성 100% 보장**

### 📦 핵심 산출물

1. **TextFileView 상속**
   - `NeroMindView extends TextFileView`
   - `getViewData()` / `setViewData()` 구현
   - `allowNoFile = false`

2. **확장자 등록**
   - `.kknm` 전용 확장자
   - Obsidian File Registry 통합

3. **Atomic Write Engine**
   - 임시 파일 → 검증 → 교체
   - 실패 시 원본 보존

4. **Schema Integer Versioning**
   - `schemaVersion` 정수만 허용
   - 단순 정수 비교 (`<=`)

### ✅ 필수 구현 체크리스트

```typescript
// 1. Atomic Write
- [ ] .tmp 파일 생성
- [ ] vault.adapter.write() 사용
- [ ] 쓰기 성공 검증
- [ ] vault.adapter.rename() 원자적 교체
- [ ] 실패 시 .tmp 파일 정리
- [ ] 원본 파일 절대 손상 금지

// 2. Timestamp 권위
- [ ] updatedAt은 직렬화 시점에만 갱신
- [ ] 뷰 이동/포커스 변경 시 갱신 금지
- [ ] 카메라 이동 시 갱신 금지

// 3. Schema Versioning
- [ ] schemaVersion은 number 타입
- [ ] 비교는 단순 정수 비교만
- [ ] compareVersions 라이브러리 사용 금지
- [ ] Semantic Versioning 금지

// 4. File Signature
- [ ] meta.createdWith = "KK-NeroMind" 검증
- [ ] 불일치 시 로딩 차단
- [ ] 읽기 전용 모드 허용 (사용자 명시 요청 시)

// 5. Migration
- [ ] Forward-only 마이그레이션
- [ ] 마이그레이션 실패 시 파일 로드 중단
- [ ] 즉시 저장하지 않음 (명시적 저장 시점에만)
```

### ⏱️ 예상 기간

- **1-2주** (28시간)
- TextFileView 상속: 4h
- Atomic Write: 6h
- Schema Versioning: 4h
- File Signature: 4h
- 파일 로드/저장 통합: 6h
- 테스트 및 검증: 4h

---

## Phase 0.3 — State Consistency & History Core

### 🎯 목표

**보이는 상태 = 실제 상태**

### 📦 핵심 산출물

1. **History Manager**
   - Undo 기본 구현
   - Redo 확장 가능 구조
   - Command Pattern 기반

2. **isDirty 정확성 100%**
   - 마지막 직렬화 상태 추적
   - Undo/Redo 연계
   - 비영속 상태 분리

3. **Multi-View Sync**
   - 상태 이벤트 브로드캐스트
   - 뷰 간 일관성 보장

### ✅ 필수 구현 체크리스트

```typescript
// 1. History Manager
- [ ] Command 인터페이스 정의
- [ ] CommandHistory 구현 (Undo stack)
- [ ] Redo stack 확장 가능 구조
- [ ] 마지막 직렬화 상태 기록

// 2. Undo/Redo isDirty 연계
- [ ] Undo 후 상태 직렬화
- [ ] 마지막 저장 상태와 비교
- [ ] 동일하면 isDirty = false
- [ ] Redo도 동일 로직 적용

// 3. 비영속 상태 분리
- [ ] 카메라 상태는 isDirty 트리거 안 함
- [ ] 선택 상태는 isDirty 트리거 안 함
- [ ] 포커스 상태는 isDirty 트리거 안 함
- [ ] UI 플래그는 isDirty 트리거 안 함

// 4. Multi-View Sync
- [ ] Workspace 이벤트 구독
- [ ] 상태 변경 브로드캐스트
- [ ] 단방향 전파 (무한 루프 방지)
- [ ] 뷰 간 불일치 시 즉시 오류
```

### ⏱️ 예상 기간

- **1주** (20시간)
- Command Pattern: 6h
- History Manager: 6h
- isDirty 연계: 4h
- Multi-View Sync: 4h

---

## Phase 0.5 — Intent Engine & Data Sanitation

### 🎯 목표

**의도와 실행의 완전 분리**

### 📦 핵심 산출물

1. **Intent Processor**
   - 선언적 Intent 정의
   - 부작용 없는 Intent
   - Engine이 해석 및 실행

2. **Sanitation Engine**
   - 파일 로드 시 Sanitation
   - 명시적 검증 시 Sanitation
   - 마이그레이션 시 Sanitation

### ✅ 필수 구현 체크리스트

```typescript
// 1. Intent 순수성
- [ ] Intent는 데이터만 포함
- [ ] Intent는 로직 포함 금지
- [ ] Intent는 정규화/보정/추론 금지
- [ ] Engine이 Intent 해석
- [ ] Engine이 유효성 검증
- [ ] Engine이 상태 변경

// 2. Sanitation 시점 제한
- [ ] 파일 로드 시만 허용
- [ ] 명시적 검증 시만 허용
- [ ] 마이그레이션 시만 허용
- [ ] 렌더링 중 금지
- [ ] 인터랙션 중 금지
- [ ] 편집 중 금지

// 3. Sanitation 최소 조치
- [ ] 존재하지 않는 노드 참조 엣지 제거
- [ ] Schema 위반 검증
- [ ] 추론/보정 금지
- [ ] 모든 Sanitation 로그 기록
```

### ⏱️ 예상 기간

- **1-2주** (24시간)
- Intent 설계: 6h
- Intent Processor: 8h
- Sanitation Engine: 6h
- 테스트: 4h

---

## Phase 0.7 — Conflict Lock & Export Safety

### 🎯 목표

**외부 충돌 시 단 1바이트도 쓰지 않는다**

### 📦 핵심 산출물

1. **Conflict Lock 강화**
   - Save Pipeline 즉시 중단
   - Auto-Save 타이머 즉시 취소
   - 편집 잠금

2. **Export Engine**
   - PNG/SVG 기본 포맷
   - SVG → PDF 변환 (선택)
   - Projection Only

### ✅ 필수 구현 체크리스트

```typescript
// 1. Conflict Lock
- [ ] 외부 파일 변경 감지
- [ ] Clean 상태: 즉시 리로드
- [ ] Dirty 상태: Conflict State 진입
- [ ] Save Pipeline 즉시 중단
- [ ] Auto-Save 타이머 즉시 취소
- [ ] 편집 기능 잠금
- [ ] 사용자 선택 모달 표시
- [ ] 결정 후 Pipeline 재개

// 2. UX 시각화
- [ ] 반투명 오버레이
- [ ] 잠금 아이콘 표시
- [ ] 명확한 경고 메시지

// 3. Export Engine
- [ ] PNG 고해상도 (2x)
- [ ] SVG 벡터 출력
- [ ] SVG → PDF 변환
- [ ] Obsidian 인쇄 Fallback
- [ ] Export는 파일 상태 변경 금지
- [ ] Projection만 생성
```

### ⏱️ 예상 기간

- **1-2주** (24시간)
- Conflict Resolver: 8h
- Save Pipeline 제어: 4h
- Export Engine: 8h
- UX 시각화: 4h

---

## Phase 0.8 — Schema Validation & Fail Loudly

### 🎯 목표

**에러는 침묵하지 않는다**

### 📦 핵심 산출물

1. **Schema Validator**
   - 정수 버전 비교
   - 필수 필드 검증
   - 타입 검증

2. **Error Handler**
   - 명시적 에러 발생
   - 사용자 알림
   - 작업 컨텍스트 중단

### ✅ 필수 구현 체크리스트

```typescript
// 1. Schema Validation
- [ ] schemaVersion 정수 검증
- [ ] 단순 정수 비교만 사용
- [ ] 필수 필드 존재 검증
- [ ] 타입 검증
- [ ] 위반 시 즉시 throw

// 2. Fail Loudly
- [ ] 에러 즉시 throw
- [ ] Notice로 사용자 알림
- [ ] 작업 컨텍스트 즉시 중단
- [ ] load/save/migration/render 명시
- [ ] 부분 계속(Partial Continuation) 금지
- [ ] Silent fallback 금지
- [ ] Silent correction 금지

// 3. Error Context
- [ ] 에러 발생 시점 기록
- [ ] 에러 발생 작업 명시
- [ ] 스택 트레이스 보존
```

### ⏱️ 예상 기간

- **1주** (16시간)
- Schema Validator: 6h
- Error Handler: 6h
- 테스트: 4h

---

## Phase 0.9 — AI Governance Validation

### 🎯 목표

**AI는 도구이지 판단 주체가 아니다**

### 📦 핵심 산출물

1. **AI 제한 검증**
   - 추측 금지 확인
   - 자동 보정 금지 확인
   - 데이터 생성 금지 확인

2. **Schema 위반 처리**
   - 거부(Reject)
   - 읽기 전용(Read-Only)

### ✅ 필수 검증 체크리스트

```typescript
// 1. AI 금지 규칙 검증
- [ ] 누락 필드 자동 생성 ❌
- [ ] 구조 자동 보정 ❌
- [ ] 의미 추측 ❌
- [ ] 기본값 추론 ❌
- [ ] "보통 이런 경우" 판단 ❌

// 2. Schema 위반 처리
- [ ] 검증 실패 시 즉시 거부
- [ ] 또는 읽기 전용 모드
- [ ] 수정 금지
- [ ] 자동 저장 금지
- [ ] 마이그레이션 금지

// 3. AI 산출물 검증
- [ ] Intent 순수성 검증
- [ ] Sanitation 시점 검증
- [ ] Fail Loudly 준수 검증
```

### ⏱️ 예상 기간

- **1주** (16시간)
- AI 제한 검증 로직: 6h
- Schema 위반 처리: 4h
- 산출물 검증: 6h

**위반 시: AI 산출물 전면 폐기**

---

## Phase 1 이후 (잠금 🔒)

다음 기능은 **Phase 0.9 통과 전까지 논의 금지**:

### 🚫 Phase 0.9 이전 금지 기능

- 협업 기능
- 실시간 동기화
- 클라우드 통합
- 플러그인 생태계
- 외부 API 통합

### ✅ Phase 0.9 통과 후 고려 가능

- Phase 1: 카메라 시스템 고도화
- Phase 2: Layout Engine
- Phase 3: 인터랙션 우선순위
- Phase 4: Follow Selection
- Phase 5: 내비게이션 시스템
- Phase 6: Viewport Culling

---

## 📊 전체 일정 요약

| Phase | 목표 | 예상 기간 | 누적 |
|-------|------|----------|------|
| **Phase 0** | File System | 1-2주 (28h) | 2주 |
| **Phase 0.3** | State & History | 1주 (20h) | 3주 |
| **Phase 0.5** | Intent & Sanitation | 1-2주 (24h) | 5주 |
| **Phase 0.7** | Conflict & Export | 1-2주 (24h) | 7주 |
| **Phase 0.8** | Schema & Fail | 1주 (16h) | 8주 |
| **Phase 0.9** | AI Governance | 1주 (16h) | 9주 |
| **합계** | **Phase 0 완료** | **9주** | **128시간** |

---

## 🎯 Phase 0 완료 조건 (Exit Criteria)

### 필수 달성 조건

```
✅ 1. 파일 무결성 100%
   - 1000회 저장 테스트 통과
   - 충돌 상황에서 데이터 손실 0건
   - Atomic Write 실패율 0%

✅ 2. State 일관성 100%
   - isDirty 정확도 100%
   - Undo/Redo 후 상태 일치
   - Multi-View 동기화 100%

✅ 3. Intent 순수성 100%
   - Intent는 데이터만 포함
   - 부작용 0건
   - Engine만 상태 변경

✅ 4. Sanitation 시점 준수 100%
   - 허용 시점에서만 실행
   - 금지 시점에서 실행 0건

✅ 5. Conflict Lock 100%
   - 충돌 시 저장 0건
   - Pipeline 중단 100%
   - 사용자 선택 필수

✅ 6. Fail Loudly 100%
   - Silent failure 0건
   - Partial continuation 0건
   - 컨텍스트 중단 100%

✅ 7. AI Governance 100%
   - 추측/보정/생성 0건
   - Schema 위반 거부 100%
```

---

## 📋 프로젝트 구조 (v4.2.8 기준)

```
src/
├── main.ts                      # 플러그인 엔트리
├── view/
│   ├── NeroMindView.ts         # TextFileView 상속 ⭐
│   └── SplashScreen.ts         # 초기 화면
├── core/
│   ├── intent/
│   │   ├── Intent.ts           # Intent 인터페이스 ⭐
│   │   └── IntentProcessor.ts  # Intent 처리 ⭐
│   ├── state/
│   │   ├── StateManager.ts     # 상태 관리
│   │   └── Serializer.ts       # 직렬화 ⭐
│   ├── history/
│   │   ├── Command.ts          # Command 인터페이스
│   │   └── HistoryManager.ts   # Undo/Redo ⭐
│   └── conflict/
│       └── ConflictResolver.ts # Conflict Lock ⭐
├── engine/
│   ├── file/
│   │   ├── FileWriter.ts       # Atomic Write ⭐
│   │   └── FileValidator.ts    # Schema 검증 ⭐
│   ├── sanitation/
│   │   └── SchemaSanitizer.ts  # Sanitation ⭐
│   └── migration/
│       └── MigrationManager.ts # 마이그레이션
├── export/
│   └── ExportManager.ts        # Export Engine ⭐
├── settings/
│   ├── Settings.ts             # 설정 인터페이스
│   └── SettingTab.ts           # 설정 UI
└── ai/
    └── AIGovernance.ts         # AI 제한 검증 ⭐

⭐ = Phase 0 핵심 파일
```

---

## 🚀 시작 가이드

### 1. Phase 0 시작 전 필독

- `KK-NeroMind-Architecture-v4.2.8.md` (헌법)
- `kknm-schema-v1.md` (데이터 구조 법)
- `textfileview-skeleton.md` (파일 I/O 규범)

### 2. 구현 순서

```
Phase 0 → 0.3 → 0.5 → 0.7 → 0.8 → 0.9
(순서 변경 금지)
```

### 3. 각 Phase 완료 조건

- 모든 체크리스트 ✅
- 테스트 통과율 100%
- Code Review 통과
- Architecture 준수 검증

---

## 📖 참고 문서

1. **KK-NeroMind-Architecture-v4.2.8.md** (최상위 헌법)
2. **KK-NeroMind-Coding-Guidelines-v4.2.8.md** (코딩 규칙)
3. **kknm-schema-v1.md** (데이터 구조 법)
4. **textfileview-skeleton.md** (파일 I/O 규범)
5. **settings-ui.md** (설정 UI 규범)

---

**Author**: Nero-kk  
**GitHub**: [https://github.com/Nero-kk](https://github.com/Nero-kk)  
**YouTube**: [https://www.youtube.com/@Nero-kkk](https://www.youtube.com/@Nero-kkk)  
**Blog**: [http://nero-k.tistory.com](http://nero-k.tistory.com/)  
**Buy Me a Coffee**: [https://buymeacoffee.com/nerokk](https://buymeacoffee.com/nerokk)

---

**Phase 0 Complete = Production Ready 🚀**
