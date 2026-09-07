'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Download,
  Upload,
  Printer,
  Plus,
  Trash2,
  Shield,
  Heart,
  Check,
  RotateCcw,
} from 'lucide-react';
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
const identity = [
  'Player’s name',
  'Race',
  'Class',
  'Level',
  'Alignment',
  'Homeland',
  'Family',
  'Race / clan',
  'Liege / patron',
  'Religion',
  'Sex',
  'Age',
  'Social class',
  'Status',
  'Height',
  'Weight',
  'Birth rank',
  'Number of siblings',
  'Hair',
  'Eyes',
  'Appearance',
  'Honor',
  'Base honor',
  'Reaction adjustment',
];
const weaponCols = [
  'Weapon',
  'Attacks / round',
  'Attack adjustment',
  'Damage adjustment',
  'THAC0',
  'Damage (S/M)',
  'Damage (L)',
  'Range',
  'Weight',
  'Size',
  'Type',
  'Speed',
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
function Section({
  id,
  num,
  title,
  detail,
  children,
}: {
  id: string;
  num: string;
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <div className="section-title">
        <h2>
          <span>{num}</span>
          {title}
        </h2>
        {detail && <span>{detail}</span>}
      </div>
      {children}
    </section>
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
  const field = (label: string, key = label, placeholder = '—') => (
    <label key={key}>
      {label}
      <input
        value={sheet.fields[key] ?? ''}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  );
  const area = (label: string, key = label) => (
    <label className="text-field">
      {label}
      <textarea
        rows={5}
        value={sheet.fields[key] ?? ''}
        placeholder="Add your notes…"
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  );
  const add = (key: 'weapons' | 'skills' | 'ammo' | 'custom') =>
    setSheet((s) => ({ ...s, [key]: [...s[key], row()] }));
  const edit = (
    key: 'weapons' | 'skills' | 'ammo' | 'custom',
    id: string,
    col: string,
    value: string,
  ) =>
    setSheet((s) => ({
      ...s,
      [key]: s[key].map((r) =>
        r.id === id ? { ...r, values: { ...r.values, [col]: value } } : r,
      ),
    }));
  const remove = (
    key: 'weapons' | 'skills' | 'ammo' | 'custom',
    id: string,
  ) => {
    setUndo(sheet);
    setSheet((s) => ({ ...s, [key]: s[key].filter((r) => r.id !== id) }));
    setNotice('Entry removed.');
  };
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
  const repeat = (key: 'weapons' | 'skills', cols: string[], title: string) => (
    <>
      <div className={'repeat-list ' + key}>
        {sheet[key].map((r, i) => (
          <article className="entry" key={r.id}>
            <div className="entry-heading">
              <span>
                {title} {String(i + 1).padStart(2, '0')}
              </span>
              <button
                className="icon-button no-print"
                aria-label={`Remove ${title.toLowerCase()} ${i + 1}`}
                onClick={() => remove(key, r.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="entry-fields">
              {cols.map((col) => (
                <label key={col}>
                  {col}
                  <input
                    aria-label={`${title} ${i + 1}: ${col}`}
                    placeholder="—"
                    value={r.values[col] ?? ''}
                    onChange={(e) => edit(key, r.id, col, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
      {sheet[key].length === 0 && (
        <p className="empty">
          {key === 'weapons'
            ? 'No weapons recorded. Add your first weapon to prepare for combat.'
            : 'Record your proficiencies, skills, and languages here.'}
        </p>
      )}
      <button className="add-button no-print" onClick={() => add(key)}>
        <Plus size={16} />
        Add {title.toLowerCase()}
      </button>
    </>
  );
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <BookOpen size={25} /> CHARACTER FOLIO <span>AD&D 2ND EDITION</span>
        </div>
        <div className="actions">
          <button disabled={!ready} onClick={() => upload.current?.click()}>
            <Upload size={16} />
            Import
          </button>
          <button disabled={!ready} onClick={exportSheet}>
            <Download size={16} />
            Export
          </button>
          <button onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </button>
        </div>
        <input
          ref={upload}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={(e) => void importSheet(e.target.files?.[0])}
        />
      </header>
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">UNOFFICIAL CHARACTER RECORD</p>
            <h1>
              {sheet.fields['Character name'] || 'An unwritten adventure.'}
            </h1>
            <output className="save-status">
              <Check size={14} />
              {status}
            </output>
          </div>
          <span className="edition">
            2e<span>CHARACTER SHEET</span>
          </span>
        </div>
        <nav aria-label="Sheet sections">
          <a href="#identity">Character</a>
          <a href="#abilities">Abilities</a>
          <a href="#combat">Combat</a>
          <a href="#weapons">Weapons</a>
          <a href="#notes">Skills & notes</a>
        </nav>
        {notice && (
          <output className="notice no-print">
            <span>{notice}</span>
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
            <button aria-label="Dismiss message" onClick={() => setNotice('')}>
              ×
            </button>
          </output>
        )}
        <fieldset disabled={!ready} className="sheet-content">
          <Section
            id="identity"
            num="01"
            title="Character"
            detail="The person behind the legend"
          >
            <div className="identity-top">
              <label className="name-field">
                Character name
                <input
                  value={sheet.fields['Character name'] ?? ''}
                  placeholder="Name your adventurer"
                  onChange={(e) => set('Character name', e.target.value)}
                />
              </label>
              <span className="record-stamp">
                PLAYER
                <br />
                RECORD
              </span>
            </div>
            <div className="field-grid">
              {identity.slice(0, 6).map((x) => field(x))}
            </div>
            <details className="biography" open>
              <summary>Personal details & background</summary>
              <div className="field-grid">
                {identity.slice(6).map((x) => field(x))}
              </div>
            </details>
          </Section>
          <Section
            id="abilities"
            num="02"
            title="Abilities"
            detail="Scores and modifiers are yours to set"
          >
            <div className="ability-list">
              {abilities.map(([abbr, name, ...mods]) => (
                <div className="ability-row" key={abbr}>
                  <label className="ability-score">
                    <span>{abbr}</span>
                    <input
                      aria-label={`${name} score`}
                      placeholder="—"
                      value={sheet.fields[abbr] ?? ''}
                      onChange={(e) => set(abbr, e.target.value)}
                    />
                    <small>{name}</small>
                  </label>
                  <div className="modifiers">
                    {mods.map((m) => field(m, abbr + ':' + m))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <div id="combat" className="combat-grid">
            <Section id="armor" num="03" title="Armor">
              <div className="armor-fields">
                <div className="stat-emblem">
                  <Shield size={28} />
                  {field('Armor class', 'AC')}
                </div>
                <div className="field-grid compact">
                  {['Adjusted AC', 'Surprised', 'Shieldless', 'Rear'].map((x) =>
                    field(x),
                  )}
                </div>
              </div>
              {area('Armor type (pieces)')}
              {area('Defenses')}
            </Section>
            <Section id="health" num="04" title="Hit points">
              <div className="health-fields">
                <Heart size={30} />
                {field('Current HP')}
                {field('Maximum HP')}
              </div>
              {area('Wounds')}
            </Section>
            <Section id="movement" num="05" title="Movement">
              <div className="movement-row header-row">
                <span>Movement</span>
                <span>Load / modifier</span>
                <span>Rate</span>
              </div>
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
              ].map((x) => (
                <div className="movement-row" key={x}>
                  <span>{x}</span>
                  {field(x + ' load', 'move:' + x + ':load')}
                  {field(x + ' rate', 'move:' + x + ':rate')}
                </div>
              ))}
            </Section>
            <Section id="saves" num="06" title="Saving throws">
              <div className="movement-row header-row">
                <span>Save against</span>
                <span>Modifier</span>
                <span>Save</span>
              </div>
              {[
                'Paralyze / poison',
                'Rod, staff, or wand',
                'Petrify / polymorph',
                'Breath weapon',
                'Spells',
              ].map((x) => (
                <div className="movement-row" key={x}>
                  <span>{x}</span>
                  {field(x + ' modifier', 'save:' + x + ':modifier')}
                  {field(x + ' save', 'save:' + x + ':save')}
                </div>
              ))}
            </Section>
          </div>
          <Section
            id="weapons"
            num="07"
            title="Weapon chart"
            detail="Your arsenal, at a glance"
          >
            {repeat('weapons', weaponCols, 'Weapon')}
            {area('Special attacks')}
            <div className="subheading">
              <h3>Ammunition</h3>
              <button className="no-print" onClick={() => add('ammo')}>
                <Plus size={16} />
                Add ammunition
              </button>
            </div>
            {sheet.ammo.length === 0 && (
              <p className="empty">
                Add an ammunition type, then tap boxes to mark rounds used.
              </p>
            )}
            {sheet.ammo.map((r, i) => (
              <div className="ammo-entry" key={r.id}>
                <label>
                  Ammunition type
                  <input
                    placeholder="e.g. Arrows"
                    value={r.values.name ?? ''}
                    onChange={(e) => edit('ammo', r.id, 'name', e.target.value)}
                  />
                </label>
                <div className="ammo-checks">
                  {Array.from({ length: 20 }, (_, n) => (
                    <Checkbox
                      key={n}
                      aria-label={`${r.values.name || 'Ammunition ' + (i + 1)} round ${n + 1} used`}
                      checked={r.values['used' + n] === 'true'}
                      onCheckedChange={(checked) =>
                        edit('ammo', r.id, 'used' + n, String(checked))
                      }
                    />
                  ))}
                </div>
                <button
                  className="icon-button no-print"
                  aria-label={`Remove ammunition ${i + 1}`}
                  onClick={() => remove('ammo', r.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Section>
          <Section id="notes" num="08" title="Skills & special abilities">
            <div className="notes-grid">
              {area('Special abilities')}
              {area('Adventure notes')}
            </div>
            <h3>Proficiencies / skills / languages</h3>
            {repeat(
              'skills',
              ['Name', 'Category', 'Rating / slots', 'Check / modifier'],
              'Proficiency',
            )}
          </Section>
          <Section
            id="custom"
            num="09"
            title="Make it your own"
            detail="Extra fields for your campaign"
          >
            {sheet.custom.map((r, i) => (
              <div className="custom-entry" key={r.id}>
                <label>
                  Field or section title
                  <input
                    placeholder="e.g. Spellbook, equipment, treasure…"
                    value={r.values.title ?? ''}
                    onChange={(e) =>
                      edit('custom', r.id, 'title', e.target.value)
                    }
                  />
                </label>
                <label>
                  Details
                  <textarea
                    rows={4}
                    value={r.values.content ?? ''}
                    onChange={(e) =>
                      edit('custom', r.id, 'content', e.target.value)
                    }
                  />
                </label>
                <button
                  className="no-print"
                  onClick={() => remove('custom', r.id)}
                  aria-label={`Remove custom section ${i + 1}`}
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            ))}
            <button
              className="add-button no-print"
              onClick={() => add('custom')}
            >
              <Plus size={16} />
              Add custom section
            </button>
          </Section>
        </fieldset>
        <div className="bottom-note no-print">
          <span>
            Automatically saved on this device. Export a backup to use
            elsewhere.
          </span>
          <button onClick={() => setPending(blank())}>
            <Plus size={16} />
            New character
          </button>
        </div>
        <footer>
          Character Folio · Unofficial AD&D 2nd Edition record · All values are
          manually editable.
        </footer>
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
            Export a backup first if you want to keep this character. You can
            also undo the replacement afterward.
          </AlertDialogDescription>
          <div className="actions">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button onClick={exportSheet}>Export current</button>
            <button
              className="primary"
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


