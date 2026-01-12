# KK-NeroMind

Apple-Style Clean & Simple Mindmap for Obsidian

## Phase 1: Core Infrastructure ✅

### Completed Files

```
KK-NeroMind/
├── src/
│   ├── main.ts                     ✅ Plugin entry point
│   ├── types/
│   │   └── index.ts               ✅ Type definitions
│   ├── views/
│   │   └── NeroMindView.ts        ✅ Mindmap view
│   ├── state/
│   │   └── StateManager.ts        ✅ State management
│   ├── rendering/
│   │   ├── Renderer.ts            ✅ Renderer orchestrator
│   │   ├── SVGNodeFactory.ts      ✅ Node factory
│   │   └── SVGEdgeFactory.ts      ✅ Edge factory
│   └── ui/
│       └── NeroMindSettingTab.ts  ✅ Settings tab
├── styles/
│   └── styles.css                  ✅ Apple Style CSS
├── .gitignore                      ✅ Git ignore rules
├── .npmrc                          ✅ NPM configuration
├── manifest.json                   ✅ Plugin metadata
├── package.json                    ✅ Dependencies
├── tsconfig.json                   ✅ TypeScript config
├── esbuild.config.mjs             ✅ Build config
└── versions.json                   ✅ Version compatibility
```

### Phase 1 Precautions ✅

All 10 precautions from Coding Guidelines strictly followed:

1. ✅ **onLayoutReady usage** - DOM operations only after workspace ready
2. ✅ **Disposable reverse cleanup** - Resources cleaned in reverse order
3. ✅ **async/await** - onload() is async, settings loaded first
4. ✅ **SVG namespace** - All SVG elements use createElementNS
5. ✅ **innerHTML avoided** - DOM API used directly
6. ✅ **Coordinate systems** - Screen/Canvas/World properly distinguished
7. ✅ **Event listener cleanup** - All listeners removed in destroy()
8. ✅ **Glassmorphism compatibility** - foreignObject for backdrop-filter
9. ✅ **Loading order** - Settings → onLayoutReady → init
10. ✅ **Reverse destroy pattern** - Input → Sync → State → Renderer

### Build and Run

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Production build
npm run build
```

### Enable Plugin in Obsidian

1. Open Obsidian Settings
2. Go to Community Plugins
3. Click "Reload" button
4. Enable "KK-NeroMind"
5. Click the brain icon in left sidebar

### Architecture

Based on **Architecture v4.0** design document:
- **Disposable Pattern**: All components implement destroy()
- **State Management**: PersistentState (Undo) vs EphemeralState
- **Rendering Pipeline**: Renderer → NodeFactory → EdgeFactory
- **Apple Style**: Glassmorphism, SF Pro Text font, blur effects

### Development Phases

- ✅ **Phase 1**: Core Infrastructure (Current)
- 🔄 **Phase 2**: Node Operations & Interactions (Next)
- 🔄 **Phase 3**: Sync & Export
- 🔄 **Phase 4**: Advanced Features & Optimization

### Author

Nero-kk

### License

MIT
