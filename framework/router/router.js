/**
 * router.js – Hash-based client-side Router
 *
 * Maps URL hash fragments (e.g. `#/active`) to handler callbacks and
 * notifies subscribers whenever the active route changes.
 *
 * Usage:
 *   const router = new Router();
 *
 *   router
 *     .on('/',          () => showAllTodos())
 *     .on('/active',    () => showActiveTodos())
 *     .on('/completed', () => showCompletedTodos())
 *     .notFound(        () => navigate('/'));
 *
 *   // React to any route change (e.g. to sync state)
 *   router.onChange(path => store.dispatch({ type: 'SET_FILTER', payload: path }));
 *
 *   // Programmatic navigation
 *   router.navigate('/active');
 */

export class Router {
  constructor() {
    /** @private Map<string, Function> */
    this._routes = new Map();
    /** @private Function[] */
    this._changeListeners = [];
    /** @private Function|null */
    this._notFoundHandler = null;

    // Bootstrap routing on load and on every hash change
    window.addEventListener('hashchange', () => this._handleRoute());
    window.addEventListener('load', () => this._handleRoute());
  }

  // ---------------------------------------------------------------------------
  // Route registration
  // ---------------------------------------------------------------------------

  /**
   * Registers a route handler.
   *
   * @param {string}   path    – Hash path WITHOUT the `#` sign (e.g. '/', '/active')
   * @param {Function} handler – Called with `(path)` when the route is activated
   * @returns {Router} this – for chaining
   */
  on(path, handler) {
    this._routes.set(path, handler);
    return this;
  }

  /**
   * Registers a catch-all handler for unmatched routes.
   *
   * @param {Function} handler
   * @returns {Router} this
   */
  notFound(handler) {
    this._notFoundHandler = handler;
    return this;
  }

  // ---------------------------------------------------------------------------
  // Listeners
  // ---------------------------------------------------------------------------

  /**
   * Subscribes to every route change.
   *
   * @param {Function} listener – Called with `(path)` after the route changes
   * @returns {Function} unsubscribe
   */
  onChange(listener) {
    this._changeListeners.push(listener);
    return () => {
      this._changeListeners = this._changeListeners.filter((l) => l !== listener);
    };
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigates to `path` by setting `window.location.hash`.
   *
   * @param {string} path – e.g. '/active'
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Returns the current route path (without the leading `#`).
   * Defaults to `'/'` when no hash is present.
   *
   * @returns {string}
   */
  getCurrentPath() {
    const hash = window.location.hash;
    return hash ? hash.slice(1) : '/';
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  _handleRoute() {
    const path = this.getCurrentPath();
    const handler = this._routes.get(path) ?? this._notFoundHandler;

    if (handler) {
      handler(path);
    }

    this._changeListeners.forEach((fn) => fn(path));
  }
}
