import { describe, it, expect } from 'vitest';
import { render } from '../src/vnode';
import type { VNode, ComponentClass } from '../src/types';
import { FreaktComponent } from '../src/component';

class Dummy extends FreaktComponent {
  render(): VNode {
    return render('span', null, 'dummy');
  }
}

describe('render', () => {
  it('creates vnode with string tag and props', () => {
    const vn = render('div', { id: 'test', className: 'box' });
    expect(vn.tag).toBe('div');
    expect(vn.props).toEqual({ id: 'test', className: 'box' });
    expect(vn.children).toEqual([]);
    expect(vn.key).toBeNull();
  });

  it('creates vnode with component class', () => {
    const vn = render(Dummy, { foo: 'bar' });
    expect(vn.tag).toBe(Dummy);
    expect(vn.props).toEqual({ foo: 'bar' });
  });

  it('extracts key from props', () => {
    const vn = render('li', { key: 'item-1', className: 'item' });
    expect(vn.key).toBe('item-1');
    expect(vn.props).toEqual({ className: 'item' });
  });

  it('sets props to null when only key remains after removal', () => {
    const vn = render('div', { key: 'only-key' });
    expect(vn.key).toBe('only-key');
    expect(vn.props).toBeNull();
  });

  it('accepts null props', () => {
    const vn = render('br', null);
    expect(vn.props).toBeNull();
  });

  it('normalizes single child', () => {
    const child = render('span', null, 'hello');
    const vn = render('div', null, child);
    expect(vn.children).toHaveLength(1);
    expect(vn.children[0]).toBe(child);
  });

  it('normalizes multiple children', () => {
    const vn = render('ul', null,
      render('li', null, 'a'),
      render('li', null, 'b'),
    );
    expect(vn.children).toHaveLength(2);
  });

  it('normalizes array children', () => {
    const items = [render('li', null, '1'), render('li', null, '2')];
    const vn = render('ul', null, items);
    expect(vn.children).toHaveLength(2);
  });

  it('filters null/undefined/boolean children', () => {
    const vn = render('div', null, null, 'text', undefined, false, 0);
    expect(vn.children).toHaveLength(2);
    expect(vn.children[0]).toBe('text');
    expect(vn.children[1]).toBe(0);
  });

  it('handles nested arrays', () => {
    const vn = render('div', null, [render('a', null), [render('b', null)]]);
    expect(vn.children).toHaveLength(2);
  });

  it('accepts string children', () => {
    const vn = render('p', null, 'hello world');
    expect(vn.children).toEqual(['hello world']);
  });

  it('accepts numeric children', () => {
    const vn = render('p', null, 42);
    expect(vn.children).toEqual([42]);
  });
});