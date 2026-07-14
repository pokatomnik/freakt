# Freakt — a React from scratch, for fun

Freakt is a **proof-of-concept** UI library written in TypeScript that mimics a tiny subset of React's behavior. It was built from scratch with zero external runtime dependencies to explore how component-based frameworks work under the hood.

> ⚠️ **Disclaimer:** Freakt is **not production-ready**. It's a learning experiment — a minimal, incomplete reimplementation of a handful of React concepts. It lacks most features you'd need in a real application (no context, no hooks, no SSR, no error boundaries, no synthetic event system, no fiber architecture, etc.). Use React instead.

---

## Features

- **Class components** with a familiar lifecycle: `constructor` → `onMount` → `onUpdate` → `onUnmount`
- **State** – any class field that isn't a method is reactive; reassigning it triggers a re-render
- **Props** – parent components pass typed props to children
- **Component nesting** – arbitrary depth, just like React
- **Keyed reconciliation** – when `key` props are provided, the diff algorithm matches children by identity, preserving component state across re-renders
- **Key change → recreation** – changing a component's `key` unmounts the old instance and mounts a fresh one (full lifecycle reset)
- **Virtual DOM diffing** – minimal set of DOM mutations based on tree comparison
- **Automatic method binding** – all component methods are bound to the instance automatically
- **Batched updates** – state changes are coalesced into a single microtask flush

## What it doesn't do (and never will)

- ❌ Functional components / Hooks
- ❌ Context API
- ❌ Server-side rendering
- ❌ React Native / canvas rendering
- ❌ Concurrent mode / Suspense
- ❌ Synthetic events
- ❌ IE support (modern APIs only)
- ❌ JSX (TypeScript-only API)

---

## Architecture & decisions

### 1. Every data field is state

In React class components you write `this.setState(...)`. In Freakt, **any** non-method field is treated as state — reassigning it triggers a re-render. This was implemented by removing the common `Object.defineProperty` trick for a single `state` accessor in favor of a generic `makeReactive()` function that runs after construction:

```typescript
// After new Component(), makeReactive scans own properties,
// skips 'props', __internals, functions, and existing accessors,
// and wraps the rest with getters/setters that call __requestUpdate().
```

The `state` accessor was kept as a backward-compatible fallback for the common `this.state = X` pattern, but `this.count = 5` or `this.text = 'hi'` work just as well.

### 2. No JSX — TypeScript only

Freakt exposes a single `render(tag, props, ...children)` function that produces a plain VNode object:

```typescript
render('div', { className: 'container' },
  render(MyComponent, { name: 'world' }),
)
```

This keeps the library lean and avoids a build-step dependency. TypeScript's type system provides enough ergonomics without JSX.

### 3. Generic-free public types

Early versions of Freakt used generics on `VNode<P>` and `ComponentClass<P>` to carry prop types through the tree. This caused covariance issues when concrete component classes (e.g., `FreaktInput extends FreaktComponent<InputProps>`) clashed with the generic `render()` return type.

The final design keeps generics on **inputs** (the `render()` function validates props against the component class) but returns a plain `VNode` — the extra type parameter on the VNode wasn't providing enough value to justify the ergonomic cost.

### 4. Keyed reconciliation baked into the children loop

Instead of dispatching to a separate `reconcileKeyed()` function when any child has a key, Freakt handles both keyed and non-keyed children in a single pass. For each position:

- If the new child has a **key** → look it up in the old children key map; if found, move and reconcile; if not, insert as new.
- If the new child has **no key** → use index-based matching (the simple path).
- If the old child at this index was already matched by key elsewhere → insert the new child as fresh.

This avoids the bug where non-keyed siblings were always inserted as duplicates when a sibling had a key.

### 5. Microtask-batched updates

When a reactive setter fires, the component is pushed to a queue. A single `queueMicrotask` flush processes all dirty components in order. This avoids cascading renders within the same synchronous block.

### 6. No `any` in public contracts

The exported types (`ComponentClass`, `VNode`, `Child`, `FreaktComponent`, `render`, `mount`) are fully typed with generics and `unknown` where applicable. The few remaining `as any` casts are confined to internal implementation files (`renderer.ts`, `dom.ts`).

---

## Project structure

```
src/
├── types.ts        Public type definitions
├── vnode.ts        VNode creation (render function)
├── component.ts    FreaktComponent base class + makeReactive
├── dom.ts          DOM attribute/event helpers
├── renderer.ts     Tree building, reconciliation, unmounting
├── mount.ts        Mount/unmount entry point
└── index.ts        Public API re-exports
index.ts            Demo application
index.html          Demo HTML shell
index.css           Demo styles
tests/              Vitest unit tests
```

---

## Getting started

```bash
# Install dependencies (dev only – no runtime deps)
npm install

# Start the dev server (hot reload)
npm run start
# → http://localhost:3001

# Run tests with coverage
npm test
```

The demo is a minimal app showing the key features: an input that updates parent state, a counter with keyed children, and lifecycle logging.

---

## License

MIT — do whatever you want with this code, but don't blame me if it breaks in production (it will).