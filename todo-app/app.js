/**
 * app.js – TodoMVC application entry point
 *
 * Wires together:
 *  • The global store (state + reducer)
 *  • The hash router
 *  • The render loop (store change → diff → DOM patch)
 */

import { h, mount, patch, createStore, Router } from '../framework/index.js';
import { TodoHeader } from './components/TodoHeader.js';
import { TodoList   } from './components/TodoList.js';
import { TodoFooter } from './components/TodoFooter.js';

// ---------------------------------------------------------------------------
// Persisted state helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'mini-framework-todos';

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// ---------------------------------------------------------------------------
// State shape
//
//   todos     – Array<{ id: number, text: string, completed: boolean }>
//   filter    – 'all' | 'active' | 'completed'
//   editingId – number | null  (id of the todo currently being edited)
// ---------------------------------------------------------------------------

const initialState = {
  todos:     loadTodos(),
  filter:    'all',
  editingId: null,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, { id: Date.now(), text: action.payload, completed: false }],
      };

    case 'DELETE_TODO': {
      const todos = state.todos.filter((t) => t.id !== action.payload);
      return todos.length === state.todos.length ? state : { ...state, todos };
    }

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t,
        ),
      };

    case 'TOGGLE_ALL': {
      if (state.todos.length === 0) {
        return state;
      }

      const allDone = state.todos.every((t) => t.completed);
      return {
        ...state,
        todos: state.todos.map((t) => ({ ...t, completed: !allDone })),
      };
    }

    case 'START_EDIT':
      return { ...state, editingId: action.payload };

    case 'SAVE_EDIT': {
      const text = action.payload.text.trim();
      return {
        ...state,
        editingId: null,
        todos: text
          ? state.todos.map((t) =>
              t.id === action.payload.id ? { ...t, text } : t,
            )
          : state.todos.filter((t) => t.id !== action.payload.id),
      };
    }

    case 'CANCEL_EDIT':
      return { ...state, editingId: null };

    case 'CLEAR_COMPLETED': {
      const todos = state.todos.filter((t) => !t.completed);
      return todos.length === state.todos.length ? state : { ...state, todos };
    }

    case 'SET_FILTER':
      if (state.filter === action.payload) return state;
      return { ...state, filter: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Store + Router
// ---------------------------------------------------------------------------

const store = createStore(initialState, reducer);
const router = new Router();

// Map hash paths to filter values
const PATH_TO_FILTER = {
  '/':          'all',
  '/active':    'active',
  '/completed': 'completed',
};

router
  .on('/',          (p) => store.dispatch({ type: 'SET_FILTER', payload: PATH_TO_FILTER[p] }))
  .on('/active',    (p) => store.dispatch({ type: 'SET_FILTER', payload: PATH_TO_FILTER[p] }))
  .on('/completed', (p) => store.dispatch({ type: 'SET_FILTER', payload: PATH_TO_FILTER[p] }))
  .notFound(        ()  => router.navigate('/'));

// ---------------------------------------------------------------------------
// Action dispatchers (clean interface for components)
// ---------------------------------------------------------------------------

const actions = {
  addTodo:      (text)       => store.dispatch({ type: 'ADD_TODO',      payload: text }),
  deleteTodo:   (id)         => store.dispatch({ type: 'DELETE_TODO',   payload: id }),
  toggleTodo:   (id)         => store.dispatch({ type: 'TOGGLE_TODO',   payload: id }),
  toggleAll:    ()           => store.dispatch({ type: 'TOGGLE_ALL' }),
  startEdit:    (id)         => store.dispatch({ type: 'START_EDIT',    payload: id }),
  saveEdit:     (id, text)   => store.dispatch({ type: 'SAVE_EDIT',     payload: { id, text } }),
  cancelEdit:   ()           => store.dispatch({ type: 'CANCEL_EDIT' }),
  clearCompleted: ()         => store.dispatch({ type: 'CLEAR_COMPLETED' }),
};

// ---------------------------------------------------------------------------
// Render function – pure: state → VNode
// ---------------------------------------------------------------------------

function filterTodos(todos, filter) {
  switch (filter) {
    case 'active':    return todos.filter((t) => !t.completed);
    case 'completed': return todos.filter((t) =>  t.completed);
    default:          return todos;
  }
}

function summarizeTodos(todos) {
  let activeCount = 0;
  let completedCount = 0;

  for (const todo of todos) {
    if (todo.completed) {
      completedCount++;
    } else {
      activeCount++;
    }
  }

  return { activeCount, completedCount };
}

function AppView(state) {
  const visibleTodos = filterTodos(state.todos, state.filter);
  const { activeCount, completedCount } = summarizeTodos(state.todos);

  return h('section', { class: 'todoapp' },
    TodoHeader({ onAdd: actions.addTodo }),
    TodoList({
      todos:        visibleTodos,
      editingId:    state.editingId,
      onToggle:     actions.toggleTodo,
      onDelete:     actions.deleteTodo,
      onToggleAll:  actions.toggleAll,
      onStartEdit:  actions.startEdit,
      onSaveEdit:   actions.saveEdit,
      onCancelEdit: actions.cancelEdit,
    }),
    TodoFooter({
      activeCount,
      completedCount,
      currentFilter:    state.filter,
      onClearCompleted: actions.clearCompleted,
    }),
  );
}

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------

const container = document.getElementById('app');
let currentVnode = null;
let rootEl = null;

function render() {
  const state    = store.getState();
  const newVnode = AppView(state);

  if (!currentVnode) {
    rootEl = mount(newVnode, container);
  } else {
    rootEl = patch(rootEl, currentVnode, newVnode);
  }

  currentVnode = newVnode;

  // Persist todos to localStorage on every render
  saveTodos(state.todos);
}

// Re-render whenever state changes
store.subscribe(render);

// Initial render (also bootstraps the router which may dispatch SET_FILTER)
render();
