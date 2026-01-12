# KK-NeroMind 코딩 주의사항 가이드

---

## 📋 문서 개요

| 항목 | 내용 |
|------|------|
| **문서명** | KK-NeroMind 코딩 주의사항 가이드 |
| **버전** | v1.0 |
| **최종 수정일** | 2026-01-12 |
| **목적** | 각 Phase별 코딩 시 주의해야 할 점들을 상세히 기술 |

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

### 1.2 SVG 팩토리 패턴

#### ⚠️ DOM 조작 주의

```typescript
// ❌ 잘못된 예: innerHTML 사용
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.innerHTML = `<rect x="0" y="0" width="100" height="40"/>`;

// ✅ 올바른 예: DOM API 사용
const svg = document.createElementNS(SVG_NS, 'svg');
const rect = document.createElementNS(SVG_NS, 'rect');
rect.setAttribute('x', '0');
rect.setAttribute('y', '0');
rect.setAttribute('width', '100');
rect.setAttribute('height', '40');
svg.appendChild(rect);
```

#### 🚨 주의사항

1. **SVG 네임스페이스 필수**
   ```typescript
   const SVG_NS = 'http://www.w3.org/2000/svg';
   // 모든 SVG 요소 생성 시 네임스페이스 사용
   document.createElementNS(SVG_NS, 'rect');
   ```

2. **innerHTML 지양**
   - 보안 이슈 (XSS 취약점)
   - 기존 이벤트 리스너 손실
   - DOM API 또는 `setAttr()` 헬퍼 사용

3. **요소 재사용 (Object Pool)**
   ```typescript
   // 노드가 많을 때 성능 최적화
   class SVGNodePool {
     private pool: SVGElement[] = [];
     
     acquire(): SVGElement {
       return this.pool.pop() ?? this.createNew();
     }
     
     release(el: SVGElement): void {
       this.resetElement(el);
       this.pool.push(el);
     }
   }
   ```

### 1.3 Glassmorphism 스타일 적용

#### ⚠️ CSS 필터 주의

```css
/* ❌ 잘못된 예: SVG 내부 직접 적용 */
.node {
  backdrop-filter: blur(20px);  /* SVG 내부에서 동작 안 함 */
}

/* ✅ 올바른 예: foreignObject 또는 HTML 오버레이 사용 */
.node-container {
  position: absolute;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
```

#### 🚨 주의사항

1. **SVG와 CSS 필터 호환성**
   - `backdrop-filter`는 SVG 내부에서 직접 사용 불가
   - `foreignObject` 또는 HTML 오버레이 레이어 사용
   - 또는 SVG 필터(`<filter>`)로 유사 효과 구현

2. **Safari 호환성**
   ```css
   /* Safari용 vendor prefix 필수 */
   -webkit-backdrop-filter: blur(20px);
   backdrop-filter: blur(20px);
   ```

3. **성능 주의**
   - `blur()`는 GPU 사용량 높음
   - 많은 노드에 적용 시 프레임 드랍
   - LOD 적용하여 원거리 노드는 단순화

### 1.4 루트노드 초기 배치

#### ⚠️ 좌표계 주의

```typescript
// ❌ 잘못된 예: 뷰포트 크기 직접 사용
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

// ✅ 올바른 예: 캔버스 컨테이너 기준
const container = this.containerEl.getBoundingClientRect();
const centerX = container.width / 2;
const centerY = container.height / 2;

// 월드 좌표로 변환 (줌/팬 고려)
const worldX = (centerX - this.panX) / this.zoom;
const worldY = (centerY - this.panY) / this.zoom;
```

#### 🚨 주의사항

1. **좌표계 구분**
   - Screen 좌표: 브라우저 뷰포트 기준
   - Canvas 좌표: 캔버스 컨테이너 기준
   - World 좌표: 마인드맵 월드 기준 (줌/팬 적용 전)

