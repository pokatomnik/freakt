import type { VNode } from './types';
import type { FreaktComponent } from './component';
import { buildDOM } from './renderer';

export function mount(root: HTMLElement, vnode: VNode): () => void {
  let isUnmounted = false;
  const el = buildDOM(vnode);
  root.appendChild(el);

  return function unmount(): void {
    if (isUnmounted) return;
    isUnmounted = true;
    if (vnode.component) {
      walkComponents(vnode.component, (c) => {
        c.__mounted = false;
        c.onUnmount();
      });
    }
    root.innerHTML = '';
  };
}

function walkComponents(comp: FreaktComponent, fn: (c: FreaktComponent) => void): void {
  fn(comp);
  if (!comp.__vnode) return;
  scanVNode(comp.__vnode, fn);
}

function scanVNode(vnode: VNode, fn: (c: FreaktComponent) => void): void {
  if (vnode.component) {
    walkComponents(vnode.component, fn);
  }
  for (const child of vnode.children) {
    if (typeof child === 'object') {
      scanVNode(child as VNode, fn);
    }
  }
}