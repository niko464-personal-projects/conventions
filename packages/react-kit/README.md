# @niko464/react-kit

React hooks that replace `useEffect` in Niko464's TypeScript projects. [`@niko464/eslint-config`](../eslint-config)'s `react` block bans the effect hooks; these three hooks and the patterns in [Instead of an effect](#instead-of-an-effect) cover what effects were used for. None of the hooks takes a dependency list.

## Install

```bash
pnpm add @niko464/react-kit
```

React 19.2 or later is required: the hooks use `useEffectEvent`.

## `useMountEffect(fn)`

`fn` runs once after mount. The cleanup it returns runs on unmount. In development, `<StrictMode>` mounts each component twice, so `fn` and its cleanup run one extra time there.

```tsx
import { useMountEffect } from '@niko464/react-kit';

const PreviewFrame = ({ draft }: { draft: Draft }) => {
  useMountEffect(() => {
    window.parent.postMessage({ type: 'draft', draft }, '*');
  });
  return <Preview draft={draft} />;
};

<PreviewFrame key={message.id} draft={message.draft} />;
```

To run it again when a value changes, give the component a `key` with that value: React mounts a new one.

## `useEventListener(target, type, handler, options?)`

Listens to `type` on `target` while the component is mounted.

- `target` is `window`, `document` or a ref to an element. A ref must point to its element when the component mounts.
- The event type is checked against the target, so `'keydown'` on `window` gives a `KeyboardEvent`.
- `handler` always sees the latest props and state, without re-subscribing.
- `options` are `addEventListener`'s options. Changing `target`, `type` or `options` re-subscribes.

```tsx
import { useEventListener } from '@niko464/react-kit';
import { useRef } from 'react';

const Dialog = ({ onClose }: { onClose: () => void }) => {
  useEventListener(window, 'keydown', (event) => {
    if (event.key === 'Escape') onClose();
  });
  return <div role="dialog">…</div>;
};

const ColourPicker = ({ onPick }: { onPick: (colour: string) => void }) => {
  const input = useRef<HTMLInputElement>(null);
  useEventListener(input, 'change', () => {
    if (input.current) onPick(input.current.value);
  });
  return <input ref={input} type="color" />;
};
```

## `useInterval(fn, ms, { delay, enabled })`

`fn` runs every `ms` milliseconds while `enabled`.

- `delay` is the wait before the first run, in milliseconds. It defaults to `ms`.
- `enabled` defaults to `true`. When it turns `false`, the interval stops.
- Changing `ms`, `delay` or `enabled` restarts the interval from the beginning.
- `fn` always sees the latest props and state. Changing it does not restart the interval.

```tsx
import { useInterval } from '@niko464/react-kit';
import { useState } from 'react';

const Slideshow = ({ photos, paused }: { photos: Photo[]; paused: boolean }) => {
  const [index, setIndex] = useState(0);
  useInterval(() => setIndex((index + 1) % photos.length), 4000, { enabled: !paused });
  return <img src={photos[index]?.url} alt="" />;
};
```

## Instead of an effect

| To                                       | Use                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Start over when a value changes          | A `key` with that value, so React mounts a new component                                               |
| Measure, place or set up a DOM node      | A ref callback: `<img ref={(node) => place(node)} />`, which may not return a cleanup                  |
| Keep a value in sync with props or state | Derive it during render: `const total = items.reduce(…)`, not a state that an effect updates           |
| Animate                                  | [Motion](https://motion.dev): `<motion.div animate={{ x }} />`, its `useSpring`, and `drag` for swipes |
