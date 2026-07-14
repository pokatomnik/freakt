import { describe, it, expect, vi } from 'vitest';
import { mount } from '../src/mount';
import { render } from '../src/vnode';
import { FreaktComponent } from '../src/component';
import type { VNode } from '../src/types';

class LC extends FreaktComponent {
  calls: string[] = [];
  onMount(): void { this.calls.push('mount'); }
  onUnmount(): void { this.calls.push('unmount'); }
  render(): VNode { return render('b', null, 'lifecycle'); }
}

describe('mount', () => {
  it('mounts vnode into root element', () => {
    const root = document.createElement('div');
    const vn = render('span', null, 'hello');
    mount(root, vn);
    expect(root.textContent).toBe('hello');
  });

  it('mounts component into root', () => {
    const root = document.createElement('div');
    mount(root, render(LC, null));
    expect(root.querySelector('b')).toBeTruthy();
    expect(root.textContent).toBe('lifecycle');
  });

  it('calls onMount on root component', () => {
    const root = document.createElement('div');
    const vn = render(LC, null);
    mount(root, vn);
    expect(vn.component!.__mounted).toBe(true);
    const comp = vn.component as LC;
    expect(comp.calls).toContain('mount');
  });

  it('returns unmount function', () => {
    const root = document.createElement('div');
    const vn = render(LC, null);
    const unmount = mount(root, vn);
    expect(typeof unmount).toBe('function');
  });

  it('unmount removes content from root', () => {
    const root = document.createElement('div');
    const vn = render(LC, null);
    const unmount = mount(root, vn);
    unmount();
    expect(root.innerHTML).toBe('');
  });

  it('unmount calls onUnmount on component tree', () => {
    const root = document.createElement('div');
    const vn = render(LC, null);
    const unmount = mount(root, vn);
    unmount();
    const comp = vn.component as LC;
    expect(comp.calls).toContain('unmount');
    expect(comp.__mounted).toBe(false);
  });

  it('unmount is idempotent', () => {
    const root = document.createElement('div');
    const vn = render(LC, null);
    const unmount = mount(root, vn);
    unmount();
    unmount();
    expect(root.innerHTML).toBe('');
  });

  it('mounts nested components', () => {
    class Inner extends FreaktComponent {
      render(): VNode { return render('i', null, 'inner'); }
    }
    class Outer extends FreaktComponent {
      render(): VNode { return render('div', null, render(Inner, null)); }
    }
    const root = document.createElement('div');
    mount(root, render(Outer, null));
    expect(root.querySelector('i')).toBeTruthy();
    expect(root.textContent).toBe('inner');
  });

  it('unmount nested components calls lifecycle on all', () => {
    const calls: string[] = [];
    class Inner extends FreaktComponent {
      onUnmount(): void { calls.push('inner'); }
      render(): VNode { return render('i', null, 'in'); }
    }
    class Outer extends FreaktComponent {
      onUnmount(): void { calls.push('outer'); }
      render(): VNode { return render('div', null, render(Inner, null)); }
    }
    const root = document.createElement('div');
    const unmount = mount(root, render(Outer, null));
    unmount();
    expect(calls).toContain('outer');
    expect(calls).toContain('inner');
    expect(root.innerHTML).toBe('');
  });

  it('preserves child order with keyed and non-keyed siblings', async () => {
    class Label extends FreaktComponent<{ label: string }> {
      render(): VNode { return render('i', null, this.props.label); }
    }
    class App extends FreaktComponent {
      state = 0;
      inc(): void { this.state = this.state + 1; }
      render(): VNode {
        return render('div', null,
          render('button', { onClick: this.inc }, '-'),
          render(Label, { key: 'lbl', label: String(this.state) }),
          render('span', null, String(this.state)),
          render('button', { onClick: this.inc }, '+'),
        );
      }
    }
    const root = document.createElement('div');
    const vn = render(App, null);
    mount(root, vn);
    const comp = vn.component as App;
    const tags = () => Array.from(root.children[0].children).map(e => e.tagName);
    expect(tags()).toEqual(['BUTTON', 'I', 'SPAN', 'BUTTON']);
    comp.inc();
    await new Promise(r => setTimeout(r, 10));
    expect(tags()).toEqual(['BUTTON', 'I', 'SPAN', 'BUTTON']);
    expect(root.children[0].children).toHaveLength(4);
  });
});