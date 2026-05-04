# Mini Framework – Documentation

## Overview

Mini Framework is a lightweight, zero-dependency JavaScript frontend framework built entirely from scratch with Vanilla ES6+ modules. It was designed with three goals in mind:

1. **Clarity** – every concept maps to a small, readable file you can read top to bottom in minutes.
2. **Correctness** – a Virtual-DOM diffing engine ensures only the minimum set of DOM mutations runs on each update.
3. **Inversion of control** – the framework owns the render loop; your code declares *what* the UI should look like and the framework figures out *how* to update the DOM.

### Architecture at a Glance

```
framework/
├── core/
│   ├── vdom.js       ← Virtual DOM node factory (h)
│   ├── renderer.js   ← mount + patch (diff engine)
│   └── component.js  ← Base Component class
├── state/
│   └── store.js      ← Reactive global state (Flux-style)
├── router/
│   └── router.js     ← Hash-based client-side router
├── events/
│   └── events.js     ← EventSystem + EventBus
└── index.js          ← Public barrel export
```

Each module is independently importable and usable; you don't have to use all of them together.

---

## Module Reference

### 1. Virtual DOM – `framework/core/vdom.js`

#### `h(tag, attrs, ...children)` → VNode

Creates a **Virtual DOM node** (a plain JavaScript object). The renderer uses this description to create or update real DOM nodes.

| Argument   | Type                                  | Description                                                     |
|------------|---------------------------------------|-----------------------------------------------------------------|
| `tag`      | `string` or `Function`               | HTML tag (e.g. `'div'`) or a **functional component** function |
| `attrs`    | `Object \| null`                      | Attributes, event handlers, and special props                  |
| `children` | `...VNode \| string \| number \| null` | Nested content; falsy values are silently ignored              |

**Event props** follow the pattern `onEventName` (capitalised first letter after `on`), e.g. `onClick`, `onInput`, `onKeydown`.

```js
import { h } from './framework/index.js';

// Plain element
const vnode = h('p', { class: 'greeting' }, 'Hello, world!');

// Nested elements
const card = h('div', { class: 'card' },
  h('h2', {}, 'Title'),
  h('p',  {}, 'Body text'),
);

// Event handling (no addEventListener in your code!)
const btn = h('button', { onClick: () => alert('clicked!') }, 'Click me');

// Conditional child
const isLoggedIn = true;
const nav = h('nav', {},
  isLoggedIn && h('a', { href: '#/logout' }, 'Log out'),
);
```

#### `createTextVNode(text)` → VNode

Creates a text node VNode. Normally you don't call this directly – strings inside `h()` are automatically converted.

---

### 2. Renderer – `framework/core/renderer.js`

#### `mount(vnode, container)` → HTMLElement

Performs the **first render**: converts `vnode` into real DOM nodes and appends them to `container`. Returns the root DOM element.

```js
import { h, mount } from './framework/index.js';

const vnode = h('h1', {}, 'Hello');
mount(vnode, document.body);
```

#### `patch(el, oldVnode, newVnode)` → HTMLElement

**Diffs** `oldVnode` against `newVnode` and applies the minimal set of DOM mutations to bring `el` in sync. Returns the (possibly replaced) DOM element.

```js
import { h, mount, patch } from './framework/index.js';

let vnode = h('p', {}, 'Hello');
let el = mount(vnode, document.body);

// Later…
const nextVnode = h('p', {}, 'World');
el = patch(el, vnode, nextVnode);  // only changes the text node
vnode = nextVnode;
```

#### How the Diff Works

The algorithm is an **index-based linear diff**:

1. If `oldVnode.tag !== newVnode.tag` → replace the entire DOM subtree.
2. If both are text nodes → update `nodeValue` if the strings differ.
3. Otherwise → call `updateAttrs` then recursively diff `children` by index.

`updateAttrs` removes stale event listeners (stored in `el._events`) before attaching fresh ones, so there are no listener leaks.

---

### 3. Component – `framework/core/component.js`

A base class for stateful, reusable UI pieces.

```js
import { h, Component } from './framework/index.js';

class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    return h('div', {},
      h('span', {}, `Count: ${this.state.count}`),
      h('button', { onClick: () => this.setState({ count: this.state.count + 1 }) },
        '+1'),
    );
  }
}

const counter = new Counter({ label: 'My Counter' });
counter._mount(document.getElementById('app'));
```

#### API

| Member            | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `this.props`      | Props passed to the constructor (immutable)                       |
| `this.state`      | Internal state object                                             |
| `setState(partial)` | Merges `partial` into `this.state` and triggers a re-render    |
| `render()`        | **Override this** – must return a VNode                          |
| `onMount()`       | Optional lifecycle hook called after the first render            |
| `_mount(container)` | Mounts the component into `container` (framework internal)    |

> **Tip:** Functional components (plain functions returning VNodes) are often simpler than class components. Use classes when you need encapsulated state.

---

### 4. State Management – `framework/state/store.js`

#### `createStore(initialState, [reducer])` → Store

Creates a **reactive global store**. Optionally accepts a reducer for action-based updates.

```js
import { createStore } from './framework/index.js';

const store = createStore({ count: 0 }, (state, action) => {
  if (action.type === 'INCREMENT') return { ...state, count: state.count + 1 };
  return state;
});

// Subscribe to state changes
const unsub = store.subscribe(state => console.log('New count:', state.count));

// Dispatch an action
store.dispatch({ type: 'INCREMENT' });

// Direct state merge (no reducer needed)
store.setState({ count: 42 });

// Unsubscribe
unsub();
```

