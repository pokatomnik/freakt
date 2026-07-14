import { describe, it, expect, vi } from 'vitest';
import { buildDOM, unmountVNode, reconcile } from '../src/renderer';
import { render } from '../src/vnode';
import { FreaktComponent } from '../src/component';
import type { VNode } from '../src/types';

class SimpleComp extends FreaktComponent {
  render(): VNode {
    return render('b', { className: 'bold' }, 'text');
  }
}

class StatefulComp extends FreaktComponent {
  state = 'initial';

  setVal(v: string): void { this.state = v; }

  render(): VNode {
    return render('span', { className: 'val' }, this.state);
  }
}

describe('buildDOM', () => {
  it('creates DOM from string tag vnode', () => {
    const vn = render('div', { className: 'root' }, 'hello');
    const el = buildDOM(vn) as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.textContent).toBe('hello');
  });

  it('mounts component and returns its DOM', () => {
    const vn = render(SimpleComp, null);
    const el = buildDOM(vn) as HTMLElement;
    expect(el.tagName).toBe('B');
    expect(el.textContent).toBe('text');
  });

  it('sets vnode.el on built nodes', () => {
    const vn = render('p', null, 'test');
    buildDOM(vn);
    expect(vn.el).toBeDefined();
  });

  it('sets component ref on vnode', () => {
    const vn = render(SimpleComp, null);
    buildDOM(vn);
    expect(vn.component).toBeInstanceOf(SimpleComp);
  });

  it('calls onMount on component', () => {
    const spy = vi.fn();
    class SpyComp extends FreaktComponent {
      onMount(): void { spy(); }
      render(): VNode { return render('i', null); }
    }
    buildDOM(render(SpyComp, null));
    expect(spy).toHaveBeenCalledOnce();
  });

  it('creates nested DOM structure', () => {
    const vn = render('div', null,
      render('ul', null,
        render('li', null, 'a'),
      ),
    );
    const el = buildDOM(vn) as HTMLElement;
    expect(el.querySelector('li')?.textContent).toBe('a');
  });
});

describe('unmountVNode', () => {
  it('removes element from parent', () => {
    const parent = document.createElement('div');
    const vn = render('span', null, 'x');
    const el = buildDOM(vn) as HTMLElement;
    parent.appendChild(el);
    unmountVNode(vn);
    expect(parent.children).toHaveLength(0);
  });

  it('calls onUnmount on component', () => {
    const spy = vi.fn();
    class UC extends FreaktComponent {
      onUnmount(): void { spy(); }
      render(): VNode { return render('u', null); }
    }
    const parent = document.createElement('div');
    const vn = render(UC, null);
    const el = buildDOM(vn);
    parent.appendChild(el);
    unmountVNode(vn);
    expect(spy).toHaveBeenCalledOnce();
    expect(vn.component!.__mounted).toBe(false);
  });
});