2. **반응형 대응**
   ```typescript
   // 리사이즈 이벤트 처리
   window.addEventListener('resize', this.handleResize);
   
   // destroy 시 제거 필수!
   destroy(): void {
     window.removeEventListener('resize', this.handleResize);
   }
   ```

---

## 🟠 Phase 2: 노드 조작 & 인터랙션 주의사항

### 2.1 방향성 관리 (DirectionManager)

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

#### 🚨 주의사항

1. **루트노드 vs 일반노드 구분**
   - 루트노드: `direction: null`, 4방향 버튼 표시
   - 일반노드: 부모로부터 방향 상속, 해당 방향에만 버튼

2. **방향별 오프셋 계산**
   ```typescript
   const DIRECTION_OFFSETS = {
     up:    { x: 0, y: -80 },
     down:  { x: 0, y: 80 },
     left:  { x: -150, y: 0 },
     right: { x: 150, y: 0 }
   };
   ```

3. **형제 노드 배치**
   - 형제는 부모의 방향에 수직으로 배치
   - up/down 방향의 형제 → 좌우로 나열
   - left/right 방향의 형제 → 상하로 나열

### 2.2 접기/펼치기 상태 관리

#### ⚠️ 상태 동기화

```typescript
// ❌ 잘못된 예: 렌더링과 상태 불일치
function toggleCollapse(nodeId: string): void {
  const node = this.getNode(nodeId);
  node.isCollapsed = !node.isCollapsed;
  // 렌더링 갱신 안 함
}

// ✅ 올바른 예: 상태 변경 → 이벤트 발행 → 렌더링
function toggleCollapse(nodeId: string): void {
  const command = new ToggleCollapseCommand(nodeId);
  this.commandDispatcher.execute(command);
  // Command 내부에서:
  // 1. 상태 변경
  // 2. 이벤트 발행
  // 3. 구독자(Renderer)가 갱신
}
```

#### 🚨 주의사항

1. **접힌 자식의 렌더링 스킵**
   ```typescript
   function renderNode(node: MindMapNode): void {
     if (this.isNodeHidden(node)) return;  // 부모가 접힌 경우
     // 렌더링 진행
   }
   
   function isNodeHidden(node: MindMapNode): boolean {
     let current = node;
     while (current.parentId) {
       const parent = this.getNode(current.parentId);
       if (parent.isCollapsed) return true;
       current = parent;
     }
     return false;
   }
   ```

2. **버튼 상태 동기화**
   - 자식 없음: + 버튼 (기본 스타일)
   - 자식 펼침: − 버튼
   - 자식 접힘: + 버튼 (빨간색 배경, 흰색 텍스트)

### 2.3 키보드 인터랙션

#### ⚠️ 이벤트 전파 관리

```typescript
// ❌ 잘못된 예: 이벤트 전파 방지 누락
function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Tab') {
    this.createChildNode();
    // Tab 기본 동작(포커스 이동)이 실행됨!
  }
}

// ✅ 올바른 예: 적절한 전파 방지
function handleKeyDown(e: KeyboardEvent): void {
  // 편집 모드에서는 기본 동작 허용
  if (this.isEditing()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.exitEditMode();
    }
    return;  // 다른 키는 텍스트 입력에 사용
  }
  
  // 탐색 모드에서만 단축키 처리
  if (e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    this.createChildNode();
  }
}
```

#### 🚨 주의사항

1. **모드별 키 동작 분리**
   - 탐색 모드: Tab → 자식 생성, Enter → 형제 생성
   - 편집 모드: Tab/Enter → 텍스트 입력 (기본 동작)
   - Escape: 편집 취소 또는 선택 해제

2. **Obsidian 전역 단축키 충돌**
   ```typescript
   // Obsidian의 기본 단축키와 충돌 시
   // 마인드맵 뷰가 활성화된 경우에만 처리
   function handleKeyDown(e: KeyboardEvent): void {
     if (!this.isViewActive()) return;
     // 처리 로직
   }
   ```

