# KK-NeroMind 코딩 가이드라인

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **문서명** | KK-NeroMind 코딩 가이드라인 |
| **버전** | v2.0 |
| **최종 수정일** | 2026-01-15 |
| **기반 아키텍처** | KK-NeroMind Architecture v4.2.3 |
| **목적** | 아키텍처 원칙 기반 코딩 주의사항 및 Best Practices |

---

## 🎯 핵심 아키텍처 원칙

구현 시 **절대 지켜야 할 3가지 원칙**:

> **1. 노드는 움직이지 않는다. 카메라만 움직인다.**  
> **2. 노드는 의미의 단위이고, 카메라는 시선의 단위다.**  
> **3. 사용자의 의도가 언제나 자동 로직보다 우선한다.**

---

## 🔴 Phase 1: 코어 인프라 주의사항

### 1.1 플러그인 진입점 (Plugin Entry Point)

#### ⚠️ 필수 체크리스트

```typescript
// ❌ 잘못된 예
class NeroMindPlugin extends Plugin {
  onload() {
    // 바로 초기화 시작
    this.init();
  }
}

// ✅ 올바른 예
class NeroMindPlugin extends Plugin {
  private disposables: Disposable[] = [];
  
  async onload(): Promise<void> {
    // 1. 설정 로드
    await this.loadSettings();
    
    // 2. 앱 준비 상태 확인
    this.app.workspace.onLayoutReady(() => {
      this.init();
    });
  }
  
  async onunload(): Promise<void> {
    // 역순으로 dispose
    for (const d of this.disposables.reverse()) {
      d.destroy();
    }
    this.disposables = [];
  }
}
```

#### 🚨 주의사항

1. **onLayoutReady 사용 필수**
   - Obsidian의 workspace가 완전히 준비되기 전에 DOM 조작하면 오류 발생
   - `this.app.workspace.onLayoutReady()` 안에서 초기화

2. **Disposable 역순 해제**
   - 등록 순서의 역순으로 destroy() 호출
   - 의존성 있는 모듈이 먼저 해제되면 오류 발생

3. **async/await 주의**
   - `onload()`는 async여야 함
   - 설정 로드 등 비동기 작업 완료 후 초기화

---

## 🔵 좌표 시스템 주의사항 (핵심)

### 2.1 월드 좌표 불변 원칙

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
  
  // 렌더링
  nodeElement.setAttribute('x', screenX.toString());
  nodeElement.setAttribute('y', screenY.toString());
}
```

#### 🚨 주의사항

1. **노드 좌표는 월드 좌표계 (World Space)**
   - 노드의 `position.x`, `position.y`는 절대 좌표
   - 카메라 이동, 줌, 리사이즈로 **절대 변경 금지**

2. **좌표 변경은 Command를 통해서만**
   ```typescript
   // ❌ 직접 수정 금지
   node.position.x = newX;
   
   // ✅ Command 사용
   commandManager.execute(new MoveNodeCommand(nodeId, newX, newY));
   ```

3. **좌표 변환 공식**
   ```typescript
   // Screen → World
   worldX = (screenX - camera.offsetX) / camera.scale;
   worldY = (screenY - camera.offsetY) / camera.scale;
   
   // World → Screen
   screenX = worldX * camera.scale + camera.offsetX;
   screenY = worldY * camera.scale + camera.offsetY;
   ```

### 2.2 layoutControlled 필드 관리

#### ⚠️ 상태 전이 규칙

```typescript
// ✅ 노드 생성 시
function createNode(parentId: string): MindMapNode {
  return {
    id: generateId(),
    position: { x: 0, y: 0 },
    layoutControlled: true,  // 기본값: 자동 레이아웃 대상
    // ...
  };
}

// ✅ 드래그 시작 시
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

