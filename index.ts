import { FreaktComponent, render, mount } from './src/index';

class FreaktInput extends FreaktComponent<{ text: string; setText: (v: string) => void }> {
  private handleChange(evt: Event): void {
    const input = evt.currentTarget as HTMLInputElement;
    this.props.setText(input.value);
  }

  render() {
    return render('input', {
      className: 'app-input',
      value: this.props.text,
      onInput: this.handleChange,
    });
  }
}

class LifecycleLogger extends FreaktComponent<{ label: string }> {
  onMount(): void {
    console.log('[LifecycleLogger] mounted');
  }

  onUpdate(): void {
    console.log('[LifecycleLogger] updated, props:', this.props);
  }

  onUnmount(): void {
    console.log('[LifecycleLogger] unmounted');
  }

  render() {
    return render('span', null, this.props.label);
  }
}

class Counter extends FreaktComponent {
  private state123 = { count: 0, label: 'initial' };

  private increment(): void {
    this.state123 = { ...this.state123, count: this.state123.count + 1 };
  }

  private decrement(): void {
    this.state123 = { ...this.state123, count: this.state123.count - 1 };
  }

  render() {
    return render('div', { className: 'counter' },
      render('button', { onClick: this.decrement }, '-'),
      ...(this.state123.count > 5 ? [render(LifecycleLogger, { key: 'label', label: String(this.state123.count) })] : []),
      render('span', null, String(this.state123.count)),
      render('button', { onClick: this.increment }, '+'),
    );
  }
}

class App extends FreaktComponent {
  private state = 'Hello, Freakt!';

  private setText(text: string): void {
    this.state = text;
  }

  render() {
    return render('div', { className: 'app' },
      render('h1', null, '⚡ Freakt Demo'),
      render(FreaktInput, { text: this.state, setText: this.setText }),
      render('p', { className: 'output' }, `You typed: ${this.state}`),
      render(Counter, null),
    );
  }
}

const root = document.getElementById('root')!;
mount(root, render(App, null));