3. **Fail-safe: 포커스 탈출**
   ```typescript
   // Ctrl+Escape는 항상 동작
   if (e.ctrlKey && e.key === 'Escape') {
     e.preventDefault();
     this.forceFocusRelease();
     return;
   }
   ```

### 2.4 Command 패턴 (Undo/Redo)

#### ⚠️ 명령 설계

```typescript
// ❌ 잘못된 예: 상태를 직접 수정
function moveNode(nodeId: string, newPos: Position): void {
  this.nodes.get(nodeId)!.position = newPos;
}

// ✅ 올바른 예: Command로 감싸기
class MoveNodeCommand implements Command {
  private oldPosition: Position;
  
  constructor(
    private nodeId: string,
    private newPosition: Position,
    private stateManager: StateManager
  ) {
    // 이전 상태 저장
    this.oldPosition = { ...stateManager.getNode(nodeId).position };
  }
  
  execute(): void {
    this.stateManager.updateNodePosition(this.nodeId, this.newPosition);
  }
  
  undo(): void {
    this.stateManager.updateNodePosition(this.nodeId, this.oldPosition);
  }
}
```

#### 🚨 주의사항

1. **불변성 유지**
   ```typescript
   // ❌ 참조 저장
   this.oldPosition = node.position;
   
   // ✅ 복사본 저장
   this.oldPosition = { ...node.position };
   ```

2. **그룹 명령 (Batch)**
   ```typescript
   // 여러 노드 동시 이동 시
   class BatchCommand implements Command {
     constructor(private commands: Command[]) {}
     
     execute(): void {
       this.commands.forEach(c => c.execute());
     }
     
     undo(): void {
       // 역순으로 undo
       [...this.commands].reverse().forEach(c => c.undo());
     }
   }
   ```

3. **EphemeralState는 Undo 대상 아님**
   - 선택 상태, 드래그 상태 등은 Command로 관리하지 않음

---

## 🟡 Phase 3: 동기화 & 내보내기 주의사항

### 3.1 노드-노트 동기화 (SyncManager)

#### ⚠️ 파일 시스템 작업

```typescript
// ❌ 잘못된 예: 동기 방식 가정
function renameLinkedNote(nodeId: string, newName: string): void {
  const path = this.virtualPathMap.get(nodeId);
  const file = this.app.vault.getAbstractFileByPath(path);
  this.app.fileManager.renameFile(file, newPath);  // Promise 무시!
}

// ✅ 올바른 예: 비동기 처리 + 에러 핸들링
async function renameLinkedNote(nodeId: string, newName: string): Promise<void> {
  const path = this.virtualPathMap.get(nodeId);
  if (!path) return;
  
  const file = this.app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  
  try {
    const dir = file.parent?.path ?? '';
    const newPath = `${dir}/${newName}.md`;
    await this.app.fileManager.renameFile(file, newPath);
    this.virtualPathMap.set(nodeId, newPath);
  } catch (e) {
    console.error('파일 이름 변경 실패:', e);
    new Notice('노트 이름 변경에 실패했습니다.');
  }
}
```

#### 🚨 주의사항

1. **TFile 타입 체크 필수**
   ```typescript
   const file = this.app.vault.getAbstractFileByPath(path);
   // TAbstractFile일 수 있음 (폴더일 수도)
   if (file instanceof TFile) {
     // 파일 작업
   }
   ```

2. **디바운스 적용**
   ```typescript
   // 연속 이벤트 방지 (300ms)
   private debouncedSync = debounce((nodeId: string) => {
     this.syncNodeToFile(nodeId);
   }, 300);
   ```

3. **순환 참조 방지**
   ```typescript
   // 파일 변경 → 노드 업데이트 → 파일 변경 → ...
   private isSyncing = false;
   
   async syncNodeToFile(nodeId: string): Promise<void> {
     if (this.isSyncing) return;
     this.isSyncing = true;
     try {
       // 동기화 로직
     } finally {
       this.isSyncing = false;
     }
   }
   ```

