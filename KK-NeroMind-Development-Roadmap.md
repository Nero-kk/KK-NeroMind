# KK-NeroMind 개발 로드맵 & 작업 명세서

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **문서명** | KK-NeroMind 개발 로드맵 & 작업 명세서 |
| **버전** | v1.0 |
| **최종 수정일** | 2026-01-12 |
| **총 예상 기간** | 7-11주 |

---

## 🔴 Phase 1: 코어 인프라 (예상: 1-2주)

### 개요
플러그인의 기본 골격을 구축합니다. 이 단계에서 완성되는 구조는 이후 Phase에서 변경되지 않습니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **플러그인 진입점 구현** | 4h | `main.ts` 생성, `Plugin` 클래스 상속, `onload()`/`onunload()` 구현 |
| 🔴 P0 | **Disposable 인터페이스 정의** | 2h | `interface Disposable { destroy(): void }` 정의, 모든 컴포넌트에 적용 |
| 🔴 P0 | **마인드맵 뷰 등록** | 4h | `ItemView` 상속, 커스텀 뷰 타입 등록, 사이드바 아이콘 추가 |
| 🟠 P1 | **SVG 캔버스 초기화** | 4h | 루트 SVG 요소 생성, 뷰포트 컨테이너 설정, 좌표계 초기화 |
| 🟠 P1 | **SVGNodeFactory 구현** | 6h | 노드 SVG 요소 생성 팩토리, 라운드 사각형 렌더링 |
| 🟠 P1 | **SVGEdgeFactory 구현** | 4h | 엣지(연결선) SVG 요소 생성 팩토리 |
| 🟠 P1 | **Renderer 조립자 구현** | 4h | NodeRenderer, EdgeRenderer를 조합하는 메인 Renderer 클래스 |
| 🟡 P2 | **루트노드 생성 및 배치** | 4h | 화면 중앙에 루트노드 자동 생성, 커서 자동 포커스 |
| 🟡 P2 | **Glassmorphism 스타일 적용** | 4h | Apple 스타일 반투명 배경, blur 효과, 그림자 |
| 🟡 P2 | **기본 테마 구조 설정** | 2h | Light 테마 CSS 변수 정의, 스타일 적용 구조 |

### Phase 1 상세 설명

#### 1.1 플러그인 진입점 구현

**파일**: `src/main.ts`

**역할**:
- Obsidian 플러그인 라이프사이클 관리
- 설정 로드/저장
- 다른 모듈 초기화 조율

**핵심 코드 구조**:
```typescript
export default class NeroMindPlugin extends Plugin {
  settings: NeroMindSettings;
  private disposables: Disposable[] = [];
  
  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_NEROMIND, (leaf) => new NeroMindView(leaf, this));
    this.addRibbonIcon('brain', 'NeroMind', () => this.activateView());
    this.addSettingTab(new NeroMindSettingTab(this.app, this));
  }
  
  async onunload(): Promise<void> {
    this.disposables.reverse().forEach(d => d.destroy());
  }
}
```

#### 1.2 SVGNodeFactory 구현

**파일**: `src/rendering/SVGNodeFactory.ts`

**역할**:
- 노드의 시각적 요소(SVG) 생성
- 노드 상태에 따른 스타일 적용

**입력/출력**:
- 입력: `MindMapNode` 데이터
- 출력: `SVGGElement` (그룹 요소)

**생성되는 요소**:
- `<rect>`: 노드 배경 (라운드 모서리)
- `<text>`: 노드 텍스트
- `<circle>`: +/- 버튼 (4방향)

#### 1.3 루트노드 생성 및 배치

**역할**:
- 플러그인 시작 시 루트노드 자동 생성
- 화면 정중앙에 배치
- 텍스트 입력 커서 자동 포커스

**배치 계산**:
```typescript
const centerX = containerWidth / 2;
const centerY = containerHeight / 2;
const rootNode = createRootNode({ x: centerX, y: centerY });
```

