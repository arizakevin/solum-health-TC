---
description: "Modular design, SOLID, low coupling. Keep components atomic and reusable; avoid tightly coupled code."
alwaysApply: true
---

# Modularity & Low Coupling

## Principles

- **Modular & atomic**: Components and modules should be focused, single-purpose, composable.
- **Reusable**: Prefer abstractions that work across projects.
- **Low coupling**: Avoid tight coupling; apply SOLID (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion).
- **Composition over coupling**: Inject dependencies; use props and composition instead of importing global state.

## Examples

### ❌ BAD – Tightly coupled, does too much

```tsx
// Component imports project-specific config, DB, and UI in one place
function ChatPanel() {
  const db = useProjectStore(s => s.db);  // Project-specific store
  const apiKey = useAppConfig();           // App-specific config
  const messages = db.getMessages();       // Direct DB access
  return (
    <div>
      {messages.map(m => <Message key={m.id} {...m} />)}
      <SendButton onSubmit={v => db.addMessage(v)} />
    </div>
  );
}
```

### ✅ GOOD – Focused, injected dependencies

```tsx
// Props for what it needs; no project-specific imports
interface ChatPanelProps {
  messages: Message[];
  onSend: (content: string) => void;
  children?: React.ReactNode;
}
function ChatPanel({ messages, onSend, children }: ChatPanelProps) {
  return (
    <div>
      {messages.map(m => <Message key={m.id} {...m} />)}
      <SendButton onSubmit={onSend} />
      {children}
    </div>
  );
}
```

### ❌ BAD – Direct dependency on sibling feature

```tsx
// ThemeToggle tightly coupled to theme store implementation
import { useThemeStore } from '@/stores/theme';  // Project-specific
function ThemeToggle() {
  const theme = useThemeStore(s => s.theme);
  return <button onClick={() => useThemeStore.getState().toggle()}>…</button>;
}
```

### ✅ GOOD – Receives behavior via props

```tsx
interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}
function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return <button onClick={onToggle}>{theme === 'dark' ? '☀️' : '🌙'}</button>;
}
```

## Avoid App Names in Code

Do **not** name code files, components, hooks, or classes with the app/product name. App names may change; generic names keep code portable and reusable.

- **Hooks**: Use `useGlobalState`, `useWorkspaceState`, or `useAppState` instead of `useMyAppNameState`.
- **DB classes**: Use `WorkspaceDB`, `AppDB`, or domain-specific names instead of `MyAppDB`.
- **Files**: Prefer `useGlobalState.tsx` over `useMyAppState.tsx`.

### ❌ BAD – App-specific names

```ts
// useProrelloState.tsx
export function useProrelloState() { ... }

// db/index.ts
export class ProrelloDB extends Dexie { ... }
```

### ✅ GOOD – Generic names

```ts
// useGlobalState.tsx
export function useGlobalState() { ... }

// db/index.ts
export class WorkspaceDB extends Dexie { ... }
```

**Exception**: User-facing strings (UI labels, export filenames, product title in the header) may use the app name for branding.

## Centralize Brand Configuration

For any creation, refactor, or project bootstrap, keep all brand metadata in one place for easier evolution and rebranding:

- **App name**, description, tagline, manifesto
- **Icon**, favicon, PWA icons, app store assets
- **Themes** (colors, fonts, design tokens)
- **Export filenames**, product title, meta tags

Use a config module (e.g. `config/brand.ts`, `lib/brand.ts`) or `package.json` fields. Components and manifests should import from that single source.
