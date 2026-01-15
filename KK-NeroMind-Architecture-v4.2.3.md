# KK-NeroMind Architecture v4.2.3

> **최종 업데이트**: 2026-01-15  
> **버전**: 4.2.3 (Robust Architecture with Camera Control & Navigation)  
> **목적**: 카메라 제어의 단일 진입점 확보, 인터랙션 우선순위 명문화, 내비게이션 시스템 추가를 통해 장기 유지보수성과 확장성을 극대화한 최종 설계안

---

## 📋 목차

1. [핵심 설계 철학](#1-핵심-설계-철학)
2. [노드 좌표 불변 원칙](#2-노드-좌표-불변-원칙)
3. [이동 단위 규칙](#3-이동-단위-규칙)
4. [카메라 시스템 및 단일 진입점 규칙](#4-카메라-시스템-및-단일-진입점-규칙)
5. [좌표 변환과 렌더링](#5-좌표-변환과-렌더링)
6. [선택과 화면 반응](#6-선택과-화면-반응)
7. [인터랙션 우선순위 명세](#7-인터랙션-우선순위-명세)
8. [카메라 잠금 규칙](#8-카메라-잠금-규칙)
9. [수동 패닝과 자동 포커싱 충돌 방지](#9-수동-패닝과-자동-포커싱-충돌-방지)
10. [초기 뷰포트 규칙](#10-초기-뷰포트-규칙)
11. [내비게이션 및 검색 시스템](#11-내비게이션-및-검색-시스템)
12. [줌 규칙](#12-줌-규칙)
13. [CameraController 생명주기](#13-cameracontroller-생명주기)
14. [Fixed Node 시각적 피드백](#14-fixed-node-시각적-피드백)
15. [성능 최적화: Viewport Culling](#15-성능-최적화-viewport-culling)
16. [다중 창 환경 대응](#16-다중-창-환경-대응)
17. [AI 에이전트 협업 인터페이스](#17-ai-에이전트-협업-인터페이스)
18. [책임 분리](#18-책임-분리)
19. [구현 체크리스트](#19-구현-체크리스트)
20. [문제 해결 가이드](#20-문제-해결-가이드)

---

## 1. 핵심 설계 철학

### 🎯 세 가지 절대 원칙

> **1. 노드는 움직이지 않는다. 카메라만 움직인다.**  
> **2. 노드는 의미의 단위이고, 카메라는 시선의 단위다.**  
> **3. 사용자의 의도가 언제나 자동 로직보다 우선한다.**

### 이 원칙으로 해결되는 문제

이 아키텍처는 다음 문제를 **구조적으로 재발 불가** 상태로 만든다:

- ✅ 초기 로딩 시 중앙 불일치
- ✅ 드래그 후 화면 튐
- ✅ Resize 시 좌표 붕괴
- ✅ 선택/이동/카메라 충돌
- ✅ Follow 기능의 UX 스트레스
- ✅ 노드 정렬 흔들림
- ✅ Undo/Redo 오염
- ✅ Edge 무결성 붕괴
- ✅ 대규모 노드 성능 저하
- ✅ 다중 창 환경 좌표 오류
- ✅ AI 생성 노드 배치 충돌
- ✅ 카메라 상태 변경 주체 혼란 (신규)

---

## 2. 노드 좌표 불변 원칙

### 2.1 절대 규칙 (Absolute Node Position Invariance)

**핵심**:
- 모든 노드는 **월드 좌표계(World Space)** 에서 **절대 좌표**를 가진다
- 이 좌표는 다음 요인으로 **절대 변경되지 않는다**:
  - 카메라 이동 (Pan)
  - 줌 (Zoom)
  - 화면 리사이즈 (Viewport Resize)
  - 포커싱 (Focus)
  - 렌더링 로직
- 노드 좌표 변경은 **명시적인 사용자 의도**가 있을 때만 허용된다

### 2.2 노드 스키마 명세 (필수)

```typescript
interface MindMapNode {
  id: string;
  position: { 
    x: number;  // World Space (absolute)
    y: number;  // World Space (absolute)
  };
  
  /**
   * 레이아웃 엔진의 제어 여부
   * - true:  레이아웃 엔진이 자동 배치 가능
   * - false: 사용자가 수동으로 고정 (레이아웃 엔진 금지)
   * 
   * 기본값: true (노드 생성 시)
   */
  layoutControlled: boolean;
  
  // ... other properties
}
```

#### 필드 의미 상세

**`layoutControlled`** (핵심 추가 필드):

| 값 | 의미 | AutoAligner 동작 | 변경 시점 |
|---|---|---|---|
| `true` | 자동 레이아웃 대상 | 위치 계산 및 적용 ✅ | 노드 생성, Reset Layout |
| `false` | 사용자 수동 배치 | 위치 수정 금지 ❌ | 드래그 시작, 명시적 이동 |

### 2.3 상태 전이 규칙

```typescript
// 1. 노드 생성 시
function createNode(parentId: string): MindMapNode {
  return {
    id: generateId(),
    position: { x: 0, y: 0 },
    layoutControlled: true,  // 기본값
    // ...
  };
}

// 2. 사용자가 드래그 시작 시
function onDragStart(nodeId: string) {
  const node = getNode(nodeId);
  node.layoutControlled = false;  // 자동 레이아웃 해제
  
  // Subtree 모드면 모든 자식도 해제
  if (moveMode === MoveMode.Subtree) {
    const descendants = getAllDescendants(nodeId);
    descendants.forEach(child => {
      child.layoutControlled = false;
    });
  }
}

// 3. "Reset Layout" 명령 시
function resetLayout() {
  allNodes.forEach(node => {
    node.layoutControlled = true;  // 전체 재활성화
  });
  
  autoAligner.align(allNodes);
}
```

### 2.4 AutoAligner 강제 규칙

**필수 구현**:

```typescript
class AutoAligner {
  align(nodes: MindMapNode[]): void {
    // layoutControlled === true 인 노드만 계산 대상
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
```

### 2.5 Command 패턴 적용

```typescript
class MoveNodeCommand implements Command {
  private oldPosition: Point;
  private oldLayoutControlled: boolean;
  
  execute() {
    this.oldPosition = { ...this.node.position };
    this.oldLayoutControlled = this.node.layoutControlled;
    
    this.node.position = this.newPosition;
    this.node.layoutControlled = false;  // 핵심!
  }
  
  undo() {
    this.node.position = this.oldPosition;
    this.node.layoutControlled = this.oldLayoutControlled;  // 복원
  }
}
```

---

## 3. 이동 단위 규칙

### 3.1 도메인 특성

**KK-NeroMind는 트리 기반 마인드맵을 핵심 도메인으로 한다.**

마인드맵의 본질적 특성:
- **의미 단위 = 가지(Branch)**
- 부모-자식 관계가 시각적 계층 구조를 결정
- Edge(Bezier)는 구조를 시각화하는 핵심 요소
- 계층 구조가 곧 시각적 의미

### 3.2 기본 원칙 (Semantic Default)

> **노드 이동은 하위 트리(Subtree)를 포함한다**

**이유**:

| 측면 | Subtree 이동 | SingleNode 이동 |
|-----|------------|----------------|
| **Edge 무결성** | 유지 ✅ | 심각하게 왜곡 ❌ |
| **시각적 계층** | 유지 ✅ | 붕괴 ❌ |
| **사용자 인지** | 자연스러움 ✅ | 혼란 ❌ |
| **마인드맵 표준** | 일치 ✅ | 불일치 ❌ |
| **의미 단위** | 보존 ✅ | 파괴 ❌ |

### 3.3 이동 모드 명세

```typescript
enum MoveMode {
  Subtree,  // 기본값 - 부모 + 모든 자식 함께 이동
  Single    // 예외 - 부모만 이동 (재연결/Reparenting 목적)
}
```

### 3.4 Subtree 이동 구현

```typescript
class MoveSubtreeCommand implements Command {
  private movedNodes: Map<string, { oldPos: Point, oldControlled: boolean }>;
  
  constructor(
    private rootNodeId: string,
    private deltaX: number,
    private deltaY: number
  ) {}
  
  execute() {
    this.movedNodes = new Map();
    
    // 이동 대상: 루트 + 모든 자손
    const nodesToMove = [
      this.rootNodeId,
      ...getAllDescendants(this.rootNodeId)
    ];
    
    nodesToMove.forEach(nodeId => {
      const node = getNode(nodeId);
      
      // 이전 상태 저장 (Undo용)
      this.movedNodes.set(nodeId, {
        oldPos: { ...node.position },
        oldControlled: node.layoutControlled
      });
      
      // 이동 적용
      node.position.x += this.deltaX;
      node.position.y += this.deltaY;
      node.layoutControlled = false;  // 전체 가지 제어 해제
    });
  }
  
  undo() {
    this.movedNodes.forEach((state, nodeId) => {
      const node = getNode(nodeId);
      node.position = state.oldPos;
      node.layoutControlled = state.oldControlled;
    });
  }
}
```

---

## 4. 카메라 시스템 및 단일 진입점 규칙

### 4.1 Camera 모델 (Ephemeral State)

```typescript
interface CameraState {
  offsetX: number;  // World → Screen translation X
  offsetY: number;  // World → Screen translation Y
  scale: number;    // Zoom level (0.1 ~ 5.0)
}
```

### 4.2 강제 규칙

**Camera는 일시적 상태(Ephemeral State)다**:

| 특성 | 적용 여부 | 이유 |
|-----|----------|-----|
| Undo/Redo 대상 | ❌ | 화면 조작은 데이터 변경이 아님 |
| PersistentState 저장 | ❌ | 세션마다 자유로운 시점 허용 |
| 노드 좌표와 혼재 | ❌ | 책임 분리 원칙 |
| View 전용 상태 | ✅ | 렌더링 전용 |

### 4.3 ⚠️ 단일 진입점 규칙 (Single Entry Point) - 신규

카메라 상태(`offsetX`, `offsetY`, `scale`)의 변경 주체가 많아짐에 따라 발생하는 상태 충돌을 방지하기 위해, **모든 변경은 단일 메서드를 통해서만 이루어진다**.

#### 4.3.1 카메라 변경 사유 (Camera Change Reason)

```typescript
enum CameraChangeReason {
  UserPan = 'UserPan',                    // 사용자 수동 패닝
  UserZoom = 'UserZoom',                  // 사용자 줌
  FollowSelection = 'FollowSelection',    // 선택 자동 추적
  CenterOnNode = 'CenterOnNode',          // 특정 노드 중앙 정렬
  InitialViewport = 'InitialViewport',    // 초기 뷰포트 설정
  SearchJump = 'SearchJump',              // 검색 결과로 점프
  ResizeAdjustment = 'ResizeAdjustment'   // 리사이즈 보정
}
```

#### 4.3.2 단일 변경 메서드

```typescript
class CameraController {
  private camera: CameraState;
  
  /**
   * 카메라 상태를 변경하는 유일한 창구
   * 모든 카메라 변경은 반드시 이 메서드를 통해야 함
   * 
   * @param partial - 변경할 카메라 속성 (부분 업데이트 가능)
   * @param reason - 변경 사유 (로깅 및 디버깅용)
   * @returns 변경 성공 여부
   */
  applyCameraChange(
    partial: Partial<CameraState>,
    reason: CameraChangeReason
  ): boolean {
    // 잠금 체크 (초기화는 예외)
    if (ephemeral.isCameraLocked && reason !== CameraChangeReason.InitialViewport) {
      console.warn(`Camera change blocked: ${ephemeral.lockReason}, attempted: ${reason}`);
      return false;
    }
    
    // 로깅 (디버깅용)
    console.log(`Camera change: ${reason}`, partial);
    
    // 상태 업데이트 (불변성 유지)
    this.camera = { ...this.camera, ...partial };
    
    // 렌더러에 통지
    this.renderer.updateTransform(this.camera);
    
    return true;
  }
  
  // ❌ 금지: 직접 camera 속성 수정
  // this.camera.offsetX = newX;  // 절대 금지!
  
  // ✅ 올바른 사용
  // this.applyCameraChange({ offsetX: newX }, CameraChangeReason.UserPan);
}
```

#### 4.3.3 사용 예시

```typescript
// 사용자 패닝
function onManualPan(deltaX: number, deltaY: number) {
  cameraController.applyCameraChange(
    { 
      offsetX: camera.offsetX + deltaX,
      offsetY: camera.offsetY + deltaY
    },
    CameraChangeReason.UserPan
  );
}

// 줌
function onZoom(newScale: number) {
  cameraController.applyCameraChange(
    { scale: newScale },
    CameraChangeReason.UserZoom
  );
}

// 선택 추적
function centerOnSelectedNode(nodeId: string) {
  const node = getNode(nodeId);
  const centerCamera = calculateCenterCamera(node);
  
  cameraController.applyCameraChange(
    centerCamera,
    CameraChangeReason.FollowSelection
  );
}
```

#### 4.3.4 장점

이 단일 진입점 규칙을 통해:
- **누가 카메라를 바꿨는지 명확** (로깅, 디버깅)
- **상태 충돌 원천 차단** (여러 곳에서 동시 수정 방지)
- **잠금 규칙 일관 적용** (한 곳에서만 체크)
- **향후 확장 용이** (애니메이션, 기록 등 추가 쉬움)

### 4.4 좌표 변환 공식

**핵심 공식**:
```
ScreenPosition = (WorldPosition × scale) + offset
WorldPosition = (ScreenPosition - offset) / scale
```

**구현**:
```typescript
class CoordinateTransformer {
  // World → Screen
  worldToScreen(worldX: number, worldY: number, camera: CameraState): Point {
    return {
      x: worldX * camera.scale + camera.offsetX,
      y: worldY * camera.scale + camera.offsetY
    };
  }
  
  // Screen → World
  screenToWorld(screenX: number, screenY: number, camera: CameraState): Point {
    return {
      x: (screenX - camera.offsetX) / camera.scale,
      y: (screenY - camera.offsetY) / camera.scale
    };
  }
}
```

---

## 5. 좌표 변환과 렌더링

### 5.1 렌더링 책임 분리

**Renderer는 노드 좌표를 계산하지 않는다**

**올바른 방법**:
```typescript
// ✅ SVG transform-layer에만 카메라 적용
function render() {
  return (
    <svg width={viewport.width} height={viewport.height}>
      <g 
        id="transform-layer"
        transform={`translate(${camera.offsetX}, ${camera.offsetY}) scale(${camera.scale})`}
      >
        {nodes.map(node => (
          <Node 
            key={node.id}
            x={node.position.x}  // 월드 좌표 그대로!
            y={node.position.y}
          />
        ))}
        
        {edges.map(edge => (
          <Edge 
            key={edge.id}
            from={getNode(edge.fromId).position}  // 월드 좌표
            to={getNode(edge.toId).position}
          />
        ))}
      </g>
    </svg>
  );
}
```

---

## 6. 선택과 화면 반응

### 6.1 기본 규칙 (Focus Policy)

**노드 선택 시 → 화면은 해당 노드를 중앙으로 포커싱**

```typescript
function onNodeSelected(nodeId: string) {
  // 예외 조건 체크
  if (!settings.followSelection) return;
  if (ephemeral.isCameraLocked) return;
  
  const node = getNode(nodeId);
  centerCameraOnNode(node);
}
```

### 6.2 단일 선택 중앙 정렬

```typescript
function centerCameraOnNode(node: MindMapNode) {
  const viewportCenterX = viewport.width / 2;
  const viewportCenterY = viewport.height / 2;
  
  // 목표 카메라 계산
  const targetOffsetX = viewportCenterX - node.position.x * camera.scale;
  const targetOffsetY = viewportCenterY - node.position.y * camera.scale;
  
  // 단일 진입점 사용!
  cameraController.applyCameraChange(
    {
      offsetX: targetOffsetX,
      offsetY: targetOffsetY
    },
    CameraChangeReason.CenterOnNode
  );
}
```

### 6.3 다중 선택 중앙 정렬

```typescript
function centerCameraOnMultipleNodes(nodeIds: string[]) {
  const nodes = nodeIds.map(id => getNode(id));
  const bounds = calculateBoundingBox(nodes);
  
  const centerWorld = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  };
  
  // 적절한 줌 레벨 계산
  const padding = 50;
  const requiredScaleX = viewport.width / (bounds.width + padding * 2);
  const requiredScaleY = viewport.height / (bounds.height + padding * 2);
  const targetScale = Math.min(requiredScaleX, requiredScaleY, camera.scale);
  
  // 단일 진입점 사용!
  cameraController.applyCameraChange(
    {
      offsetX: viewport.width / 2 - centerWorld.x * targetScale,
      offsetY: viewport.height / 2 - centerWorld.y * targetScale,
      scale: targetScale
    },
    CameraChangeReason.CenterOnNode
  );
}
```

---

## 7. 인터랙션 우선순위 명세

### 7.1 Interaction Priority Table (신규)

시스템의 복잡한 동작을 예측 가능하게 만들기 위해 다음의 우선순위 표를 준수한다.

| 우선순위 | 인터랙션 | 동작 결과 | 카메라 상태 | 노드 좌표 | 비고 |
|---------|---------|----------|-----------|----------|------|
| **1** | **Reparent Mode (Alt+Drag)** | SingleNode 이동 | 불변 | 변경 | 재연결 목적 |
| **2** | **Node Drag (Follow OFF)** | Subtree 이동 | 불변 | 변경 | 구조 편집 |
| **3** | **Manual Pan (Space+Drag)** | 화면 이동 | 변경 | 불변 | layoutControlled 유지 |
| **4** | **User Zoom (Wheel)** | 커서 중심 확대/축소 | 변경 | 불변 | Cursor Anchor 유지 |
| **5** | **Follow Selection** | 선택 노드 중앙 정렬 | 조건부 변경 | 불변 | 잠금·수동 패닝 체크 |
| **6** | **Auto Center (초기화)** | 초기 뷰포트 정렬 | 변경 | 불변 | 파일 오픈 시 1회 |

### 7.2 우선순위 규칙

**핵심 규칙**:
- 높은 우선순위 인터랙션이 진행 중이면 낮은 우선순위는 무시
- 동일 우선순위 충돌 시 **사용자 입력 > 자동 로직**
- 카메라 잠금 상태는 우선순위 1~4를 제외한 모든 카메라 변경 차단

### 7.3 드래그 시작 시 분기 로직

```typescript
function onDragStart(nodeId: string, event: MouseEvent) {
  // 우선순위 1: Reparent Mode
  if (event.altKey || ephemeral.reparentMode) {
    startSingleNodeDrag(nodeId);
    cameraController.lock('reparenting');
    return;
  }
  
  // 우선순위 2: Follow OFF - Node Drag
  if (!settings.followSelection) {
    const mode = determineMoveMode(event);
    startNodeDrag(nodeId, mode);
    cameraController.lock('dragging');
    return;
  }
  
  // 우선순위 3: Follow ON - Camera Drag
  startCameraDrag();
  cameraController.lock('camera-drag');
}
```

### 7.4 왜 이 표가 필요한가?

**문제 상황**:
```
사용자가 노드를 드래그하는 중
  → Follow Selection이 ON이라 선택 변경 감지
  → 자동으로 중앙 정렬 시도
  → 드래그 중인 노드가 화면 밖으로 튐
```

**해결**:
```
Interaction Priority Table 적용
  → Node Drag (우선순위 2) 진행 중
  → Follow Selection (우선순위 5) 차단
  → 드래그 완료 후에만 Follow 적용
```

---

## 8. 카메라 잠금 규칙

### 8.1 목적

**자동 포커싱 / Resize / 외부 이벤트로 인한 화면 흔들림 방지**

### 8.2 잠금 상태 정의

```typescript
interface EphemeralState {
  isCameraLocked: boolean;
  lockReason?: 'dragging' | 'layout' | 'reparenting' | 'animation' | 'manual-pan' | 'camera-drag';
}
```

### 8.3 강제 규칙 구현

```typescript
class CameraController {
  private lockCount = 0;  // 중첩 잠금 지원
  
  lock(reason: string): void {
    this.lockCount++;
    ephemeral.isCameraLocked = true;
    ephemeral.lockReason = reason;
    console.log(`Camera locked: ${reason} (count: ${this.lockCount})`);
  }
  
  unlock(reason: string): void {
    this.lockCount = Math.max(0, this.lockCount - 1);
    
    if (this.lockCount === 0) {
      ephemeral.isCameraLocked = false;
      ephemeral.lockReason = undefined;
      console.log(`Camera unlocked: ${reason}`);
    }
  }
}
```

---

## 9. 수동 패닝과 자동 포커싱 충돌 방지

### 9.1 핵심 UX 규칙

> **Manual Pan suppresses Follow Selection**
>
> 사용자가 수동으로 화면을 이동한 직후에는  
> 자동 포커싱을 일정 시간 억제한다.

### 9.2 구현

```typescript
interface EphemeralState {
  lastManualPanAt: number;  // timestamp
  manualPanSuppressionMs: number;  // default: 2000
}

// 수동 패닝 감지
function onManualPan(deltaX: number, deltaY: number) {
  ephemeral.lastManualPanAt = Date.now();
  
  // 단일 진입점 사용!
  cameraController.applyCameraChange(
    {
      offsetX: camera.offsetX + deltaX,
      offsetY: camera.offsetY + deltaY
    },
    CameraChangeReason.UserPan
  );
}

// 자동 포커싱 시 체크
function centerCameraOnNode(node: MindMapNode) {
  if (!settings.followSelection) return;
  if (ephemeral.isCameraLocked) return;
  
  // 수동 패닝 직후 체크
  const timeSinceManualPan = Date.now() - ephemeral.lastManualPanAt;
  if (timeSinceManualPan < ephemeral.manualPanSuppressionMs) {
    console.log(`Auto-focus suppressed (manual pan ${timeSinceManualPan}ms ago)`);
    return;
  }
  
  // 포커싱 수행
  // ...
}
```

---

## 10. 초기 뷰포트 규칙

### 10.1 기본 규칙

> **Open File → Center on Root**

**파일 최초 오픈 시**:
1. `isCameraLocked = false` 확인
2. Root Node 기준 `centerCameraOnNode` 실행
3. 이후 정상 규칙 복귀

```typescript
async function openFile(filePath: string) {
  const data = await loadMindMapData(filePath);
  nodes = data.nodes;
  edges = data.edges;
  rootNodeId = data.rootNodeId;
  
  await nextTick();
  
  // 초기 뷰포트 설정 (단일 진입점 사용!)
  const rootNode = getNode(rootNodeId);
  if (rootNode) {
    const centerCamera = calculateCenterCamera(rootNode);
    cameraController.applyCameraChange(
      centerCamera,
      CameraChangeReason.InitialViewport  // 잠금 무시 가능
    );
  }
}
```

---

## 11. 내비게이션 및 검색 시스템

### 11.1 검색 인터페이스 (Search UI)

**목적**: 방대한 맵 탐색을 위한 '탐색(Search) → 이동(Jump) → 강조(Highlight)' 워크플로우

**외형**:
- 마인드맵 중앙 상단에 플로팅되는 글래스모피즘 스타일 검색창
- 키보드 단축키: `Ctrl/Cmd + F`

**검색 범위**:
- 노드 텍스트
- 연결된 노트 파일명
- 태그 기반 Fuzzy Search 지원

```typescript
interface SearchResult {
  nodeId: string;
  matchType: 'text' | 'note' | 'tag';
  matchScore: number;
  highlightRanges: Array<[number, number]>;
}
```

### 11.2 JumpToNode 메커니즘

특정 노드로의 시점 이동 시 다음의 보정 로직을 적용한다.

```typescript
function jumpToNode(nodeId: string, options?: JumpOptions) {
  const node = getNode(nodeId);
  
  // 1. 좌표 도출: 대상 노드의 월드 좌표를 가져와 뷰포트 중앙 오프셋 계산
  const viewportCenter = {
    x: viewport.width / 2,
    y: viewport.height / 2
  };
  
  // 2. 현재 줌 레벨이 너무 낮으면 읽기 가능한 배율로 조정
  const minReadableScale = 1.0;
  const targetScale = Math.max(camera.scale, minReadableScale);
  
  const targetCamera = {
    offsetX: viewportCenter.x - node.position.x * targetScale,
    offsetY: viewportCenter.y - node.position.y * targetScale,
    scale: targetScale
  };
  
  // 3. 부드러운 이동: 400ms 동안 easeInOutExpo 곡선 적용
  animateCameraChange(
    camera,
    targetCamera,
    400,  // duration
    'easeInOutExpo',
    CameraChangeReason.SearchJump  // 단일 진입점!
  );
  
  // 4. 수동 조작 억제: 점프 직후 자동 포커싱 억제
  ephemeral.lastManualPanAt = Date.now();
  
  // 5. 시각적 피드백: 1.5초간 펄스 하이라이트
  highlightNode(nodeId, 1500);
}
```

### 11.3 시각적 피드백 (Visual Highlight)

```typescript
function highlightNode(nodeId: string, duration: number = 1500) {
  const highlightState = {
    nodeId,
    startTime: Date.now(),
    duration
  };
  
  ephemeral.highlightedNode = highlightState;
  
  // 애니메이션 종료 후 자동 제거
  setTimeout(() => {
    if (ephemeral.highlightedNode?.nodeId === nodeId) {
      ephemeral.highlightedNode = null;
    }
  }, duration);
}

// Renderer에서 펄스 효과 적용
function renderNode(node: MindMapNode) {
  const isHighlighted = ephemeral.highlightedNode?.nodeId === node.id;
  
  return (
    <g className={isHighlighted ? 'pulse-highlight' : ''}>
      {/* 노드 렌더링 */}
    </g>
  );
}
```

### 11.4 검색 결과 네비게이션

```typescript
interface SearchSession {
  results: SearchResult[];
  currentIndex: number;
}

function nextSearchResult() {
  const session = ephemeral.searchSession;
  if (!session || session.results.length === 0) return;
  
  session.currentIndex = (session.currentIndex + 1) % session.results.length;
  const result = session.results[session.currentIndex];
  
  jumpToNode(result.nodeId);
}

function previousSearchResult() {
  const session = ephemeral.searchSession;
  if (!session || session.results.length === 0) return;
  
  session.currentIndex = 
    (session.currentIndex - 1 + session.results.length) % session.results.length;
  const result = session.results[session.currentIndex];
  
  jumpToNode(result.nodeId);
}
```

### 11.5 키보드 단축키

| 키 | 기능 |
|---|-----|
| `Ctrl/Cmd + F` | 검색창 열기 |
| `Enter` | 다음 검색 결과 |
| `Shift + Enter` | 이전 검색 결과 |
| `Esc` | 검색 종료 |

---

## 12. 줌 규칙

### 12.1 UX 필수 규칙

**마우스 커서 중심 Zoom Anchor**:
- 확대/축소 시 **마우스 커서 아래의 월드 좌표는 유지된다**

### 12.2 보정 절차

```typescript
function zoom(delta: number, mouseX: number, mouseY: number) {
  // 1. 줌 전 마우스 위치의 월드 좌표 계산
  const worldPointBefore = screenToWorld(mouseX, mouseY);
  
  // 2. scale 변경
  const scaleFactor = delta > 0 ? 0.9 : 1.1;
  const newScale = clamp(camera.scale * scaleFactor, 0.1, 5.0);
  
  // 3. offset 보정
  const worldPointAfter = {
    x: (mouseX - camera.offsetX) / newScale,
    y: (mouseY - camera.offsetY) / newScale
  };
  
  const offsetDeltaX = (worldPointAfter.x - worldPointBefore.x) * newScale;
  const offsetDeltaY = (worldPointAfter.y - worldPointBefore.y) * newScale;
  
  // 4. 단일 진입점 사용!
  cameraController.applyCameraChange(
    {
      scale: newScale,
      offsetX: camera.offsetX + offsetDeltaX,
      offsetY: camera.offsetY + offsetDeltaY
    },
    CameraChangeReason.UserZoom
  );
}
```

---

## 13. CameraController 생명주기

### 13.1 Obsidian 플러그인 연결

```typescript
class CameraController {
  private resizeObserver: ResizeObserver;
  private camera: CameraState;
  private viewport: Viewport;
  
  constructor(private contentEl: HTMLElement) {
    this.camera = { offsetX: 0, offsetY: 0, scale: 1.0 };
    this.viewport = { 
      width: contentEl.clientWidth, 
      height: contentEl.clientHeight 
    };
    
    this.setupResizeObserver();
  }
  
  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        this.onResize(rect);
      }
    });
    
    this.resizeObserver.observe(this.contentEl);
  }
  
  destroy() {
    this.resizeObserver.disconnect();
  }
}
```

### 13.2 Resize 처리 규칙

```typescript
function onResize(newRect: DOMRect) {
  if (ephemeral.isCameraLocked) {
    console.log('Resize ignored: camera locked');
    return;
  }
  
  // 화면 중앙의 월드 좌표 계산 (리사이즈 전)
  const centerWorld = screenToWorld(
    viewport.width / 2,
    viewport.height / 2
  );
  
  // Viewport 갱신
  viewport = {
    width: newRect.width,
    height: newRect.height
  };
  
  // 같은 월드 좌표가 중앙에 오도록 offset 보정 (단일 진입점 사용!)
  cameraController.applyCameraChange(
    {
      offsetX: viewport.width / 2 - centerWorld.x * camera.scale,
      offsetY: viewport.height / 2 - centerWorld.y * camera.scale
    },
    CameraChangeReason.ResizeAdjustment
  );
}
```

---

## 14. Fixed Node 시각적 피드백

### 14.1 필수성

**문제**: 사용자가 `layoutControlled: false` 상태를 알 수 없음

**해결**: 시각적 표시 필수화

### 14.2 구현

```typescript
function renderNode(node: MindMapNode) {
  return (
    <g className="node">
      {/* 노드 본체 */}
      <circle cx={node.position.x} cy={node.position.y} r={30} />
      
      {/* Fixed Node 표시 */}
      {!node.layoutControlled && (
        <g className="pin-indicator" transform={`translate(${node.position.x + 20}, ${node.position.y - 20})`}>
          <text fontSize="16">📌</text>
        </g>
      )}
    </g>
  );
}
```

### 14.3 인터랙션

- Pin 아이콘 클릭 시 `layoutControlled` 토글 가능
- Tooltip: "자동 레이아웃에서 고정됨"

---

## 15. 성능 최적화: Viewport Culling

### 15.1 선택적 최적화 (Phase 2+)

**규칙**: 
- Renderer **MAY** apply viewport culling optimization
- This is a **non-blocking** performance enhancement

### 15.2 자동 활성화

```typescript
class Renderer {
  render() {
    const totalNodes = allNodes.length;
    const useCulling = totalNodes > 1000;  // 자동 활성화 임계값
    
    const nodesToRender = useCulling 
      ? this.calculateVisibleNodes(allNodes)
      : allNodes;
    
    return this.renderNodes(nodesToRender);
  }
  
  private calculateVisibleNodes(nodes: MindMapNode[]): MindMapNode[] {
    const visibleBounds = this.getVisibleWorldBounds();
    
    return nodes.filter(node => {
      return this.isNodeInBounds(node, visibleBounds);
    });
  }
}
```

---

## 16. 다중 창 환경 대응

### 16.1 CameraController 인스턴스 격리

```typescript
class MindMapView {
  private cameraController: CameraController;
  
  onOpen() {
    // 각 창마다 독립적인 CameraController 생성
    this.cameraController = new CameraController(this.contentEl);
  }
  
  onClose() {
    this.cameraController.destroy();
  }
}
```

### 16.2 DPI 감지

```typescript
class CameraController {
  private devicePixelRatio: number;
  
  constructor(private contentEl: HTMLElement) {
    this.devicePixelRatio = window.devicePixelRatio || 1;
    
    // DPI 변경 감지 (모니터 간 이동)
    window.addEventListener('resize', () => {
      const newDPR = window.devicePixelRatio || 1;
      if (newDPR !== this.devicePixelRatio) {
        this.devicePixelRatio = newDPR;
        this.onDPIChange();
      }
    });
  }
}
```

---

## 17. AI 에이전트 협업 인터페이스

### 17.1 AI 노드 메타데이터

```typescript
interface NodeMetadata {
  createdBy?: 'user' | 'ai' | 'import';
  confirmedBy?: 'user';
  confirmedAt?: number;
}
```

### 17.2 AI 노드 생성

```typescript
function createAINode(content: string, parentId: string): MindMapNode {
  return {
    id: generateId(),
    position: { x: 0, y: 0 },
    layoutControlled: true,  // AI 노드는 자동 배치 기본값
    metadata: {
      createdBy: 'ai'
    }
  };
}
```

### 17.3 사용자 확정 플로우

```typescript
function onUserMoveAINode(nodeId: string) {
  const node = getNode(nodeId);
  
  if (node.metadata?.createdBy === 'ai' && !node.metadata?.confirmedBy) {
    // 확정 다이얼로그 표시
    showConfirmDialog({
      message: "AI가 생성한 노드입니다. 배치를 확정하시겠습니까?",
      onConfirm: () => {
        node.layoutControlled = false;
        node.metadata.confirmedBy = 'user';
        node.metadata.confirmedAt = Date.now();
      },
      onCancel: () => {
        // 이동 취소
      }
    });
  }
}
```

---

## 18. 책임 분리

### 18.1 계층별 책임 (최종)

| 레이어 | 책임 | 절대 하지 않는 것 | 의존성 |
|-------|-----|------------------|-------|
| **Interaction** | - 의도 해석<br>- 입력 이벤트 처리<br>- 모드 전환 결정<br>- 우선순위 판단 | - 직접 좌표 변경<br>- 직접 렌더링<br>- 상태 영속화 | Command, CameraController |
| **CameraController** | - 단일 진입점 제공<br>- 화면 이동<br>- 줌 관리<br>- 포커싱<br>- Resize 보정<br>- 잠금 관리 | - 노드 좌표 변경<br>- 상태 영속화<br>- 레이아웃 계산 | EphemeralState, Renderer |
| **Layout Engine** | - 초기 자동 배치<br>- layoutControlled 노드만 계산 | - 수동 배치 노드 수정<br>- 강제 재배치<br>- Camera 조작 | PersistentState |
| **Renderer** | - SVG 투영<br>- Transform 적용<br>- 시각화<br>- Culling (선택적) | - 노드 좌표 계산<br>- 상태 변경<br>- 비즈니스 로직 | CameraController (read-only) |
| **StateManager** | - 노드 좌표 영속화<br>- 구조 저장<br>- Undo/Redo 관리 | - 렌더링<br>- 사용자 입력 처리<br>- Camera 저장 | - |
| **Command** | - 노드 좌표 변경<br>- 구조 변경<br>- Undo/Redo 로직 | - 직접 렌더링<br>- Camera 조작<br>- 입력 처리 | StateManager |

---

## 19. 구현 체크리스트

### Phase 1: 기본 구조 (필수)

- [ ] `MindMapNode`에 `layoutControlled: boolean` 필드 추가
- [ ] `CameraState` 인터페이스 정의
- [ ] `EphemeralState`에 `isCameraLocked`, `lastManualPanAt` 추가
- [ ] 좌표 변환 함수 구현 (screenToWorld, worldToScreen)
- [ ] CoordinateTransformer 클래스 생성

### Phase 2: 카메라 단일 진입점 (필수)

- [ ] `CameraChangeReason` enum 정의
- [ ] `CameraController.applyCameraChange()` 메서드 구현
- [ ] 모든 카메라 변경을 단일 진입점으로 리팩토링
- [ ] 로깅 및 디버깅 인프라 추가

### Phase 3: 레이아웃 시스템 (필수)

- [ ] AutoAligner에 `layoutControlled` 필터링 추가
- [ ] 노드 드래그 시 `layoutControlled = false` 전환
- [ ] "Reset Layout" 명령 구현
- [ ] `layoutControlled` 상태 Undo/Redo 지원

### Phase 4: 이동 모드 (필수)

- [ ] `MoveMode` enum 정의 (Subtree, Single)
- [ ] `MoveSubtreeCommand` 구현
- [ ] `MoveSingleNodeCommand` 구현
- [ ] `ReparentNodeCommand` 구현
- [ ] Alt 키 감지 및 모드 전환

### Phase 5: 인터랙션 우선순위 (필수)

- [ ] Interaction Priority Table 문서화
- [ ] 드래그 시작 시 우선순위 로직 구현
- [ ] Reparent > Node Drag > Manual Pan 순서 검증
- [ ] 드래그 중 선택 변경 금지
- [ ] 드래그 중 자동 포커싱 금지

### Phase 6: Follow Selection (필수)

- [ ] `followSelection` 설정 추가
- [ ] 단일 선택 시 중앙 정렬 (단일 진입점 사용)
- [ ] 다중 선택 시 Bounding Box 중앙 정렬
- [ ] Follow ON/OFF 토글 UI
- [ ] 잠금 상태 체크 통합

### Phase 7: 수동 패닝 억제 (필수)

- [ ] `lastManualPanAt` 타임스탬프 추적
- [ ] `manualPanSuppressionMs` 설정 추가
- [ ] 수동 패닝 감지 (단일 진입점 사용)
- [ ] 자동 포커싱 시 억제 시간 체크

### Phase 8: 초기 뷰포트 (필수)

- [ ] 파일 오픈 시 Root 중앙 정렬 (단일 진입점 사용)
- [ ] `restoreLastCameraPosition` 설정 (선택적)

### Phase 9: 내비게이션 시스템 (필수)

- [ ] 검색 UI 구현 (Fuzzy Search)
- [ ] `jumpToNode()` 메커니즘 구현 (단일 진입점 사용)
- [ ] 펄스 하이라이트 애니메이션
- [ ] 검색 결과 네비게이션 (Next/Previous)
- [ ] 키보드 단축키 (`Ctrl/Cmd + F`)

### Phase 10: 시각적 피드백 (필수)

- [ ] Fixed Node Pin 아이콘 렌더링
- [ ] Pin 아이콘 클릭 토글 기능
- [ ] Tooltip 추가
- [ ] 상태 가시화 검증

### Phase 11: 성능 최적화 (선택적)

- [ ] Viewport Culling 구현
- [ ] 자동 활성화 로직 (1000개 임계값)
- [ ] 화면 밖 노드 렌더링 생략
- [ ] 성능 테스트 (5000개 노드 60fps)

### Phase 12: 다중 창 대응 (강력 권장)

- [ ] CameraController 인스턴스 격리
- [ ] `contentEl` 생성자 주입
- [ ] DPI 변경 감지
- [ ] Pop-out Window 테스트

### Phase 13: AI 협업 (선택적)

- [ ] AI 노드 메타데이터 추가
- [ ] AI 노드 `layoutControlled: true` 기본값
- [ ] 배치 확정 다이얼로그
- [ ] 확정 후 `layoutControlled: false` 전환

### Phase 14: 테스트 (필수)

- [ ] 단일 진입점 호출 검증
- [ ] 우선순위 충돌 시나리오 테스트
- [ ] 드래그 중 카메라 잠금 테스트
- [ ] Follow ON/OFF 전환 테스트
- [ ] 수동 패닝 후 억제 테스트
- [ ] 검색 및 점프 테스트
- [ ] Undo/Redo 무결성 테스트

---

## 20. 문제 해결 가이드

### 20.1 카메라가 여러 곳에서 변경되어 충돌

**증상**: 드래그 중 화면이 갑자기 튐, 예상과 다른 위치로 이동

**원인**:
- 여러 모듈에서 `camera.offsetX` 직접 수정
- Follow Selection과 Manual Pan이 동시 실행
- 단일 진입점 미사용

**해결**:
```typescript
// ❌ 잘못된 코드
camera.offsetX = newX;
camera.offsetY = newY;

// ✅ 올바른 코드
cameraController.applyCameraChange(
  { offsetX: newX, offsetY: newY },
  CameraChangeReason.UserPan
);
```

### 20.2 검색 후 화면이 이동했는데 다시 돌아감

**증상**: 검색으로 노드로 점프 후 다른 노드 선택 시 원래 위치로 복귀

**원인**:
- `lastManualPanAt` 갱신 누락
- Search Jump를 Manual Pan으로 인식하지 않음

**해결**:
```typescript
function jumpToNode(nodeId: string) {
  // ...
  
  // 점프 직후 수동 패닝으로 인식
  ephemeral.lastManualPanAt = Date.now();
  
  // 단일 진입점 사용
  cameraController.applyCameraChange(
    targetCamera,
    CameraChangeReason.SearchJump
  );
}
```

### 20.3 인터랙션 우선순위가 무시됨

**증상**: Reparent 모드인데 Subtree가 이동됨

**원인**:
- 우선순위 체크 순서 오류
- 조건 분기 로직 누락

**해결**:
```typescript
function onDragStart(nodeId: string, event: MouseEvent) {
  // 반드시 우선순위 순서대로 체크
  
  // 1. Reparent (최우선)
  if (event.altKey || ephemeral.reparentMode) {
    startSingleNodeDrag(nodeId);
    return;
  }
  
  // 2. Follow OFF - Node Drag
  if (!settings.followSelection) {
    startNodeDrag(nodeId, MoveMode.Subtree);
    return;
  }
  
  // 3. Follow ON - Camera Drag
  startCameraDrag();
}
```

### 20.4 Fixed Node 상태를 모름

**증상**: 사용자가 "왜 자동 정렬이 안 되지?" 문의

**원인**:
- Pin 아이콘 미표시
- 시각적 피드백 누락

**해결**:
```typescript
// Renderer에 추가
{!node.layoutControlled && (
  <g className="pin-indicator">📌</g>
)}
```

### 20.5 대규모 노드에서 성능 저하

**증상**: 노드 1000개 이상에서 화면 끊김

**원인**:
- Viewport Culling 미적용
- 모든 노드 렌더링

**해결**:
```typescript
class Renderer {
  render() {
    const useCulling = allNodes.length > 1000;
    const nodesToRender = useCulling 
      ? this.calculateVisibleNodes(allNodes)
      : allNodes;
    
    return this.renderNodes(nodesToRender);
  }
}
```

---

## 📐 핵심 원칙 요약 (Quick Reference)

### 절대 불변 규칙

```
1. 노드 좌표는 월드 좌표 절대값이다
2. 렌더러는 노드 좌표를 절대 수정하지 않는다
3. 카메라는 일시적 상태이며 히스토리에 기록되지 않는다
4. 카메라 변경은 단일 진입점(applyCameraChange)만 사용한다
5. 이동에는 Node 이동과 Camera 이동, 두 종류만 존재한다
6. 이 둘은 절대 섞이지 않는다
7. layoutControlled: false 노드는 AutoAligner가 건드리지 않는다
8. 사용자의 수동 조작은 항상 자동 로직보다 우선한다
```

### 기본 동작

```
카메라 변경 → applyCameraChange(partial, reason) 호출
선택 변경 → Follow ON + 잠금 해제 + 수동 패닝 아님 → 중앙 정렬
드래그 시작 → Interaction Priority Table 참조
검색 결과 → jumpToNode() → 펄스 하이라이트
```

### 우선순위

```
1순위: Reparent Mode
2순위: Node Drag (Follow OFF)
3순위: Manual Pan
4순위: User Zoom
5순위: Follow Selection
6순위: Auto Center
```

### 한 문장 요약

> **노드는 의미의 단위이고, 카메라는 시선의 단위이며,  
> 사용자의 의도가 언제나 최우선이다.**

---

## 🎓 설계 결정 기록 (ADR)

### ADR-001: layoutControlled 필드 도입

*(v4.2.2와 동일)*

### ADR-002 ~ ADR-010

*(v4.2.2와 동일)*

### ADR-011: 카메라 변경 단일 진입점 강제 (v4.2.3 신규)

**결정**: 모든 카메라 상태 변경은 `applyCameraChange()` 메서드를 통해서만 수행

**이유**:
- 카메라 변경 주체 명확화
- 상태 충돌 원천 차단
- 로깅 및 디버깅 용이
- 향후 확장 용이 (애니메이션, 기록 등)

**구현**:
```typescript
applyCameraChange(
  partial: Partial<CameraState>,
  reason: CameraChangeReason
): boolean
```

**대안**:
- 직접 수정 허용 → 충돌 위험, 디버깅 어려움
- Observer 패턴 → 불필요한 복잡도

**결과**: ✅ 채택, 강제 규칙으로 명문화

---

### ADR-012: Interaction Priority Table 명문화 (v4.2.3 신규)

**결정**: 인터랙션 우선순위를 문서에 표로 명문화

**이유**:
- 복잡한 인터랙션 충돌 방지
- AI/협업자가 우선순위 파악 용이
- "왜 이렇게 동작하지?" 질문 감소

**구현**:
- 6단계 우선순위 표
- 각 인터랙션의 동작 결과 명시
- 코드 리뷰 필수 항목으로 지정

**대안**:
- 암묵적 규칙 유지 → 혼란, 버그 위험
- 코드 주석만 → 발견 가능성 낮음

**결과**: ✅ 채택, 섹션 7에 표 추가

---

### ADR-013: 내비게이션 시스템 추가 (v4.2.3 신규)

**결정**: 검색 및 점프 기능을 핵심 아키텍처에 포함

**이유**:
- 대규모 맵 필수 기능
- 카메라 제어와 긴밀히 연계
- UX 완성도 향상

**구현**:
- Fuzzy Search 지원
- `jumpToNode()` 메커니즘
- 펄스 하이라이트 피드백
- 수동 패닝 억제 통합

**대안**:
- 플러그인으로 분리 → 카메라 제어 중복, 통합 어려움
- 텍스트 검색만 → UX 불완전

**결과**: ✅ 채택, 섹션 11에 명세 추가

---

### ADR-014: Viewport Culling을 선택적 최적화로 유지 (v4.2.3 확정)

**결정**: Viewport Culling은 Phase 2+ 선택적 최적화로 유지

**이유**:
- 소규모 맵에서 불필요
- 핵심 아키텍처와 독립적
- 구현 부담 감소

**명시**:
- "Renderer **MAY** apply viewport culling"
- "This is a **non-blocking** enhancement"

**대안**:
- 필수 구현 → 불필요한 복잡도
- 완전 제외 → 대규모 성능 대응 불가

**결과**: ✅ 채택, 선택적 최적화로 명확히 표기

---

## 📚 참조

- [Command Pattern](https://refactoring.guru/design-patterns/command)
- [Coordinate Systems in Graphics](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Mind Mapping Best Practices](https://www.mindmapping.com)
- [UX Patterns for Interactive Canvas](https://www.nngroup.com/articles/canvas-interaction/)
- [Viewport Culling Techniques](https://developer.mozilla.org/en-US/docs/Web/Performance/Rendering)
- [Multi-Window Application Design](https://web.dev/multi-screen-window-placement/)
- [Single Entry Point Pattern](https://refactoring.guru/design-patterns/facade)

---

## 🔄 버전 히스토리

- **v4.2.3** (2026-01-15): 
  - **장기 유지보수성 강화 버전**
  - 카메라 변경 단일 진입점 규칙 추가 (ADR-011)
  - Interaction Priority Table 명문화 (ADR-012)
  - 내비게이션 및 검색 시스템 추가 (ADR-013)
  - Viewport Culling 선택적 최적화 명확화 (ADR-014)
  - 모든 카메라 변경을 `applyCameraChange()`로 통일
  - 검색 → 점프 → 하이라이트 워크플로우 정의
  - **변경 철학**: GPT 리뷰 반영, 아키텍처 보험 장치 설치
  
- **v4.2.2** (2026-01-14): 
  - Production-Ready 보완 버전
  - Fixed Node 시각적 피드백
  - Viewport Culling 성능 최적화
  - 다중 창 환경 대응
  - AI 에이전트 협업 인터페이스
  
- **v4.2.1** (2026-01-14): 
  - 수동 패닝 vs 자동 포커싱 충돌 방지
  - 다중 선택 중앙 정렬
  - 초기 뷰포트 규칙
  
- **v4.2** (2026-01-14): 
  - layoutControlled 필드 추가
  - 구현 우선순위 명확화
  
- **v4.1** (2026-01-14): 
  - 초기 통합 문서
  
- **v4.0** (2026-01-13): 
  - 기본 설계 원칙 정립

---

## 🎯 v4.2.3에서 추가로 해결되는 문제

기존 v4.2.2의 모든 문제 해결에 더해:

15. ✅ 카메라 상태 변경 주체 혼란 문제 (단일 진입점)
16. ✅ 복잡한 인터랙션 충돌 문제 (우선순위 표)
17. ✅ 대규모 맵 탐색 어려움 (내비게이션 시스템)
18. ✅ 검색 후 화면 복귀 문제 (수동 패닝 억제 통합)

---

## 💡 구현 가이드라인 요약

### 우선순위 1: 핵심 기능 (필수)

1. **좌표 불변 원칙** (Phase 1)
2. **카메라 단일 진입점** (Phase 2) - 신규
3. **레이아웃 시스템** (Phase 3)
4. **이동 모드** (Phase 4)
5. **인터랙션 우선순위** (Phase 5) - 보강
6. **Follow Selection** (Phase 6)
7. **수동 패닝 억제** (Phase 7)
8. **초기 뷰포트** (Phase 8)
9. **내비게이션 시스템** (Phase 9) - 신규

### 우선순위 2: 확장성 대비 (강력 권장)

10. **시각적 피드백** (Phase 10)
11. **성능 최적화** (Phase 11) - 선택적
12. **다중 창 대응** (Phase 12)

### 우선순위 3: 미래 기능 (선택적)

13. **AI 협업** (Phase 13)

---

## 🔍 리뷰 체크포인트

### 카메라 제어
- [ ] 모든 카메라 변경이 `applyCameraChange()`를 사용하는가?
- [ ] `CameraChangeReason`이 명시되어 있는가?
- [ ] 직접 `camera.offsetX` 수정이 없는가?

### 인터랙션 우선순위
- [ ] 드래그 시작 시 우선순위 순서를 따르는가?
- [ ] Reparent > Node Drag > Manual Pan 순서가 맞는가?

### 내비게이션
- [ ] 검색 결과로 점프 시 `jumpToNode()`를 사용하는가?
- [ ] 점프 후 펄스 하이라이트가 표시되는가?
- [ ] 점프 후 `lastManualPanAt`이 갱신되는가?

---

## 📝 마이그레이션 가이드

### v4.2.2 → v4.2.3

기존 코드를 다음과 같이 변경:

```typescript
// 1. 카메라 변경을 단일 진입점으로 리팩토링
// ❌ Before
camera.offsetX = newX;
camera.offsetY = newY;

// ✅ After
cameraController.applyCameraChange(
  { offsetX: newX, offsetY: newY },
  CameraChangeReason.UserPan
);

// 2. Interaction Priority Table 적용
function onDragStart(nodeId: string, event: MouseEvent) {
  // 우선순위 순서대로 체크
  if (event.altKey || ephemeral.reparentMode) {
    startSingleNodeDrag(nodeId);
    return;
  }
  
  if (!settings.followSelection) {
    startNodeDrag(nodeId, MoveMode.Subtree);
    return;
  }
  
  startCameraDrag();
}

// 3. 검색 및 점프 기능 추가
function onSearch(query: string) {
  const results = fuzzySearch(query, allNodes);
  ephemeral.searchSession = {
    results,
    currentIndex: 0
  };
  
  if (results.length > 0) {
    jumpToNode(results[0].nodeId);
  }
}
```

### 호환성

- **v4.2.2 데이터**: 100% 호환
- **기존 코드**: 카메라 변경 부분만 리팩토링 필요
- **API 변경**: `applyCameraChange()` 추가, 기존 API 유지

---

## 🚀 다음 단계

v4.2.3 완료 후 권장 순서:

1. **Phase 1~2 완료** (기본 구조 + 단일 진입점)
2. **Phase 3~5 완료** (레이아웃 + 이동 + 우선순위)
3. **Phase 6~8 완료** (Follow + 수동 패닝 + 초기화)
4. **Phase 9 완료** (내비게이션 시스템)
5. **Phase 10~12 선택** (시각화 + 성능 + 다중 창)
6. **Phase 13 선택** (AI 협업)
7. **Phase 14 완료** (전체 테스트 및 검증)

---

**문서 작성자**: KK-NeroMind Team  
**라이선스**: MIT  
**기여**: Pull Requests Welcome  
**검토**: ChatGPT + Gemini Consensus Review + GPT Architecture Review

---

## 📊 v4.2.3 변경 사항 요약

| 항목 | v4.2.2 | v4.2.3 | 변경 이유 |
|-----|--------|--------|----------|
| **카메라 제어** | 여러 곳에서 직접 수정 | 단일 진입점 강제 | 상태 충돌 방지, 디버깅 용이 |
| **인터랙션 우선순위** | 암묵적 규칙 | 명문화된 표 | AI/협업자 파악 용이 |
| **내비게이션 시스템** | 없음 | 검색 + 점프 + 하이라이트 | 대규모 맵 필수 기능 |
| **Viewport Culling** | Phase 11 선택적 | Phase 11 선택적 명확화 | 구현 부담 명시 |
| **ADR** | 10개 | 14개 | 신규 설계 결정 문서화 |

### 핵심 철학 변경 없음 ✅

v4.2.3은 v4.2.2의 **철학을 100% 유지**하며:
- 좌표 불변 원칙
- 카메라 기반 화면 이동
- 사용자 의도 우선

위 원칙들은 그대로 유지하고, **장기 유지보수를 위한 아키텍처 보험 장치**를 추가했습니다.

---

## 🎉 최종 결론

**KK-NeroMind Architecture v4.2.3**는:

- ✅ 개념적으로 완성된 설계 (v4.2.1)
- ✅ 실사용 대비 가드레일 설치 (v4.2.2)
- ✅ 장기 유지보수 보험 장치 (v4.2.3)
- ✅ AI·대규모·멀티윈도우 안전 확보
- ✅ 카메라 제어 단일 진입점
- ✅ 인터랙션 우선순위 명문화
- ✅ 내비게이션 시스템 통합

**Production-Ready + Future-Proof 상태**입니다. 🚀
