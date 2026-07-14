type HandlerOf<T> = T extends (...args: infer A) => unknown ? (...args: A) => void : never;

type GlobalHandlers = {
  [K in keyof GlobalEventHandlers as K extends `on${string}` ? K : never]?: HandlerOf<NonNullable<GlobalEventHandlers[K]>>;
};

type Attrs = GlobalHandlers & {
  className?: string;
  id?: string;
  style?: string;
  hidden?: boolean;
  title?: string;
  tabIndex?: number;
  key?: string | number;
};

export type IntrinsicProps = {
  div: Attrs;
  span: Attrs;
  p: Attrs;
  h1: Attrs;
  h2: Attrs;
  h3: Attrs;
  b: Attrs;
  i: Attrs;
  u: Attrs;
  em: Attrs;
  strong: Attrs;
  ul: Attrs;
  li: Attrs;
  br: Attrs;

  a: Attrs & { href?: string; target?: string };
  label: Attrs & { htmlFor?: string };
  img: Attrs & { src?: string; alt?: string };

  input: Attrs & { value?: string; disabled?: boolean; placeholder?: string; type?: string; checked?: boolean; readOnly?: boolean; name?: string };
  button: Attrs & { disabled?: boolean; type?: string; value?: string; name?: string };
  textarea: Attrs & { value?: string; disabled?: boolean; placeholder?: string; rows?: number; cols?: number; name?: string };
  select: Attrs & { disabled?: boolean; value?: string; name?: string };
  option: Attrs & { disabled?: boolean; value?: string; selected?: boolean; label?: string };
};