### Phase 1 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] Disposable.destroy() 호출 시 리소스 해제 확인
- [ ] SVGNodeFactory.create() 올바른 SVG 요소 생성 확인
- [ ] SVGEdgeFactory.create() 올바른 path 생성 확인
- [ ] 뷰 등록/해제 정상 동작 확인

## UI/UX 테스트
- [ ] 플러그인 활성화 시 마인드맵 뷰 표시
- [ ] 루트노드가 화면 중앙에 위치
- [ ] 루트노드에 커서 자동 포커스
- [ ] Glassmorphism 스타일 정상 적용
- [ ] 4방향 + 버튼 표시
```

---

## 🟠 Phase 2: 노드 조작 & 인터랙션 (예상: 2-3주)

### 개요
사용자와 마인드맵 간의 인터랙션을 구현합니다. 노드 생성, 삭제, 이동, 탐색 등 핵심 기능이 포함됩니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **DirectionManager 구현** | 6h | 4방향 확장 로직, 방향 상속 로직, 자식 위치 계산 |
| 🔴 P0 | **자식 노드 생성 기능** | 4h | +버튼 클릭 또는 Tab 키로 자식 노드 생성 |
| 🔴 P0 | **형제 노드 생성 기능** | 4h | Enter 키로 형제 노드 생성 |
| 🔴 P0 | **StateManager 기본 구현** | 6h | PersistentState/EphemeralState 분리, 노드 저장소 |
| 🟠 P1 | **KeyboardManager 구현** | 8h | 전체 키보드 단축키 바인딩 및 처리 |
| 🟠 P1 | **MouseManager 구현** | 6h | 클릭, 드래그, 휠 이벤트 처리 |
| 🟠 P1 | **노드 선택 시스템** | 4h | 단일 선택, 선택 상태 시각화 |
| 🟠 P1 | **노드 탐색 (방향키)** | 4h | 방향키로 인접 노드 선택 이동 |
| 🟠 P1 | **노드 편집 모드** | 4h | Space 키 또는 더블클릭으로 텍스트 편집 |
| 🟡 P2 | **접기/펼치기 기능** | 4h | -버튼으로 자식 숨기기, 빨간색 +버튼으로 표시 |
| 🟡 P2 | **노드 삭제 기능** | 3h | Delete 키로 선택 노드 및 서브트리 삭제 |
| 🟡 P2 | **CommandHistory 구현** | 6h | Command 패턴, Undo/Redo 스택 관리 |
| 🟡 P2 | **InteractionBridge 구현** | 4h | 이벤트 배칭 (RAF 타이밍), 이벤트-커맨드 변환 |
| 🟢 P3 | **GlobalShortcutInterceptor** | 4h | Obsidian 전역 단축키 충돌 방지, Fail-safe |
| 🟢 P3 | **노드 드래그 이동** | 4h | 노드 드래그 시 서브트리 함께 이동 |
| 🟢 P3 | **노드 재배치 (드롭)** | 4h | 다른 노드에 드롭하여 부모 변경 |

### Phase 2 상세 설명

#### 2.1 DirectionManager 구현

**파일**: `src/core/DirectionManager.ts`

**역할**:
- 루트노드의 4방향 자식 생성 관리
- 자식노드의 방향 상속 처리
- 다음 노드 위치 계산

**핵심 로직**:
```typescript
// 루트노드에서 자식 생성 시
createChildFromRoot(direction: Direction): Position {
  const offsets = {
    up: { x: 0, y: -NODE_GAP_V },
    down: { x: 0, y: NODE_GAP_V },
    left: { x: -NODE_GAP_H, y: 0 },
    right: { x: NODE_GAP_H, y: 0 }
  };
  return addPosition(rootPosition, offsets[direction]);
}

