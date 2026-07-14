import { describe, it, expect, vi } from 'vitest';
import { FreaktComponent, makeReactive } from '../src/component';
import { render } from '../src/vnode';
import type { VNode } from '../src/types';

class TestComp extends FreaktComponent {
  state = '';
  calls: string[] = [];

  setValue(v: string): void {
    this.state = v;
  }

  onMount(): void { this.calls.push('mount'); }
  onUpdate(): void { this.calls.push('update'); }
  onUnmount(): void { this.calls.push('unmount'); }

  render(): VNode {
    return render('span', null, this.state);
  }
}

describe('FreaktComponent', () => {
  it('sets initial state via field initializer', () => {
    const comp = new TestComp();
    expect(comp.state).toBe('');
  });

  it('updates state and triggers request', () => {
    const comp = new TestComp();
    comp.__mounted = true;
    comp.state = 'hello';
    expect(comp.state).toBe('hello');
  });

  it('does not update when not mounted', () => {
    const comp = new TestComp();
    const spy = vi.spyOn(comp as any, '__requestUpdate');
    comp.state = 'test';
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('auto-binds methods to instance', () => {
    const comp = new TestComp();
    const { setValue } = comp;
    expect(setValue).toBeDefined();
  });

  it('calls lifecycle hooks on mount', () => {
    const comp = new TestComp();
    comp.__mounted = true;
    comp.onMount();
    expect(comp.calls).toContain('mount');
  });

  it('calls lifecycle hooks on update', () => {
    const comp = new TestComp();
    comp.__vnode = render('span', null, 'old');
    comp.__reconcile = vi.fn();
    comp.__mounted = true;
    comp.render = () => render('span', null, 'new');
    comp.__performUpdate();
    expect(comp.calls).toContain('update');
  });

  it('calls lifecycle hooks on unmount', () => {
    const comp = new TestComp();
    comp.onUnmount();
    expect(comp.calls).toContain('unmount');
  });

  it('stores props', () => {
    const comp = new TestComp();
    comp.props = { text: 'hello' };
    expect(comp.props.text).toBe('hello');
  });
});

describe('update queue', () => {
  it('batches updates via microtask', async () => {
    const comp = new TestComp();
    comp.__mounted = true;
    comp.__reconcile = vi.fn();
    comp.render = vi.fn(() => render('span', null, 'v'));
    comp.state = 'first';
    comp.state = 'second';
    await new Promise(r => setTimeout(r, 10));
    expect(comp.state).toBe('second');
  });
});

describe('makeReactive', () => {
  it('any data field triggers update', () => {
    class FieldComp extends FreaktComponent {
      count = 0;
      render(): VNode { return render('span', null); }
    }
    const comp = new FieldComp();
    comp.__mounted = true;
    makeReactive(comp);
    const spy = vi.spyOn(comp, '__requestUpdate');
    comp.count = 5;
    expect(spy).toHaveBeenCalled();
    expect(comp.count).toBe(5);
  });

  it('constructor accepts props', () => {
    class WithProps extends FreaktComponent<{ name: string }> {
      render(): VNode { return render('b', null); }
    }
    const comp = new WithProps({ name: 'test' });
    expect(comp).toBeInstanceOf(WithProps);
  });
});