'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { FittedEntry } from './fitted-entry';
type Point = [number, number];
type Stroke = Point[];
export function readMap(raw: string | undefined): Stroke[] {
  try {
    const v = JSON.parse(raw ?? '[]');
    return Array.isArray(v) &&
      v.length <= 1000 &&
      v.every(
        (s) =>
          Array.isArray(s) &&
          s.length <= 10000 &&
          s.every(
            (p) =>
              Array.isArray(p) &&
              p.length === 2 &&
              p.every((n) => typeof n === 'number' && Number.isFinite(n)),
          ),
      )
      ? v
      : [];
  } catch {
    return [];
  }
}
export function CharacterPageTwo({
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
  const [width, setWidth] = useState(1146);
  const [draw, setDraw] = useState(false);
  const [draft, setDraft] = useState<Stroke>([]);
  const active = useRef<Stroke | null>(null);
  useEffect(() => {
    if (!box.current) return;
    const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    obs.observe(box.current);
    return () => obs.disconnect();
  }, []);
  const scale = fit ? Math.min(width / 736, 1146 / 736) : 1146 / 736;
  const ink = readMap(fields['page2.map']);
  const field = (
    key: string,
    label: string,
    x: number,
    y: number,
    w: number,
    h = 13,
    center = false,
    multiline = false,
  ) => (
    <FittedEntry
      key={key}
      aria-label={label}
      title={label}
      className="sheet-input"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        ...(multiline ? { lineHeight: '16px' } : {}),
      }}
      maxSize={h > 20 ? 15 : 11.5}
      center={center}
      multiline={multiline}
      value={fields['page2.' + key] ?? ''}
      onChange={(e) => onChange('page2.' + key, e.target.value)}
    />
  );
  return (
    <div className="page-two">
      <div className="map-tools">
        <span>Map grid</span>
        <button
          aria-pressed={draw}
          disabled={!ready}
          onClick={() => setDraw(!draw)}
        >
          {draw ? 'Finish drawing' : 'Draw on grid'}
        </button>
        <button
          disabled={!ready || ink.length === 0}
          onClick={() =>
            onChange('page2.map', JSON.stringify(ink.slice(0, -1)))
          }
        >
          Undo last stroke
        </button>
        <span>
          {draw
            ? 'Drag on the grid to draw.'
            : 'Use the grid for a map or written notes.'}
        </span>
      </div>
      <div className="page-two-viewport" ref={box}>
        <div
          className="page-two-size"
          style={{ width: 736 * scale, height: 952 * scale }}
        >
          <fieldset
            disabled={!ready}
            className="original-sheet page-two-sheet"
            style={{ transform: `scale(${scale})` }}
            aria-label="Character sheet page 2: gear, supplies, treasure, notes and magic"
          >
            <Image
              unoptimized
              className="original-image"
              src="/character-page-two.jpg"
              width={736}
              height={952}
              alt="Original second character sheet page with gear, supplies, experience, treasure, a map grid, and magic."
            />
            {Array.from({ length: 3 }, (_, col) =>
              Array.from({ length: 10 }, (_, r) => {
                const x = [9, 203, 384][col],
                  y = 43 + r * 14.55;
                return (
                  <div key={`${col}-${r}`}>
                    {field(
                      `gear.${col}.${r}.item`,
                      `Gear ${col * 10 + r + 1}: item`,
                      x,
                      y,
                      col === 0 ? 125 : 105,
                    )}
                    {field(
                      `gear.${col}.${r}.location`,
                      `Gear ${col * 10 + r + 1}: location`,
                      x + (col === 0 ? 128 : 107),
                      y,
                      42,
                    )}
                    {field(
                      `gear.${col}.${r}.weight`,
                      `Gear ${col * 10 + r + 1}: weight`,
                      x + (col === 0 ? 173 : 153),
                      y,
                      16,
                      13,
                      true,
                    )}
                  </div>
                );
              }),
            )}
            {(['Water / wine', 'Rations', 'Food'] as const).map(
              (label, group) =>
                Array.from(
                  { length: group === 1 ? 40 : group === 0 ? 16 : 24 },
                  (_, n) => {
                    const half = group === 1 ? 20 : group === 0 ? 8 : 12;
                    const cluster = Math.floor(n / half),
                      local = n % half;
                    const x = 577 + cluster * 83 + (local % 4) * 14;
                    const y = [39, 81, 151][group] + Math.floor(local / 4) * 12;
                    return (
                      <Checkbox
                        className="ammo-box supply-box"
                        key={`${group}-${n}`}
                        aria-label={`${label} unit ${n + 1} used`}
                        checked={
                          fields[`page2.supply.${group}.${n}`] === 'true'
                        }
                        onCheckedChange={(v) =>
                          onChange(`page2.supply.${group}.${n}`, String(v))
                        }
                        style={{ left: x, top: y, width: 9, height: 9 }}
                      />
                    );
                  },
                ),
            )}
            {field('experience', 'Experience', 13, 225, 170, 156, false, true)}
            {field('coins', 'Coins', 207, 243, 124, 62, false, true)}
            {field('gems', 'Gems', 207, 330, 124, 49, false, true)}
            {Array.from({ length: 11 }, (_, r) =>
              field(
                `valuable.${r}`,
                `Other valuables line ${r + 1}`,
                342,
                237 + r * 12.8,
                365,
                12,
              ),
            )}
            {Array.from({ length: 23 }, (_, r) =>
              field(
                `misc.${r}`,
                `Miscellaneous information line ${r + 1}`,
                10,
                419 + r * 12.8,
                155,
                12,
              ),
            )}
            {field(
              'map.notes',
              'Map grid notes',
              199,
              422,
              514,
              292,
              false,
              true,
            )}
            <svg
              className={`map-drawing ${draw ? 'drawing' : ''}`}
              style={{ left: 194, top: 418, width: 524, height: 304 }}
              viewBox="0 0 524 304"
              aria-label="Map drawing"
              onPointerDown={(e) => {
                if (!draw) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = e.currentTarget.getBoundingClientRect();
                active.current = [
                  [
                    ((e.clientX - rect.left) * 524) / rect.width,
                    ((e.clientY - rect.top) * 304) / rect.height,
                  ],
                ];
                setDraft([...active.current]);
              }}
              onPointerMove={(e) => {
                if (!active.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                active.current.push([
                  Math.max(
                    0,
                    Math.min(524, ((e.clientX - rect.left) * 524) / rect.width),
                  ),
                  Math.max(
                    0,
                    Math.min(304, ((e.clientY - rect.top) * 304) / rect.height),
                  ),
                ]);
                setDraft([...active.current]);
              }}
              onPointerUp={() => {
                if (active.current) {
                  onChange(
                    'page2.map',
                    JSON.stringify([...ink, active.current]),
                  );
                  active.current = null;
                  setDraft([]);
                }
              }}
              onPointerCancel={() => {
                active.current = null;
                setDraft([]);
              }}
            >
              {[...ink, draft].map((stroke, i) =>
                stroke.length > 0 ? (
                  <polyline
                    key={i}
                    points={stroke.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    stroke="#202019"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null,
              )}
            </svg>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i}>
                {field(
                  `magic.slot.${i}.used`,
                  `Magic level ${i + 1} slots used`,
                  28,
                  786 + i * 12.8,
                  13,
                  12,
                  true,
                )}
                {field(
                  `magic.slot.${i}.total`,
                  `Magic level ${i + 1} total slots`,
                  46,
                  786 + i * 12.8,
                  11,
                  12,
                  true,
                )}
              </div>
            ))}
            {field('magic.ability', 'Magic ability', 60, 914, 119, 13)}
            {[
              { level: 1, x: 60, y: 786, rows: 10 },
              { level: 2, x: 190, y: 786, rows: 11 },
              { level: 3, x: 320, y: 786, rows: 4 },
              { level: 4, x: 320, y: 863, rows: 5 },
              { level: 5, x: 450, y: 786, rows: 11 },
              { level: 7, x: 580, y: 786, rows: 2 },
              { level: 8, x: 580, y: 837, rows: 3 },
              { level: 9, x: 580, y: 889, rows: 3 },
            ].map(({ level, x, y, rows }) =>
              Array.from({ length: rows }, (_, r) =>
                field(
                  `magic.level.${level}.line.${r}`,
                  `Magic level ${level}, line ${r + 1}`,
                  x,
                  y + r * 12.8,
                  120,
                  12,
                ),
              ),
            )}
          </fieldset>
        </div>
      </div>
    </div>
  );
}