// 일반 노드에서 자식 생성 시 (방향 상속)
createChildFromNode(parent: MindMapNode): Position {
  const direction = parent.direction; // 부모 방향 그대로
  return this.calculateNextPosition(parent, direction);
}
```

**형제 노드 배치**:
- up/down 방향 노드의 형제 → 좌우로 배치
- left/right 방향 노드의 형제 → 상하로 배치

#### 2.2 KeyboardManager 구현

**파일**: `src/input/KeyboardManager.ts`

**키 매핑 테이블**:

| 키 | 탐색 모드 동작 | 편집 모드 동작 |
|---|---|---|
| Tab | 자식 노드 생성 | 텍스트 탭 (기본) |
| Enter | 형제 노드 생성 | 편집 완료 |
| Space | 편집 모드 진입 | 텍스트 스페이스 |
| Arrow Keys | 노드 탐색 | 커서 이동 |
| Escape | 선택 해제 | 편집 취소 |
| Delete | 노드 삭제 | 텍스트 삭제 |
| Ctrl+Z | Undo | Undo |
| Ctrl+Y | Redo | Redo |
| Ctrl+Home | 전체 보기 | - |
| Ctrl++/- | 줌 인/아웃 | - |
| Ctrl+Arrow | 화면 이동 | - |
| Home | 마지막 선택 노드로 | - |
| Ctrl+Escape | 강제 포커스 해제 | 강제 포커스 해제 |

#### 2.3 접기/펼치기 기능

**상태 전이**:
```
[자식 없음] ─ 자식생성 → [펼침] ─ 접기클릭 → [접힘]
     │                     │                   │
     │                     └─ 펼치기클릭 ←────┘
     │
   + 버튼 (기본)      − 버튼           + 버튼 (빨간색)
```

**시각적 표시**:
- 기본 (자식 없음): + 버튼, 흰색 배경, 회색 아이콘
- 펼침 상태: − 버튼, 흰색 배경, 회색 아이콘
- 접힘 상태: + 버튼, 빨간색 배경 (#ff3b30), 흰색 아이콘

#### 2.4 CommandHistory 구현

**파일**: `src/state/CommandHistory.ts`

**Command 인터페이스**:
```typescript
interface Command {
  execute(): void;  // 실행
  undo(): void;     // 되돌리기
  description: string;  // UI 표시용
}
```

**구현된 Command 목록**:
| Command | execute() | undo() |
|---------|-----------|--------|
| CreateNodeCommand | 노드 추가 | 노드 제거 |
| DeleteNodeCommand | 노드 제거 | 노드 복원 |
| MoveNodeCommand | 위치 변경 | 이전 위치로 |
| EditNodeCommand | 텍스트 변경 | 이전 텍스트로 |
| ToggleCollapseCommand | 접기/펼치기 토글 | 역토글 |
| ReparentNodeCommand | 부모 변경 | 이전 부모로 |

### Phase 2 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] DirectionManager 방향별 위치 계산 정확성
- [ ] DirectionManager 방향 상속 로직
- [ ] CommandHistory Undo/Redo 동작
- [ ] 각 Command의 execute/undo 대칭성
- [ ] KeyboardManager 키 매핑 정확성

## UI/UX 테스트
- [ ] 루트노드 4방향 + 버튼 클릭 시 자식 생성
- [ ] 자식노드는 부모 방향에만 + 버튼 표시
- [ ] Tab 키로 자식 생성
- [ ] Enter 키로 형제 생성
- [ ] 방향키로 노드 탐색
- [ ] Space 키로 편집 모드 진입
- [ ] 접기 시 빨간색 + 버튼으로 변경
- [ ] 노드 드래그 시 서브트리 함께 이동
- [ ] Ctrl+Z로 Undo 동작
```

---

## 🟡 Phase 3: 동기화 & 내보내기 (예상: 2-3주)

