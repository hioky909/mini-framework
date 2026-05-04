/**
 * tests/run.js – Test runner for Mini Framework
 *
 * Runs all test suites and prints a summary.
 * Uses Node.js built-in assert + jsdom for DOM simulation.
 */

import { createRequire } from 'module';
import assert from 'assert';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

// ---------------------------------------------------------------------------
// Helper: set up a fresh DOM environment
// ---------------------------------------------------------------------------
function setupDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  });
  global.document = dom.window.document;
  global.window = dom.window;
  global.CustomEvent = dom.window.CustomEvent;
  return dom.window.document.getElementById('app');
}

// ---------------------------------------------------------------------------
// Test suite runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function describe(suiteName, fn) {
  console.log(`\n▶ ${suiteName}`);
  fn();
}

function it(testName, fn) {
  try {
    fn();
    console.log(`  ✓ ${testName}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${testName}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// vdom tests
// ---------------------------------------------------------------------------
import { h, createTextVNode } from '../framework/core/vdom.js';

describe('vdom – h()', () => {
  it('creates an element VNode', () => {
    const vn = h('div', { class: 'foo' });
    assert.strictEqual(vn.tag, 'div');
    assert.deepStrictEqual(vn.attrs, { class: 'foo' });
    assert.deepStrictEqual(vn.children, []);
  });

  it('wraps string children as text VNodes', () => {
    const vn = h('p', {}, 'hello');
    assert.strictEqual(vn.children.length, 1);
    assert.strictEqual(vn.children[0].tag, '#text');
    assert.strictEqual(vn.children[0].value, 'hello');
  });

  it('ignores null, false, undefined children', () => {
    const vn = h('div', {}, null, false, undefined, 'real');
    assert.strictEqual(vn.children.length, 1);
    assert.strictEqual(vn.children[0].value, 'real');
  });

  it('converts number children to strings', () => {
    const vn = h('span', {}, 42);
    assert.strictEqual(vn.children[0].value, '42');
  });

  it('flattens array children', () => {
    const vn = h('ul', {}, [h('li', {}, 'A'), h('li', {}, 'B')]);
    assert.strictEqual(vn.children.length, 2);
  });

  it('calls functional components immediately', () => {
    function Greet({ name }) { return h('span', {}, `Hi ${name}`); }
    const vn = h(Greet, { name: 'Alice' });
    assert.strictEqual(vn.tag, 'span');
    assert.strictEqual(vn.children[0].value, 'Hi Alice');
  });

  it('createTextVNode creates a text VNode', () => {
    const vn = createTextVNode('world');
    assert.strictEqual(vn.tag, '#text');
    assert.strictEqual(vn.value, 'world');
  });
});

// ---------------------------------------------------------------------------
// renderer tests
// ---------------------------------------------------------------------------
import { mount, patch, createElement } from '../framework/core/renderer.js';

describe('renderer – mount()', () => {
  it('appends element to container', () => {
    const container = setupDOM();
    const vn = h('div', { class: 'box' }, 'hello');
    mount(vn, container);
    assert.strictEqual(container.children[0].className, 'box');
    assert.strictEqual(container.children[0].textContent, 'hello');
  });

  it('sets attributes', () => {
    const container = setupDOM();
    const vn = h('input', { type: 'text', placeholder: 'Type…' });
    mount(vn, container);
    assert.strictEqual(container.children[0].getAttribute('type'), 'text');
    assert.strictEqual(container.children[0].getAttribute('placeholder'), 'Type…');
  });

  it('attaches event listeners via onClick prop', () => {
    const container = setupDOM();
    let calls = 0;
    const vn = h('button', { onClick: () => calls++ }, 'Btn');
    const btn = mount(vn, container);
    btn.click();
    assert.strictEqual(calls, 1);
  });

  it('renders nested children', () => {
    const container = setupDOM();
    const vn = h('ul', {}, h('li', {}, 'A'), h('li', {}, 'B'));
    mount(vn, container);
    assert.strictEqual(container.firstChild.children.length, 2);
    assert.strictEqual(container.firstChild.children[1].textContent, 'B');
  });
});

describe('renderer – patch()', () => {
  it('updates text content in place', () => {
    const container = setupDOM();
    const v1 = h('p', {}, 'before');
    const el = mount(v1, container);
    const v2 = h('p', {}, 'after');
    const el2 = patch(el, v1, v2);
    assert.strictEqual(el2, el, 'same element');
    assert.strictEqual(el2.textContent, 'after');
  });

  it('replaces element when tag changes', () => {
    const container = setupDOM();
    const v1 = h('span', {}, 'span');
    const el = mount(v1, container);
    const v2 = h('div', {}, 'div');
    const el2 = patch(el, v1, v2);
    assert.notStrictEqual(el2, el);
    assert.strictEqual(el2.tagName, 'DIV');
  });

  it('updates className', () => {
    const container = setupDOM();
    const v1 = h('div', { class: 'a' });
    const el = mount(v1, container);
    const v2 = h('div', { class: 'b' });
    patch(el, v1, v2);
    assert.strictEqual(el.className, 'b');
  });

  it('appends new children', () => {
    const container = setupDOM();
    const v1 = h('ul', {}, h('li', {}, '1'));
    const ul = mount(v1, container);
    const v2 = h('ul', {}, h('li', {}, '1'), h('li', {}, '2'));
    patch(ul, v1, v2);
    assert.strictEqual(ul.children.length, 2);
  });

  it('removes surplus children', () => {
    const container = setupDOM();
    const v1 = h('ul', {}, h('li', {}, 'A'), h('li', {}, 'B'), h('li', {}, 'C'));
    const ul = mount(v1, container);
    const v2 = h('ul', {}, h('li', {}, 'A'));
    patch(ul, v1, v2);
    assert.strictEqual(ul.children.length, 1);
  });

  it('swaps event handler when it changes', () => {
    const container = setupDOM();
    let log = [];
    const v1 = h('button', { onClick: () => log.push('old') });
    const btn = mount(v1, container);
    const v2 = h('button', { onClick: () => log.push('new') });
    patch(btn, v1, v2);
    btn.click();
    assert.deepStrictEqual(log, ['new']);
  });

  it('removes attribute when missing in new vnode', () => {
    const container = setupDOM();
    const v1 = h('div', { 'data-id': '42' });
    const el = mount(v1, container);
    const v2 = h('div', {});
    patch(el, v1, v2);
    assert.strictEqual(el.getAttribute('data-id'), null);
  });
});

// ---------------------------------------------------------------------------
// store tests
// ---------------------------------------------------------------------------
import { createStore } from '../framework/state/store.js';

describe('store – createStore()', () => {
  it('returns initial state', () => {
    const store = createStore({ x: 1 });
    assert.deepStrictEqual(store.getState(), { x: 1 });
  });

  it('notifies subscribers on dispatch', () => {
    const store = createStore({ n: 0 }, (s, a) => a.type === 'INC' ? { n: s.n + 1 } : s);
    let last;
    store.subscribe(s => { last = s; });
    store.dispatch({ type: 'INC' });
    assert.strictEqual(last.n, 1);
  });

  it('unsubscribe stops notifications', () => {
    const store = createStore({ n: 0 }, (s, a) => a.type === 'INC' ? { n: s.n + 1 } : s);
    let calls = 0;
    const unsub = store.subscribe(() => calls++);
    store.dispatch({ type: 'INC' });
    unsub();
    store.dispatch({ type: 'INC' });
    assert.strictEqual(calls, 1);
  });

  it('setState merges plain objects', () => {
    const store = createStore({ a: 1, b: 2 });
    store.setState({ b: 99 });
    assert.deepStrictEqual(store.getState(), { a: 1, b: 99 });
  });

  it('setState accepts updater functions', () => {
    const store = createStore({ count: 5 });
    store.setState(s => ({ count: s.count * 2 }));
    assert.strictEqual(store.getState().count, 10);
  });

  it('no notification when state reference unchanged', () => {
    const store = createStore({ n: 0 }, (s) => s);  // reducer always returns same ref
    let calls = 0;
    store.subscribe(() => calls++);
    store.dispatch({ type: 'NOOP' });
    assert.strictEqual(calls, 0);
  });
});

// ---------------------------------------------------------------------------
// router tests (hash-less, using mock window.location)
// ---------------------------------------------------------------------------
import { Router } from '../framework/router/router.js';

describe('router – Router', () => {
  it('navigate() sets window.location.hash', () => {
    const dom = new JSDOM('', { url: 'http://localhost/' });
    global.window = dom.window;
    global.document = dom.window.document;

    const router = new Router();
    router.navigate('/active');
    assert.strictEqual(dom.window.location.hash, '#/active');
  });

  it('getCurrentPath() returns "/" when no hash', () => {
    const dom = new JSDOM('', { url: 'http://localhost/' });
    global.window = dom.window;
    const router = new Router();
    assert.strictEqual(router.getCurrentPath(), '/');
  });

  it('getCurrentPath() returns path from hash', () => {
    const dom = new JSDOM('', { url: 'http://localhost/#/active' });
    global.window = dom.window;
    const router = new Router();
    assert.strictEqual(router.getCurrentPath(), '/active');
  });
});

// ---------------------------------------------------------------------------
// EventBus tests
// ---------------------------------------------------------------------------
import { EventBus, EventSystem } from '../framework/events/events.js';

describe('EventBus', () => {
  it('emits to registered handlers', () => {
    const bus = new EventBus();
    let received;
    bus.on('greet', data => { received = data; });
    bus.emit('greet', { name: 'Bob' });
    assert.deepStrictEqual(received, { name: 'Bob' });
  });

  it('supports multiple handlers per event', () => {
    const bus = new EventBus();
    const log = [];
    bus.on('ev', () => log.push(1));
    bus.on('ev', () => log.push(2));
    bus.emit('ev');
    assert.deepStrictEqual(log, [1, 2]);
  });

  it('unsubscribe removes a single handler', () => {
    const bus = new EventBus();
    const log = [];
    const off = bus.on('ev', () => log.push('A'));
    bus.on('ev', () => log.push('B'));
    off();
    bus.emit('ev');
    assert.deepStrictEqual(log, ['B']);
  });
});

describe('EventSystem', () => {
  it('on() attaches and fires handler', () => {
    const container = setupDOM();
    const btn = document.createElement('button');
    let called = false;
    EventSystem.on(btn, 'click', () => { called = true; });
    btn.click();
    assert.ok(called);
  });

  it('off() removes handler', () => {
    const container = setupDOM();
    const btn = document.createElement('button');
    let calls = 0;
    EventSystem.on(btn, 'click', () => calls++);
    EventSystem.off(btn, 'click');
    btn.click();
    assert.strictEqual(calls, 0);
  });

  it('once() fires only once', () => {
    const container = setupDOM();
    const btn = document.createElement('button');
    let calls = 0;
    EventSystem.once(btn, 'click', () => calls++);
    btn.click();
    btn.click();
    assert.strictEqual(calls, 1);
  });
});

// ---------------------------------------------------------------------------
// TodoMVC reducer tests (import reducer via app.js is awkward; test inline)
// ---------------------------------------------------------------------------
describe('TodoMVC reducer logic', () => {
  // Inline the reducer to test without a browser
  let _nextId = 1;
  function reducer(state, action) {
    switch (action.type) {
      case 'ADD_TODO':
        return { ...state, todos: [...state.todos, { id: _nextId++, text: action.payload, completed: false }] };
      case 'DELETE_TODO':
        return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
      case 'TOGGLE_TODO':
        return { ...state, todos: state.todos.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t) };
      case 'TOGGLE_ALL': {
        const allDone = state.todos.every(t => t.completed);
        return { ...state, todos: state.todos.map(t => ({ ...t, completed: !allDone })) };
      }
      case 'START_EDIT':
        return { ...state, editingId: action.payload };
      case 'SAVE_EDIT': {
        const text = action.payload.text.trim();
        return {
          ...state,
          editingId: null,
          todos: text
            ? state.todos.map(t => t.id === action.payload.id ? { ...t, text } : t)
            : state.todos.filter(t => t.id !== action.payload.id),
        };
      }
      case 'CANCEL_EDIT':
        return { ...state, editingId: null };
      case 'CLEAR_COMPLETED':
        return { ...state, todos: state.todos.filter(t => !t.completed) };
      case 'SET_FILTER':
        return { ...state, filter: action.payload };
      default:
        return state;
    }
  }

  const initialState = { todos: [], filter: 'all', editingId: null };

  it('ADD_TODO adds a todo', () => {
    const s = reducer(initialState, { type: 'ADD_TODO', payload: 'Buy milk' });
    assert.strictEqual(s.todos.length, 1);
    assert.strictEqual(s.todos[0].text, 'Buy milk');
    assert.strictEqual(s.todos[0].completed, false);
  });

  it('DELETE_TODO removes by id', () => {
    let s = reducer(initialState, { type: 'ADD_TODO', payload: 'Task' });
    const id = s.todos[0].id;
    s = reducer(s, { type: 'DELETE_TODO', payload: id });
    assert.strictEqual(s.todos.length, 0);
  });

  it('TOGGLE_TODO flips completed', () => {
    let s = reducer(initialState, { type: 'ADD_TODO', payload: 'Task' });
    const id = s.todos[0].id;
    s = reducer(s, { type: 'TOGGLE_TODO', payload: id });
    assert.strictEqual(s.todos[0].completed, true);
    s = reducer(s, { type: 'TOGGLE_TODO', payload: id });
    assert.strictEqual(s.todos[0].completed, false);
  });

  it('TOGGLE_ALL marks all complete, then all incomplete', () => {
    let s = reducer(initialState, { type: 'ADD_TODO', payload: 'A' });
    s = reducer(s, { type: 'ADD_TODO', payload: 'B' });
    s = reducer(s, { type: 'TOGGLE_ALL' });
    assert.ok(s.todos.every(t => t.completed));
    s = reducer(s, { type: 'TOGGLE_ALL' });
    assert.ok(s.todos.every(t => !t.completed));
  });

  it('SAVE_EDIT updates text', () => {
    let s = reducer(initialState, { type: 'ADD_TODO', payload: 'Old' });
    const id = s.todos[0].id;
    s = reducer(s, { type: 'START_EDIT', payload: id });
    assert.strictEqual(s.editingId, id);
    s = reducer(s, { type: 'SAVE_EDIT', payload: { id, text: 'New' } });
    assert.strictEqual(s.todos[0].text, 'New');
    assert.strictEqual(s.editingId, null);
  });

  it('SAVE_EDIT with empty text deletes the todo', () => {
    let s = reducer(initialState, { type: 'ADD_TODO', payload: 'Task' });
    const id = s.todos[0].id;
    s = reducer(s, { type: 'SAVE_EDIT', payload: { id, text: '   ' } });
    assert.strictEqual(s.todos.length, 0);
  });

  it('CANCEL_EDIT clears editingId', () => {
    let s = reducer({ ...initialState, editingId: 42 }, { type: 'CANCEL_EDIT' });
    assert.strictEqual(s.editingId, null);
  });

  it('CLEAR_COMPLETED removes only completed todos', () => {
    let s = reducer(initialState, { type: 'ADD_TODO', payload: 'Keep' });
    s = reducer(s, { type: 'ADD_TODO', payload: 'Delete me' });
    const deleteId = s.todos[1].id;
    s = reducer(s, { type: 'TOGGLE_TODO', payload: deleteId });
    s = reducer(s, { type: 'CLEAR_COMPLETED' });
    assert.strictEqual(s.todos.length, 1);
    assert.strictEqual(s.todos[0].text, 'Keep');
  });

  it('SET_FILTER updates the filter', () => {
    const s = reducer(initialState, { type: 'SET_FILTER', payload: 'active' });
    assert.strictEqual(s.filter, 'active');
  });
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
