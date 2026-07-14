import type { VNode } from './types';

let updateQueue: FreaktComponent[] = [];
let isFlushScheduled = false;

function flushUpdateQueue(): void {
  isFlushScheduled = false;
  const queue = updateQueue.slice();
  updateQueue = [];
  for (const comp of queue) {
    if (comp.__mounted) {
      comp.__performUpdate();
    }
  }
}

export abstract class FreaktComponent<P extends Record<string, unknown> = Record<string, unknown>> {
  props!: P;
  __vnode: VNode | null = null;
  __mounted = false;
  __reconcile: ((oldV: VNode, newV: VNode) => void) | null = null;

  constructor(_props?: P) {
    let _state: unknown;
    Object.defineProperty(this, 'state', {
      get(): unknown { return _state; },
      set(v: unknown) {
        _state = v;
        this.__requestUpdate();
      },
      configurable: true,
      enumerable: true,
    });
    this.__autoBind();
  }

  private __autoBind(): void {
    const proto = Object.getPrototypeOf(this);
    const names = Object.getOwnPropertyNames(proto);
    for (const key of names) {
      if (key === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc && typeof desc.value === 'function') {
        (this as Record<string, unknown>)[key] = (desc.value as (...args: unknown[]) => unknown).bind(this);
      }
    }
  }

  __requestUpdate(): void {
    if (!this.__mounted) return;
    updateQueue.push(this);
    if (!isFlushScheduled) {
      isFlushScheduled = true;
      queueMicrotask(flushUpdateQueue);
    }
  }

  __performUpdate(): void {
    const newVNode = this.render();
    if (this.__vnode && this.__reconcile) {
      this.__reconcile(this.__vnode, newVNode);
    }
    this.__vnode = newVNode;
    this.onUpdate();
  }

  abstract render(): VNode;

  onUpdate(): void {}
  onMount(): void {}
  onUnmount(): void {}
}

export function makeReactive(comp: FreaktComponent): void {
  for (const key of Object.getOwnPropertyNames(comp)) {
    if (key === 'props' || key.startsWith('__')) continue;
    const desc = Object.getOwnPropertyDescriptor(comp, key) as PropertyDescriptor | undefined;
    if (!desc || typeof desc.value === 'function') continue;
    if (desc.get || desc.set) continue;
    let value = desc.value;
    Object.defineProperty(comp, key, {
      get(): unknown { return value; },
      set(v: unknown) { if (value !== v) { value = v; comp.__requestUpdate(); } },
      configurable: true,
      enumerable: true,
    });
  }
}