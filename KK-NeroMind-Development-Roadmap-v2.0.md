# KK-NeroMind 개발 로드맵 & 작업 명세서

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **문서명** | KK-NeroMind 개발 로드맵 & 작업 명세서 |
| **버전** | v2.0 |
| **최종 수정일** | 2026-01-15 |
| **기반 아키텍처** | KK-NeroMind Architecture v4.2.3 |
| **총 예상 기간** | 8-12주 |

---

## 🎯 아키텍처 v4.2.3 기반 Phase 재구성

Architecture v4.2.3의 핵심 원칙을 반영하여 Phase를 재편성했습니다:

1. **Phase 1**: 기본 구조 + **카메라 단일 진입점** (필수)
2. **Phase 2**: 레이아웃 + 이동 모드 + **인터랙션 우선순위** (필수)
3. **Phase 3**: Follow + 수동 패닝 + 초기화 (필수)
4. **Phase 4**: **내비게이션 시스템** + 동기화 (필수)
5. **Phase 5**: 시각화 + 성능 + 다중 창 (강력 권장)
6. **Phase 6**: AI 협업 + 고급 기능 (선택적)

---

## 🔴 Phase 1: 기본 구조 & 카메라 단일 진입점 (예상: 2-3주)

### 개요
플러그인의 기본 골격과 좌표 시스템을 구축합니다. **Architecture v4.2.3의 핵심인 카메라 단일 진입점**을 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **플러그인 진입점 구현** | 4h | `main.ts` 생성, `Plugin` 클래스 상속, `onload()`/`onunload()` 구현 |
| 🔴 P0 | **Disposable 인터페이스 정의** | 2h | `interface Disposable { destroy(): void }` 정의, 모든 컴포넌트에 적용 |
| 🔴 P0 | **마인드맵 뷰 등록** | 4h | `ItemView` 상속, 커스텀 뷰 타입 등록, 사이드바 아이콘 추가 |
| 🔴 P0 | **CameraState 인터페이스 정의** | 2h | offsetX, offsetY, scale 정의, Ephemeral State로 분리 |
| 🔴 P0 | **CameraChangeReason enum** | 2h | UserPan, UserZoom, FollowSelection, SearchJump 등 정의 |
| 🔴 P0 | **CameraController 구현** | 8h | applyCameraChange() 단일 진입점, 잠금 메커니즘, ResizeObserver 연동 |
| 🔴 P0 | **CoordinateTransformer 구현** | 4h | screenToWorld, worldToScreen, 좌표 변환 유틸리티 |
| 🟠 P1 | **SVG 캔버스 초기화** | 4h | 루트 SVG 요소 생성, transform-layer 설정, 좌표계 초기화 |
| 🟠 P1 | **SVGNodeFactory 구현** | 6h | 노드 SVG 요소 생성 팩토리, 월드 좌표 렌더링 |
| 🟠 P1 | **SVGEdgeFactory 구현** | 4h | 엣지 SVG 요소 생성, 월드 좌표 기반 계산 |
| 🟠 P1 | **Renderer 조립자 구현** | 4h | transform-layer 관리, NodeRenderer, EdgeRenderer 조합 |
| 🟡 P2 | **루트노드 생성 및 배치** | 4h | 화면 중앙에 루트노드 자동 생성, 커서 자동 포커스 |
| 🟡 P2 | **Glassmorphism 스타일 적용** | 4h | Apple 스타일 반투명 배경, blur 효과, 그림자 |

### Phase 1 상세 설명

#### 1.1 CameraController 구현 (핵심)

**파일**: `src/camera/CameraController.ts`

**역할**:
- 카메라 상태 변경의 **단일 진입점** 제공
- 잠금 메커니즘 관리
- ResizeObserver 연동