// ✅ "Reset Layout" 명령 시
function resetLayout() {
  allNodes.forEach(node => {
    node.layoutControlled = true;  // 전체 재활성화
  });
  autoAligner.align(allNodes);
}
```

#### 🚨 주의사항

1. **AutoAligner는 layoutControlled 필터링 필수**
   ```typescript
   class AutoAligner {
     align(nodes: MindMapNode[]): void {
       // layoutControlled === true 인 노드만 계산 대상
       const controllableNodes = nodes.filter(n => n.layoutControlled);
       
       // layoutControlled === false 노드는 절대 건드리지 않음!
       controllableNodes.forEach(node => {
         node.position = this.calculatePosition(node);
       });
     }
   }
   ```

2. **Command에서 layoutControlled 상태 저장**
   ```typescript
   class MoveNodeCommand implements Command {
     private oldLayoutControlled: boolean;
     
     execute() {
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

## 🟢 카메라 시스템 주의사항 (핵심)

### 3.1 카메라 변경 단일 진입점

#### ⚠️ 강제 규칙

```typescript
// ❌ 잘못된 예: 직접 카메라 수정
function panCamera(deltaX: number, deltaY: number) {
  camera.offsetX += deltaX;  // 금지!
  camera.offsetY += deltaY;
}

// ✅ 올바른 예: 단일 진입점 사용
function panCamera(deltaX: number, deltaY: number) {
  cameraController.applyCameraChange(
    {
      offsetX: camera.offsetX + deltaX,
      offsetY: camera.offsetY + deltaY
    },
    CameraChangeReason.UserPan
  );
}
```

#### 🚨 주의사항

1. **모든 카메라 변경은 applyCameraChange() 사용**
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
   
   class CameraController {
     applyCameraChange(
       partial: Partial<CameraState>,
       reason: CameraChangeReason
     ): boolean {
       // 잠금 체크
       if (ephemeral.isCameraLocked && reason !== CameraChangeReason.InitialViewport) {
         console.warn(`Camera locked: ${ephemeral.lockReason}`);
         return false;
       }
       
       // 로깅 (디버깅용)
       console.log(`Camera change: ${reason}`, partial);
       
       // 상태 업데이트
       this.camera = { ...this.camera, ...partial };
       this.renderer.updateTransform(this.camera);
       
       return true;
     }
   }
   ```

2. **직접 camera 속성 수정 절대 금지**
   ```typescript
   // ❌ 절대 금지
   this.camera.offsetX = newX;
   this.camera.scale = newScale;
   
   // ✅ 항상 단일 진입점 사용
   cameraController.applyCameraChange(
     { offsetX: newX, scale: newScale },
     CameraChangeReason.UserZoom
   );
   ```

### 3.2 카메라 잠금 규칙

#### ⚠️ 잠금 생명주기

```typescript
// ✅ 드래그 시작 시 잠금
function onDragStart() {
  cameraController.lock('dragging');
}

// ✅ 드래그 종료 시 해제
function onDragEnd() {
  cameraController.unlock('dragging');
}

// ✅ 중첩 잠금 지원
class CameraController {
  private lockCount = 0;
  
  lock(reason: string): void {
    this.lockCount++;
    ephemeral.isCameraLocked = true;
    ephemeral.lockReason = reason;
  }
  
  unlock(reason: string): void {
    this.lockCount = Math.max(0, this.lockCount - 1);
    
    if (this.lockCount === 0) {
      ephemeral.isCameraLocked = false;
      ephemeral.lockReason = undefined;
    }
  }
}
```

#### 🚨 주의사항

1. **잠금 중에는 카메라 변경 차단**
   - Follow Selection 무시
   - Resize 보정 무시 (InitialViewport는 예외)

2. **잠금/해제 쌍 맞추기**
   ```typescript
   function performLayout() {
     cameraController.lock('layout');
     try {
       autoAligner.align(nodes);
     } finally {
       cameraController.unlock('layout');  // 반드시 해제
     }
   }
   ```

---

## 🟡 인터랙션 우선순위 주의사항

### 4.1 Interaction Priority Table 준수

#### ⚠️ 우선순위 체크 순서

```typescript
// ✅ 올바른 예: 우선순위 순서대로 체크
function onDragStart(nodeId: string, event: MouseEvent) {
  // 우선순위 1: Reparent Mode
  if (event.altKey || ephemeral.reparentMode) {
    startSingleNodeDrag(nodeId);
    cameraController.lock('reparenting');
    return;
  }
  
  // 우선순위 2: Follow OFF - Node Drag
  if (!settings.followSelection) {
    startNodeDrag(nodeId, MoveMode.Subtree);
    cameraController.lock('dragging');
    return;
  }
  
  // 우선순위 3: Follow ON - Camera Drag
  startCameraDrag();
  cameraController.lock('camera-drag');
}

// ❌ 잘못된 예: 우선순위 무시
function onDragStart(nodeId: string, event: MouseEvent) {
  if (settings.followSelection) {  // 순서 바뀜 - 버그!
    startCameraDrag();
    return;
  }
  
  if (event.altKey) {  // Reparent가 나중에 체크됨
    startSingleNodeDrag(nodeId);
    return;
  }
}
```

#### 🚨 주의사항

1. **우선순위 테이블 암기**
   | 우선순위 | 인터랙션 | 조건 |
   |---------|---------|-----|
   | 1 | Reparent Mode | Alt 키 또는 Reparent Mode ON |
   | 2 | Node Drag | Follow OFF |
   | 3 | Camera Drag | Follow ON |

2. **드래그 중 선택 변경 금지**
   ```typescript
   function onNodeSelected(nodeId: string) {
     if (ephemeral.isDragging) return;  // 드래그 중 무시
     if (!settings.followSelection) return;
     
     centerCameraOnNode(getNode(nodeId));
   }
   ```

### 4.2 Subtree vs Single 이동

#### ⚠️ 기본값은 Subtree

```typescript
// ✅ 올바른 예: 기본은 Subtree
enum MoveMode {
  Subtree,  // 기본값 - 부모 + 모든 자식 함께 이동
  Single    // 예외 - 부모만 이동 (재연결 목적)
}

function determineMoveMode(event: MouseEvent): MoveMode {
  // Alt 키 또는 Reparent Mode일 때만 Single
  if (event.altKey || ephemeral.reparentMode) {
    return MoveMode.Single;
  }
  
  return MoveMode.Subtree;  // 기본값
}

// ❌ 잘못된 예: Single이 기본
function determineMoveMode(event: MouseEvent): MoveMode {
  if (!event.altKey) return MoveMode.Single;  // 반대로 하면 안 됨!
  return MoveMode.Subtree;
}
```

#### 🚨 주의사항

1. **Subtree 이동 시 모든 자손 포함**
   ```typescript
   class MoveSubtreeCommand implements Command {
     execute() {
       // 루트 + 모든 자손
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

## 🟣 수동 패닝과 자동 포커싱 충돌 방지

### 5.1 Manual Pan Suppresses Follow

#### ⚠️ 억제 시간 체크

```typescript
// ✅ 올바른 예: 수동 패닝 후 억제
interface EphemeralState {
  lastManualPanAt: number;  // timestamp
  manualPanSuppressionMs: number;  // default: 2000
}

function onManualPan(deltaX: number, deltaY: number) {
  ephemeral.lastManualPanAt = Date.now();
  
  cameraController.applyCameraChange(
    {
      offsetX: camera.offsetX + deltaX,
      offsetY: camera.offsetY + deltaY
    },
    CameraChangeReason.UserPan
  );
}

function centerCameraOnNode(node: MindMapNode) {
  if (!settings.followSelection) return;
  if (ephemeral.isCameraLocked) return;
  
  // 수동 패닝 직후 체크
  const timeSinceManualPan = Date.now() - ephemeral.lastManualPanAt;
  if (timeSinceManualPan < ephemeral.manualPanSuppressionMs) {
    console.log(`Auto-focus suppressed (${timeSinceManualPan}ms ago)`);
    return;
  }
  
  // 포커싱 수행
  // ...
}
```

#### 🚨 주의사항

1. **검색 점프 후에도 억제 적용**
   ```typescript
   function jumpToNode(nodeId: string) {
     // ...
     
     // 점프 직후 수동 패닝으로 인식
     ephemeral.lastManualPanAt = Date.now();
     
     cameraController.applyCameraChange(
       targetCamera,
       CameraChangeReason.SearchJump
     );
   }
   ```

---

## 🔵 렌더링 주의사항

### 6.1 SVG Transform Layer

#### ⚠️ 카메라는 transform-layer에만 적용

```typescript
// ✅ 올바른 예: transform-layer 분리
function render() {
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
          />
        ))}
      </g>
    </svg>
  );
}

// ❌ 잘못된 예: 노드 DOM에 transform 적용
<Node 
  transform={`translate(${node.position.x * camera.scale}, ${node.position.y * camera.scale})`}
/>
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

### 6.2 Fixed Node 시각적 피드백

#### ⚠️ Pin 아이콘 표시

```typescript
// ✅ 올바른 예: layoutControlled 상태 표시
function renderNode(node: MindMapNode) {
  return (
    <g className="node">
      {/* 노드 본체 */}
      <rect x={node.position.x} y={node.position.y} />
      
      {/* Fixed Node 표시 */}
      {!node.layoutControlled && (
        <g className="pin-indicator" 
           transform={`translate(${node.position.x + 20}, ${node.position.y - 20})`}>
          <text fontSize="16">📌</text>
        </g>
      )}
    </g>
  );
}
```

---

## 🟠 Phase 2: 노드 조작 & 인터랙션 주의사항

### 7.1 방향성 관리 (DirectionManager)

#### ⚠️ 방향 상속 로직

```typescript
// ❌ 잘못된 예: 자식에서 방향 임의 설정
function createChild(parent: MindMapNode, direction: Direction) {
  return { ...newNode, direction };  // 부모 방향 무시
}

// ✅ 올바른 예: 부모 방향 상속
function createChild(parent: MindMapNode): MindMapNode {
  // 루트노드가 아니면 부모 방향 상속
  const direction = parent.parentId === null 
    ? this.getNextDirectionFromRoot(parent)  // 루트의 +버튼에서 결정
    : parent.direction;  // 부모 방향 상속
    
  return { ...newNode, direction };
}
```

### 7.2 Command 패턴 (Undo/Redo)

#### ⚠️ 명령 설계

```typescript
// ❌ 잘못된 예: 상태를 직접 수정
function moveNode(nodeId: string, newPos: Position): void {
  this.nodes.get(nodeId)!.position = newPos;
}

// ✅ 올바른 예: Command로 감싸기
class MoveNodeCommand implements Command {
  private oldPosition: Position;
  private oldLayoutControlled: boolean;
  
  constructor(
    private nodeId: string,
    private newPosition: Position,
    private stateManager: StateManager
  ) {
    const node = stateManager.getNode(nodeId);
    this.oldPosition = { ...node.position };
    this.oldLayoutControlled = node.layoutControlled;
  }
  
  execute(): void {
    const node = this.stateManager.getNode(this.nodeId);
    node.position = this.newPosition;
    node.layoutControlled = false;  // 핵심!
  }
  
  undo(): void {
    const node = this.stateManager.getNode(this.nodeId);
    node.position = this.oldPosition;
    node.layoutControlled = this.oldLayoutControlled;  // 복원!
  }
}
```

---

## 🟡 Phase 3: 동기화 & 내보내기 주의사항

### 8.1 자동 저장 시스템

#### ⚠️ 디바운스 구현

```typescript
// ✅ 올바른 예: 디바운스로 연속 저장 방지
class AutoSaveManager {
  private saveTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 1000;  // 1초
  
  scheduleSave(): void {
    // 기존 예약 취소
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // 새 예약
    this.saveTimeout = window.setTimeout(() => {
      this.save();
    }, this.DEBOUNCE_MS);
  }
  
  private async save(): Promise<void> {
    try {
      const data = this.stateManager.serialize();
      await this.app.vault.modify(this.mindmapFile, data);
      // 조용히 저장 (토스트 없음)
    } catch (e) {
      console.error('자동 저장 실패:', e);
      new Notice('자동 저장에 실패했습니다.');
    }
  }
}
```

---

## 🟢 Phase 4: 고급 기능 & 최적화 주의사항

### 9.1 자동 정렬 (AutoAligner)

#### ⚠️ layoutControlled 필터링 필수

```typescript
// ✅ 올바른 예: layoutControlled 필터링
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

// ❌ 잘못된 예: 모든 노드 정렬
function align(nodes: MindMapNode[]): void {
  nodes.forEach(node => {
    node.position = this.calculatePosition(node);  // 사용자 배치 덮어씀!
  });
}
```

### 9.2 Viewport Culling (선택적)

#### ⚠️ 자동 활성화

```typescript
// ✅ 올바른 예: 노드 수에 따라 자동 활성화
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

## 📊 공통 주의사항

### 메모리 누수 방지

```typescript
// 이벤트 리스너는 반드시 제거
class SomeComponent implements Disposable {
  private listeners: Array<() => void> = [];
  
  init(): void {
    const handler = this.handleEvent.bind(this);
    window.addEventListener('resize', handler);
    this.listeners.push(() => window.removeEventListener('resize', handler));
  }
  
  destroy(): void {
    for (const remove of this.listeners) {
      remove();
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
} catch (e) {
  console.error('저장 실패:', e);
  new Notice('파일 저장에 실패했습니다. 다시 시도해주세요.');
}
```

---

## ✅ 체크리스트

구현 완료 시 반드시 확인:

### 좌표 시스템
- [ ] 노드 좌표는 월드 좌표만 사용하는가?
- [ ] Renderer가 노드 좌표를 수정하지 않는가?
- [ ] Camera는 Ephemeral State인가?
- [ ] 좌표 변환 공식이 올바른가?

### 카메라 제어
- [ ] 모든 카메라 변경이 `applyCameraChange()`를 사용하는가?
- [ ] `CameraChangeReason`이 명시되어 있는가?
- [ ] 직접 `camera.offsetX` 수정이 없는가?
- [ ] 카메라 잠금/해제 쌍이 맞는가?

### 레이아웃
- [ ] AutoAligner가 `layoutControlled` 필터링을 하는가?
- [ ] 드래그 시 `layoutControlled`가 false로 전환되는가?
- [ ] Command에서 `layoutControlled` 상태를 저장/복원하는가?

### 인터랙션
- [ ] Interaction Priority Table 순서를 지키는가?
- [ ] 기본 이동 모드가 Subtree인가?
- [ ] 드래그 중 선택 변경이 금지되는가?
- [ ] 수동 패닝 후 자동 포커싱이 억제되는가?

### 시각화
- [ ] Fixed Node에 Pin 아이콘이 표시되는가?
- [ ] transform-layer가 단 하나만 존재하는가?
- [ ] 노드 DOM에 transform이 적용되지 않는가?

---

**문서 끝**
