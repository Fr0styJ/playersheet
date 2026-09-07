'use client';
import { useEffect, useRef, type CSSProperties } from 'react';

type Props = {
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  style?: CSSProperties;
  className?: string;
  title?: string;
  'aria-label': string;
  multiline?: boolean;
  maxSize?: number;
  center?: boolean;
};

/** Fit in native sheet pixels, independent of the whole-page zoom. */
export function FittedEntry({
  value,
  onChange,
  style,
  className = '',
  title,
  multiline = false,
  maxSize = 19,
  center = false,
  ...label
}: Props) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const computed = getComputedStyle(element);
      const available = Math.max(
        1,
        element.clientWidth -
          parseFloat(computed.paddingLeft) -
          parseFloat(computed.paddingRight) -
          2,
      );
      const maximum = Math.min(
        maxSize,
        multiline ? maxSize : element.clientHeight * 0.82,
      );
      let size = maximum;
      if (multiline) {
        // Preserve the original ruled-line rhythm; never alter or truncate saved text.
        element.style.fontSize = `${size}px`;
        while (size > 9 && element.scrollHeight > element.clientHeight + 1) {
          size = Math.max(9, size - 0.5);
          element.style.fontSize = `${size}px`;
        }
      } else {
        const context = document.createElement('canvas').getContext('2d');
        if (context) {
          context.font = `${computed.fontWeight} ${maximum}px ${computed.fontFamily}`;
          const measured = context.measureText(value || ' ').width;
          size = Math.max(
            8,
            Math.min(maximum, (maximum * available) / Math.max(1, measured)),
          );
        }
        element.style.fontSize = `${size}px`;
        if (document.activeElement !== element) element.scrollLeft = 0;
      }
    };
    fit();
    void document.fonts.ready.then(fit);
    document.fonts.addEventListener('loadingdone', fit);
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    window.addEventListener('beforeprint', fit);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', fit);
      window.removeEventListener('beforeprint', fit);
    };
  }, [value, maxSize, multiline]);
  const common = {
    ...label,
    title: value ? `${title ?? label['aria-label']}: ${value}` : title,
    value,
    onChange,
    className: `${className} fitted-entry`,
    style: {
      ...style,
      fontSize: maxSize,
      textAlign: center ? ('center' as const) : undefined,
    },
    spellCheck: false,
  };
  return multiline ? (
    <textarea
      {...common}
      ref={(node) => {
        ref.current = node;
      }}
    />
  ) : (
    <input
      {...common}
      ref={(node) => {
        ref.current = node;
      }}
      onBlur={(e) => {
        e.currentTarget.scrollLeft = 0;
      }}
    />
  );
}