### 개요
파일 시스템과의 동기화, 데이터 내보내기/불러오기 기능을 구현합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **툴바 UI 구현** | 6h | 좌측 상단 8개 버튼 배치, 스타일링 |
| 🔴 P0 | **ExportManager - Markdown** | 6h | 마인드맵 → Markdown 계층 구조 변환 |
| 🔴 P0 | **ImportManager - Markdown** | 6h | Markdown → 마인드맵 파싱 및 생성 |
| 🟠 P1 | **ExportManager - 이미지** | 6h | SVG → Canvas → PNG 변환 |
| 🟠 P1 | **ExportManager - PDF** | 4h | Canvas → PDF 변환 (외부 라이브러리) |
| 🟠 P1 | **새로 작성 기능** | 2h | 현재 마인드맵 초기화, 새 루트노드 생성 |
| 🟡 P2 | **VirtualPathMap 구현** | 4h | nodeId ↔ filePath 매핑 테이블 |
| 🟡 P2 | **SyncManager 구현** | 8h | 노드-노트 양방향 동기화 로직 |
| 🟡 P2 | **FileWatcher 연동** | 4h | Vault 파일 변경 감지 및 노드 업데이트 |
| 🟡 P2 | **노트 드래그앤드롭 연결** | 4h | 파일 탐색기 → 노드로 드래그 시 링크 생성 |
| 🟢 P3 | **IntegrityChecker 구현** | 6h | Orphan 감지, 분류, 알림, 복구 UI |
| 🟢 P3 | **EssayComposer 구현** | 6h | 마인드맵 → 통합 문서 생성 |
| 🟢 P3 | **동기화 디바운스** | 2h | 연속 이벤트 300ms 디바운스 |

### Phase 3 상세 설명

#### 3.1 툴바 UI 구현

**파일**: `src/ui/Toolbar.ts`

**버튼 배치 (좌측 상단, 가로)** - 스크린샷 참조:

| 순서 | 아이콘 | ID | 기능 | 단축키 |
|:----:|:------:|:--:|------|--------|
| 1 | ◀️ | back | 뒤로가기 | - |
| 2 | ↩️ | undo | 되돌리기 | Ctrl+Z |
| 3 | ↪️ | redo | 되살리기 | Ctrl+Y |
| 4 | 📄 | fullNote | **Full Note (통합하기)** | - |
| 5 | 📤 | export | **Export MD (내보내기)** | - |
| 6 | 📂 | load | **Load (불러오기)** | - |

> **자동 저장**: 별도 Save 버튼 없이 변경 후 1초 뒤 자동 저장
> **Full Note**: 마인드맵 + 연결된 노트 내용 → `Full-{이름}.md`
> **Export MD**: 마인드맵 구조만 → 세로선 트리 형태
> **Load**: Export MD로 내보낸 파일이나 MD 파일 → 마인드맵으로 변환

#### 3.2 Markdown 내보내기 (Export MD)

**출력 형식** (세로선 + 불릿 트리):
```
— 사람들
├─ • 옵시디안 CSS 바꾸기
├─ • 할아버지
│   ├─ • PDF 판매 올해 목표 달성
│   └─ • 아저씨
└─ • 옵시디언 잘 쓰는 법
    ├─ • 옵시디언 설치
    └─ • 메모 연결
```

**변환 규칙**:
- 루트: `— {이름}`
- 자식: `├─ • {이름}` 또는 `└─ • {이름}` (마지막)
- 세로선: `│   ` (4칸)
- `[[노트]]` → 순수 텍스트 (대괄호 제거)

#### 3.3 Markdown 불러오기 (Load)

**지원 형식**:
1. Export MD 형식 (세로선 + 불릿)
2. 일반 리스트 형식 (`-`, `*`, `+`, `1.`)

**파싱 규칙**:
- `—` 로 시작: 루트 노드
- `├─ •`, `└─ •`: 자식 노드
- 세로선 개수로 깊이 계산
- 일반 리스트도 호환 (들여쓰기 2칸 = 1레벨)

#### 3.4 SyncManager 구현

**파일**: `src/sync/SyncManager.ts`

**동기화 방향**:

