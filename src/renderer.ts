import type { VNode, ComponentClass } from './types';
import { FreaktComponent, makeReactive } from './component';
import { setProps, updateProps } from './dom';
export function buildDOM(vnode: VNode): Node {
  if (typeof vnode.tag === 'function') return initComponent(vnode);
  const el = document.createElement(vnode.tag as string);
  setProps(el, vnode.props); vnode.el = el;
  for (const ch of vnode.children) {
    if (typeof ch === 'object') el.appendChild(buildDOM(ch as VNode));
    else el.appendChild(document.createTextNode(String(ch)));
  }
  return el;
}
function initComponent(vnode: VNode): Node {
  const Ctor = vnode.tag as ComponentClass;
  const comp = new Ctor(vnode.props ?? undefined);
  comp.props = (vnode.props ?? {}) as Record<string, unknown>;
  makeReactive(comp);
  const rendered = comp.render();
  comp.__vnode = rendered;
  comp.__reconcile = (oldV: VNode, newV: VNode) => {
    const p = oldV.el?.parentNode as HTMLElement;
    if (p) reconcile(p, oldV, newV);
  };
  vnode.component = comp;
  const el = buildDOM(rendered);
  rendered.el = el; comp.__mounted = true; comp.onMount();
  return el;
}
export function unmountVNode(vnode: VNode): void {
  if (vnode.component) { vnode.component.__mounted = false; vnode.component.onUnmount(); }
  vnode.el?.parentNode?.removeChild(vnode.el!);
}
export function reconcile(parentEl: Node, oldV: VNode | null, newV: VNode | null, idx?: number): void {
  const ref = idx != null ? parentEl.childNodes[idx] : null;
  if (!oldV && newV) { parentEl.insertBefore(buildDOM(newV), ref); return; }
  if (oldV && !newV) { unmountVNode(oldV); return; }
  if (!oldV || !newV) return;
  if (oldV.tag !== newV.tag) { unmountVNode(oldV); parentEl.insertBefore(buildDOM(newV), ref); return; }
  if (oldV.key !== newV.key) { unmountVNode(oldV); parentEl.insertBefore(buildDOM(newV), ref); return; }
  if (typeof oldV.tag === 'function') { updateComponent(oldV, newV); return; }
  newV.el = oldV.el!;
  updateProps(newV.el as HTMLElement, oldV.props, newV.props);
  reconcileChildren(newV.el as HTMLElement, oldV.children, newV.children);
}
function updateComponent(oldV: VNode, newV: VNode): void {
  const comp = oldV.component!;
  comp.props = newV.props ?? {}; newV.component = comp;
  const oldR = comp.__vnode!, newR = comp.render();
  comp.__vnode = newR;
  const p = oldR.el?.parentNode as HTMLElement;
  if (p) reconcile(p, oldR, newR);
  comp.onUpdate();
}
function reconcileChildren(parentEl: HTMLElement, oldC: any[], newC: any[]): void {
  const keyMap = new Map(), keyIdx = new Map();
  for (let i = 0; i < oldC.length; i++) {
    const c = oldC[i];
    if (typeof c === 'object' && (c as VNode).key != null)
      keyMap.set((c as VNode).key, c), keyIdx.set((c as VNode).key, i);
  }
  const used = new Set<string | number>();
  const max = Math.max(oldC.length, newC.length);
  for (let i = 0; i < max; i++) {
    const nc = newC[i], oc = oldC[i];
    if (nc == null) continue;
    const nk = typeof nc === 'object' ? (nc as VNode).key : null;
    const ok = typeof oc === 'object' ? (oc as VNode).key : null;
    if (nk != null && keyMap.has(nk)) {
      const kv = keyMap.get(nk) as VNode;
      used.add(nk);
      const de: Node | undefined = (kv as any).el || (kv as any).component?.__vnode?.el;
      if (de && keyIdx.get(nk) !== i) parentEl.insertBefore(de, parentEl.childNodes[i] ?? null);
      reconcile(parentEl, kv, nc as VNode, i);
    } else if (nk != null) {
      parentEl.insertBefore(typeof nc === 'object' ? buildDOM(nc) : document.createTextNode(String(nc)), parentEl.childNodes[i] ?? null);
    } else if (oc != null && ok != null && used.has(ok)) {
      parentEl.insertBefore(typeof nc === 'object' ? buildDOM(nc) : document.createTextNode(String(nc)), parentEl.childNodes[i] ?? null);
    } else if (typeof oc === 'object' && typeof nc === 'object') {
      reconcile(parentEl, oc, nc, i);
    } else if (typeof oc !== 'object' && typeof nc !== 'object') {
      if (String(oc ?? '') !== String(nc ?? '')) {
        parentEl.childNodes[i] ? parentEl.replaceChild(document.createTextNode(String(nc ?? '')), parentEl.childNodes[i]) : parentEl.appendChild(document.createTextNode(String(nc ?? '')));
      }
    } else if (typeof oc === 'object') {
      const ref = parentEl.childNodes[i]?.nextSibling ?? null;
      unmountVNode(oc); parentEl.insertBefore(document.createTextNode(String(nc ?? '')), ref);
    } else {
      const ref = parentEl.childNodes[i]?.nextSibling ?? null;
      if (parentEl.childNodes[i]) parentEl.removeChild(parentEl.childNodes[i]);
      parentEl.insertBefore(buildDOM(nc), ref);
    }
  }
  for (let i = oldC.length - 1; i >= 0; i--) {
    const oc = oldC[i], key = typeof oc === 'object' ? (oc as VNode).key : null;
    if (key != null && !used.has(key)) { if (typeof oc === 'object') unmountVNode(oc); }
    else if (key == null && i >= newC.length)
      { if (typeof oc === 'object') unmountVNode(oc); else if (parentEl.childNodes[i]) parentEl.removeChild(parentEl.childNodes[i]); }
  }
}