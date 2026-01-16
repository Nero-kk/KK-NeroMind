# TextFileView Skeleton

## (KK-NeroMind Engine — Final Canonical Specification)

본 문서는 Obsidian `TextFileView` 기반에서 **`.kknm` 파일을 다루는 유일한 정본 규약**이다.  
모든 KK-NeroMind 파일 I/O, 상태 관리, 마이그레이션, 렌더링은 본 문서를 따른다.

---

## 1. Purpose & Scope

TextFileView는 **파일 중심(File-first)** 문서 뷰이며, 다음을 보장한다.

- 정확히 하나의 `.kknm` Vault 파일을 **독점적으로 소유**
    
- 스키마에 정의된 데이터만 로드 / 렌더 / 저장
    
- 모든 파일 변경은 **검증 → 마이그레이션 → 직렬화**를 거친다
    
- Vault 무결성은 UI 편의보다 항상 우선한다
    

---

## 2. Ownership & Authority

TextFileView 인스턴스는 다음 권한과 제한을 가진다.

### Authority

- Parsing / Validation / Migration / Serialization의 최종 결정권
    
- `.kknm` 파일의 유일한 **Write Authority**
    

### Restriction

- 소유하지 않은 파일을 수정하지 않는다
    
- Vault 전역 상태, 외부 파일, 외부 스키마를 암묵적으로 변경하지 않는다
    

### Refusal Rule

아래 조건 중 하나라도 위반되면 **즉시 로드 거부**한다.

- KK-NeroMind 형식이 아님
    
- 스키마 검증 실패
    
- 마이그레이션 불가능한 버전
    

> 정책: **Fail Loudly**  
> 부분 로드, 자동 복구, 추측 기반 로드는 허용하지 않는다.

---

## 3. Metadata Contract (Schema Binding)

### 3.1 필수 메타데이터

모든 `.kknm` 파일은 반드시 다음 메타데이터를 포함한다.

```json
{
  "meta": {
    "createdWith": "KK-NeroMind",
    "schemaVersion": 1,
    "pluginVersion": "0.4.2"
  }
}
```

### 3.2 Ownership Validation

deserialize 단계에서 아래 조건을 **모두 통과해야 한다**.

- `createdWith === "KK-NeroMind"`
    
- `schemaVersion` 존재 + 지원 범위 내
    
- JSON 파싱 성공
    
- 스키마 구조 완전 일치
    

> `createdWith`는 **파일 시그니처**이며,  
> 확장자만 `.kknm`인 외부 JSON 파일을 차단하는 1차 방어선이다.

---

## 4. Load & Deserialize Lifecycle

### 4.1 Standard Load Sequence

1. Vault Read (raw text)
    
2. JSON Deserialize
    
3. Metadata & Schema Validation
    
4. Forward-only Migration
    
5. State Hydration
    
6. View Render
    

### 4.2 Migration Rules

- 순수 함수 (Pure / Deterministic)
    
- **하위 → 상위 버전만 허용**
    
- 실패 시 렌더링 중단 + 오류 노출
    
- 로드 중 수행된 마이그레이션 결과는  
    **즉시 저장하지 않는다**
    
- 실제 파일 반영은 명시적 Save 시점에만 수행
    

---

## 5. Saving & Serialization Policy

### 5.1 Dirty State Definition

`isDirty === true` 조건:

- 노드 / 엣지 / 메타데이터의 **의미론적 변경**
    
- 스키마 버전 또는 구조적 데이터 변경
    

`isDirty === false` 유지:

- 선택 상태
    
- 줌 / 팬
    
- 임시 UI 상태
    

> View State는 **파일 데이터가 아니다**

---

### 5.2 Save Triggers

- **Debounced Save**  
    마지막 변경 후 300–500ms
    
- **Immediate Flush**
    
    - 뷰 종료
        
    - 파일 전환
        
    - 앱 종료
        
    - 사용자 수동 저장
        

---

### 5.3 Atomic Write Rule

모든 저장은 다음 단계를 따른다.

1. Serialize → JSON
    
2. Temp File Write
    
3. Original File Replace
    

- 가능한 경우 `vault.adapter` 사용
    
- 쓰기 완료 전 `isDirty` 해제 금지
    

---

## 6. File Path & Vault Safety

### 6.1 Path Normalization

- 모든 경로는 `normalizePath()` 필수
    
- Vault 외부 접근, `../` 이동 전면 금지
    

### 6.2 Folder Creation

- 상위 폴더가 없을 경우
    
    - 루트부터 순차 생성
        
    - **idempotent** 로직 유지
        

---

## 7. External Modification & Conflict Handling

### Clean State

- 외부 변경 감지 시 즉시 리로드
    

### Dirty State

- 자동 리로드 차단
    
- 사용자 선택 요구:
    
    - 디스크 버전 로드
        
    - 현재 상태 유지
        

> Dirty 상태에서의 자동 덮어쓰기는 **데이터 손실로 간주**

---

## 8. Multi-View Synchronization

- 동일 `.kknm` 파일을 여러 뷰에서 열 수 있다
    
- 한 뷰에서 저장 발생 시:
    
    - Workspace Event로 즉시 전파
        
    - 다른 뷰는 재하이드레이션 수행
        

---

## 9. Embed Policy

- 임베드 뷰는 **항상 Read-only**
    
- 저장 / 수정 / Dirty 트리거 권한 없음
    
- deserialize 로직은 메인 뷰와 **완전 공유**
    

---

## 10. UI Layout Isolation

- 모든 캔버스 UI는 `this.contentEl` 기준
    
- Obsidian Header(Breadcrumb) 의존 금지
    
- 헤더 높이 기반 CSS 보정 금지
    
- Absolute positioning은 **뷰 컨테이너 내부에서만 허용**
    

---

## 11. Error Boundary Policy

다음 단계 중 하나라도 실패하면:

- Deserialize
    
- Validation
    
- Migration
    
- Write
    

→ 즉시 사용자에게 오류 표시  
→ Silent failure, partial render 금지

---

## 12. Core Invariants (절대 불변)

1. **File First**  
    파일이 유일한 진실의 원천이다.
    
2. **Schema is Law**  
    편의보다 스키마가 우선한다.
    
3. **Fail Loudly**  
    조용한 실패는 버그다.
    
4. **Deterministic**  
    동일 파일 → 동일 상태 → 동일 렌더링
    

---

### Status

- Canonical
    
- Schema-bound
    
- KK-NeroMind v4.2.5 기준
    

---
