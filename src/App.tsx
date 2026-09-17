import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, Braces, Check, Columns2, Copy, Download, FileCode2, FilePlus2, FolderOpen, GitCompareArrows, Keyboard, Minus, Monitor, Moon, Plus, RotateCcw, Settings2, ShieldCheck, Sun, WrapText, X } from 'lucide-react';
import { createTwoFilesPatch, diffLines } from 'diff';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { DiffEditor, type EditorHandle } from './components/DiffEditor';
import { original, modified } from './sample';
import { version as appVersion } from '../package.json';
import './App.css';

type Theme = 'system' | 'light' | 'dark';
function restoreTheme(): Theme {
  try {
    const value = localStorage.getItem('diffchecker-theme');
    if (value === 'system' || value === 'light' || value === 'dark') return value;
    if (value === 'monokai') return 'dark';
    const previous = JSON.parse(localStorage.getItem('diffchecker-session') || 'null');
    if (previous?.theme === 'light' || previous?.theme === 'dark') return previous.theme;
  } catch { /* Storage may be unavailable. */ }
  return 'system';
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return <button role="switch" aria-checked={value} onClick={onChange} className="flex w-full items-center justify-between gap-3 py-2 text-xs"><span>{label}</span><span className={`flex h-[18px] w-8 shrink-0 items-center rounded-full p-[3px] transition-colors ${value ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700'}`}><span className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[14px]' : ''}`} /></span></button>;
}
function App() {
  const [texts, setTexts] = useState<[string, string]>(['', '']);
  const [names, setNames] = useState<[string, string]>(['original.txt', 'modified.txt']);
  const [theme, setTheme] = useState<Theme>(restoreTheme);
  const [systemDark, setSystemDark] = useState(matchMedia('(prefers-color-scheme: dark)').matches);
  const [wrap, setWrap] = useState(true);
  const [collapse, setCollapse] = useState(false);
  const [language, setLanguage] = useState('Plain text');
  const [chunks, setChunks] = useState(0);
  const [toast, setToast] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const editor = useRef<EditorHandle>(null);
  const file = useRef<HTMLInputElement>(null);
  const importSide = useRef(0);
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  const stats = useMemo(() => {
    const changes = diffLines(texts[0], texts[1], { timeout: 100 });
    if (!changes) return null;
    return changes.reduce((sum, c) => ({ removed: sum.removed + (c.removed ? c.count || 0 : 0), added: sum.added + (c.added ? c.count || 0 : 0) }), { removed: 0, added: 0 });
  }, [texts]);
  useEffect(() => {
    if (isTauri()) {
      const window = getCurrentWindow();
      let disposed = false;
      let unlisten: (() => void) | undefined;
      void window.onThemeChanged(({ payload }) => setSystemDark(payload === 'dark')).then(stop => {
        if (disposed) stop();
        else unlisten = stop;
      }).catch(() => {});
      void window.theme().then(value => {
        if (!disposed && value) setSystemDark(value === 'dark');
      }).catch(() => {});
      return () => { disposed = true; unlisten?.(); };
    }
    const query = matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setSystemDark(query.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => { try { localStorage.setItem('diffchecker-theme', theme); } catch { /* Storage may be unavailable. */ } }, [theme]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 4000); return () => clearTimeout(id); }, [toast]);
  const replace = (a: string, b: string) => { editor.current?.replace(a, b); setTexts([a, b]); };
  const copy = async (side: number) => { try { await navigator.clipboard.writeText(texts[side]); setToast(`${side ? 'Modified' : 'Original'} text copied`); } catch { setToast('Clipboard unavailable. Select text in the editor and use your copy shortcut.'); } };
  const exportPatch = async () => {
    try {
      const patch = createTwoFilesPatch(names[0], names[1], texts[0], texts[1], '', '', { timeout: 1000 });
      if (patch === undefined) throw new Error('Comparison is too large to export. Try smaller files.');
      if (isTauri()) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        const path = await save({ defaultPath: 'comparison.patch', filters: [{ name: 'Patch', extensions: ['patch', 'diff'] }] });
        if (!path) return;
        await writeTextFile(path, patch);
      } else {
        const url = URL.createObjectURL(new Blob([patch], { type: 'text/plain' }));
        const a = document.createElement('a'); a.href = url; a.download = 'comparison.patch'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setToast('Patch exported');
    } catch (error) { setToast(`Export failed: ${String(error)}`); }
  };
  const loadFile = async (selected?: File) => {
    if (!selected) return;
    const side = importSide.current;
    try {
      if (selected.size > 2_000_000) throw new Error('Please choose a text file smaller than 2 MB.');
      const content = await selected.text();
      if (content.includes('\0')) throw new Error('This looks like a binary file. Please choose a text file.');
      replace(side === 0 ? content : texts[0], side === 1 ? content : texts[1]);
      setNames(previous => side === 0 ? [selected.name, previous[1]] : [previous[0], selected.name]);
      const ext = selected.name.split('.').pop() || '';
      setLanguage(({ ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', json: 'JSON', css: 'CSS', html: 'HTML', md: 'Markdown' } as Record<string, string>)[ext] || 'Plain text');
    } catch (error) { setToast(String(error)); }
  };
  return <div className="flex h-dvh min-h-[500px] min-w-[680px] flex-col overflow-hidden">
    <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-slate-200/80 px-6 dark:border-white/[0.07]">
      <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-violet-600 text-white shadow-sm shadow-violet-500/20"><GitCompareArrows size={19} strokeWidth={1.8} /></div><h1 className="text-[15px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">DiffChecker</h1><span className="ml-3 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400 dark:border-white/10">WORKSPACE</span></div>
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#1b1e25]">{([{ value: 'light', icon: Sun }, { value: 'dark', icon: Moon }, { value: 'system', icon: Monitor }] as const).map(({ value, icon: Icon }) => <button key={value} title={`${value[0].toUpperCase() + value.slice(1)} theme`} aria-label={`${value} theme`} aria-pressed={theme === value} onClick={() => setTheme(value)} className={`rounded-md px-2 py-1.5 ${theme === value ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><Icon size={14} /></button>)}</div>
    </header>
    <div className="flex h-[61px] shrink-0 items-center justify-between gap-3 px-5">
      <div className="flex items-center gap-3"><button onClick={() => setShowTools(!showTools)} aria-pressed={showTools} className={`tool-button ${showTools ? 'bg-slate-200/60 dark:bg-white/5' : ''}`}><Settings2 size={14} /> Tools</button><span className="h-5 w-px bg-slate-200 dark:bg-white/10" /><span className="text-xs font-medium">Text comparison</span><span className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live</span></div>
      <div className="flex gap-1"><button className="tool-button" onClick={() => setConfirmClear(true)}><FilePlus2 size={14} />New comparison</button><button onClick={exportPatch} className="tool-button border border-slate-200 bg-white shadow-xs dark:border-white/10 dark:bg-[#23262e]"><Download size={14} />Export patch</button></div>
    </div>
    <main className="flex min-h-0 flex-1 gap-4 px-5 pb-5">
      {showTools && <aside className="flex w-[190px] shrink-0 flex-col pr-1 pt-3">
        <div className="section-label">Comparison</div><div className="mb-5 flex items-center gap-2 rounded-lg border border-violet-200/60 bg-violet-50 px-3 py-2.5 text-xs font-medium text-violet-600 dark:border-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300"><Columns2 size={14} />Side by side<Check className="ml-auto" size={12} /></div>
        <div className="section-label">Editor settings</div><Toggle label="Wrap long lines" value={wrap} onChange={() => setWrap(!wrap)} /><Toggle label="Hide unchanged lines" value={collapse} onChange={() => setCollapse(!collapse)} />
        <label className="mb-2 mt-6 text-[11px] text-slate-400" htmlFor="syntax">Syntax highlighting</label><select id="syntax" className="select-input" value={language} onChange={e => setLanguage(e.target.value)}>{['Plain text', 'TypeScript', 'JavaScript', 'JSON', 'HTML', 'CSS', 'Markdown'].map(name => <option key={name}>{name}</option>)}</select>
        <div className="my-6 h-px bg-slate-200/80 dark:bg-white/[0.07]" /><div className="section-label">Text tools</div>
        <button className="tool-button justify-start !px-2" onClick={() => { replace(texts[1], texts[0]); setNames([names[1], names[0]]); }}><ArrowLeftRight size={14} />Swap sides</button>
        <button className="tool-button justify-start !px-2" onClick={() => { replace(texts[0].replace(/[\t ]+$/gm, ''), texts[1].replace(/[\t ]+$/gm, '')); setToast('Trailing whitespace removed from both sides'); }}><WrapText size={14} />Trim trailing spaces</button>
        <button className="tool-button justify-start !px-2" onClick={() => { replace(original, modified); setNames(['binary-search.ts', 'binary-search.ts']); setLanguage('TypeScript'); }}><RotateCcw size={14} />Load example</button>
        <div className="mt-auto rounded-xl border border-slate-200/70 bg-white/50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]"><ShieldCheck size={17} className="mb-2 text-slate-400" /><p className="text-[11px] font-medium">Just between your files.</p><p className="mt-1 text-[10px] leading-relaxed text-slate-400">Comparisons stay on this device. Export a patch to keep a copy.</p></div>
      </aside>}
      <section aria-label="Text comparison editors" className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_0_#00000003] dark:border-white/10 dark:bg-[#1b1e25]">
        <div className="grid shrink-0 grid-cols-2 border-b border-slate-200 dark:border-white/10">{[0, 1].map(side => <div key={side} className={`flex h-[62px] items-center justify-between gap-2 px-4 ${side ? 'border-l border-slate-200 dark:border-white/10' : ''}`}><div className="flex min-w-0 items-center gap-2.5"><FileCode2 size={16} className="shrink-0 text-slate-400" /><div className="min-w-0"><div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{side ? 'Modified' : 'Original'}</div><div className="mt-0.5 truncate text-[10px] text-slate-400">{names[side]}</div></div></div><div className="flex"><button title={`Open ${side ? 'modified' : 'original'} file`} aria-label={`Open ${side ? 'modified' : 'original'} file`} className="tool-button !px-2" onClick={() => { importSide.current = side; file.current?.click(); }}><FolderOpen size={14} /></button><button title={`Copy ${side ? 'modified' : 'original'} text`} aria-label={`Copy ${side ? 'modified' : 'original'} text`} className="tool-button !px-2" onClick={() => copy(side)}><Copy size={13} /></button></div></div>)}</div>
        <div className="grid shrink-0 grid-cols-2 border-b border-slate-100 dark:border-white/5">{[0, 1].map(side => <div key={side} className={`flex h-10 items-center justify-between px-4 text-[10px] ${side ? 'border-l border-slate-200 dark:border-white/10' : ''}`}><span className={`flex items-center gap-1.5 font-medium ${side ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#cf715e] dark:text-orange-300'}`}>{side ? <Plus size={12} /> : <Minus size={12} />}{stats ? (side ? stats.added : stats.removed) : '—'} {(side ? stats?.added : stats?.removed) === 1 ? (side ? 'addition' : 'removal') : (side ? 'additions' : 'removals')}</span><span className="text-slate-400">{texts[side] ? texts[side].split('\n').length : 0} lines</span></div>)}</div>
        <DiffEditor ref={editor} initial={['', '']} onChange={(a, b, count) => { setTexts([a, b]); setChunks(count); }} wrap={wrap} collapse={collapse} language={language} dark={dark} />
        <div className="flex h-11 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 dark:border-white/10 dark:bg-white/[0.015]"><span className="flex items-center gap-2 text-[10px] text-slate-400"><Braces size={13} />{language}<span className="mx-1 text-slate-300 dark:text-slate-600">/</span>UTF-8</span><div className="flex items-center gap-2"><span className="mr-1 text-[10px] text-slate-400">{chunks ? `${chunks} changed ${chunks === 1 ? 'section' : 'sections'}` : texts[0] || texts[1] ? 'Texts are identical' : 'Ready to compare'}</span><button disabled={!chunks} aria-label="Previous change" title="Previous change" className="tool-button !p-1.5" onClick={() => editor.current?.navigate(-1)}><ArrowUp size={13} /></button><button disabled={!chunks} aria-label="Next change" title="Next change" className="tool-button !p-1.5" onClick={() => editor.current?.navigate(1)}><ArrowDown size={13} /></button></div></div>
      </section>
    </main>
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200/70 px-6 text-[10px] text-slate-400 dark:border-white/[0.07]"><span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500" />Private on this device</span><span className="flex items-center gap-1.5"><Keyboard size={12} />⌘ / Ctrl + F to find<span className="mx-2 opacity-40">|</span>DiffChecker v{appVersion}</span></footer>
    <input ref={file} type="file" className="hidden" aria-label="Import text file" onChange={e => { void loadFile(e.target.files?.[0]); e.target.value = ''; }} />
    {toast && <div role="status" className="fixed bottom-12 left-1/2 z-50 flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs shadow-lg dark:border-white/10 dark:bg-slate-800">{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}
    {confirmClear && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="new-title" className="w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#23262e]"><h2 id="new-title" className="text-base font-semibold">Start a new comparison?</h2><p className="mt-2 text-xs leading-relaxed text-slate-400">Both editors will be cleared. You can undo in each editor to recover your text.</p><div className="mt-6 flex justify-end gap-2"><button autoFocus className="tool-button" onClick={() => setConfirmClear(false)}>Cancel</button><button className="tool-button !bg-violet-600 !text-white" onClick={() => { replace('', ''); setNames(['original.txt', 'modified.txt']); setConfirmClear(false); }}>New comparison</button></div></div></div>}
  </div>;
}
export default App;
