'use client';
import { useEffect, useRef, useState } from 'react';

import { FittedEntry } from './fitted-entry';
export function BagOfHolding({
  fields,
  onChange,
  fit,
  ready,
}: {
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
  fit: boolean;
  ready: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1103);
  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  const scale = fit ? Math.min(width / 1103, 1146 / 1103) : 1146 / 1103;
  const field = (
    key: string,
    label: string,
    x: number,
    y: number,
    w: number,
    h = 34,
    center = false,
  ) => (
    <FittedEntry
      key={key}
      aria-label={label}
      title={label}
      className="sheet-input"
      style={{ left: x, top: y, width: w, height: h }}
      value={fields['bag.' + key] ?? ''}
      onChange={(e) => onChange('bag.' + key, e.target.value)}
      maxSize={25}
      center={center}
    />
  );
  return (
    <div className="bag-viewport" ref={box}>
      <div
        className="bag-size"
        style={{ width: 1103 * scale, height: 1426 * scale }}
      >
        <fieldset
          disabled={!ready}
          className="original-sheet bag-sheet"
          style={{ transform: `scale(${scale})` }}
          aria-label="Bag of Holding inventory"
        >
          <img
            className="original-image"
            src={`${import.meta.env.BASE_URL}bag-of-holding.png`}
            width={1103}
            height={1426}
            alt="Bag of Holding sheet with owner, bag type, capacity, current value, location and 25 inventory rows."
          />
          {field('owner', 'Bag owner', 159, 234, 340)}
          {field('type', 'Bag type', 187, 273, 312)}
          {field('capacity', 'Bag capacity', 187, 313, 312)}
          {field('currentValue', 'Bag current value', 682, 236, 337)}
          {field('location', 'Bag location / notes', 704, 274, 315)}
          {field(
            'location2',
            'Bag location / notes, second line',
            541,
            314,
            478,
          )}
          {Array.from({ length: 25 }, (_, i) => {
            const y = 475 + i * 36.65;
            return (
              <div key={i}>
                {field(
                  `item.${i}.name`,
                  `Bag item ${i + 1}: item`,
                  119,
                  y,
                  345,
                  33,
                )}
                {field(
                  `item.${i}.quantity`,
                  `Bag item ${i + 1}: quantity`,
                  472,
                  y,
                  87,
                  33,
                  true,
                )}
                {field(
                  `item.${i}.value`,
                  `Bag item ${i + 1}: value`,
                  568,
                  y,
                  147,
                  33,
                  true,
                )}
                {field(
                  `item.${i}.notes`,
                  `Bag item ${i + 1}: notes`,
                  724,
                  y,
                  340,
                  33,
                )}
              </div>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
}
