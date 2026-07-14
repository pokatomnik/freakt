import type { VNode } from './types';

export function setProps(el: HTMLElement, props: Record<string, unknown> | null): void {
  if (!props) return;
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') {
      el.setAttribute('class', String(value));
    } else if (key === 'htmlFor') {
      el.setAttribute('for', String(value));
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value as EventListener);
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
      else el.removeAttribute(key);
    } else if (value != null) {
      el.setAttribute(key, String(value));
    }
  }
}

export function updateProps(
  el: HTMLElement,
  oldProps: Record<string, unknown> | null,
  newProps: Record<string, unknown> | null,
): void {
  const oldKeys = new Set(Object.keys(oldProps ?? {}));
  const newKeys = new Set(Object.keys(newProps ?? {}));

  for (const key of oldKeys) {
    const isEvent = key.startsWith('on') && key.length > 2;
    if (isEvent && typeof oldProps![key] === 'function') {
      el.removeEventListener(key.slice(2), oldProps![key] as EventListener);
    } else if (!newKeys.has(key) && key !== 'key') {
      el.removeAttribute(key === 'className' ? 'class' : key);
    }
  }
  setProps(el, newProps);
}

export function createDOM(vnode: VNode): Node {
  const el = document.createElement(vnode.tag as string);
  setProps(el, vnode.props);
  vnode.el = el;
  for (const child of vnode.children) {
    if (typeof child === 'object') {
      el.appendChild(createDOM(child as VNode));
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }
  return el;
}