describe('reconcile', () => {
  it('patches text content change', () => {
    const parent = document.createElement('div');
    const oldVn = render('p', null, 'old');
    const newVn = render('p', null, 'new');
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('new');
  });

  it('replaces different tags', () => {
    const parent = document.createElement('div');
    const oldVn = render('span', null, 'a');
    const newVn = render('div', null, 'b');
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.children[0].tagName).toBe('DIV');
    expect(parent.textContent).toBe('b');
  });

  it('removes node when new is null', () => {
    const parent = document.createElement('div');
    const vn = render('span', null, 'x');
    parent.appendChild(buildDOM(vn));
    reconcile(parent, vn, null);
    expect(parent.children).toHaveLength(0);
  });

  it('adds node when old is null', () => {
    const parent = document.createElement('div');
    const vn = render('span', null, 'new');
    reconcile(parent, null, vn);
    expect(parent.children[0].tagName).toBe('SPAN');
  });

  it('updates component on reconcile', () => {
    const parent = document.createElement('div');
    const oldVn = render(StatefulComp, null);
    parent.appendChild(buildDOM(oldVn));
    const newVn = render(StatefulComp, {});
    reconcile(parent, oldVn, newVn);
    expect(newVn.component).toBe(oldVn.component);
  });

  it('preserves existing DOM node on same tag', () => {
    const parent = document.createElement('div');
    const oldVn = render('span', { className: 'a' }, 't');
    const newVn = render('span', { className: 'b' }, 't');
    parent.appendChild(buildDOM(oldVn));
    const oldEl = parent.children[0];
    reconcile(parent, oldVn, newVn);
    expect(parent.children[0]).toBe(oldEl);
  });

  it('reconciles VNode children', () => {
    const parent = document.createElement('div');
    const oldVn = render('ul', null,
      render('li', { key: '1' }, 'a'),
      render('li', { key: '2' }, 'b'),
    );
    const newVn = render('ul', null,
      render('li', { key: '1' }, 'a-upd'),
      render('li', { key: '2' }, 'b-upd'),
    );
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('a-updb-upd');
  });

  it('replaces element child with text', () => {
    const parent = document.createElement('div');
    const oldVn = render('div', null, render('span', null, 'was-el'));
    const newVn = render('div', null, 'now-text');
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('now-text');
  });

  it('replaces text child with element', () => {
    const parent = document.createElement('div');
    const oldVn = render('div', null, 'was-text');
    const newVn = render('div', null, render('span', null, 'now-el'));
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    const span = parent.querySelector('span');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('now-el');
  });

  it('component state change triggers reconcile in DOM', async () => {
    class SC extends FreaktComponent {
      state = 'start';
      setVal(v: string): void { this.state = v; }
      render(): VNode { return render('em', null, this.state); }
    }
    const parent = document.createElement('div');
    const vn = render(SC, null);
    parent.appendChild(buildDOM(vn));
    const comp = vn.component as SC;
    expect(parent.textContent).toBe('start');
    comp.setVal('changed');
    await new Promise(r => setTimeout(r, 10));
    expect(parent.textContent).toBe('changed');
  });

  it('appends new children at end', () => {
    const parent = document.createElement('div');
    const oldVn = render('div', null, render('span', null, 'first'));
    const newVn = render('div', null,
      render('span', null, 'first'),
      render('b', null, 'second'),
    );
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.children[0].children).toHaveLength(2);
    expect(parent.textContent).toBe('firstsecond');
  });

  it('adds text child where none existed', () => {
    const parent = document.createElement('div');
    const oldVn = render('p', null);
    const newVn = render('p', null, 'added');
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('added');
  });

  it('does nothing when both old and new are null', () => {
    const parent = document.createElement('div');
    reconcile(parent, null, null);
    expect(parent.children).toHaveLength(0);
  });

  it('updates component with null props', () => {
    const parent = document.createElement('div');
    const oldVn = render(StatefulComp, null);
    parent.appendChild(buildDOM(oldVn));
    const newVn = render(StatefulComp, null);
    reconcile(parent, oldVn, newVn);
    expect(newVn.component).toBe(oldVn.component);
    expect(parent.textContent).toBe('initial');
  });

  it('keyed: removes child from middle', () => {
    const parent = document.createElement('div');
    const oldVn = render('ul', null,
      render('li', { key: 'a' }, 'A'),
      render('li', { key: 'b' }, 'B'),
      render('li', { key: 'c' }, 'C'),
    );
    const newVn = render('ul', null,
      render('li', { key: 'a' }, 'A'),
      render('li', { key: 'c' }, 'C'),
    );
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('AC');
    expect(parent.querySelectorAll('li')).toHaveLength(2);
  });

  it('keyed: adds child at beginning', () => {
    const parent = document.createElement('div');
    const oldVn = render('ul', null,
      render('li', { key: 'b' }, 'B'),
      render('li', { key: 'c' }, 'C'),
    );
    const newVn = render('ul', null,
      render('li', { key: 'a' }, 'A'),
      render('li', { key: 'b' }, 'B'),
      render('li', { key: 'c' }, 'C'),
    );
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('ABC');
    expect(parent.querySelectorAll('li')).toHaveLength(3);
  });

  it('keyed: preserves component identity on reorder', () => {
    class Item extends FreaktComponent {
      render(): VNode { return render('span', null, 'item'); }
    }
    const parent = document.createElement('div');
    const oldVn = render('div', null,
      render(Item, { key: 'first' }),
      render(Item, { key: 'second' }),
    );
    parent.appendChild(buildDOM(oldVn));
    const comps = oldVn.children.map(c => (c as VNode).component);
    const newVn = render('div', null,
      render(Item, { key: 'second' }),
      render(Item, { key: 'first' }),
    );
    reconcile(parent, oldVn, newVn);
    expect((newVn.children[0] as VNode).component).toBe(comps[1]);
    expect((newVn.children[1] as VNode).component).toBe(comps[0]);
  });

  it('non-keyed uses simple reconcile path', () => {
    const parent = document.createElement('div');
    const oldVn = render('div', null,
      render('span', null, 'a'),
      render('span', null, 'b'),
    );
    const newVn = render('div', null,
      render('span', null, 'x'),
      render('span', null, 'y'),
    );
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('xy');
  });

  it('keyed: replaces element child with non-keyed text', () => {
    const parent = document.createElement('div');
    const oldVn = render('div', null,
      render('b', { key: 'bold' }, 'bold'),
      render('i', { key: 'italic' }, 'italic'),
    );
    const newVn = render('div', null,
      'just text',
      render('i', { key: 'italic' }, 'italic'),
    );
    parent.appendChild(buildDOM(oldVn));
    reconcile(parent, oldVn, newVn);
    expect(parent.textContent).toBe('just textitalic');
    expect(parent.querySelector('b')).toBeNull();
  });

  it('key change recreates component', () => {
    const logs: string[] = [];
    class KC extends FreaktComponent {
      onMount(): void { logs.push('mount'); }
      onUnmount(): void { logs.push('unmount'); }
      render(): VNode { return render('span', null, 'k'); }
    }
    const parent = document.createElement('div');
    const oldVn = render(KC, { key: 'a' });
    parent.appendChild(buildDOM(oldVn));
    const oldComp = oldVn.component!;
    const newVn = render(KC, { key: 'b' });
    reconcile(parent, oldVn, newVn);
    expect(oldComp.__mounted).toBe(false);
    expect(newVn.component).not.toBe(oldComp);
    expect(logs).toContain('unmount');
    expect(logs).toContain('mount');
  });
});