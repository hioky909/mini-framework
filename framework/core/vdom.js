/**
 * vdom.js – Virtual DOM node creation
 *
 * A VNode is a plain JavaScript object describing what should appear on screen.
 * The renderer converts VNodes to real DOM nodes, and the patcher diffs old
 * against new VNodes to apply the minimum set of DOM mutations.
 */

/**
 * Creates a Virtual DOM element node.
 *
 * @param {string|Function} tag   – HTML tag name (e.g. 'div') or a component function
 * @param {Object|null}     attrs – Attributes and event handlers (e.g. { class: 'foo', onClick: fn })
 * @param {...any}          children – Child VNodes, strings, numbers, arrays, or null/false (ignored)
 * @returns {VNode}
 */
export function h(tag, attrs, ...children) {
  // Functional components: call the function and return its VNode
  if (typeof tag === 'function') {
    return tag(attrs || {}, children.flat());
  }

  const normalizedChildren = flattenChildren(children);

  return {
    tag,
    attrs: attrs || {},
    children: normalizedChildren,
  };
}

/**
 * Creates a text VNode.
 * @param {string} text
 * @returns {VNode}
 */
export function createTextVNode(text) {
  return { tag: '#text', value: String(text), attrs: {}, children: [] };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function flattenChildren(children) {
  const result = [];
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === true) {
      // Intentionally skip falsy placeholders
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      result.push(createTextVNode(String(child)));
    } else {
      result.push(child);
    }
  }
  return result;
}
