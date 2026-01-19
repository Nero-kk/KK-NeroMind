# KK-NeroMind Claude Checklist

> **문서 버전**: 1.0.0  
> **대상**: Claude Sonnet 4.5 (Thinking), Claude 기반 AI 에이전트  
> **상위 문서**: KK-NeroMind-Architecture-v5.2.0.md  
> **문서 지위**: Claude 전용 허용/금지 체크리스트

---

## 📜 문서 목적

이 체크리스트는 **Claude가 스스로 사고를 검열하도록 강제하는 장치**다.  
Thinking 모델일수록 이 체크리스트가 반드시 필요하다.

---

## ❌ 절대 금지 (FORBIDDEN)

Claude는 다음 행동을 **해서는 안 된다**.

### 데이터 관련

| 번호 | 금지 행동 | 이유 |
|------|-----------|------|
| F-01 | Schema에 없는 필드 추가 | Schema is Law 위반 |
| F-02 | undefined/null을 "합리적으로" 보정 | No Auto-Correction 위반 |
| F-03 | deserialize 중 데이터 수정 | Data Lifecycle 위반 |
| F-04 | 누락된 필드에 기본값 삽입 | No Guessing 위반 |

### 상태 관련

| 번호 | 금지 행동 | 이유 |
|------|-----------|------|
| F-05 | UI 이벤트에서 상태 직접 변경 | Command is Truth 위반 |
| F-06 | View에서 Model 직접 수정 | Projection Only 위반 |
| F-07 | 부분 성공 상태 생성 | Command Atomicity 위반 |

### 에러 처리 관련

| 번호 | 금지 행동 | 이유 |
|------|-----------|------|
| F-08 | try/catch로 오류 삼키기 | Fail Loudly 위반 |
| F-09 | 주석으로 규칙 무력화 | Architecture 위반 |
| F-10 | Silent fallback 구현 | No Silent Correction 위반 |

### 코드 품질 관련

| 번호 | 금지 행동 | 이유 |
|------|-----------|------|
| F-11 | "임시", "나중에 정리" 코드 삽입 | Executable or Nothing 위반 |
| F-12 | 하나의 파일에 여러 책임 혼합 | 단일 책임 원칙 위반 |
| F-13 | console.log를 프로덕션 코드에 남김 | Console Output Protocol 위반 |
| F-14 | 테스트 없이 Command 작성 | Test Before Merge 위반 |

### 파일 관련

| 번호 | 금지 행동 | 이유 |
|------|-----------|------|
| F-15 | Target Files에 없는 파일 수정 | AI File Boundary 위반 |
| F-16 | 아키텍처 문서 임의 해석 | Human Decision Authority 위반 |
| F-17 | esbuild 호환 안 되는 라이브러리 사용 | External Dependency Lock 위반 |

---

## ✅ 명시적 허용 (ALLOWED)

다음은 **적극적으로 권장**된다.

### 데이터 관련

| 번호 | 허용 행동 | 이유 |
|------|-----------|------|
| A-01 | Command 기반 상태 변경 | Command is Truth 준수 |
| A-02 | Schema 필드만 사용 | Schema is Law 준수 |
| A-03 | 명시적 validation 로직 | Fail Loudly 준수 |

### 에러 처리 관련

| 번호 | 허용 행동 | 이유 |
|------|-----------|------|
| A-04 | 실패 시 즉시 throw | Fail Loudly 준수 |
| A-05 | Notice로 사용자에게 알림 | Notice-First Debugging 준수 |
| A-06 | 에러 로그 노트에 기록 | 진단 가능성 확보 |

### 코드 품질 관련

| 번호 | 허용 행동 | 이유 |
|------|-----------|------|
| A-07 | 읽기 전용 View 설계 | Projection Only 준수 |
| A-08 | 테스트 가능한 순수 함수 | Testability 확보 |
| A-09 | 보수적이고 반복적인 코드 | 유지보수성 우선 |
| A-10 | 장황하더라도 명확한 분리 | 가독성 우선 |

### 프로세스 관련

| 번호 | 허용 행동 | 이유 |
|------|-----------|------|
| A-11 | 아키텍처 충돌 시 즉시 중단 | AI Notice-First Enforcement |
| A-12 | Rule ID와 함께 문제 보고 | 명확한 커뮤니케이션 |
| A-13 | 인간의 결정 대기 | Human Decision Authority |

---

## 🧠 사고 프레임 강제 문장

Claude는 코드 작성 전 **항상** 다음 질문을 내부적으로 통과해야 한다:

### 데이터 변경 전

```
□ 이 변경은 Command를 통과하는가?
□ Canonical Model을 직접 건드리지 않았는가?
□ 이 데이터는 Derived Data가 아닌가?
```

### 에러 처리 전

```
□ 실패해야 할 상황을 성공시키고 있지 않은가?
□ 에러를 삼키고 있지 않은가?
□ Notice로 사용자에게 알리고 있는가?
```

### 코드 작성 전

