# KK-NeroMind

Obsidian 전용 마인드맵 플러그인. 노트를 시각적으로 구조화하고 아이디어를 정리합니다.

![Obsidian](https://img.shields.io/badge/Obsidian-v1.4.0+-7C3AED?logo=obsidian&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Mind Map Editing
- **Node CRUD** — Tab(자식 추가), Enter(형제 추가), Delete(삭제), F2(이름 편집)
- **Drag & Drop** — 노드를 드래그하여 다른 노드의 자식으로 이동 (다중 선택 지원)
- **Undo / Redo** — 전체 편집 이력 관리 (Ctrl+Z / Ctrl+Y)
- **Node Collapse** — Space로 하위 노드 접기/펼치기
- **Keyboard Navigation** — 방향키로 노드 간 이동, Shift+방향키로 노드 순서/레벨 변경
- **Multi-Select** — Ctrl+Click(토글), Shift+Click(범위 선택)

### Note Integration
- **Note Linking** — Obsidian 파일 탐색기에서 .md 파일을 노드에 드래그&드롭하여 연결
- **Folder Import** — 폴더를 드롭하면 하위 구조가 자동으로 노드 트리로 생성
- **Ctrl+Double Click** — 연결된 노트를 새 탭에서 열기
- **Auto Sync** — 노트 이름 변경/삭제 시 연결 정보 자동 업데이트

### File Management
- **Native File Format** — `.neromind` 확장자로 저장, 탐색기에서 클릭하면 자동으로 열림
- **Auto Save** — 변경 사항 자동 저장 (1초 debounce)
- **Save As** — 파일명을 지정하여 저장
- **Export** — 마크다운 bullet list 형식으로 내보내기 (wikilink 포함)
- **Import** — 마크다운 파일에서 마인드맵 구조 가져오기
- **Full Note** — 전체 노드를 하나의 노트로 컴파일

### Themes
| Theme | Style |
|-------|-------|
| **Frost** | Glassmorphism, cool blue/purple |
| **Midnight** | Deep dark, navy/cyan |
| **Dawn** | Warm coral/gold, sunrise tones |
| **Square** | Minimal flat, white background |
| **Toss Dark** | Toss-inspired soft dark mode |
| **Neon** | Cyberpunk neon glow |

### Customization
- **Custom Background Color** — RGB 색상 선택기로 배경색 지정
- **Font Selection** — Pretendard, Noto Sans KR, D2Coding 등 14종 폰트
- **Configurable Keybindings** — 모든 단축키를 설정에서 변경 가능

### Canvas
- **Zoom** — 마우스 휠로 줌 인/아웃
- **Pan** — 휠 버튼 드래그 또는 빈 캔버스 드래그
- **Fit All** — 휠 버튼 더블클릭으로 전체 노드 보기
- **Search** — Ctrl+F로 노드 검색 + 하이라이트

## Installation

### Manual
1. [Releases](../../releases)에서 `main.js`, `manifest.json`, `styles.css`를 다운로드
2. Vault의 `.obsidian/plugins/kk-neromind/` 폴더에 복사
3. Obsidian 설정 > Community Plugins에서 KK-NeroMind 활성화

## Keyboard Shortcuts

| Action | Default Key |
|--------|-------------|
| Add Child | `Tab` |
| Add Sibling | `Enter` |
| Delete Node | `Delete` |
| Rename | `F2` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |
| Navigate | `Arrow Keys` |
| Reorder | `Shift+Arrow Up/Down` |
| Move Level | `Shift+Arrow Left/Right` |
| Collapse/Expand | `Space` |
| Search | `Ctrl+F` |
| Save | `Ctrl+S` |
| Open Linked Note | `Ctrl+Double Click` |
| Fit All Nodes | `Middle Click x2` |

## Tech Stack

- TypeScript + SVG (foreignObject)
- Obsidian Plugin API
- Reingold-Tilford tree layout algorithm

## License

MIT