### 3.2 IntegrityChecker

#### ⚠️ 비파괴적 설계

```typescript
// ❌ 잘못된 예: 자동 수정
function checkIntegrity(): void {
  const orphans = this.detectOrphans();
  for (const nodeId of orphans.nodeOrphans) {
    this.deleteNode(nodeId);  // 자동 삭제!
  }
}

// ✅ 올바른 예: 진단만, 수정은 사용자 선택
function checkIntegrity(): OrphanReport {
  const report = this.detectOrphans();
  
  // 알림만 표시
  if (report.hasOrphans()) {
    new Notice(`${report.nodeOrphans.length}개의 orphan 노드 발견`);
  }
  
  return report;  // UI에서 사용자 선택 유도
}
```

#### 🚨 주의사항

1. **Read-only 원칙**
   - IntegrityChecker는 절대 데이터를 수정하지 않음
   - Detect → Classify → Notify → (사용자 선택 시) Repair

2. **초기 로드 순서**
   ```
   플러그인 로드
     → IntegrityChecker 실행 (Vault 기준 진단)
     → Orphan 상태 분류
     → VirtualPathMap 구성
     → SyncManager 활성화
   ```

### 3.3 Markdown 내보내기 (Export MD) / 불러오기 (Load)

#### ⚠️ Export MD 출력 형식

> **핵심**: 세로선 + 불릿 트리 구조로 내보내기

```typescript
// ✅ Export MD 출력 형식
// — 루트
// ├─ • 자식1
// │   └─ • 손자1
// └─ • 자식2

function exportToMarkdown(root: MindMapNode): string {
  let result = `— ${cleanContent(root.content)}\n`;
  
  const children = getChildNodes(root);
  children.forEach((child, i) => {
    const isLast = i === children.length - 1;
    result += nodeToMarkdown(child, '', isLast);
  });
  
  return result;
}

function nodeToMarkdown(node: MindMapNode, prefix: string, isLast: boolean): string {
  const connector = isLast ? '└' : '├';
  const content = cleanContent(node.content);
  let result = `${prefix}${connector}─ • ${content}\n`;
  
  // 자식용 prefix: 마지막이면 공백, 아니면 세로선
  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  
  const children = getChildNodes(node);
  children.forEach((child, i) => {
    result += nodeToMarkdown(child, childPrefix, i === children.length - 1);
  });
  
  return result;
}

// [[노트]] → 노트 (대괄호 제거)
function cleanContent(content: string): string {
  return content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, path, __, alias) => {
    return alias || path;
  });
}
```

#### ⚠️ Load 파싱 (Export MD 형식 + 일반 리스트)

```typescript
// ✅ 두 가지 형식 모두 지원
function parseMarkdown(md: string): MindMapNode[] {
  const lines = md.split('\n').filter(line => line.trim());
  
  // 루트 노드 찾기
  const rootLine = lines.find(line => line.startsWith('—'));
  if (rootLine) {
    return parseExportMdFormat(lines);  // Export MD 형식
  } else {
    return parseStandardListFormat(lines);  // 일반 리스트 형식
  }
}

// Export MD 형식 파싱
function parseExportMdFormat(lines: string[]): MindMapNode[] {
  // — 루트
  // ├─ • 자식  또는  └─ • 자식
  // │   ├─ • 손자
  
  for (const line of lines) {
    // 깊이 계산: '│   ' 또는 '    ' 가 4칸씩
    let depth = 0;
    let i = 0;
    while (i < line.length) {
      const chunk = line.substring(i, i + 4);
      if (chunk === '│   ' || chunk === '    ') {
        depth++;
        i += 4;
      } else {
        break;
      }
    }
    
    // 내용 추출
    const bulletMatch = line.match(/[├└]─\s*•\s*(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();
      // depth + 1 레벨의 노드 생성
    }
  }
}
```

