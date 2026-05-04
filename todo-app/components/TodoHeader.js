/**
 * TodoHeader.js
 *
 * Renders the page heading and the "new todo" input.
 * Pressing Enter with non-blank text calls `props.onAdd(text)`.
 */

import { h } from '../../framework/index.js';

/**
 * @param {{ onAdd: (text: string) => void }} props
 * @returns {VNode}
 */
export function TodoHeader({ onAdd }) {
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text) {
        onAdd(text);
        e.target.value = '';
      }
    }
  }

  return h('header', { class: 'header' },
    h('h1', {}, 'todos'),
    h('input', {
      class: 'new-todo',
      placeholder: 'What needs to be done?',
      autofocus: true,
      onKeydown: handleKeydown,
    }),
  );
}
