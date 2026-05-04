/**
 * store.js – Reactive Global State Store
 *
 * A lightweight Flux-inspired store.
 *
 * Usage (with reducer):
 *   const store = createStore({ count: 0 }, (state, action) => {
 *     if (action.type === 'INCREMENT') return { ...state, count: state.count + 1 };
 *     return state;
 *   });
 *
 *   store.subscribe(state => console.log(state));
 *   store.dispatch({ type: 'INCREMENT' });
 *
 * Usage (without reducer – simple object merge):
 *   const store = createStore({ user: null });
 *   store.setState({ user: { name: 'Alice' } });
 */

/**
 * Creates a reactive state store.
 *
 * @param {Object}    initialState  – Starting state snapshot
 * @param {Function}  [reducer]     – Optional reducer: (state, action) => newState.
 *                                    When omitted, `dispatch` performs a shallow merge.
 * @returns {{
 *   getState: () => Object,
 *   dispatch: (action: Object) => void,
 *   setState: (updater: Object|Function) => void,
 *   subscribe: (listener: Function) => Function
 * }}
 */
export function createStore(initialState, reducer) {
  let state = { ...initialState };
  const listeners = new Set();

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Returns the current (immutable-by-convention) state snapshot. */
  function getState() {
    return state;
  }

  /**
   * Dispatches an action object through the reducer.
   * If no reducer was provided the action object is shallow-merged into state.
   *
   * @param {Object} action – Must have a `type` string when using a reducer.
   */
  function dispatch(action) {
    if (reducer) {
      const next = reducer(state, action);
      if (next !== state) {
        state = next;
        notifyAll();
      }
    } else {
      state = { ...state, ...action };
      notifyAll();
    }
  }

  /**
   * Directly sets / merges state without going through a reducer.
   * Accepts a plain object or an updater function.
   *
   * @param {Object|Function} updater
   */
  function setState(updater) {
    const next =
      typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    if (next !== state) {
      state = next;
      notifyAll();
    }
  }

  /**
   * Registers a listener that is called with the new state after every change.
   *
   * @param {Function} listener – called as listener(newState)
   * @returns {Function} unsubscribe – call to remove this listener
   */
  function subscribe(listener) {
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  function notifyAll() {
    listeners.forEach((fn) => fn(state));
  }

  return { getState, dispatch, setState, subscribe };
}