#### 🚨 주의사항

1. **Export MD: [[노트]] 대괄호 제거**
   ```typescript
   // Export MD는 순수 텍스트로 출력
   // [[노트명]] → 노트명
   // [[경로/노트|별칭]] → 별칭
   ```

2. **Load: 원본 형식 자동 감지**
   ```typescript
   // '—'로 시작하면 Export MD 형식
   // '-', '*', '+' 로 시작하면 일반 리스트
   ```

3. **세로선 문자 정확히 사용**
   ```typescript
   // │ (U+2502) Box Drawings Light Vertical
   // ├ (U+251C) Box Drawings Light Vertical and Right
   // └ (U+2514) Box Drawings Light Up and Right
   // ─ (U+2500) Box Drawings Light Horizontal
   ```

### 3.4 통합하기 (EssayComposer) - Full Note 기능

> **핵심**: 마인드맵의 모든 노드를 순회하여 `Full-{마인드맵이름}.md` 파일 생성
> - `[[노트 링크]]`가 있는 노드는 해당 노트 **전체 내용** 삽입
> - 노드 계층은 **탭 들여쓰기 + 불릿(•)** 으로 표현

#### ⚠️ 출력 파일 경로 및 알림

```typescript
// ✅ 출력 파일 경로 규칙
private getOutputPath(): string {
  const mindmapName = this.mindmapFile.basename;  // 확장자 제외
  const folder = this.mindmapFile.parent?.path || '';
  const fileName = `Full-${mindmapName}.md`;
  
  return folder ? `${folder}/${fileName}` : fileName;
}

// 예시:
// 마인드맵: "0. Inbox/사람들.mindmap"
// 출력: "0. Inbox/Full-사람들.md"

// ✅ 토스트 알림 (우측 상단)
new Notice(`Full ObsiMap exported: ${outputPath}`);
```

#### ⚠️ 비동기 파일 읽기

```typescript
// ❌ 잘못된 예: 순차 처리
async function composeAll(nodes: MindMapNode[]): Promise<string> {
  let result = '';
  for (const node of nodes) {
    const content = await this.getNodeContent(node);  // 순차적
    result += content;
  }
  return result;
}

// ✅ 올바른 예: DFS 순서 유지하며 재귀 처리
async function composeNode(node: MindMapNode, depth: number): Promise<string> {
  const indent = '\t'.repeat(depth);
  let result = '';
  
  // [[노트 링크]] 추출
  const linkedPath = this.extractLinkedNotePath(node.content);
  
  if (linkedPath) {
    const noteTitle = this.extractTitle(node.content);
    const noteContent = await this.getLinkedNoteContent(linkedPath);
    result += `${indent}• ${noteTitle}\n`;
    result += `${noteContent}\n\n`;  // 노트 전체 내용 (들여쓰기 없이)
  } else {
    result += `${indent}• ${node.content}\n`;
  }
  
  // 자식들 재귀 처리 (순서 유지됨)
  for (const childId of node.childIds) {
    result += await this.composeNode(this.getNode(childId), depth + 1);
  }
  
  return result;
}
```

#### ⚠️ [[노트 링크]] 파싱

```typescript
// ✅ 노드 내용에서 [[링크]] 추출
private extractLinkedNotePath(content: string): string | null {
  // [[노트이름]] 또는 [[경로/노트이름]]
  const match = content.match(/\[\[([^\]]+)\]\]/);
  if (!match) return null;
  
  const linkText = match[1];
  // 별칭 처리: [[실제경로|표시이름]]
  const actualPath = linkText.split('|')[0];
  
  // Obsidian API로 실제 파일 경로 resolve
  const file = this.app.metadataCache.getFirstLinkpathDest(
    actualPath, 
    this.mindmapFile.path  // 현재 마인드맵 위치 기준
  );
  
  return file?.path || null;
}

// ✅ 표시용 제목 추출
private extractTitle(content: string): string {
  const match = content.match(/\[\[([^\]]+)\]\]/);
  if (!match) return content;
  
  // [[경로|표시이름]] → 표시이름
  // [[경로]] → 경로
  const parts = match[1].split('|');
  return parts[parts.length - 1];
}
```

