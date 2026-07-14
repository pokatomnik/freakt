import type { VNode } from './types';

const EVENT_RE = /^on[A-Z]/;

function eventName(prop: string): string {
  return prop.slice(2).toLowerCase();
}

export function setProps(el: HTMLElement, props: Record<string, any> | null): void {
  if (!props) return;
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') {
      el.setAttribute('class', value);
    } else if (key === 'htmlFor') {
      el.setAttribute('for', value);
    } else if (EVENT_RE.test(key)) {
      const evt = eventName(key);
      el.addEventListener(evt, value);
      (el as any).__events ??= {};
      (el as any).__events[evt] = value;
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
  oldProps: Record<string, any> | null,
  newProps: Record<string, any> | null,
): void {
  const oldKeys = new Set(Object.keys(oldProps ?? {}));
  const newKeys = new Set(Object.keys(newProps ?? {}));
  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      if (EVENT_RE.test(key)) {
        const evt = eventName(key);
        (el as any).__events?.[evt] && el.removeEventListener(evt, (el as any).__events[evt]);
      } else if (key !== 'key') {
        el.removeAttribute(key === 'className' ? 'class' : key);
      }
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