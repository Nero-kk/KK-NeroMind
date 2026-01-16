## KK-NeroMind Settings UI Implementation Guide

### 1. 개요 및 아키텍처 원칙 (v4.2.5 업데이트)

본 문서는 **KK-NeroMind**의 설정 탭(Settings Tab) 구현을 위한 표준 명세이다.

- **Architectural Constraint**: 설정은 아키텍처의 규칙을 우회할 수 없다.
    
- **Settings Migration**: 설정 스키마는 버전 관리되며, `.kknm` 파일과 독립적으로 마이그레이션된다. 하위 호환성은 최선(Best-effort)을 다하되 보장하지 않는다.
    
- **Reflection Rule**: 렌더링이나 레이아웃에 영향을 주는 설정 변경 시 `settings-changed` 이벤트를 발생시켜야 한다. **해당 설정을 리렌더링할지, 전체 레이아웃을 재계산할지는 View가 결정한다.**
    

---

### 2. [Basic] Part: 초기 구동 및 경로 설정

- **Show splash screen in new drawings**: Toggle (Default: ON).
    
- **KK-NeroMind folder (Case Sensitive!)**: Text Input (Default: `"KK-NeroMind"`). 저장 전 반드시 `normalizePath()` 검증을 거친다.
    

---

### 3. [Saving] Part: 저장 정책 및 안전장치

#### 3.1 Auto-Save & UX Guard

- **Type**: Toggle (Default: True).
    
- **UX Guard (Auto-Save OFF 시)**:
    
    - 캔버스 또는 뷰 상단에 **'Unsaved Changes'** 인디케이터를 표시한다.
        
    - 뷰를 닫거나 앱 종료 시 **'저장되지 않은 변경사항이 있습니다'**라는 확인 모달(Modal)을 반드시 띄워야 한다.
        

#### 3.2 Filename Live Preview

- **Live Preview**: 아래 설정값에 따라 실시간으로 파일명을 조합하여 보여준다.
    
- **Filename prefix**: Text Input (Default: `"Making"`).
    
- **Filename Date & Reference**: Text Input (Default: `"YYYY-MM-DD HH.mm.ss"`). Moment.js 링크 연결.
    
- **Extension Format Toggle**: `.kkneromind.kknm` vs `.kknm`.
    

---

### 4. [Advanced] Part: 외부 연동

- **Export Format Support**: PNG, SVG, PDF 지원 여부 제어.
    
- **Embed Read-only Lock**: 임베드 뷰의 읽기 전용 모드 강제 (Default: True).
    

---

### 5. UI 배치 및 인터랙션 제약

- Obsidian 기본 `Setting` 클래스를 준수한다.
    
- 모든 UI 요소는 뷰 컨테이너(`this.contentEl`) 내부에 독립적으로 존재해야 한다.
    

---

### 6. Technical Logic: Filename Live Preview (보완)

- **Concatenation**: `{prefix}` + + `moment().format({date})` + `{ext}`.
    
- **OS Validation Caveat**: **Live Preview에서 성공했다고 해서 실제 파일 생성이 보장되는 것은 아니다.** 파일 시스템(OS)의 금지된 문자나 경로 제한에 대한 **최종 검증은 쓰기(Write) 직전에 반드시 수행되어야 한다.**