**핵심 코드 구조**:
```typescript
enum CameraChangeReason {
  UserPan = 'UserPan',
  UserZoom = 'UserZoom',
  FollowSelection = 'FollowSelection',
  CenterOnNode = 'CenterOnNode',
  InitialViewport = 'InitialViewport',
  SearchJump = 'SearchJump',
  ResizeAdjustment = 'ResizeAdjustment'
}

class CameraController {
  private camera: CameraState;
  private lockCount = 0;
  private resizeObserver: ResizeObserver;
  
  constructor(private contentEl: HTMLElement) {
    this.camera = { offsetX: 0, offsetY: 0, scale: 1.0 };
    this.setupResizeObserver();
  }
  
  /**
   * 카메라 상태를 변경하는 유일한 창구
   */
  applyCameraChange(
    partial: Partial<CameraState>,
    reason: CameraChangeReason
  ): boolean {
    if (ephemeral.isCameraLocked && reason !== CameraChangeReason.InitialViewport) {
      console.warn(`Camera locked: ${ephemeral.lockReason}`);
      return false;
    }
    
    console.log(`Camera change: ${reason}`, partial);
    this.camera = { ...this.camera, ...partial };
    this.renderer.updateTransform(this.camera);
    
    return true;
  }
  
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

#### 1.2 CoordinateTransformer 구현

**파일**: `src/camera/CoordinateTransformer.ts`

**역할**:
- 화면 좌표 ↔ 월드 좌표 변환
- Bounding Box 변환

**핵심 공식**:
```typescript
class CoordinateTransformer {
  worldToScreen(worldX: number, worldY: number, camera: CameraState): Point {
    return {
      x: worldX * camera.scale + camera.offsetX,
      y: worldY * camera.scale + camera.offsetY
    };
  }
  
  screenToWorld(screenX: number, screenY: number, camera: CameraState): Point {
    return {
      x: (screenX - camera.offsetX) / camera.scale,
      y: (screenY - camera.offsetY) / camera.scale
    };
  }
}
```

### Phase 1 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] CameraController.applyCameraChange() 정상 동작
- [ ] CameraController.lock/unlock 중첩 잠금
- [ ] CoordinateTransformer 좌표 변환 정확성
- [ ] Renderer transform-layer 단일성
- [ ] 직접 camera 속성 수정 감지 (린트)

## UI/UX 테스트
- [ ] 플러그인 활성화 시 마인드맵 뷰 표시
- [ ] 루트노드가 화면 중앙에 위치
- [ ] 카메라 이동 시 로그 출력 (CameraChangeReason)
- [ ] Resize 시 좌표 유지
```

---

## 🟠 Phase 2: 레이아웃 & 인터랙션 우선순위 (예상: 2-3주)

### 개요
노드 이동 모드, 레이아웃 시스템, **인터랙션 우선순위 테이블**을 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **MindMapNode 스키마 확정** | 2h | layoutControlled 필드 추가 |
| 🔴 P0 | **MoveMode enum 정의** | 2h | Subtree, Single 정의 |
| 🔴 P0 | **MoveSubtreeCommand 구현** | 6h | 부모 + 모든 자식 이동, layoutControlled 관리 |
| 🔴 P0 | **MoveSingleNodeCommand 구현** | 4h | 부모만 이동 (재연결용) |
| 🔴 P0 | **ReparentNodeCommand 구현** | 4h | 부모 변경 로직 |
| 🔴 P0 | **Interaction Priority 로직** | 6h | Reparent > Node Drag > Manual Pan 우선순위 구현 |
| 🟠 P1 | **AutoAligner 기본 구현** | 8h | layoutControlled 필터링, 노드 자동 정렬 |
| 🟠 P1 | **DirectionManager 구현** | 6h | 4방향 확장 로직, 방향 상속 로직, 자식 위치 계산 |
| 🟠 P1 | **자식 노드 생성 기능** | 4h | +버튼 클릭 또는 Tab 키로 자식 노드 생성 |
| 🟠 P1 | **형제 노드 생성 기능** | 4h | Enter 키로 형제 노드 생성 |
| 🟠 P1 | **StateManager 기본 구현** | 6h | PersistentState/EphemeralState 분리, 노드 저장소 |
| 🟡 P2 | **KeyboardManager 구현** | 8h | 전체 키보드 단축키 바인딩 및 처리 |
| 🟡 P2 | **MouseManager 구현** | 6h | 클릭, 드래그, 휠 이벤트 처리 |
| 🟡 P2 | **노드 선택 시스템** | 4h | 단일 선택, 선택 상태 시각화 |
| 🟡 P2 | **노드 드래그 이동** | 6h | Subtree 기본, Alt 키로 Single 전환 |

