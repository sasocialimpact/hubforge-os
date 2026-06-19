# HubForge OS - Innovation Features

## What innovative products do that we should steal

| Product | Innovation | How HubForge uses it |
|---------|-----------|---------------------|
| **Linear** | Cmd+K command palette, keyboard-first, instant | Command palette for all actions |
| **ChatGPT/Cursor** | Streaming output (text appears in real-time) | Stream LLM output, no more 3-min spinner |
| **Ollama/LM Studio** | Local LLMs on user hardware | WebGPU in-browser LLM (zero cost, offline) |
| **Otter.ai** | Voice input | Dictate problem description (field workers) |
| **Roam/Obsidian** | Bidirectional links, graph view | Programs link to context, graph of connections |
| **Excalidraw/Tldraw** | Infinite canvas, hand-drawn | Whiteboard mode for ToC (drag, draw, connect) |
| **Perplexity** | Search + AI + citations | Click any claim to see source web page |
| **Gamma** | AI generates full deck from one prompt | "One-click program" from a single sentence |
| **Figma** | Components, auto-layout, real-time | Reusable program components, template blocks |
| **Raycast** | Extensions, snippets, quick actions | Save problem templates, reuse with hotkey |
| **Notion** | Block-based, embeds, databases | Strategy as blocks (reorder, nest, embed) |
| **Arc Browser** | Spaces, sidebar, pinned | Program spaces, pin frequent programs |

## What to build now (high impact, low effort, leverages user hardware)

### 1. Command Palette (Cmd+K) - like Linear/Raycast
- Opens with Cmd+K / Ctrl+K
- Search programs, actions, settings, help
- Type "new water project in Kenya" -> creates program with pre-filled context
- Keyboard-only workflow (no mouse needed)
- Recent programs, quick exports, mode switch

### 2. Streaming Output - like ChatGPT/Cursor
- LLM text appears word-by-word in real-time
- No more 3-minute spinner - user sees progress immediately
- Uses Server-Sent Events (SSE) or streaming fetch
- Per-engine streaming: see each engine's output as it runs

### 3. Voice Input - like Otter.ai
- Microphone button on the problem input
- Uses Web Speech API (built into Chrome/Edge/Safari)
- Dictate: "We want to design a literacy program for 500 children in Marsabit..."
- No extra libraries, no API cost, works offline
- Perfect for field workers who can't type fast

### 4. Smart Caching - like Perplexity
- Cache LLM responses by problem hash
- If someone asks a similar question, return cached + refine
- Cache web search results by geography (Marsabit data doesn't change daily)
- 10x faster for repeat/similar queries
- Reduces API costs by 80%

### 5. WebGPU Local AI - like Ollama but in-browser
- Use @xenova/transformers to run small models (Phi-3, Gemma-2B) in the browser
- Zero API cost - uses the user's GPU
- Works offline (after first load)
- Data never leaves the device (privacy)
- Falls back to cloud API for complex reasoning
- The future: no server costs, no API keys, no rate limits

### 6. Instant Templates - like Gamma
- "I need a literacy program" -> full ToC + Logframe + Budget in 2 seconds
- Uses pre-computed templates, not LLM calls
- User customizes from a 90% complete draft
- 100x faster than generating from scratch

### 7. Interactive Citations - like Perplexity
- Every claim in the strategy has a [Source] link
- Click to see the original web page in a side panel
- Hover to see the snippet
- Builds trust - users verify claims

### 8. Comparison View - like Git diff
- After feedback, show what changed (red strikethrough old, green new)
- Version slider: drag to see v1 -> v2 -> v3 evolution
- Users understand what the AI changed and why