#### 🚨 주의사항

1. **무한 재귀 방지**
   ```typescript
   // 순환 링크 체크
   const visited = new Set<string>();
   
   async function composeNode(nodeId: string): Promise<string> {
     if (visited.has(nodeId)) {
       return '<!-- 순환 참조 감지 -->';
     }
     visited.add(nodeId);
     // 처리 로직
   }
   ```

2. **파일 덮어쓰기 확인**
   ```typescript
   // 기존 Full-* 파일이 있으면 수정, 없으면 생성
   const existing = this.app.vault.getAbstractFileByPath(outputPath);
   if (existing instanceof TFile) {
     await this.app.vault.modify(existing, content);
   } else {
     await this.app.vault.create(outputPath, content);
   }
   ```

3. **빈 노트 처리**
   ```typescript
   // 노트 파일이 없거나 읽을 수 없으면 빈 문자열
   private async getLinkedNoteContent(path: string): Promise<string> {
     try {
       const file = this.app.vault.getAbstractFileByPath(path);
       if (file instanceof TFile) {
         return await this.app.vault.read(file);
       }
     } catch (e) {
       console.warn(`노트 읽기 실패: ${path}`, e);
     }
     return '';
   }
   ```

### 3.5 자동 저장 시스템 (AutoSave)

> **핵심**: Save 버튼 없이 변경사항 자동 저장 (디바운스 1초)

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

#### 🚨 주의사항

1. **상태 변경 구독**
   ```typescript
   // 모든 상태 변경에서 저장 예약
   this.stateManager.onChange(() => this.scheduleSave());
   ```

2. **플러그인 종료 시 정리**
   ```typescript
   destroy(): void {
     if (this.saveTimeout) {
       clearTimeout(this.saveTimeout);
       // 마지막 저장 즉시 실행 (선택적)
       this.save();
     }
   }
   ```

3. **저장 중 추가 변경 처리**
   ```typescript
   private isSaving = false;
   private pendingSave = false;
   
   private async save(): Promise<void> {
     if (this.isSaving) {
       this.pendingSave = true;
       return;
     }
     
     this.isSaving = true;
     try {
       await this.doSave();
       if (this.pendingSave) {
         this.pendingSave = false;
         this.scheduleSave();  // 재예약
       }
     } finally {
       this.isSaving = false;
     }
   }
   ```

---

## 🟢 Phase 4: 고급 기능 & 최적화 주의사항

### 4.1 자동 정렬 (AutoAligner)

#### ⚠️ 충돌 해결 알고리즘

```typescript
// ❌ 잘못된 예: 무한 루프 가능성
function resolveAllCollisions(): void {
  while (this.hasCollisions()) {
    this.resolveCollisions();  // 해결 후 새 충돌 발생 가능
  }
}

// ✅ 올바른 예: 반복 횟수 제한
function resolveAllCollisions(): void {
  const MAX_ITERATIONS = 100;
  let iterations = 0;
  
  while (this.hasCollisions() && iterations < MAX_ITERATIONS) {
    this.resolveCollisions();
    iterations++;
  }
  
  if (iterations >= MAX_ITERATIONS) {
    console.warn('충돌 해결 최대 반복 횟수 도달');
  }
}
```

#### 🚨 주의사항

1. **핀 고정 노드 우선순위**
   ```typescript
   // 핀 노드는 절대 움직이지 않음
   if (nodeA.isPinned && nodeB.isPinned) {
     // 둘 다 핀이면 해결 불가, 사용자에게 알림
     return;
   }
   
   const movable = nodeA.isPinned ? nodeB : nodeA;
   // movable만 이동
   ```

