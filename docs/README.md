# KK-NeroMind

> **Apple-Style Mind Mapping Plugin for Obsidian**

A native Obsidian plugin that transforms your notes into interactive mind maps with automatic layout and bidirectional synchronization.

---

## 📖 Product Context

### Vision

**Seamlessly integrate visual thinking into your Obsidian knowledge management system.**

KK-NeroMind bridges the gap between linear note-taking and visual thinking by providing a native mind mapping experience within Obsidian. No context switching, no manual positioning—just pure focus on ideas and their connections.

---

### Target Users

**Primary Users:**
- **Knowledge Managers**: Obsidian users building Personal Knowledge Management (PKM) systems
- **Visual Thinkers**: Those who understand concepts better through diagrams and relationships
- **PKM Enthusiasts**: Users with 100+ interconnected notes seeking better visualization

**Secondary Users:**
- **Students & Researchers**: Organizing complex topics and literature reviews
- **Content Creators**: Planning articles, videos, or courses with hierarchical structures
- **Obsidian Community**: Early adopters interested in innovative visualization tools

---

### Core Value Proposition

#### 🎯 Full Note Integration (Primary Value)

The defining feature that sets KK-NeroMind apart:

```
Mind Map Node ←→ Full Obsidian Note
```

**What This Means:**
- Each mind map node can link to a complete Obsidian note
- Bidirectional sync: changes in notes reflect in mind maps, and vice versa
- Leverage Obsidian's powerful backlink system visually
- Context preservation: never lose the "why" behind connections

**Example Use Case:**
```
Research Topic (Mind Map)
├── Literature Review (→ notes/lit-review.md)
├── Methodology (→ notes/methodology.md)
│   ├── Data Collection (→ notes/data-collection.md)
│   └── Analysis (→ notes/analysis.md)
└── Findings (→ notes/findings.md)
```

Each node maintains full context through its linked note, while the mind map provides the visual overview.

#### 🚀 Additional Benefits

1. **Native Obsidian Experience**
   - No external apps or context switching
   - Works offline, files stay local
   - Integrates with existing Obsidian workflows

2. **Automatic Layout Engine**
   - Zero manual positioning required
   - Intelligent spacing and hierarchy
   - Scales from 10 to 1000+ nodes

3. **Reliable Architecture**
   - Atomic file operations (no data loss)
   - Command pattern with full undo/redo
   - Comprehensive testing (80% coverage target)

---

### Success Criteria

#### Technical Milestones

- [x] **Phase 1**: Zero-to-One - Plugin loads in Obsidian successfully
- [ ] **Phase 6**: 80% code coverage achieved
- [ ] **Phase 7**: Full Note bidirectional sync working
- [ ] **Performance**: Smooth rendering with 100+ nodes (60fps)
- [ ] **Reliability**: Auto-save < 100ms, atomic write operations

#### Community Goals

- [ ] **Alpha Release**: Shared with early testers for feedback
- [ ] **Beta Release**: Public testing in Obsidian community
- [ ] **Community Plugin**: Approved for official Obsidian plugin directory
- [ ] **User Adoption**: Positive feedback from knowledge management community
- [ ] **Open Source**: Active community contributions and improvements

---

### Why KK-NeroMind?

**The Problem:**
- Existing mind map tools are separate from Obsidian → context loss
- Obsidian Canvas requires manual node positioning → tedious for large maps
- No automatic layout engines for Obsidian → can't scale to complex knowledge graphs
- Limited integration with note system → mind maps become disconnected diagrams

**The Solution:**
KK-NeroMind treats mind maps as **first-class citizens** in your Obsidian vault:
- `.kknm` files sit alongside your `.md` files
- Automatic layout keeps focus on content, not positioning
- Full Note integration preserves context and enables deep linking
- Native Obsidian experience with no external dependencies

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/kk-neromind.git

# Install dependencies
npm install

# Build the plugin
npm run build

