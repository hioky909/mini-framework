/**
 * renderer.js – DOM Renderer & Patcher
 *
 * Responsibilities:
 *  • mount(vnode, container) – First render: create real DOM from a VNode tree
 *    and append it to `container`.
 *  • patch(el, oldVnode, newVnode) – Subsequent renders: diff the two VNode
 *    trees and apply the minimal set of DOM mutations to bring `el` in sync
 *    with `newVnode`.
 *
 * Event listeners are stored on each DOM node under `node._events` so that
 * we can remove old handlers before attaching updated ones without leaking.
 */

// ---------------------------------------------------------------------------
// DOM creation
// ---------------------------------------------------------------------------

/**
 * Builds a real DOM node from a VNode (no diffing – used only on first render
 * or when a node must be fully replaced).
 * @param {VNode} vnode
 * @returns {Node}
 */
export function createElement(vnode) {
  if (vnode.tag === '#text') {
    return document.createTextNode(vnode.value);
  }

  const el = document.createElement(vnode.tag);

  // Attach attributes / events
  applyAttrs(el, vnode.attrs);

  // Recursively build children
  for (const child of vnode.children) {
    el.appendChild(createElement(child));
  }

  return el;
}

/**
 * Applies all attributes from `attrs` onto `el` from scratch.
 * Called when the element is first created.
 */
function applyAttrs(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    applyAttr(el, key, value);
  }
}

/**
 * Sets a single attribute or event listener on `el`.
 */
function applyAttr(el, key, value) {
  if (isEventKey(key)) {
    const event = eventName(key);
    if (!el._events) el._events = {};
    el._events[event] = value;
    el.addEventListener(event, value);
    return;
  }

  switch (key) {
    case 'class':
    case 'className':
      el.className = value || '';
      break;
    case 'htmlFor':
      el.htmlFor = value;
      break;
    case 'checked':
      el.checked = !!value;
      break;
    case 'value':
      el.value = value != null ? value : '';
      break;
    case 'autofocus':
      if (value) {
        // Defer so the element is in the DOM first
        setTimeout(() => el.focus(), 0);
      }
      break;
    default:
      if (value === false || value === null || value === undefined) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, String(value));
      }
  }
}

// ---------------------------------------------------------------------------
// DOM patching (diffing)
// ---------------------------------------------------------------------------

/**
 * Updates `el` in place to reflect `newVnode`, given it currently reflects
 * `oldVnode`. Returns the (possibly new) DOM node that replaced `el`.
 *
 * @param {Node}   el       – current real DOM node
 * @param {VNode}  oldVnode – the VNode that produced `el`
 * @param {VNode}  newVnode – the desired new VNode
 * @returns {Node} the updated (or replaced) DOM node
 */
export function patch(el, oldVnode, newVnode) {
  // Identical references – nothing to do
  if (oldVnode === newVnode) return el;

  // Different tag → replace entire subtree
  if (oldVnode.tag !== newVnode.tag) {
    const newEl = createElement(newVnode);
    el.parentNode.replaceChild(newEl, el);
    return newEl;
  }

  // Text node update
  if (newVnode.tag === '#text') {
    if (oldVnode.value !== newVnode.value) {
      el.nodeValue = newVnode.value;
    }
    return el;
  }

  // Update attributes
  updateAttrs(el, oldVnode.attrs, newVnode.attrs);

  // Recursively diff children
  patchChildren(el, oldVnode.children, newVnode.children);

  return el;
}

/**
 * Diffs the children of `el` between `oldChildren` and `newChildren`.
 * Strategy: compare by index (simple O(n) diff without keys).
 */
function patchChildren(el, oldChildren, newChildren) {
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
  const min = Math.min(oldLen, newLen);

  // 1. Patch shared slots
  for (let i = 0; i < min; i++) {
    patch(el.childNodes[i], oldChildren[i], newChildren[i]);
  }

  // 2. Append new children
  for (let i = oldLen; i < newLen; i++) {
    el.appendChild(createElement(newChildren[i]));
  }

  // 3. Remove surplus old children (remove from end to keep indices stable)
  for (let i = oldLen - 1; i >= newLen; i--) {
    el.removeChild(el.childNodes[i]);
  }
}

/**
 * Brings `el`'s attributes in sync from `oldAttrs` to `newAttrs`.
 */
function updateAttrs(el, oldAttrs, newAttrs) {
  // Remove attributes / handlers that no longer exist
  for (const key of Object.keys(oldAttrs)) {
    if (key in newAttrs) continue;

    if (isEventKey(key)) {
      const event = eventName(key);
      if (el._events?.[event]) {
        el.removeEventListener(event, el._events[event]);
        delete el._events[event];
      }
    } else if (key === 'class' || key === 'className') {
      el.className = '';
    } else if (key === 'checked') {
      el.checked = false;
    } else {
      el.removeAttribute(key);
    }
  }

  // Add / update attributes
  for (const [key, value] of Object.entries(newAttrs)) {
    if (isEventKey(key)) {
      const event = eventName(key);
      if (!el._events) el._events = {};
      const oldHandler = oldAttrs[key];
      if (oldHandler !== value) {
        if (oldHandler) el.removeEventListener(event, el._events[event]);
        el.addEventListener(event, value);
        el._events[event] = value;
      }
      continue;
    }

    switch (key) {
      case 'class':
      case 'className': {
        const cls = value || '';
        if (el.className !== cls) el.className = cls;
        break;
      }
      case 'htmlFor':
        if (el.htmlFor !== value) el.htmlFor = value;
        break;
      case 'checked':
        if (el.checked !== !!value) el.checked = !!value;
        break;
      case 'value': {
        const v = value != null ? String(value) : '';
        // Never overwrite a focused input (the user might be typing)
        if (document.activeElement !== el && el.value !== v) {
          el.value = v;
        }
        break;
      }
      case 'autofocus':
        // Only focus when the attribute is newly added
        if (value && !oldAttrs[key]) {
          setTimeout(() => el.focus(), 0);
        }
        break;
      default: {
        const oldVal = oldAttrs[key];
        if (oldVal === value) break;
        if (value === false || value === null || value === undefined) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, String(value));
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

/**
 * Performs the first render: creates a DOM tree from `vnode` and appends it
 * to `container`. Returns the root DOM element.
 *
 * @param {VNode}       vnode
 * @param {HTMLElement} container
 * @returns {Node}
 */
export function mount(vnode, container) {
  const el = createElement(vnode);
  container.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if `key` looks like an event prop (e.g. 'onClick'). */
function isEventKey(key) {
  return key.startsWith('on') && key.length > 2 && key[2] === key[2].toUpperCase();
}

/** Converts an event prop key to a DOM event name (e.g. 'onClick' → 'click'). */
function eventName(key) {
  return key.slice(2).toLowerCase();
}
