/**
 * TodoItem.js
 *
 * Renders a single todo list item.
 *
 * States:
 *  • normal   – checkbox + label + destroy button
 *  • editing  – above + an <input class="edit"> with the current text
 *  • completed – the <li> gets the `completed` CSS class
 *
 * Editing behaviour:
 *  • Double-click the label → call onStartEdit(id)
 *  • Enter or blur          → call onSaveEdit(id, newText)
 *  • Escape                 → call onCancelEdit()
 */

import { h } from '../../framework/index.js';

/**
 * @param {{
 *   todo:          { id: number, text: string, completed: boolean },
 *   editing:       boolean,
 *   onToggle:      (id: number) => void,
 *   onDelete:      (id: number) => void,
 *   onStartEdit:   (id: number) => void,
 *   onSaveEdit:    (id: number, text: string) => void,
 *   onCancelEdit:  () => void,
 * }} props
 * @returns {VNode}
 */
export function TodoItem({ todo, editing, onToggle, onDelete, onStartEdit, onSaveEdit, onCancelEdit }) {
  const liClass = [
    todo.completed ? 'completed' : '',
    editing        ? 'editing'   : '',
  ].filter(Boolean).join(' ');

  function handleEditKeydown(e) {
    if (e.key === 'Enter') {
      onSaveEdit(todo.id, e.target.value);
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  }

  function handleEditBlur(e) {
    // Only save if we're still in editing mode (Escape sets editing=false
    // before the blur fires, so we guard against saving a cancelled edit).
    onSaveEdit(todo.id, e.target.value);
  }

  const viewDiv = h('div', { class: 'view' },
    h('input', {
      class: 'toggle',
      type: 'checkbox',
      checked: todo.completed,
      onChange: () => onToggle(todo.id),
    }),
    h('label', {
      onDblclick: () => onStartEdit(todo.id),
    }, todo.text),
    h('button', {
      class: 'destroy',
      onClick: () => onDelete(todo.id),
    }),
  );

  const children = [viewDiv];

  if (editing) {
    children.push(
      h('input', {
        class: 'edit',
        value: todo.text,
        autofocus: true,
        onKeydown: handleEditKeydown,
        onBlur: handleEditBlur,
      }),
    );
  }

  return h('li', { class: liClass }, ...children);
}