| 트리거 | 방향 | 동작 |
|--------|------|------|
| 노드 제목 변경 | Node → File | 파일명 변경 |
| 파일명 변경 | File → Node | 노드 제목 업데이트 |
| 파일 삭제 | File → Node | Orphan 감지, 사용자에게 알림 |
| 노트 드래그앤드롭 | File → Node | 노드 링크 생성 `[[노트명]]` |

**순환 참조 방지**:
```typescript
class SyncManager {
  private isSyncing = false;
  
  async syncNodeToFile(nodeId: string): Promise<void> {
    if (this.isSyncing) return;  // 재진입 방지
    this.isSyncing = true;
    try {
      // 동기화 로직
    } finally {
      this.isSyncing = false;
    }
  }
}
```

#### 3.4 EssayComposer 구현 (Full Note 기능)

**파일**: `src/sync/EssayComposer.ts`

**출력 파일 규칙**:
- 파일명: `Full-{마인드맵이름}.md`
- 위치: 마인드맵과 동일 폴더
- 예시: `0. Inbox/사람들.mindmap` → `0. Inbox/Full-사람들.md`

**통합 규칙**:
1. 마인드맵 순회 (DFS, 깊이 우선)
2. 각 노드 → **탭 들여쓰기 + 불릿(•)** 으로 변환
   - 루트: `— 루트이름`
   - 깊이 1: `\t• 노드이름`
   - 깊이 2: `\t\t• 노드이름`
3. 노드에 `[[노트 링크]]`가 있으면:
   - 노트 **전체 내용**을 해당 노드 아래에 삽입 (들여쓰기 없이)
4. 완료 시 우측 상단 토스트 알림: `Full ObsiMap exported: {경로}`

**출력 예시**:
```markdown
— 사람들
	• 사람들
		• 옵시디안 CSS 바꾸기
Date : 2023-12-11 22:56
Topic : #obsidian #plugin

작가님들 어서오세요~! 여기는 작가의 방입니다...
(노트 전체 내용)

		• 할아버지
			• PDF 판매 올해 목표
(노트 전체 내용)

			• 아저씨
				• 옵시디언 설치
(노트 전체 내용)
```

**핵심 메서드**:
- `composeAndSave()`: 통합 문서 생성 + 저장 + 토스트 알림
- `extractLinkedNotePath()`: 노드에서 `[[링크]]` 추출
- `getLinkedNoteContent()`: 링크된 노트 내용 읽기

### Phase 3 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] ExportManager Markdown 출력 형식
- [ ] ImportManager Markdown 파싱 정확성
- [ ] VirtualPathMap 매핑 정확성
- [ ] SyncManager 양방향 동기화
- [ ] IntegrityChecker Orphan 감지
- [ ] EssayComposer 계층 구조 변환 (탭 들여쓰기)
- [ ] EssayComposer [[노트]] 내용 삽입

