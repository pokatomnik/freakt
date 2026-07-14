import { describe, it, expect } from 'vitest';
import { setProps, updateProps, createDOM } from '../src/dom';
import { render } from '../src/vnode';

describe('createDOM', () => {
  it('creates element with tag name', () => {
    const vn = render('div', null);
    const el = createDOM(vn) as HTMLElement;
    expect(el.tagName).toBe('DIV');
  });

  it('sets className attribute', () => {
    const vn = render('div', { className: 'box' });
    const el = createDOM(vn) as HTMLElement;
    expect(el.getAttribute('class')).toBe('box');
  });

  it('sets string attributes', () => {
    const vn = render('input', { id: 'name', placeholder: 'Enter' });
    const el = createDOM(vn) as HTMLElement;
    expect(el.getAttribute('id')).toBe('name');
    expect(el.getAttribute('placeholder')).toBe('Enter');
  });

  it('creates text children', () => {
    const vn = render('p', null, 'hello');
    const el = createDOM(vn) as HTMLElement;
    expect(el.textContent).toBe('hello');
  });

  it('creates nested elements', () => {
    const vn = render('ul', null, render('li', null, 'a'), render('li', null, 'b'));
    const el = createDOM(vn) as HTMLElement;
    expect(el.children).toHaveLength(2);
    expect(el.children[0].textContent).toBe('a');
  });

  it('sets vnode.el reference', () => {
    const vn = render('span', null);
    const el = createDOM(vn) as HTMLElement;
    expect(vn.el).toBe(el);
  });
});

describe('setProps', () => {
  it('adds event listener', () => {
    const el = document.createElement('button');
    let called = false;
    setProps(el, { onclick: () => { called = true; } });
    el.click();
    expect(called).toBe(true);
  });

  it('sets htmlFor', () => {
    const el = document.createElement('label');
    setProps(el, { htmlFor: 'input-id' });
    expect(el.getAttribute('for')).toBe('input-id');
  });

  it('handles boolean attributes', () => {
    const el = document.createElement('input');
    setProps(el, { disabled: true });
    expect(el.getAttribute('disabled')).toBe('');
    setProps(el, { disabled: false });
    expect(el.getAttribute('disabled')).toBeNull();
  });
});

describe('updateProps', () => {
  it('adds new props', () => {
    const el = document.createElement('div');
    setProps(el, { id: 'old' });
    updateProps(el, { id: 'old' }, { id: 'new', className: 'x' });
    expect(el.getAttribute('id')).toBe('new');
    expect(el.getAttribute('class')).toBe('x');
  });

  it('removes old props', () => {
    const el = document.createElement('div');
    setProps(el, { className: 'old', id: 'keep' });
    updateProps(el, { className: 'old', id: 'keep' }, { id: 'keep' });
    expect(el.getAttribute('class')).toBeNull();
    expect(el.getAttribute('id')).toBe('keep');
  });

  it('replaces event listeners', () => {
    const el = document.createElement('button');
    let count = 0;
    const handler1 = () => { count = 1; };
    const handler2 = () => { count = 2; };
    setProps(el, { onclick: handler1 });
    updateProps(el, { onclick: handler1 }, { onclick: handler2 });
    el.click();
    expect(count).toBe(2);
  });

  it('removes old event listeners on update', () => {
    const el = document.createElement('button');
    let called = false;
    const handler = () => { called = true; };
    setProps(el, { onclick: handler });
    updateProps(el, { onclick: handler }, { className: 'x' });
    el.click();
    expect(called).toBe(false);
  });
});