### Phase 2 상세 설명

#### 2.1 MindMapNode 스키마

**파일**: `src/types/MindMapNode.ts`

```typescript
interface MindMapNode {
  id: string;
  position: { 
    x: number;  // World Space (absolute)
    y: number; 
  };
  
  /**
   * 레이아웃 엔진의 제어 여부
   * - true:  레이아웃 엔진이 자동 배치 가능
   * - false: 사용자가 수동으로 고정 (레이아웃 엔진 금지)
   */
  layoutControlled: boolean;  // 기본값: true
  
  content: string;
  direction: Direction | null;
  parentId: string | null;
  isCollapsed: boolean;
}
```

#### 2.2 Interaction Priority 구현

**파일**: `src/input/InteractionController.ts`

**우선순위 테이블**:

| 우선순위 | 인터랙션 | 조건 | 동작 |
|---------|---------|-----|-----|
| 1 | Reparent Mode | Alt + Drag | SingleNode 이동 |
| 2 | Node Drag | Follow OFF | Subtree 이동 |
| 3 | Camera Drag | Follow ON | Camera 이동 |

**구현**:
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
    startNodeDrag(nodeId, MoveMode.Subtree);
    cameraController.lock('dragging');
    return;
  }
  
  // 우선순위 3: Follow ON - Camera Drag
  startCameraDrag();
  cameraController.lock('camera-drag');
}
```

#### 2.3 AutoAligner 구현

**파일**: `src/layout/AutoAligner.ts`

**핵심 로직**:
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
  }
}
```

### Phase 2 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] Interaction Priority 순서 검증
- [ ] Subtree 이동 시 모든 자손 포함 확인
- [ ] AutoAligner layoutControlled 필터링
- [ ] layoutControlled 상태 전이
- [ ] Command Undo/Redo에서 layoutControlled 복원

## UI/UX 테스트
- [ ] 기본 드래그는 Subtree 이동
- [ ] Alt + 드래그는 Single 이동
- [ ] Follow OFF 시 Node 이동
- [ ] Follow ON 시 Camera 이동
- [ ] AutoAligner 수동 배치 노드 제외
```

---

## 🟡 Phase 3: Follow & 수동 패닝 충돌 방지 (예상: 1-2주)

### 개요
Follow Selection 시스템과 수동 패닝 충돌 방지를 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **followSelection 설정 추가** | 2h | Settings 인터페이스, 기본값 true |
| 🔴 P0 | **단일 선택 중앙 정렬** | 4h | centerCameraOnNode() 구현, applyCameraChange() 사용 |
| 🔴 P0 | **다중 선택 Bounding Box 정렬** | 4h | calculateBoundingBox(), 모든 선택 노드 포함 |
| 🔴 P0 | **수동 패닝 감지** | 4h | Space+Drag, Middle Mouse, lastManualPanAt 추적 |
| 🔴 P0 | **자동 포커싱 억제** | 4h | manualPanSuppressionMs, 억제 시간 체크 |
| 🟠 P1 | **Follow ON/OFF 토글 UI** | 2h | Toolbar 버튼, 상태 시각화 |
| 🟠 P1 | **초기 뷰포트 설정** | 4h | 파일 오픈 시 Root 중앙 정렬 |
| 🟡 P2 | **카메라 애니메이션** | 4h | smooth transition (200ms), easing 함수 |

### Phase 3 상세 설명

#### 3.1 수동 패닝 vs 자동 포커싱

**파일**: `src/camera/FocusController.ts`

**구현**:
```typescript
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
  
  // 중앙 정렬
  const targetOffsetX = viewport.width / 2 - node.position.x * camera.scale;
  const targetOffsetY = viewport.height / 2 - node.position.y * camera.scale;
  
  cameraController.applyCameraChange(
    { offsetX: targetOffsetX, offsetY: targetOffsetY },
    CameraChangeReason.CenterOnNode
  );
}
```

### Phase 3 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] Follow ON 시 중앙 정렬
- [ ] Follow OFF 시 중앙 정렬 무시
- [ ] 수동 패닝 후 2초간 억제
- [ ] 다중 선택 Bounding Box 계산

## UI/UX 테스트
- [ ] Space+Drag 후 선택 변경 시 화면 고정
- [ ] 2초 경과 후 자동 포커싱 복귀
- [ ] Follow 토글 버튼 동작
```

