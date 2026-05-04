/**
 * component.js – Base Component class
 *
 * Components encapsulate a piece of UI.  They have:
 *  • props  – immutable data passed by the parent
 *  • state  – internal mutable data; changes trigger a re-render
 *
 * Usage:
 *   class MyButton extends Component {
 *     render() {
 *       return h('button', { onClick: () => this.setState({ count: this.state.count + 1 }) },
 *         `Clicked ${this.state.count} times`);
 *     }
 *   }
 *
 *   const btn = new MyButton({ label: 'Click me' });
 *   btn._mount(document.getElementById('app'));
 */

import { mount, patch } from './renderer.js';

export class Component {
  /**
   * @param {Object} props – initial props
   */
  constructor(props = {}) {
    this.props = props;
    this.state = {};

    /** @private */
    this._vnode = null;
    /** @private */
    this._el = null;
    /** @private */
    this._mounted = false;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Merges `partialState` into `this.state` and schedules a re-render.
   *
   * @param {Object|Function} partialState – plain object OR updater fn(prevState) => newState
   */
  setState(partialState) {
    const update =
      typeof partialState === 'function' ? partialState(this.state) : partialState;
    this.state = { ...this.state, ...update };
    if (this._mounted) {
      this._update();
    }
  }

  /**
   * Override to define what this component renders.
   * Must return a VNode (result of calling `h()`).
   * @returns {VNode}
   */
  render() {
    throw new Error(`${this.constructor.name} must implement render()`);
  }

  /**
   * Optional lifecycle hook – called once after the component is first
   * inserted into the DOM.
   */
  onMount() {}

  // ---------------------------------------------------------------------------
  // Framework-internal
  // ---------------------------------------------------------------------------

  /**
   * First render: builds the VNode, creates real DOM, appends to `container`.
   * @param {HTMLElement} container
   */
  _mount(container) {
    this._vnode = this.render();
    this._el = mount(this._vnode, container);
    this._mounted = true;
    this.onMount();
  }

  /**
   * Re-render: diffs the new VNode against the previous one and patches the DOM.
   */
  _update() {
    const newVnode = this.render();
    this._el = patch(this._el, this._vnode, newVnode);
    this._vnode = newVnode;
  }
}
