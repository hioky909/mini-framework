/**
 * TodoList.js
 *
 * Renders the "main" section containing:
 *  • A "toggle all" checkbox
 *  • The <ul class="todo-list"> of TodoItem components
 *
 * Hidden when there are no todos.
 */

import { h } from '../../framework/index.js';
import { TodoItem } from './TodoItem.js';

/**
 * @param {{
 *   todos:        Array<{ id: number, text: string, completed: boolean }>,
 *   editingId:    number|null,
 *   onToggle:     (id: number) => void,
 *   onDelete:     (id: number) => void,
 *   onToggleAll:  () => void,
 *   onStartEdit:  (id: number) => void,
 *   onSaveEdit:   (id: number, text: string) => void,
 *   onCancelEdit: () => void,
 * }} props
 * @returns {VNode}
 */
export function TodoList({
  todos,
  editingId,
  onToggle,
  onDelete,
  onToggleAll,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}) {
  if (todos.length === 0) {
    // Return an empty placeholder so the patcher can diff against it
    return h('span', { class: 'todo-list-empty' });
  }

  const allCompleted = todos.every((t) => t.completed);

  const items = todos.map((todo) =>
    TodoItem({
      todo,
      editing: todo.id === editingId,
      onToggle,
      onDelete,
      onStartEdit,
      onSaveEdit,
      onCancelEdit,
    }),
  );

  return h('section', { class: 'main' },
    h('input', {
      id: 'toggle-all',
      class: 'toggle-all',
      type: 'checkbox',
      checked: allCompleted,
      onChange: onToggleAll,
    }),
    h('label', { htmlFor: 'toggle-all' }, 'Mark all as complete'),
    h('ul', { class: 'todo-list' }, ...items),
  );
}