---

## 🟢 Phase 4: 내비게이션 & 동기화 (예상: 2-3주)

### 개요
**검색 및 점프 시스템**, 파일 동기화, 데이터 내보내기를 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **검색 UI 구현** | 6h | Fuzzy Search, 검색창 UI, 키보드 단축키 (Ctrl+F) |
| 🔴 P0 | **jumpToNode 구현** | 6h | 카메라 이동, 펄스 하이라이트, applyCameraChange() 사용 |
| 🔴 P0 | **검색 결과 네비게이션** | 4h | Next/Previous, Shift+Enter |
| 🔴 P0 | **펄스 하이라이트 애니메이션** | 4h | 1.5초 효과, ephemeral.highlightedNode |
| 🟠 P1 | **툴바 UI 구현** | 6h | Back, Undo, Redo, Full Note, Export, Load 버튼 |
| 🟠 P1 | **ExportManager - Markdown** | 6h | 마인드맵 → Markdown 계층 구조 변환 |
| 🟠 P1 | **ImportManager - Markdown** | 6h | Markdown → 마인드맵 파싱 및 생성 |
| 🟠 P1 | **자동 저장 시스템** | 4h | 디바운스 1초, 조용한 저장 |
| 🟡 P2 | **SyncManager 구현** | 8h | 노드-노트 양방향 동기화 로직 |
| 🟡 P2 | **EssayComposer 구현** | 6h | 마인드맵 → 통합 문서 생성 |
| 🟢 P3 | **ExportManager - 이미지/PDF** | 6h | SVG → Canvas → PNG/PDF |

### Phase 4 상세 설명

#### 4.1 검색 및 점프 시스템 (신규)

**파일**: `src/navigation/SearchController.ts`

**검색 인터페이스**:
```typescript
interface SearchResult {
  nodeId: string;
  matchType: 'text' | 'note' | 'tag';
  matchScore: number;
  highlightRanges: Array<[number, number]>;
}

interface SearchSession {
  results: SearchResult[];
  currentIndex: number;
}
```

**jumpToNode 구현**:
```typescript
function jumpToNode(nodeId: string, options?: JumpOptions) {
  const node = getNode(nodeId);
  
  // 1. 읽기 가능한 배율 확인
  const minReadableScale = 1.0;
  const targetScale = Math.max(camera.scale, minReadableScale);
  
  // 2. 중앙 정렬 계산
  const targetCamera = {
    offsetX: viewport.width / 2 - node.position.x * targetScale,
    offsetY: viewport.height / 2 - node.position.y * targetScale,
    scale: targetScale
  };
  
  // 3. 부드러운 이동 (400ms, easeInOutExpo)
  animateCameraChange(
    camera,
    targetCamera,
    400,
    'easeInOutExpo',
    CameraChangeReason.SearchJump  // 단일 진입점!
  );
  
  // 4. 수동 패닝으로 인식 (자동 포커싱 억제)
  ephemeral.lastManualPanAt = Date.now();
  
  // 5. 펄스 하이라이트
  highlightNode(nodeId, 1500);
}
```

### Phase 4 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] Fuzzy Search 정확도
- [ ] jumpToNode 카메라 이동
- [ ] 펄스 하이라이트 타이밍
- [ ] Export/Import Markdown 형식