## UI/UX 테스트
- [ ] 툴바 버튼 정상 표시 (Back, Undo, Redo, Full Note, Export, Save)
- [ ] 내보내기 드롭다운 메뉴 동작
- [ ] Markdown 내보내기 파일 생성
- [ ] Markdown 불러오기 마인드맵 생성
- [ ] 이미지/PDF 내보내기
- [ ] 노트 드래그앤드롭 → [[링크]] 생성
- [ ] Full Note 버튼 → Full-*.md 파일 생성
- [ ] Full Note 완료 시 토스트 알림 표시
- [ ] Orphan 발생 시 알림 표시
```

---

## 🟢 Phase 4: 고급 기능 & 최적화 (예상: 2-3주)

### 개요
사용자 경험을 향상시키는 고급 기능과 성능 최적화를 진행합니다.

### 작업 목록

| 우선순위 | 작업명 | 소요시간 | 설명 |
|:--------:|--------|:--------:|------|
| 🔴 P0 | **AutoAligner 구현** | 8h | 노드 자동 정렬 알고리즘, 충돌 회피 |
| 🔴 P0 | **핀 고정 기능** | 4h | 선택 노드 고정, 자동정렬에서 제외, 시각적 표시 |
| 🟠 P1 | **MiniMap 구현** | 8h | 우측 하단 미니맵, 뷰포트 표시, 클릭 이동 |
| 🟠 P1 | **설정창 구현** | 6h | 전체 설정 UI, 토글, 슬라이더, 드롭다운 |
| 🟠 P1 | **뷰포트 컨트롤** | 4h | 줌 인/아웃, 전체 보기, 노드 중심 이동 |
| 🟡 P2 | **LOD 시스템 구현** | 6h | 줌 레벨별 렌더링 상세도 조절 |
| 🟡 P2 | **ViewportCuller 구현** | 4h | 화면 밖 노드 렌더링 스킵 |
| 🟡 P2 | **ThemeRegistry 구현** | 4h | 테마 등록/적용 시스템, 확장 구조 |
| 🟢 P3 | **Dark Theme 추가** | 4h | 다크 모드 테마 정의 |
| 🟢 P3 | **애니메이션 시스템** | 4h | 노드 이동, 줌 등 부드러운 전환 |
| 🟢 P3 | **성능 프로파일링** | 4h | 병목 지점 분석, 최적화 |
| 🟢 P3 | **Object Pool 적용** | 4h | SVG 요소 재사용으로 메모리 최적화 |

### Phase 4 상세 설명

#### 4.1 AutoAligner 구현

**파일**: `src/layout/AutoAligner.ts`

**정렬 알고리즘**:
1. 루트노드 위치 고정 (기준점)
2. 각 방향(상/하/좌/우)별로 서브트리 정렬
3. BFS로 레벨별 노드 배치
4. 같은 레벨 노드들 균등 분배
5. 충돌 감지 및 회피

**충돌 회피 로직**:
```typescript
function resolveCollisions(nodes: MindMapNode[]): void {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let hasCollision = false;
    
    for (const [a, b] of getAllPairs(nodes)) {
      if (isOverlapping(a, b)) {
        hasCollision = true;
        pushApart(a, b);  // 핀 고정 노드는 움직이지 않음
      }
    }
    
    if (!hasCollision) break;
  }
}
```

**핀 고정 노드 처리**:
- 핀 고정 노드는 위치 고정
- 충돌 시 상대 노드만 이동
- 두 노드 모두 핀이면 충돌 해결 불가 (사용자 알림)

#### 4.2 MiniMap 구현

**파일**: `src/ui/MiniMap.ts`

**레이아웃**:
- 위치: 우측 하단
- 기본 크기: 200x150px
- 조절 가능: 100-400px

**표시 요소**:
- 전체 마인드맵 축소 표시 (노드는 점으로)
- 현재 뷰포트 영역 (파란색 테두리)
- 클릭/드래그로 뷰포트 이동

**최적화**:
- 변경 시에만 다시 그리기 (dirty flag)
- 오프스크린 캔버스 사용
- 노드 개수에 따라 LOD 적용

#### 4.3 설정창 구현

**파일**: `src/ui/NeroMindSettingTab.ts`

**설정 항목**:

| 카테고리 | 설정명 | 타입 | 기본값 |
|----------|--------|------|--------|
| 뷰포트 | 노드 생성 시 중앙 이동 | Toggle | ON |
| 뷰포트 | 자동 정렬 | Toggle | ON |
| 미니맵 | 미니맵 표시 | Toggle | ON |
| 미니맵 | 미니맵 크기 | Dropdown | Medium |
| 미니맵 | 미니맵 투명도 | Slider | 0.9 |
| 테마 | 테마 선택 | Dropdown | Light |
| 고급 | 애니메이션 속도 | Slider | 200ms |
| 고급 | 노드 수평 간격 | Number | 100 |
| 고급 | 노드 수직 간격 | Number | 60 |

#### 4.4 LOD 시스템

**파일**: `src/rendering/LODStrategy.ts`

**LOD 레벨**:

| 레벨 | 화면 크기 | 렌더링 |
|------|-----------|--------|
| Minimal | < 30px | 점만 표시 |
| Basic | 30-80px | 사각형 + 1줄 라벨 |
| Standard | 80-150px | 전체 UI |
| Full | > 150px | 전체 UI + 편집 가능 |

**강제 승격**:
- 선택된 노드: 최소 Standard
- 편집 중인 노드: 항상 Full

### Phase 4 테스트 항목

```markdown
## 유닛 테스트 (목표: 80% 커버리지)
- [ ] AutoAligner 충돌 감지 정확성
- [ ] AutoAligner 핀 노드 제외 확인
- [ ] LODStrategy 레벨 판정
- [ ] LODStrategy 강제 승격
- [ ] ViewportCuller 화면 밖 노드 필터링
- [ ] ThemeRegistry 테마 적용