# Copy to your Obsidian plugins folder
cp -r . /path/to/your/vault/.obsidian/plugins/kk-neromind/
```

### First Mind Map

1. Open Obsidian
2. Create new file: `MyIdeas.kknm`
3. The mind map view will open automatically
4. Start adding nodes and connecting them!

---

## 📚 Documentation

### Core Documentation

- **[Architecture v5.2.0](docs/KK-NeroMind-Architecture-v5_2_0.md)** - Architectural constitution and design principles
- **[Development Roadmap v5.2.0](docs/KK-NeroMind-Development-Roadmap-v5_2_0.md)** - Phase-by-phase implementation plan
- **[Coding Guidelines v5.2.1](docs/KK-NeroMind-Coding-Guidelines-v5.2.1.md)** - AI-agent safe coding rules
- **[Schema v5.2.1](docs/KK-NeroMind-Schema-v5.2.1.md)** - `.kknm` file format specification
- **[Test Specification v5.2.0](docs/KK-NeroMind-Test-Specification-v5_2_0.md)** - Comprehensive test cases

### Key Concepts

**Phase-Based Development:**
- **Phase 1**: Zero-to-One (Plugin loads successfully)
- **Phase 2-3**: File I/O and Command System
- **Phase 4-5**: UI Layer and Interactions
- **Phase 6**: Automatic Layout Engine ⭐
- **Phase 7**: Full Note Integration ⭐⭐
- **Phase 8**: Production Release

**Architectural Principles:**
1. **Schema is Law** - `.kknm` file format is sacred
2. **Fail Loudly** - No silent failures or auto-corrections
3. **Command is Truth** - All changes go through Command pattern
4. **Executable or Nothing** - Code must actually run in Obsidian

---

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm 7+
- Obsidian 1.0+

### Build Commands

```bash
# Development build
npm run dev

# Production build
npm run build

# Run tests
npm test

# Test coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

### Project Structure

```
kk-neromind/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── core/                   # Core state management
│   │   └── MindMapState.ts
│   ├── commands/               # Command pattern implementation
│   │   ├── base/
│   │   └── node/
│   ├── services/               # Service layer
│   │   ├── FileService.ts
│   │   ├── HistoryManager.ts
│   │   └── LayoutEngine.ts
│   ├── views/                  # UI layer
│   │   └── MindMapView.ts
│   ├── schema/                 # Data schema
│   │   ├── types.ts
│   │   └── validator.ts
│   └── utils/                  # Utilities
├── docs/                       # Documentation
├── tests/                      # Test files
└── manifest.json              # Obsidian plugin manifest
```

---

## 🧪 Testing Philosophy

KK-NeroMind follows a **rigorous testing approach**:

- **Phase 1**: 50% coverage (Bootstrap + Validation)
- **Phase 6**: 80% coverage target ⭐
- **Phase 8**: 80%+ coverage (Production ready)

**Test-Driven Phase Gates:**
Every phase requires passing tests before moving forward. This ensures:
- No regressions
- Verified functionality
- Production-ready code

---

## 🗺️ Roadmap

### Current Status: **Phase 0** (Environment Setup)

| Phase | Status | Key Deliverable |
|-------|--------|----------------|
| Phase 0 | ✅ Complete | Environment configured |
| Phase 1 | 🚧 In Progress | Plugin loads in Obsidian |
| Phase 2 | ⏳ Planned | File I/O with atomic writes |
| Phase 3 | ⏳ Planned | Command System with Undo/Redo |
| Phase 4 | ⏳ Planned | Canvas rendering |
| Phase 5 | ⏳ Planned | Drag & edit interactions |
| Phase 6 | ⏳ Planned | **Automatic Layout Engine** |
| Phase 7 | ⏳ Planned | **Full Note Integration** |
| Phase 8 | ⏳ Planned | Production release |

**Estimated Timeline:** 3-4 weeks

---

## 🤝 Contributing

KK-NeroMind is designed for community contribution with clear architectural boundaries.

