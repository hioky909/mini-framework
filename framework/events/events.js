/**
 * events.js – Custom Event System
 *
 * Provides two utilities:
 *
 * 1. `EventSystem` – Manages DOM event listeners via a clean API (wraps
 *    `addEventListener` / `removeEventListener`) and keeps references so that
 *    handlers can be cleanly removed without the caller needing to hold a
 *    reference.
 *
 * 2. `EventBus` – An application-level publish/subscribe channel decoupled
 *    from the DOM.  Useful for cross-component communication.
 *
 * NOTE: The renderer automatically calls EventSystem for event props on VNodes
 * (e.g. `onClick`).  You rarely need to call EventSystem directly in app code
 * – use VNode event props instead.  EventBus is for higher-level app events.
 */

// ---------------------------------------------------------------------------
// EventSystem – DOM-level helpers
// ---------------------------------------------------------------------------

export const EventSystem = {
  /**
   * Attaches `handler` for `event` on `el`.
   * If a handler for this event is already registered on `el` it is replaced.
   *
   * @param {HTMLElement} el
   * @param {string}      event   – DOM event name (e.g. 'click', 'input')
   * @param {Function}    handler
   */
  on(el, event, handler) {
    if (!el._events) el._events = {};
    // Remove previous handler for the same event (avoid double-registration)
    if (el._events[event]) {
      el.removeEventListener(event, el._events[event]);
    }
    el._events[event] = handler;
    el.addEventListener(event, handler);
  },

  /**
   * Removes the handler previously registered for `event` on `el`.
   *
   * @param {HTMLElement} el
   * @param {string}      event
   */
  off(el, event) {
    if (el._events?.[event]) {
      el.removeEventListener(event, el._events[event]);
      delete el._events[event];
    }
  },

  /**
   * Attaches a one-time handler.  It is automatically removed after it fires.
   *
   * @param {HTMLElement} el
   * @param {string}      event
   * @param {Function}    handler
   */
  once(el, event, handler) {
    const wrapper = (e) => {
      handler(e);
      EventSystem.off(el, event);
    };
    EventSystem.on(el, event, wrapper);
  },

  /**
   * Dispatches a custom DOM event with optional `detail` payload.
   * The event bubbles up the DOM tree.
   *
   * @param {HTMLElement} el
   * @param {string}      event
   * @param {*}           [detail]
   */
  emit(el, event, detail) {
    el.dispatchEvent(new CustomEvent(event, { bubbles: true, detail }));
  },

  /**
   * Removes all tracked event listeners from `el`.
   * Useful when manually removing a DOM node.
   *
   * @param {HTMLElement} el
   */
  cleanup(el) {
    if (!el._events) return;
    for (const [event, handler] of Object.entries(el._events)) {
      el.removeEventListener(event, handler);
    }
    delete el._events;
  },
};

// ---------------------------------------------------------------------------
// EventBus – application-level pub/sub
// ---------------------------------------------------------------------------

export class EventBus {
  constructor() {
    /** @private Map<string, Set<Function>> */
    this._handlers = new Map();
  }

  /**
   * Subscribes `handler` to `event`.
   *
   * @param {string}   event
   * @param {Function} handler – called with the event payload
   * @returns {Function} unsubscribe
   */
  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribes `handler` from `event`.
   *
   * @param {string}   event
   * @param {Function} handler
   */
  off(event, handler) {
    this._handlers.get(event)?.delete(handler);
  }

  /**
   * Emits `event`, calling all registered handlers with `data`.
   *
   * @param {string} event
   * @param {*}      [data]
   */
  emit(event, data) {
    this._handlers.get(event)?.forEach((fn) => fn(data));
  }
}
