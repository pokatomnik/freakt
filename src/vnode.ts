import type { VNode, Child, ComponentClass } from './types';

function normalizeChildren(items: Child[]): (VNode | string | number)[] {
  const result: (VNode | string | number)[] = [];
  for (const item of items) {
    if (item == null || typeof item === 'boolean') continue;
    if (Array.isArray(item)) {
      result.push(...normalizeChildren(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

export function render<P extends Record<string, unknown> = Record<string, unknown>>(
  tag: string | ComponentClass<P>,
  props: (P & { key?: string | number }) | null,
  ...children: Child[]
): VNode {
  const flatChildren = normalizeChildren(children);
  let key: string | number | null = null;
  let cleanProps: Record<string, unknown> | null = props as Record<string, unknown> | null;

  if (props && 'key' in props) {
    key = (props as Record<string, unknown>).key as string | number | null;
    const { key: _, ...rest } = props as Record<string, unknown>;
    cleanProps = Object.keys(rest).length > 0 ? rest : null;
  }

  return {
    tag,
    props: cleanProps,
    children: flatChildren,
    key,
    el: undefined,
    component: undefined,
  } as VNode;
}