# NeroMind 개발 로그 - 2026-01-15

## 1. 개요

오늘 작업은 **설정 UI 구축**, **레이아웃 알고리즘 고도화**, **Undo/Redo 시스템 확장**, 그리고 **렌더링 최적화 및 추상화**를 중심으로 진행되었습니다. 아키텍처 v4.2.3의 원칙을 준수하며 안정성과 확장성을 동시에 확보했습니다.

## 2. 주요 작업 내용

### 🎨 설정 시스템 (Settings UI)

- `NeroMindSettingTab.ts` 구현: `enableRadialLayout`, `enableArchive`, `layoutDirection`, `rendererType` 설정을 관리하는 UI를 구축했습니다.
- `main.ts` 연동: 설정을 로드/저장하고 변경 시 `EventBus`를 통해 뷰에 즉시 통지하는 구조를 만들었습니다.

### 🧠 방사형 레이아웃 엔진 고도화

- **수동 배치 지원**: `MindMapNode`에 `userPosition: boolean` 플래그를 추가하여 드래그한 노드는 자동 배치에서 제외되도록 했습니다.
- **범위 기반 재계산**: `recomputeLayout` 함수가 전체(`all`) 또는 특정 노드 기준 서브트리(`subtree`) 단위로 레이아웃을 계산할 수 있도록 확장했습니다.
- **주요 함수**:
  - `computeRadialPositions`: 루트 노드 선정 및 초기 각도 범위 설정.
  - `layoutSubtree`: 재귀적으로 자식 노드의 좌표를 계산하며 `userPosition`인 경우 기존 좌표를 유지.

### 🔄 Undo/Redo (Command 패턴) 확장

- **전용 Command 구현**:
  - `MoveNodeCommand`: 드래그 시 위치와 `userPosition` 상태를 기록하고 복구합니다.
  - `ResetNodeToAutoLayoutCommand`: 노드를 다시 자동 배치 대상으로 전환합니다.
  - `ChangeLayoutCommand`: 레이아웃 설정 변경을 실행 취소할 수 있도록 캡슐화했습니다.
- **트랜잭션 관리**: `TransactionCommand`를 통해 여러 명령을 묶어 처리하며, 중간 실패 시 `execute`했던 명령들을 즉시 롤백하는 보호 로직을 포함했습니다.
- **명령 병합(Coalescing)**: `HistoryManager.tryCoalesceMove`를 통해 동일 노드의 연속적인 이동(300ms 이내)을 하나의 히스토리로 자동 병합하여 Undo 효율을 높였습니다.

### 🚀 렌더링 성능 최적화 및 가시성 제어

- **디바운스 큐**: `enqueueLayoutRequest`와 `scheduleLayoutFlush`를 도입하여 레이아웃 재계산 요청이 단기간에 중복 발생할 경우 병합하고 `requestAnimationFrame`으로 실행을 최적화했습니다.
- **뷰포트 컬링(Viewport Culling)**:
  - `computeVisibleNodeIds`: 현재 화면(viewBox) 영역과 노드 크기를 계산하여 보이는 노드만 선별합니다.
  - `isNodeVisible`: 노드 좌표와 크기 기반 가시성 판정 로직.
  - 선택된 노드나 드래그 중인 노드는 뷰포트 밖이어도 강제 렌더링되도록 예외 처리했습니다.

### 🏗️ 렌더러 추상화 (Renderer Abstraction)

- `MindMapRenderer` 인터페이스 정의: `init`, `render`, `update`, `destroy` 명세를 확립했습니다.
- **다중 렌더러 구현**:
  - `DomRenderer`: 기존 SVG 기반의 정밀한 렌더링을 수행합니다.
  - `CanvasRenderer`: 성능 중심의 Canvas API 기반 기본 렌더링을 구현했습니다.
- **런타임 스왑**: 설정에서 `rendererType` 변경 시 `initializeRenderer`를 통해 뷰의 재시작 없이 렌더러 구현체를 즉시 교체하는 구조를 완성했습니다.

## 3. 핵심 로직 요약

- **상태 변경 이벤트 기반 반응**: Command는 레이아웃을 직접 호출하지 않고 `layoutResetRequested` 등의 이벤트를 발행하며, View가 이를 감지하여 `recomputeLayout`을 디바운스 처리 후 실행합니다.
- **순수 계산과 렌더 분리**: 가시 노드 계산 로직을 렌더러 밖(`NeroMindView`)으로 끌어올려 렌더러 구현체(DOM/Canvas)에 상관없이 최적화 로직을 재사용할 수 있게 했습니다.