#### Store API

| Method                  | Description                                                |
|-------------------------|------------------------------------------------------------|
| `getState()`            | Returns the current state snapshot                        |
| `dispatch(action)`      | Runs the reducer (or shallow-merges) and notifies listeners|
| `setState(updater)`     | Merges / replaces state; accepts an object or `fn(prev)`  |
| `subscribe(listener)`   | Registers `listener(newState)`; returns unsubscribe fn    |

---

### 5. Router – `framework/router/router.js`

Hash-based client-side router. Routes map to hash fragments like `#/`, `#/active`.

```js
import { Router } from './framework/index.js';

const router = new Router();

router
  .on('/',         () => renderHome())
  .on('/about',    () => renderAbout())
  .notFound(       () => router.navigate('/'));

// React to every route change (e.g. sync state)
router.onChange(path => {
  store.dispatch({ type: 'SET_ROUTE', payload: path });
});

// Programmatic navigation
router.navigate('/about');
```

#### Router API

| Method               | Description                                              |
|----------------------|----------------------------------------------------------|
| `on(path, handler)`  | Registers `handler(path)` for the given hash path       |
| `notFound(handler)`  | Catch-all for unmatched routes                          |
| `navigate(path)`     | Sets `window.location.hash = path`                      |
| `getCurrentPath()`   | Returns the current hash path (defaults to `'/'`)       |
| `onChange(listener)` | Subscribes to every route change; returns unsubscribe fn|

---

### 6. Event System – `framework/events/events.js`

#### `EventSystem`

A utility object that wraps `addEventListener` / `removeEventListener` with a clean API and tracks handlers per element to avoid leaks.

```js
import { EventSystem } from './framework/index.js';

const btn = document.querySelector('button');

// Attach
EventSystem.on(btn, 'click', handler);

// Remove
EventSystem.off(btn, 'click');

// One-time
EventSystem.once(btn, 'click', () => console.log('clicked once'));

// Dispatch a custom event
EventSystem.emit(btn, 'my-event', { detail: 42 });
```

> **Note:** You rarely need `EventSystem` directly. Just use event props on VNodes (`onClick`, `onInput`) – the renderer calls `EventSystem` internally.

#### `EventBus`

An application-level publish/subscribe channel, decoupled from the DOM.

```js
import { EventBus } from './framework/index.js';

const bus = new EventBus();

const unsub = bus.on('user:login', ({ name }) => console.log('Welcome', name));
bus.emit('user:login', { name: 'Alice' });

unsub(); // stop listening
```

---

## TodoMVC Application

The `todo-app/` directory contains a complete TodoMVC implementation built exclusively with the Mini Framework.

### Running the app

Serve the project root with any static file server, then open `todo-app/index.html`:

```bash
npx serve .          # Node.js
python3 -m http.server   # Python
```

### Features

| Feature             | How it works                                                     |
|---------------------|------------------------------------------------------------------|
| Add todo            | Press Enter in the header input                                  |
| Delete todo         | Click the × button (visible on hover)                           |
| Toggle complete     | Click the circle checkbox                                        |
| Toggle all          | Click the ❯ arrow above the list                                 |
| Edit todo           | Double-click the label; Enter/blur saves, Escape cancels         |
| Filter              | Click All / Active / Completed (URL hash updates automatically)  |
| Clear completed     | Click "Clear completed" in the footer                           |
| Persistence         | Todos are saved to `localStorage` automatically                  |

### App Architecture

```
todo-app/
├── index.html                     ← entry point (<script type="module">)
├── styles.css                     ← TodoMVC-spec styles
├── app.js                         ← store + router + render loop
└── components/
    ├── TodoHeader.js              ← new-todo input
    ├── TodoList.js                ← main section + toggle-all
    ├── TodoItem.js                ← individual todo (view + edit)
    └── TodoFooter.js              ← count + filters + clear button
```

**Data flow:**

```
User action → action dispatcher → store.dispatch()
                                       ↓
                                   reducer()
                                       ↓
                            store notifies subscribers
                                       ↓
                                   render()
                                       ↓
                              AppView(state) → VNode tree
                                       ↓
                         patch(el, oldVnode, newVnode)
                                       ↓
                              Minimal DOM mutations
```

---

## Internal Design Decisions

### Why Virtual DOM?

The virtual DOM gives a clean separation between "what should the UI look like" (a plain JS object tree) and "how to make that happen in the browser" (DOM API calls). It also makes the render function a **pure function of state**, which is easy to reason about and test.

### Why index-based diffing?

Key-based reconciliation (like React's) is significantly more complex and adds code weight. For a mini framework the index-based strategy is a good trade-off: it handles the common case (append, remove-last, update-in-place) efficiently, and the TodoMVC list is re-rendered by filtering the same array, so indices are stable.

### Why hash routing?

Hash routing (`#/path`) requires no server configuration – the page never reloads and any static file server works out of the box.

### Why a Flux-style store instead of reactive signals?

The Flux/Redux pattern (action → reducer → new state → notify) gives a predictable, auditable state history and maps naturally to a render function `f(state) → UI`.

### Event listener cleanup

Every DOM element that has event listeners stores them in a non-enumerable `_events` map on the element itself. `updateAttrs` always replaces old handlers before adding new ones, preventing the double-registration bugs common in virtual-DOM implementations.
