# Mini Framework

[![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-f7df1e?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
![Zero Dependencies](https://img.shields.io/badge/Zero%20dependencies-yes-2ea44f)
![TodoMVC](https://img.shields.io/badge/TodoMVC-implementation-4caf50)

Lightweight JavaScript UI framework with virtual DOM rendering, reactive state, hash-based routing, and event utilities.

## Table of Contents

- [1. Project Title](#1-project-title)
- [2. Overview](#2-overview)
- [3. Features](#3-features)
- [4. Installation](#4-installation)
- [5. Getting Started](#5-getting-started-very-important)
- [6. Framework Architecture](#6-framework-architecture)
- [7. How It Works](#7-how-it-works-important-for-audit)
- [8. TodoMVC Implementation](#8-todomvc-implementation)
- [9. Code Examples](#9-code-examples-section)
- [10. Best Practices](#10-best-practices)
- [11. Validation](#11-validation)
- [12. Conclusion](#12-conclusion)

## 1. Project Title

**Mini Framework**

Small, readable JavaScript framework for building interactive UI with a virtual DOM, state management, routing, and event handling.

## 2. Overview

Mini Framework is a zero-dependency frontend framework built with ES modules. It exists to show how the core pieces of a modern UI framework fit together without hidden abstractions or unnecessary complexity.

The framework centers on four ideas:

- **DOM abstraction**: build UI with `h()` instead of manual DOM calls.
- **State management**: keep application data in a store and re-render when it changes.
- **Routing**: map URL hash fragments to views and filters.
- **Events**: attach DOM handlers and application-level pub/sub cleanly.

This makes the codebase useful for learning, auditing, and small applications where clarity matters more than framework overhead.

## 3. Features

- **DOM abstraction** with virtual nodes created by `h()`.
- **Routing system** with hash-based routes and route change listeners.
- **State management** through a reactive store with `dispatch`, `setState`, and `subscribe`.
- **Event system** with DOM helpers and an application `EventBus`.
- **TodoMVC example** that demonstrates the full stack working together.

## 4. Installation

The project has no runtime dependencies. You only need a recent version of Node.js to run the local scripts.

1. Install dependencies:

```bash
npm install
```

2. Run the automated checks:

```bash
npm test
```

3. Serve the project locally:

```bash
npm run serve
```

4. Open the TodoMVC app in your browser:

```text
http://localhost:3000/todo-app/
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` instead.

## 5. Getting Started (VERY IMPORTANT)

All examples below use the public API exported from `framework/index.js`.

### Create an element

```js
import { h } from './framework/index.js';

const title = h('h1', {}, 'Hello world');
```

This creates a virtual node for an `h1` element. Strings inside `h()` are automatically converted into text nodes.

### Add attributes

```js
import { h } from './framework/index.js';

const input = h('input', {
	type: 'text',
	placeholder: 'Type a todo',
	class: 'new-todo',
});
```

Attributes are passed as a plain object. Special names such as `class`, `className`, `value`, `checked`, and `htmlFor` are handled explicitly by the renderer.

### Nest elements

```js
import { h } from './framework/index.js';

const card = h('section', { class: 'card' },
	h('h2', {}, 'Todo list'),
	h('p', {}, 'Build the UI from small reusable nodes.'),
);
```

Children can be nested directly inside `h()`. Arrays are flattened automatically, so you can compose larger trees from smaller parts.

### Create an event

```js
import { h } from './framework/index.js';

const button = h('button', {
	onClick: () => console.log('Clicked'),
}, 'Save');
```

Event props follow the `onEventName` pattern. The renderer converts them into DOM listeners for you.

### Use state

```js
import { createStore } from './framework/index.js';

const store = createStore({ count: 0 }, (state, action) => {
	if (action.type === 'INCREMENT') {
		return { ...state, count: state.count + 1 };
	}
	return state;
});

store.subscribe((state) => {
	console.log('count changed:', state.count);
});

store.dispatch({ type: 'INCREMENT' });
```

The store keeps application data in one place. When state changes, subscribers receive the new snapshot and can re-render the UI.

### Use routing

```js
import { Router } from './framework/index.js';

const router = new Router();

router
	.on('/', () => console.log('show all todos'))
	.on('/active', () => console.log('show active todos'))
	.on('/completed', () => console.log('show completed todos'))
	.notFound(() => router.navigate('/'));

router.navigate('/active');
```

The router uses the URL hash, so route changes are reflected in the browser address bar and can be bookmarked or refreshed safely.

## 6. Framework Architecture

The framework is intentionally split into small modules so each responsibility is easy to inspect.

```text
framework/
├── core/
│   ├── vdom.js       # Virtual node factory
│   ├── renderer.js   # mount + patch + DOM creation
│   └── component.js  # Base class for stateful components
├── state/
│   └── store.js      # Reactive global store
├── router/
│   └── router.js     # Hash-based client-side router
├── events/
│   └── events.js     # EventSystem and EventBus
└── index.js          # Public exports
```

The core modules work together like this:

- `vdom.js` creates virtual nodes with `h()`.
- `renderer.js` turns virtual nodes into real DOM and updates them with `patch()`.
- `component.js` gives you a stateful base class for reusable UI pieces.
- `store.js` holds application state and notifies subscribers when data changes.
- `router.js` reads and updates the hash portion of the URL.
- `events.js` provides DOM listener helpers and an application-level event bus.

## 7. How It Works (IMPORTANT FOR AUDIT)

### DOM abstraction

Instead of creating DOM nodes directly, you describe the UI as a tree of virtual nodes. A call like `h('button', { onClick }, 'Save')` creates a plain JavaScript object that says what should appear on screen.

The renderer converts that description into real DOM on the first render. On later renders, `patch()` compares the old and new virtual trees and updates only what changed.

### How state updates the UI

The store exposes `subscribe()`, so app code can re-run the render function whenever state changes. In the TodoMVC app, `store.subscribe(render)` keeps the UI synchronized with the current state snapshot.

`Component.setState()` follows the same idea for local component state: it merges the new data, re-renders the component, and patches the DOM in place.

### How routing syncs with the URL

`Router` listens to `load` and `hashchange`. That means the active route always comes from the URL, not from hidden internal state.

When the hash changes, the router resolves the current path, runs the matching handler, and notifies any `onChange()` listeners. In the TodoMVC app, this keeps the filter view aligned with `#/`, `#/active`, and `#/completed`.

### How events are handled

DOM events are attached with props such as `onClick`, `onInput`, `onKeydown`, and `onBlur`. The renderer stores active handlers on the node so it can replace or remove them during patching without leaking listeners.

For application-level communication, `EventBus` provides a small pub/sub channel that is separate from the DOM.

## 8. TodoMVC Implementation

The `todo-app/` folder contains a complete TodoMVC example built with this framework.

### How the framework is used

- `app.js` creates the store, router, and render loop.
- Components in `todo-app/components/` return virtual nodes through `h()`.
- The store reducer handles all todo actions.
- The router drives the active/completed/all filter state.
- The renderer mounts the app into `#app` and patches the DOM on updates.

### Implemented features

- Add new todos
- Toggle individual todos
- Toggle all todos
- Edit a todo inline
- Cancel or save editing with keyboard and blur interactions
- Remove todos
- Filter by all, active, or completed
- Clear completed todos
- Persist todo data in `localStorage`

### TodoMVC behavior

The app follows the standard TodoMVC interaction model: the route reflects the current filter, editing is keyboard-friendly, completed items are visually marked, and the list updates immediately when state changes.

## 9. Code Examples Section

### Component creation

```js
import { Component, h } from './framework/index.js';

class Counter extends Component {
	constructor(props) {
		super(props);
		this.state = { count: 0 };
	}

	render() {
		return h('div', { class: 'counter' },
			h('p', {}, `Count: ${this.state.count}`),
			h('button', {
				onClick: () => this.setState({ count: this.state.count + 1 }),
			}, 'Increment'),
		);
	}
}
```

This pattern is useful when a part of the UI needs its own local state and lifecycle.

### State usage

```js
import { createStore } from './framework/index.js';

const store = createStore({ todos: [] }, (state, action) => {
	switch (action.type) {
		case 'ADD_TODO':
			return { ...state, todos: [...state.todos, action.payload] };
		default:
			return state;
	}
});
```

Use the store for shared application state and update it through actions for predictable behavior.

### Routing usage

```js
import { Router } from './framework/index.js';

const router = new Router();

router
	.on('/', () => renderAll())
	.on('/active', () => renderActive())
	.on('/completed', () => renderCompleted());
```

This keeps URL-driven views simple and makes filters or pages refreshable.

### Event handling

```js
import { h } from './framework/index.js';

const form = h('form', {
	onSubmit: (event) => {
		event.preventDefault();
		console.log('submit');
	},
},
	h('input', { type: 'text' }),
	h('button', { type: 'submit' }, 'Add'),
);
```

Event props let you wire interactions directly in the virtual tree without manual DOM wiring.

## 10. Best Practices

- Keep render functions pure: derive UI from state and props only.
- Use small components for clear responsibilities.
- Store shared application data in the global store, not in DOM state.
- Prefer actions and reducers for state transitions so behavior stays easy to audit.
- Use the router for URL-driven filters and views.
- Avoid unnecessary re-renders by changing only the state you need.
- Keep event handlers close to the nodes they affect so the UI remains easy to reason about.

## 11. Validation

The project was validated with both automated tests and manual browser checks.

- Automated suite: `node tests/run.js` → 42 passed, 0 failed.
- Manual TodoMVC checks completed in the browser:
	- Add todo
	- Delete todo
	- Toggle complete / incomplete
	- Edit on double click
	- Filter by All / Active / Completed
	- Clear completed
	- Footer visibility and counter updates
	- URL updates with filters

The manual edit flow also exposed a blur/save edge case, which was fixed in the Todo item component so Enter and Escape no longer trigger duplicate updates.

## 12. Conclusion

Mini Framework is intentionally small, but it still demonstrates the essential building blocks of a frontend framework: virtual DOM rendering, reactive state, routing, and event handling.

Its main strengths are simplicity, explicit control flow, and a codebase that is easy to audit. That makes it useful both as a learning project and as a reference implementation for understanding how UI frameworks work internally.