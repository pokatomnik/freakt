import type { FreaktComponent } from './component';

export type ComponentClass<P extends Record<string, unknown> = Record<string, unknown>> = new (props?: P) => FreaktComponent<P>;

export interface VNode {
  tag: string | ComponentClass;
  props: Record<string, unknown> | null;
  children: (VNode | string | number)[];
  key: string | number | null;
  el?: Node;
  component?: FreaktComponent;
}

export type Child = VNode | string | number | null | undefined | boolean | Child[];
export type Children = Child | Child[];