### Contribution Areas

- **Layout Algorithms**: Improve automatic positioning
- **UI/UX**: Enhance visual design and interactions
- **Performance**: Optimize rendering for large graphs
- **Testing**: Expand test coverage
- **Documentation**: Improve guides and examples

### Getting Started

1. Read [Architecture v5.2.0](docs/KK-NeroMind-Architecture-v5_2_0.md)
2. Review [Coding Guidelines v5.2.1](docs/KK-NeroMind-Coding-Guidelines-v5.2.1.md)
3. Check open issues
4. Submit PRs following the guidelines

**AI Agents Welcome!**  
This project includes AI-specific documentation:
- [AI Agent Prompt](docs/KK-NeroMind-AI-Agent-Prompt.md)
- [Claude Checklist](docs/KK-NeroMind-Claude-Checklist.md)

---

## 📄 File Format

KK-NeroMind uses `.kknm` (KK-NeroMind) file format:

```json
{
  "schemaVersion": 1,
  "metadata": {
    "created": 1705555200000,
    "modified": 1705555200000,
    "title": "My Mind Map"
  },
  "nodes": {
    "node-1": {
      "id": "node-1",
      "content": "Main Idea",
      "position": { "x": 0, "y": 0 },
      "linkedNote": "notes/main-idea.md"
    }
  },
  "edges": {
    "edge-1": {
      "id": "edge-1",
      "from": "node-1",
      "to": "node-2"
    }
  },
  "camera": { "x": 0, "y": 0, "zoom": 1.0 }
}
```

See [Schema v5.2.1](docs/KK-NeroMind-Schema-v5.2.1.md) for complete specification.

---

## 🎨 Design Philosophy

### User Experience Principles

1. **Invisible Complexity**: Users see simple mind maps, not technical details
2. **Fast by Default**: Every operation should feel instant
3. **Fail Gracefully**: Clear error messages, never silent failures
4. **Data Safety First**: Never lose user data, even on crashes

### Technical Principles

1. **Schema is Law**: File format is sacred and immutable
2. **Command Pattern**: All changes are undoable
3. **Atomic Operations**: No partial states or corrupted files
4. **Test Everything**: 80% coverage is non-negotiable

---

## 📊 Performance Targets

| Metric | Target | Phase |
|--------|--------|-------|
| Plugin Load Time | < 500ms | Phase 1 |
| File Open | < 200ms | Phase 2 |
| Auto-save | < 100ms | Phase 2 |
| Render 100 nodes | 60fps | Phase 4 |
| Render 1000 nodes | 30fps | Phase 6 |
| Undo/Redo | < 50ms | Phase 3 |
| Layout calculation | < 1s | Phase 6 |

---

## 🐛 Known Limitations

**Alpha Phase (Current):**
- Limited to basic node creation and positioning
- Manual layout only (automatic layout in Phase 6)
- No Full Note integration yet (Phase 7)
- Desktop only (mobile support planned)

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

**Inspiration:**
- Obsidian Canvas - Native diagramming approach
- Excalidraw - Smooth interaction patterns
- Apple Design - Clean, intuitive interfaces

**Architecture Influenced By:**
- Domain-Driven Design principles
- Command Pattern (Gang of Four)
- Fail Loudly philosophy (Erlang/Elixir)

---

## 📞 Contact

- **Author**: Jin (Nero-kk)
- **YouTube**: [Nero's Knowledge Archive](https://youtube.com/@your-channel)
- **Project**: [GitHub Repository](https://github.com/yourusername/kk-neromind)

---

## 🗓️ Version History

- **v5.2.1** (2026-01-18) - Schema and Guidelines refinement
- **v5.2.0** (2026-01-18) - Execution-Guaranteed Architecture
- **v5.1.0** (2026-01-17) - Architecture consolidation
- **v1.0.0** (Planned) - First stable release

---

**Built with ❤️ for the Obsidian community**

*"Visualize your knowledge, preserve your context."*