2. **서브트리 함께 이동**
   ```typescript
   function moveNodeWithSubtree(nodeId: string, delta: Position): void {
     const subtree = this.getSubtreeNodes(nodeId);
     for (const node of subtree) {
       node.position.x += delta.x;
       node.position.y += delta.y;
     }
   }
   ```

### 4.2 미니맵 렌더링

#### ⚠️ 성능 최적화

```typescript
// ❌ 잘못된 예: 매 프레임 전체 렌더링
function renderMiniMap(): void {
  this.ctx.clearRect(0, 0, this.width, this.height);
  for (const node of this.nodes) {
    this.drawNode(node);  // 모든 노드 매번 그리기
  }
}

// ✅ 올바른 예: 변경 시에만 렌더링
function renderMiniMap(): void {
  if (!this.needsUpdate) return;
  
  // 오프스크린 캔버스 사용
  const offscreen = new OffscreenCanvas(this.width, this.height);
  const ctx = offscreen.getContext('2d')!;
  
  // 렌더링
  for (const node of this.nodes) {
    this.drawNodeToContext(ctx, node);
  }
  
  // 메인 캔버스에 복사
  this.ctx.drawImage(offscreen, 0, 0);
  this.needsUpdate = false;
}
```

#### 🚨 주의사항

1. **뷰포트 영역 표시**
   ```typescript
   // 현재 보이는 영역을 미니맵에 표시
   function drawViewport(): void {
     const scale = this.miniMapScale;
     const rect = {
       x: -this.panX / this.zoom * scale,
       y: -this.panY / this.zoom * scale,
       width: this.containerWidth / this.zoom * scale,
       height: this.containerHeight / this.zoom * scale
     };
     
     this.ctx.strokeStyle = '#007AFF';
     this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
   }
   ```

2. **클릭 좌표 변환**
   ```typescript
   function handleMiniMapClick(e: MouseEvent): void {
     const rect = this.miniMapEl.getBoundingClientRect();
     const clickX = e.clientX - rect.left;
     const clickY = e.clientY - rect.top;
     
     // 미니맵 좌표 → 월드 좌표
     const worldX = clickX / this.miniMapScale;
     const worldY = clickY / this.miniMapScale;
     
     // 뷰포트 중심 이동
     this.panTo(worldX, worldY);
   }
   ```

### 4.3 LOD 최적화

#### ⚠️ 강제 승격 규칙

```typescript
// ❌ 잘못된 예: 선택 노드도 LOD 축소
function getLODLevel(node: MindMapNode): LODLevel {
  const screenSize = this.getNodeScreenSize(node);
  if (screenSize < 30) return 'minimal';
  // ...
}

// ✅ 올바른 예: 선택/편집 노드 강제 승격
function getLODLevel(node: MindMapNode): LODLevel {
  // 강제 승격
  if (node.id === this.editingNodeId) return 'full';
  if (node.id === this.selectedNodeId) return 'standard';
  
  // 일반 LOD
  const screenSize = this.getNodeScreenSize(node);
  if (screenSize < 30) return 'minimal';
  if (screenSize < 80) return 'basic';
  if (screenSize < 150) return 'standard';
  return 'full';
}
```

### 4.4 테마 시스템

#### ⚠️ CSS 변수 관리

```typescript
// ❌ 잘못된 예: 인라인 스타일 직접 수정
function applyTheme(theme: Theme): void {
  for (const node of this.nodes) {
    node.element.style.background = theme.node.background;
  }
}

// ✅ 올바른 예: CSS 변수 사용
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--nm-node-bg', theme.node.background);
  root.style.setProperty('--nm-node-border', theme.node.border);
  root.style.setProperty('--nm-edge-stroke', theme.edge.stroke);
  // CSS에서 var(--nm-node-bg) 사용
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

**문서 끝**