## UI/UX 테스트
- [ ] Ctrl+F로 검색창 열기
- [ ] Enter로 다음 결과
- [ ] Shift+Enter로 이전 결과
- [ ] 점프 후 1.5초 하이라이트
- [ ] 점프 후 자동 포커싱 억제
```

---

## 🔵 Phase 5: 시각화 & 성능 최적화 (예상: 2-3주)

### 개요
Fixed Node 시각적 피드백, 성능 최적화, 다중 창 환경 대응을 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **Fixed Node Pin 아이콘** | 4h | layoutControlled: false 시각 표시 |
| 🔴 P0 | **Pin 아이콘 토글 기능** | 2h | 클릭으로 layoutControlled 전환 |
| 🟠 P1 | **Viewport Culling 구현** | 6h | 노드 1000개 이상 시 자동 활성화 |
| 🟠 P1 | **화면 밖 노드 렌더링 스킵** | 4h | calculateVisibleNodes(), 성능 테스트 |
| 🟠 P1 | **CameraController 인스턴스 격리** | 4h | contentEl별 독립 인스턴스, Pop-out Window 대응 |
| 🟠 P1 | **DPI 감지 및 대응** | 4h | devicePixelRatio 변경 감지 |
| 🟡 P2 | **MiniMap 구현** | 8h | 우측 하단 미니맵, 뷰포트 표시, 클릭 이동 |
| 🟡 P2 | **LOD 시스템 구현** | 6h | 줌 레벨별 렌더링 상세도 조절 |
| 🟡 P2 | **설정창 구현** | 6h | 전체 설정 UI, 토글, 슬라이더 |
| 🟢 P3 | **테마 시스템** | 4h | ThemeRegistry, Dark Theme |

### Phase 5 상세 설명

#### 5.1 Fixed Node 시각적 피드백

**파일**: `src/rendering/NodeRenderer.ts`

**구현**:
```typescript
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

#### 5.2 Viewport Culling

**파일**: `src/rendering/ViewportCuller.ts`

**구현**:
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

### Phase 5 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] Pin 아이콘 표시 조건
- [ ] Viewport Culling 필터링
- [ ] CameraController 인스턴스 격리
- [ ] DPI 변경 감지

## UI/UX 테스트
- [ ] layoutControlled: false 노드에 Pin 표시
- [ ] Pin 클릭으로 토글
- [ ] 노드 1000개 이상에서 Culling 동작
- [ ] Pop-out Window 좌표 일관성
- [ ] 다중 모니터 환경 테스트
```

---

## 🟣 Phase 6: AI 협업 & 고급 기능 (예상: 1-2주, 선택적)

### 개요
AI 에이전트 협업 인터페이스 및 기타 고급 기능을 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🟡 P2 | **AI 노드 메타데이터** | 4h | createdBy, confirmedBy, confirmedAt 필드 |
| 🟡 P2 | **AI 노드 생성 로직** | 4h | layoutControlled: true 기본값 |
| 🟡 P2 | **배치 확정 다이얼로그** | 4h | 사용자 이동 시 확정 UI |
| 🟢 P3 | **애니메이션 시스템** | 4h | 노드 이동, 줌 등 부드러운 전환 |
| 🟢 P3 | **성능 프로파일링** | 4h | 병목 지점 분석, 최적화 |

### Phase 6 상세 설명

#### 6.1 AI 협업 인터페이스

**파일**: `src/ai/AINodeManager.ts`

**구현**:
```typescript
interface NodeMetadata {
  createdBy?: 'user' | 'ai' | 'import';
  confirmedBy?: 'user';
  confirmedAt?: number;
}

function createAINode(content: string, parentId: string): MindMapNode {
  return {
    id: generateId(),
    position: { x: 0, y: 0 },
    layoutControlled: true,  // AI 노드는 자동 배치
    metadata: {
      createdBy: 'ai'
    }
  };
}

function onUserMoveAINode(nodeId: string) {
  const node = getNode(nodeId);
  
  if (node.metadata?.createdBy === 'ai' && !node.metadata?.confirmedBy) {
    showConfirmDialog({
      message: "AI가 생성한 노드입니다. 배치를 확정하시겠습니까?",
      onConfirm: () => {
        node.layoutControlled = false;
        node.metadata.confirmedBy = 'user';
        node.metadata.confirmedAt = Date.now();
      }
    });
  }
}
```

---

## 📅 전체 일정 요약

```
Phase 1 (2-3주)         Phase 2 (2-3주)         Phase 3 (1-2주)
    │                       │                       │
카메라 단일 진입점      인터랙션 우선순위       Follow & 수동 패닝
CoordinateTransformer   MoveMode 구현            억제 시간 체크
Transform Layer         layoutControlled         초기 뷰포트
    │                       │                       │
    ▼                       ▼                       ▼

