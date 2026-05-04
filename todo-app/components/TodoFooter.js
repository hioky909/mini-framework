/**
 * TodoFooter.js
 *
 * Renders:
 *  • Item count ("N item(s) left")
 *  • Filter links (All / Active / Completed) – selected one gets class `selected`
 *  • "Clear completed" button (visible only when there are completed todos)
 *
 * Hidden when there are no todos.
 */

import { h } from '../../framework/index.js';

/**
 * @param {{
 *   activeCount:      number,
 *   completedCount:   number,
 *   currentFilter:    'all'|'active'|'completed',
 *   onClearCompleted: () => void,
 * }} props
 * @returns {VNode}
 */
export function TodoFooter({ activeCount, completedCount, currentFilter, onClearCompleted }) {
  const totalCount = activeCount + completedCount;
  if (totalCount === 0) {
    return h('span', { class: 'todo-footer-empty' });
  }

  const itemWord = activeCount === 1 ? 'item' : 'items';

  const filters = [
    { label: 'All',       path: '#/',          key: 'all'       },
    { label: 'Active',    path: '#/active',    key: 'active'    },
    { label: 'Completed', path: '#/completed', key: 'completed' },
  ];

  const filterLinks = filters.map(({ label, path, key }) =>
    h('li', {},
      h('a', {
        href: path,
        class: currentFilter === key ? 'selected' : '',
      }, label),
    ),
  );

  const clearButton = completedCount > 0
    ? h('button', { class: 'clear-completed', onClick: onClearCompleted }, 'Clear completed')
    : h('span', {});  // empty placeholder keeps child count stable

  return h('footer', { class: 'footer' },
    h('span', { class: 'todo-count' },
      h('strong', {}, String(activeCount)),
      ` ${itemWord} left`,
    ),
    h('ul', { class: 'filters' }, ...filterLinks),
    clearButton,
  );
}
