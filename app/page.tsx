'use client';
import Image from 'next/image';
import { CharacterPageTwo } from './character-page-two';
import { Spellbook } from './spellbook';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FittedEntry } from './fitted-entry';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Download, Upload, Printer, Plus, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
type Row = { id: string; values: Record<string, string> };
type Sheet = {
  version: 1;
  fields: Record<string, string>;
  weapons: Row[];
  skills: Row[];
  ammo: Row[];
  custom: Row[];
};
const row = (): Row => ({ id: crypto.randomUUID(), values: {} });
const blank = (): Sheet => ({
  version: 1,
  fields: {},
  weapons: [],
  skills: [],
  ammo: [],
  custom: [],
});
const KEY = 'character-folio-v1';
const abilities = [
  [
    'STR',
    'Strength',
    'Hit probability',
    'Damage adjustment',
    'Weight allowance',
    'Maximum press',
    'Open doors',
    'Bend bars / lift gates',
  ],
  [
    'DEX',
    'Dexterity',
    'Reaction adjustment',
    'Missile attack adjustment',
    'Defensive adjustment',
  ],
  [
    'CON',
    'Constitution',
    'HP adjustment',
    'System shock',
    'Resurrection survival',
    'Poison save',
    'Regeneration',
  ],
  [
    'INT',
    'Intelligence',
    'Number of languages',
    'Spell level',
    'Learn spell',
    'Spells per level',
    'Spell immunity',
  ],
  [
    'WIS',
    'Wisdom',
    'Magical defense adjustment',
    'Bonus spells',
    'Spell failure',
    'Spell immunity',
  ],
  [
    'CHR',
    'Charisma',
    'Maximum henchmen',
    'Loyalty base',
    'Reaction adjustment',
  ],
];
function valid(s: unknown): s is Sheet {
  if (!s || typeof s !== 'object') return false;
  const a = s as Sheet;
  const values = (v: unknown) =>
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === 'string');
  return (
    a.version === 1 &&
    values(a.fields) &&
    (['weapons', 'skills', 'ammo', 'custom'] as const).every(
      (k) =>
        Array.isArray(a[k]) &&
        a[k].length <= 500 &&
        new Set(a[k].map((r) => r?.id)).size === a[k].length &&
        a[k].every((r) => r && typeof r.id === 'string' && values(r.values)),
    )
  );
}
export default function Home() {
  const [sheet, setSheet] = useState<Sheet>(blank);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading saved sheet…');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<Sheet | null>(null);
  const [blocked, setBlocked] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const [undo, setUndo] = useState<Sheet | null>(null);
  // Hydrate device-local data after SSR; the initial empty sheet must never overwrite it.
  /* oxlint-disable react/react-compiler -- SSR hydration and storage error reporting require state updates. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!valid(parsed)) throw Error();
        setSheet(parsed);
      }
      setStatus('Saved in this browser');
    } catch {
      setBlocked(true);
      setStatus('Saved data could not be read. Export edits before leaving.');
    }
    setReady(true);
  }, []);
  // Synchronize browser storage and report failures to the user.
  /* oxlint-disable react/react-compiler -- SSR hydration and storage error reporting require state updates. */
  useEffect(() => {
    if (!ready || blocked) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(sheet));
      setStatus('Saved in this browser');
    } catch {
      setStatus('Browser storage unavailable — export to keep your changes.');
    }
  }, [sheet, ready, blocked]);
  /* oxlint-enable react/react-compiler */
  const set = (key: string, value: string) =>
    setSheet((s) => ({ ...s, fields: { ...s.fields, [key]: value } }));
  const exportSheet = () => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      (sheet.fields['Character name'] || 'character').replace(
        /[^a-z0-9_-]/gi,
        '-',
      ) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      'Character exported. Keep the file as a backup or import it on another device.',
    );
  };
  const importSheet = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw Error();
      const data = JSON.parse(await file.text());
      if (!valid(data)) throw Error();
      setPending(data);
    } catch {
      setNotice(
        'This file is not a valid Character Folio export. Your sheet has not changed.',
      );
    }
    if (upload.current) upload.current.value = '';
  };

  const [fit, setFit] = useState(true);
  const [characterPage, setCharacterPage] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1146);
  useEffect(() => {
    if (!box.current) return;
    const obs = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    obs.observe(box.current);
    return () => obs.disconnect();
  }, []);
  const scale = fit ? Math.min(width / 1146, 1) : 1;
  const position = (
    x: number,
    y: number,
    w: number,
    h = 24,
  ): CSSProperties => ({ left: x, top: y, width: w, height: h });
  const input = (key: string, x: number, y: number, w: number, h = 24) => (
    <FittedEntry
      center={w <= 90}
      maxSize={key === 'Character name' ? 21 : h > 28 ? 25 : 19}
      key={key}
      className="sheet-input"
      aria-label={key}
      title={key}
      style={position(x, y, w, h)}
      value={sheet.fields[key] ?? ''}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const text = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    line = 24,
  ) => (
    <FittedEntry
      multiline
      key={key}
      className="sheet-input sheet-notes"
      aria-label={key}
      title={key}
      style={{ ...position(x, y, w, h), lineHeight: `${line}px` }}
      value={sheet.fields[key] ?? ''}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const updateRow = (
    kind: 'weapons' | 'skills' | 'ammo',
    index: number,
    key: string,
    value: string,
  ) =>
    setSheet((s) => {
      const list = [...s[kind]];
      while (list.length <= index) list.push(row());
      list[index] = {
        ...list[index],
        values: { ...list[index].values, [key]: value },
      };
      return { ...s, [kind]: list };
    });
  const entry = (
    kind: 'weapons' | 'skills' | 'ammo',
    i: number,
    key: string,
    x: number,
    y: number,
    w: number,
    h = 24,
  ) => (
    <FittedEntry
      center={key !== 'Weapon' && key !== 'Name' && key !== 'name'}
      key={`${kind}-${i}-${key}`}
      className="sheet-input"
      aria-label={`${kind} ${i + 1}: ${key}`}
      title={`${kind} ${i + 1}: ${key}`}
      style={position(x, y, w, h)}
      value={sheet[kind][i]?.values[key] ?? ''}
      onChange={(e) => updateRow(kind, i, key, e.target.value)}
    />
  );
  const detailFields: [string, number, number, number][] = [
    ['Character name', 136, 94, 479],
    ['Alignment', 104, 124, 75],
    ['Race', 236, 124, 83],
    ['Class', 374, 124, 84],
    ['Level', 525, 124, 88],
    ['Player’s name', 170, 150, 345],
    ['Homeland', 139, 178, 376],
    ['Family', 595, 150, 182],
    ['Race / clan', 879, 150, 198],
    ['Liege / patron', 666, 177, 111],
    ['Religion', 881, 177, 196],
    ['Sex', 89, 204, 111],
    ['Age', 260, 204, 116],
    ['Social class', 494, 204, 281],
    ['Status', 859, 204, 217],
    ['Height', 79, 230, 121],
    ['Weight', 250, 230, 127],
    ['Birth rank', 492, 230, 282],
    ['Number of siblings', 909, 230, 167],
    ['Hair', 94, 257, 106],
    ['Eyes', 263, 257, 114],
    ['Appearance', 498, 257, 577],
    ['Honor', 102, 283, 174],
    ['Base honor', 397, 283, 171],
    ['Reaction adjustment', 761, 283, 314],
  ];
  const shortMods = [
    ['Hit prob.', 'Dmg adj.', 'Wt allow', 'Max press', 'Op doors', 'BB / LG'],
    ['Reaction adj.', 'Missile att. adj.', 'Defense adj.'],
    ['HP adj.', 'Sys. shock', 'Res. survival', 'Poison save', 'Regen.'],
    ['No. lang.', 'Spell lvl', 'Learn spell', 'Spells / lvl', 'Spell immune'],
    ['Magic def.', 'Bonus spells', 'Spell fail', 'Spell immune'],
    ['Max hench.', 'Loyalty base', 'Reaction adj.'],
  ];
  return (
    <>
      <div className="toolbar">
        <div className="tools">
          <button onClick={() => setFit(!fit)}>
            {fit ? 'Enlarge to edit' : 'Fit whole sheet'}
          </button>
          <button onClick={() => upload.current?.click()}>
            <Upload size={16} />
            Import
          </button>
          <button onClick={exportSheet}>
            <Download size={16} />
            Export
          </button>
          <button onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </button>
        </div>
        <output>{status}</output>
        <input
          ref={upload}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={(e) => void importSheet(e.target.files?.[0])}
        />
      </div>
      {notice && (
        <output className="notice">
          {notice}
          {undo && (
            <button
              onClick={() => {
                setSheet(undo);
                setUndo(null);
                setNotice('Previous sheet restored.');
              }}
            >
              <RotateCcw size={14} />
              Undo
            </button>
          )}
          <button onClick={() => setNotice('')} aria-label="Dismiss message">
            ×
          </button>
        </output>
      )}
      <main>
        <Tabs defaultValue="character" className="record-tabs">
          <TabsList className="record-tab-list" aria-label="Character records">
            <TabsTrigger value="character">Character sheet</TabsTrigger>
            <TabsTrigger value="spells">Spellbook</TabsTrigger>
          </TabsList>
          <TabsContent value="character" keepMounted>
            <div
              className="character-page-nav"
              aria-label="Character sheet pages"
            >
              <button
                aria-pressed={characterPage === 1}
                onClick={() => setCharacterPage(1)}
              >
                1 · Character
              </button>
              <button
                aria-pressed={characterPage === 2}
                onClick={() => setCharacterPage(2)}
              >
                2 · Gear & notes
              </button>
            </div>
            <div
              className={`character-document character-first ${characterPage === 1 ? 'active' : ''}`}
            >
              <div className="sheet-viewport" ref={box}>
                <div
                  className="sheet-size"
                  style={{ width: 1146 * scale, height: 1524 * scale }}
                >
                  <fieldset
                    disabled={!ready}
                    className="original-sheet"
                    style={{ transform: `scale(${scale})` }}
                    aria-label="AD&D 2nd Edition character record sheet"
                  >
                    <Image
                      unoptimized
                      className="original-image"
                      src="/character-sheet.jpg"
                      width="1146"
                      height="1524"
                      alt="Unofficial AD&D 2nd Edition character record sheet. Editable character, abilities, movement, saving throws, armor, hit points, weapons and skills fields follow."
                    />
                    {detailFields.map(([k, x, y, w]) => input(k, x, y, w))}
                    {abilities.map(([abbr, name, ...mods], i) => (
                      <div key={abbr}>
                        {input(abbr, 40, 368 + i * 33.3, 46, 30)}
                        <div
                          className="modifier-row"
                          style={position(165, 367 + i * 33.3, 397, 32)}
                        >
                          {mods.map((m, j) => (
                            <label key={m}>
                              <span>{shortMods[i][j]}</span>
                              <FittedEntry
                                center
                                maxSize={16}
                                aria-label={`${name}: ${m}`}
                                title={`${name}: ${m}`}
                                value={sheet.fields[abbr + ':' + m] ?? ''}
                                onChange={(e) =>
                                  set(abbr + ':' + m, e.target.value)
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {[
                      'Base rate',
                      'Light',
                      'Moderate',
                      'Heavy',
                      'Severe',
                      'Jog ×2',
                      'Run ×3',
                      'Run ×4',
                      'Run ×5',
                    ].map((x, i) => (
                      <div key={x}>
                        {input(
                          'move:' + x + ':rate',
                          735,
                          369 + i * 21.4,
                          88,
                          20,
                        )}
                        {i > 0 &&
                          i < 5 &&
                          input(
                            'move:' + x + ':load',
                            647,
                            391 + (i - 1) * 21.4,
                            53,
                            20,
                          )}
                      </div>
                    ))}
                    {[
                      'Paralyze / poison',
                      'Rod, staff, or wand',
                      'Petrify / polymorph',
                      'Breath weapon',
                      'Spells',
                    ].map((x, i) => (
                      <div key={x}>
                        {input(
                          'save:' + x + ':modifier',
                          873,
                          375 + i * 37.4,
                          49,
                          23,
                        )}
                        {input(
                          'save:' + x + ':save',
                          1052,
                          375 + i * 37.4,
                          48,
                          23,
                        )}
                      </div>
                    ))}
                    {input('AC', 61, 651, 56, 37)}
                    {input('Adjusted AC', 273, 620, 38)}
                    {input('Surprised', 244, 642, 63)}
                    {input('Shieldless', 244, 665, 63)}
                    {input('Rear', 244, 689, 63)}
                    {text('Armor type (pieces)', 326, 642, 245, 70, 23.5)}
                    {input('Defenses', 124, 711, 450)}
                    {text('Current HP', 624, 648, 132, 76, 30)}
                    {text('Wounds', 784, 642, 305, 82, 26)}
                    {Array.from({ length: 6 }, (_, i) => {
                      const y = 811 + i * 24.6;
                      return (
                        <div key={i}>
                          {entry('weapons', i, 'Weapon', 42, y, 169)}
                          {entry('weapons', i, 'Attacks / round', 215, y, 47)}
                          {entry('weapons', i, 'Attack adjustment', 266, y, 77)}
                          {entry('weapons', i, 'Damage adjustment', 344, y, 79)}
                          {entry('weapons', i, 'THAC0', 429, y, 69)}
                          {entry('weapons', i, 'Damage (S/M)', 503, y, 64)}
                          {entry('weapons', i, 'Damage (L)', 580, y, 68)}
                          {entry('weapons', i, 'Range', 654, y, 145)}
                          {entry('weapons', i, 'Weight', 804, y, 82)}
                          {entry('weapons', i, 'Size', 892, y, 57)}
                          {entry('weapons', i, 'Type', 953, y, 57)}
                          {entry('weapons', i, 'Speed', 1016, y, 82)}
                        </div>
                      );
                    })}
                    {input('Special attacks', 170, 983, 372)}
                    {text('Special attacks (continued)', 51, 1009, 491, 49, 24)}
                    {entry('ammo', 0, 'name', 676, 982, 134, 23)}
                    {entry('ammo', 1, 'name', 825, 982, 109, 23)}
                    {[0, 1].map((group) =>
                      Array.from({ length: group === 0 ? 16 : 12 }, (_, n) => {
                        const x =
                          group === 0
                            ? 562 + [0, 30, 60, 90, 137, 167, 197, 227][n % 8]
                            : 983 + (n % 4) * 28;
                        const y =
                          group === 0
                            ? 1013 + Math.floor(n / 8) * 24
                            : 987 + Math.floor(n / 4) * 24;
                        if (group === 1 && n >= 12) return null;
                        return (
                          <Checkbox
                            className="ammo-box"
                            key={`${group}-${n}`}
                            aria-label={`Ammunition ${group + 1}, round ${n + 1} used`}
                            style={position(x, y, 15, 15)}
                            checked={
                              sheet.ammo[group]?.values['used' + n] === 'true'
                            }
                            onCheckedChange={(v) =>
                              updateRow('ammo', group, 'used' + n, String(v))
                            }
                          />
                        );
                      }),
                    )}
                    {entry('ammo', 1, 'notes', 825, 1010, 140, 23)}
                    {entry('ammo', 1, 'notes2', 825, 1034, 140, 23)}
                    {text('Special abilities', 50, 1102, 238, 352, 23.8)}
                    {text(
                      'Special abilities (continued)',
                      310,
                      1102,
                      237,
                      352,
                      23.8,
                    )}
                    {Array.from({ length: 28 }, (_, i) => {
                      const x = i < 14 ? 590 : 849;
                      const y = 1096 + (i % 14) * 23.7;
                      return (
                        <div key={i}>
                          {entry('skills', i, 'Name', x, y, 154, 23)}
                          {entry(
                            'skills',
                            i,
                            'Rating / slots',
                            x + 164,
                            y,
                            23,
                            23,
                          )}
                          {entry(
                            'skills',
                            i,
                            'Check / modifier',
                            x + 200,
                            y,
                            23,
                            23,
                          )}
                        </div>
                      );
                    })}
                  </fieldset>
                </div>
              </div>
              <div className="extras">
                <p className="mobile-hint">
                  Tap any line to edit. Use “Enlarge to edit” for larger fields;
                  swipe across the sheet on a phone. Changes save in this
                  browser.
                </p>
                <details>
                  <summary>Additional fields & campaign notes</summary>
                  <p>
                    Extra entries stay here so the original sheet keeps its
                    layout.
                  </p>
                  {[
                    'Maximum HP',
                    'Adventure notes',
                    ...(sheet.fields['move:Base rate:load']
                      ? ['move:Base rate:load']
                      : []),
                  ].map((k) => (
                    <label key={k}>
                      {k}
                      <textarea
                        value={sheet.fields[k] ?? ''}
                        onChange={(e) => set(k, e.target.value)}
                      />
                    </label>
                  ))}
                  {(['weapons', 'skills', 'ammo'] as const).map((kind) =>
                    sheet[kind].map((r, i) => (
                      <details key={r.id}>
                        <summary>
                          {kind} {i + 1}
                          {r.values.Weapon || r.values.Name || r.values.name
                            ? ': ' +
                              (r.values.Weapon ||
                                r.values.Name ||
                                r.values.name)
                            : ''}
                        </summary>
                        {Object.entries(r.values)
                          .filter(([key]) => !key.startsWith('used'))
                          .map(([key, value]) => (
                            <label key={key}>
                              {key}
                              <input
                                value={value}
                                onChange={(e) =>
                                  updateRow(kind, i, key, e.target.value)
                                }
                              />
                            </label>
                          ))}
                      </details>
                    )),
                  )}
                  {sheet.custom.map((r, i) => (
                    <div className="custom" key={r.id}>
                      <label>
                        Section title
                        <input
                          value={r.values.title ?? ''}
                          onChange={(e) =>
                            setSheet((s) => ({
                              ...s,
                              custom: s.custom.map((r, n) =>
                                n === i
                                  ? {
                                      ...r,
                                      values: {
                                        ...r.values,
                                        title: e.target.value,
                                      },
                                    }
                                  : r,
                              ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        Details
                        <textarea
                          value={r.values.content ?? ''}
                          onChange={(e) =>
                            setSheet((s) => ({
                              ...s,
                              custom: s.custom.map((r, n) =>
                                n === i
                                  ? {
                                      ...r,
                                      values: {
                                        ...r.values,
                                        content: e.target.value,
                                      },
                                    }
                                  : r,
                              ),
                            }))
                          }
                        />
                      </label>
                      <button
                        onClick={() => {
                          setUndo(sheet);
                          setSheet((s) => ({
                            ...s,
                            custom: s.custom.filter((_, n) => n !== i),
                          }));
                          setNotice('Section removed.');
                        }}
                      >
                        Remove section
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setSheet((s) => ({ ...s, custom: [...s.custom, row()] }))
                    }
                  >
                    <Plus size={16} />
                    Add custom section
                  </button>
                </details>
                <button
                  className="new-character"
                  onClick={() => setPending(blank())}
                >
                  New character
                </button>
              </div>
            </div>
            <div
              className={`character-document character-second ${characterPage === 2 ? 'active' : ''}`}
            >
              <CharacterPageTwo
                fields={sheet.fields}
                onChange={set}
                fit={fit}
                ready={ready}
              />
            </div>
          </TabsContent>
          <TabsContent value="spells" keepMounted>
            <Spellbook
              fields={sheet.fields}
              onChange={(fields) => setSheet((s) => ({ ...s, fields }))}
              fit={fit}
              ready={ready}
            />
          </TabsContent>
        </Tabs>
      </main>
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogTitle>Replace the current character?</AlertDialogTitle>
          <AlertDialogDescription>
            Export a backup first to keep this character. You can undo the
            replacement afterward.
          </AlertDialogDescription>
          <div className="tools">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button onClick={exportSheet}>Export current</button>
            <button
              onClick={() => {
                if (pending) {
                  setUndo(sheet);
                  setSheet(pending);
                  setPending(null);
                  setBlocked(false);
                  setNotice('Character replaced.');
                }
              }}
            >
              Replace character
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