```
□ "친절함" 때문에 규칙을 어기고 있지 않은가?
□ 이 코드는 테스트 가능한가?
□ Target Files에 명시된 파일만 수정하는가?
```

### 완료 전

```
□ npm run build가 성공하는가?
□ 테스트가 통과하는가?
□ console.log가 남아있지 않은가?
```

---

## 📋 코드 작성 전 체크리스트

```markdown
## Pre-Implementation Checklist

### 파일 범위
- [ ] Target Files에 명시된 파일만 수정
- [ ] Read-Only Files는 참조만

### 데이터 처리
- [ ] Command를 통해서만 상태 변경
- [ ] Schema에 정의된 필드만 사용
- [ ] Derived Data는 파일에 저장 안 함

### 에러 처리
- [ ] 실패 시 throw (삼키지 않음)
- [ ] Notice로 사용자에게 알림
- [ ] 부분 성공 상태 없음

### 코드 품질
- [ ] 테스트 코드 포함
- [ ] console.log 없음 (error/warn만)
- [ ] Disposable 인터페이스 구현
```

---

## 📋 코드 작성 후 체크리스트

```markdown
## Post-Implementation Checklist

### 빌드
- [ ] npm run build 성공
- [ ] 타입 에러 없음
- [ ] 린트 에러 없음

### 테스트
- [ ] 새 테스트 추가됨
- [ ] 기존 테스트 통과
- [ ] execute/undo/redo 검증 (Command인 경우)

### 검증
- [ ] Obsidian에서 로드 성공
- [ ] console.error 없음
- [ ] 기능 동작 확인
```

---

## 🔴 위반 감지 시 행동

아키텍처 위반을 감지한 경우:

### 1단계: 즉시 중단

```
구현을 멈추고 위반 사항을 분석한다.
```

### 2단계: 보고

```markdown
## ⚠️ Architecture Violation Detected

**Violated Rule**: [Rule ID] - [Rule 이름]
**Violation Type**: [F-XX 번호]
**Description**: [위반 상황 설명]
**Attempted Code**: 
\`\`\`typescript
// 문제가 된 코드
\`\`\`

**Correct Approach**: [올바른 접근 방식 제안]

**Awaiting confirmation to proceed.**
```

### 3단계: 대기

```
인간의 확인 없이 진행하지 않는다.
```

---

## 📊 우선순위 결정 매트릭스

두 가지 선택지가 있을 때:

| 상황 | 선택 |
|------|------|
| 편의성 vs 정확성 | **정확성** |
| 암묵적 성공 vs 명시적 실패 | **명시적 실패** |
| 영리한 구현 vs 아키텍처 준수 | **아키텍처 준수** |
| 짧은 코드 vs 명확한 코드 | **명확한 코드** |
| 빠른 구현 vs 테스트 포함 | **테스트 포함** |

---

## 🎯 구현 원칙 요약

```
┌─────────────────────────────────────────┐
│                                         │
│   Correctness > Convenience             │
│   정확성이 편의성보다 우선한다          │
│                                         │
│   Explicit Failure > Implicit Success   │
│   명시적 실패가 암묵적 성공보다 낫다    │
│                                         │
│   Architecture > Cleverness             │
│   아키텍처 준수가 영리한 구현보다 중요  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📌 최종 경고

```
⚠️ 이 체크리스트의 규칙을 위반한 코드는
   정상 동작하더라도 폐기 대상이다.

⚠️ "더 좋아 보여서" 규칙을 우회하는 것은
   아키텍처 파괴 행위다.

⚠️ Claude는 구현자이지 설계자가 아니다.
```

---

## 🔖 Quick Reference Card

```
┌────────────────────────────────────────────────┐
│ FORBIDDEN (❌)                                  │
├────────────────────────────────────────────────┤
│ • Schema에 없는 필드 추가                      │
│ • undefined/null 자동 보정                     │
│ • UI에서 상태 직접 변경                        │
│ • try/catch로 오류 삼키기                      │
│ • "임시" 코드 작성                             │
│ • Target Files 외 파일 수정                    │
├────────────────────────────────────────────────┤
│ ALLOWED (✅)                                    │
├────────────────────────────────────────────────┤
│ • Command 기반 상태 변경                       │
│ • 실패 시 throw                                │
│ • Notice로 사용자 알림                         │
│ • 보수적이고 명확한 코드                       │
│ • 테스트 코드 포함                             │
│ • 아키텍처 충돌 시 중단 & 보고                 │
└────────────────────────────────────────────────┘
```

---

**Author**: Nero-kk  
**GitHub**: [https://github.com/Nero-kk](https://github.com/Nero-kk)  
**YouTube**: [https://www.youtube.com/@Nero-kkk](https://www.youtube.com/@Nero-kkk)  
**Blog**: [http://nero-k.tistory.com](http://nero-k.tistory.com/)  
**Buy Me a Coffee**: [https://buymeacoffee.com/nerokk](https://buymeacoffee.com/nerokk)
