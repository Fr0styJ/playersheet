'use client';
import { useEffect, useRef, useState } from 'react';

import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { FittedEntry } from './fitted-entry';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export function spellLineValue(
  fields: Record<string, string>,
  prefix: string,
  line: number,
) {
  const saved = fields[`${prefix}.line.${line}`];
  if (saved !== undefined) return saved;
  const old = (fields[`${prefix}.notes`] ?? '').split(/\r?\n/);
  return line < 6 ? (old[line] ?? '') : old.slice(6).join(' · ');
}
export function pageCount(fields: Record<string, string>) {
  const n = Number(fields['spellbook.pages']);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 50) : 1;
}
export function removeSpellPage(fields: Record<string, string>, page: number) {
  const count = pageCount(fields);
  if (count <= 1 || page < 0 || page >= count) return fields;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    const match = /^spellbook\.page\.(\d+)\.(.*)$/.exec(key);
    if (!match) {
      result[key] = value;
      continue;
    }
    const n = Number(match[1]);
    if (n === page) continue;
    result[`spellbook.page.${n > page ? n - 1 : n}.${match[2]}`] = value;
  }
  result['spellbook.pages'] = String(count - 1);
  return result;
}
export function Spellbook({
  fields,
  onChange,
  fit,
  ready,
}: {
  fields: Record<string, string>;
  onChange: (fields: Record<string, string>) => void;
  fit: boolean;
  ready: boolean;
}) {
  const count = pageCount(fields);
  const [selected, setSelected] = useState(0);
  const page = Math.min(selected, count - 1);
  const [confirm, setConfirm] = useState(false);
  const [undo, setUndo] = useState<Record<string, string> | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1103);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const scale = fit ? Math.min(width / 1103, 1) : 1;
  const field = (
    key: string,
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
    multiline = false,
    line = 38,
  ) => (
    <FittedEntry
      key={key}
      aria-label={label}
      title={label}
      className={multiline ? 'sheet-input sheet-notes' : 'sheet-input'}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        ...(multiline ? { lineHeight: `${line}px` } : {}),
      }}
      value={fields[key] ?? ''}
      onChange={(e) => onChange({ ...fields, [key]: e.target.value })}
      maxSize={multiline ? 25 : h > 35 ? 29 : 25}
      center={!multiline && w < 90}
      multiline={multiline}
    />
  );
  return (
    <div className="spellbook">
      <div className="spell-tools">
        <Pagination aria-label="Spellbook pages">
          <PaginationContent>
            <PaginationItem>
              <button
                disabled={page === 0}
                onClick={() => setSelected(page - 1)}
                aria-label="Previous spell page"
              >
                <ChevronLeft size={16} />
              </button>
            </PaginationItem>
            <PaginationItem>
              <output aria-live="polite">
                Page {page + 1} of {count}
              </output>
            </PaginationItem>
            <PaginationItem>
              <button
                disabled={page === count - 1}
                onClick={() => setSelected(page + 1)}
                aria-label="Next spell page"
              >
                <ChevronRight size={16} />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <button
          disabled={!ready || count >= 50}
          onClick={() => {
            onChange({ ...fields, 'spellbook.pages': String(count + 1) });
            setSelected(count);
          }}
        >
          <Plus size={16} />
          Add page
        </button>
        <button
          disabled={!ready || count === 1}
          onClick={() => setConfirm(true)}
        >
          <Trash2 size={16} />
          Remove page
        </button>
      </div>
      <p className="spell-help">
        Spellcasting level and slots / memory are shared across all pages. Each
        page holds nine spells. Print includes every spell page.
      </p>
      {undo && (
        <div className="notice">
          Page removed.
          <button
            onClick={() => {
              onChange(undo);
              setUndo(null);
            }}
          >
            Undo removal
          </button>
          <button aria-label="Dismiss undo" onClick={() => setUndo(null)}>
            ×
          </button>
        </div>
      )}
      <div className="spell-viewport" ref={viewport}>
        {Array.from({ length: count }, (_, p) => (
          <div
            className={`spell-page ${p === page ? 'current' : ''}`}
            key={p}
            style={{ width: 1103 * scale, height: 1426 * scale }}
          >
            <fieldset
              disabled={!ready}
              className="original-sheet spell-sheet"
              style={{ transform: `scale(${scale})` }}
              aria-label={`Spellbook page ${p + 1}`}
            >
              <img
                className="original-image"
                src={`${import.meta.env.BASE_URL}spellbook.png`}
                alt="Spellbook sheet with shared spellcasting level and spell slots, and nine illustrated spell panels."
                width={1103}
                height={1426}
              />
              {field(
                'spellbook.castingLevel',
                'Spellcasting level (shared)',
                773,
                32,
                202,
                28,
              )}
              {Array.from({ length: 9 }, (_, i) =>
                field(
                  `spellbook.slots.${i + 1}`,
                  `Level ${i + 1} spell slots / memory (shared)`,
                  563 + i * 46,
                  132,
                  36,
                  38,
                ),
              )}
              {Array.from({ length: 9 }, (_, i) => {
                const col = i % 3,
                  r = Math.floor(i / 3);
                const x = [80, 445, 797][col],
                  y = [252, 632, 1014][r];
                const prefix = `spellbook.page.${p}.spell.${i}`;
                return (
                  <div key={i}>
                    {field(
                      prefix + '.name',
                      `Page ${p + 1}, spell ${i + 1} name`,
                      x,
                      y,
                      188,
                      27,
                    )}
                    {field(
                      prefix + '.level',
                      `Page ${p + 1}, spell ${i + 1} level`,
                      x + 214,
                      y,
                      50,
                      27,
                    )}
                    {Array.from({ length: 7 }, (_, line) => (
                      <FittedEntry
                        key={line}
                        aria-label={`Page ${p + 1}, spell ${i + 1}, detail line ${line + 1}`}
                        title={`Spell ${i + 1}, detail line ${line + 1}`}
                        className="sheet-input spell-detail-line"
                        style={{
                          left: x - 15,
                          top: y + 46 + line * 38,
                          width: 289,
                          height: 35,
                        }}
                        maxSize={25}
                        value={spellLineValue(fields, prefix, line)}
                        onChange={(e) =>
                          onChange({
                            ...fields,
                            [`${prefix}.line.${line}`]: e.target.value,
                          })
                        }
                      />
                    ))}
                  </div>
                );
              })}
              <span className="spell-page-number">
                Page {p + 1} of {count}
              </span>
            </fieldset>
          </div>
        ))}
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogTitle>Remove spell page {page + 1}?</AlertDialogTitle>
          <AlertDialogDescription>
            The nine spells on this page will be removed. Shared spellcasting
            level and slots will stay. You can undo this removal.
          </AlertDialogDescription>
          <div className="tools">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button
              onClick={() => {
                setUndo(fields);
                onChange(removeSpellPage(fields, page));
                setSelected(Math.max(0, page - 1));
                setConfirm(false);
              }}
            >
              Remove page
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
