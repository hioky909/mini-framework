/**
 * framework/index.js – Public API barrel export
 *
 * Import everything you need from here:
 *
 *   import { h, mount, patch, createStore, Router, EventBus } from '../framework/index.js';
 */

export { h, createTextVNode } from './core/vdom.js';
export { mount, patch, createElement } from './core/renderer.js';
export { Component } from './core/component.js';
export { createStore } from './state/store.js';
export { Router } from './router/router.js';
export { EventSystem, EventBus } from './events/events.js';