Phase 4 (2-3주)         Phase 5 (2-3주)         Phase 6 (1-2주)
    │                       │                       │
내비게이션 시스템       시각화 & 최적화         AI 협업 (선택)
검색 & 점프            Fixed Node Pin          메타데이터
동기화 & 내보내기      Viewport Culling        확정 다이얼로그
    │                       │                       │
    ▼                       ▼                       ▼
[테스트 80%]            [테스트 80%]            [테스트 80%]
    │                       │                       │
    ▼                       ▼                       ▼
[Obsidian 확인]         [Obsidian 확인]         [릴리즈 준비]
```

**총 예상 기간**: 8-12주 (Phase 6 포함 시 최대 14주)

---

## 🔧 개발 환경 설정

### 필수 도구
- Node.js 18+
- npm 또는 yarn
- TypeScript 5+
- Obsidian (최신 버전)

### 프로젝트 구조 (v4.2.3 기반)

```
KK-NeroMind/
├── src/
│   ├── main.ts                      # 플러그인 진입점
│   ├── types/
│   │   ├── MindMapNode.ts           # layoutControlled 포함
│   │   └── CameraState.ts
│   ├── camera/
│   │   ├── CameraController.ts      # 단일 진입점, 잠금
│   │   ├── CoordinateTransformer.ts # 좌표 변환
│   │   └── FocusController.ts       # Follow Selection
│   ├── core/
│   │   ├── DirectionManager.ts
│   │   └── GraphEngine.ts
│   ├── state/
│   │   ├── StateManager.ts
│   │   └── CommandHistory.ts
│   ├── commands/
│   │   ├── MoveSubtreeCommand.ts    # layoutControlled 관리
│   │   ├── MoveSingleNodeCommand.ts
│   │   └── ReparentNodeCommand.ts
│   ├── rendering/
│   │   ├── Renderer.ts               # transform-layer 관리
│   │   ├── NodeRenderer.ts           # Pin 아이콘
│   │   ├── EdgeRenderer.ts
│   │   ├── LODStrategy.ts
│   │   └── ViewportCuller.ts
│   ├── input/
│   │   ├── InteractionController.ts  # 우선순위 테이블
│   │   ├── KeyboardManager.ts
│   │   └── MouseManager.ts
│   ├── navigation/                   # 신규
│   │   ├── SearchController.ts
│   │   └── JumpController.ts
│   ├── sync/
│   │   ├── SyncManager.ts
│   │   └── EssayComposer.ts
│   ├── export/
│   │   ├── ExportManager.ts
│   │   └── ImportManager.ts
│   ├── layout/
│   │   └── AutoAligner.ts            # layoutControlled 필터링
│   ├── ai/                            # 선택적
│   │   └── AINodeManager.ts
│   └── ui/
│       ├── Toolbar.ts
│       ├── MiniMap.ts
│       └── SettingTab.ts
├── styles/
│   └── styles.css
├── manifest.json
├── package.json
└── tsconfig.json
```

---

## 📊 Architecture v4.2.3 핵심 원칙 준수

### 필수 체크리스트

모든 Phase에서 반드시 확인:

#### 좌표 시스템
- [ ] 노드 좌표는 월드 좌표만 사용
- [ ] Renderer가 노드 좌표를 수정하지 않음
- [ ] Camera는 Ephemeral State
- [ ] transform-layer 단 하나만 존재

#### 카메라 제어
- [ ] 모든 카메라 변경이 `applyCameraChange()` 사용
- [ ] `CameraChangeReason` 명시
- [ ] 직접 `camera.offsetX` 수정 없음
- [ ] 카메라 잠금/해제 쌍 맞춤

#### 레이아웃
- [ ] AutoAligner가 `layoutControlled` 필터링
- [ ] 드래그 시 `layoutControlled = false`
- [ ] Command에서 `layoutControlled` 저장/복원

#### 인터랙션
- [ ] Interaction Priority Table 순서 준수
- [ ] 기본 이동 모드는 Subtree
- [ ] 드래그 중 선택 변경 금지
- [ ] 수동 패닝 후 자동 포커싱 억제

---

**문서 끝**