## UI/UX 테스트
- [ ] 자동 정렬 버튼 클릭 시 노드 정렬
- [ ] 핀 고정 노드 정렬에서 제외
- [ ] 핀 고정 노드 시각적 표시 (주황색)
- [ ] 미니맵 정상 표시
- [ ] 미니맵 클릭으로 화면 이동
- [ ] 설정창 모든 옵션 동작
- [ ] 줌 아웃 시 LOD 적용 (노드 단순화)
- [ ] 부드러운 애니메이션 전환
```

---

## 📅 전체 일정 요약

```
Phase 1 (1-2주)     Phase 2 (2-3주)     Phase 3 (2-3주)     Phase 4 (2-3주)
    │                   │                   │                   │
    ├─ 진입점           ├─ DirectionMgr     ├─ 툴바             ├─ AutoAligner
    ├─ Disposable       ├─ 노드 생성        ├─ Export/Import   ├─ 핀 기능
    ├─ 뷰 등록          ├─ 키보드/마우스    ├─ SyncManager      ├─ MiniMap
    ├─ SVG Factory      ├─ CommandHistory   ├─ IntegrityCheck   ├─ 설정창
    └─ 루트노드         └─ 접기/펼치기      └─ EssayComposer    └─ LOD/최적화
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
    [테스트 80%]        [테스트 80%]        [테스트 80%]        [테스트 80%]
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
    [Obsidian 확인]     [Obsidian 확인]     [Obsidian 확인]     [릴리즈 준비]
```

---

## 🔧 개발 환경 설정

### 필수 도구
- Node.js 18+
- npm 또는 yarn
- TypeScript 5+
- Obsidian (최신 버전)

### 프로젝트 구조
```
KK-NeroMind/
├── src/
│   ├── main.ts              # 플러그인 진입점
│   ├── core/
│   │   ├── DirectionManager.ts
│   │   └── GraphEngine.ts
│   ├── state/
│   │   ├── StateManager.ts
│   │   └── CommandHistory.ts
│   ├── rendering/
│   │   ├── Renderer.ts
│   │   ├── SVGNodeFactory.ts
│   │   ├── SVGEdgeFactory.ts
│   │   ├── LODStrategy.ts
│   │   └── ViewportCuller.ts
│   ├── input/
│   │   ├── KeyboardManager.ts
│   │   ├── MouseManager.ts
│   │   └── GlobalShortcutInterceptor.ts
│   ├── sync/
│   │   ├── SyncManager.ts
│   │   ├── IntegrityChecker.ts
│   │   └── EssayComposer.ts
│   ├── export/
│   │   ├── ExportManager.ts
│   │   └── ImportManager.ts
│   ├── layout/
│   │   └── AutoAligner.ts
│   ├── ui/
│   │   ├── Toolbar.ts
│   │   ├── MiniMap.ts
│   │   └── NeroMindSettingTab.ts
│   └── theme/
│       └── ThemeRegistry.ts
├── styles/
│   └── styles.css
├── manifest.json
├── package.json
└── tsconfig.json
```

---

**문서 끝**
