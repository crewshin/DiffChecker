import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import { EditorView, placeholder } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { markdown } from '@codemirror/lang-markdown';

export type EditorHandle = { replace: (a: string, b: string) => void; navigate: (direction: number) => void };
type Props = { initial: [string, string]; onChange: (a: string, b: string, chunks: number) => void; wrap: boolean; collapse: boolean; language: string; dark: boolean };
const languageExtension = (name: string) => ({ TypeScript: javascript({ typescript: true }), JavaScript: javascript(), JSON: json(), CSS: css(), HTML: html(), Markdown: markdown() })[name] ?? [];
export const DiffEditor = forwardRef<EditorHandle, Props>(function DiffEditor(props, ref) {
  const container = useRef<HTMLDivElement>(null);
  const merge = useRef<MergeView | null>(null);
  const callback = useRef(props.onChange);
  callback.current = props.onChange;
  const compartments = useRef([new Compartment(), new Compartment()]);
  const initial = useRef(props.initial);
  const selected = useRef(-1);
  useImperativeHandle(ref, () => ({
    replace(a, b) {
      const view = merge.current;
      if (!view) return;
      view.a.dispatch({ changes: { from: 0, to: view.a.state.doc.length, insert: a } });
      view.b.dispatch({ changes: { from: 0, to: view.b.state.doc.length, insert: b } });
      selected.current = -1;
    },
    navigate(direction) {
      const view = merge.current;
      if (!view || !view.chunks.length) return;
      selected.current = (selected.current + direction + view.chunks.length) % view.chunks.length;
      const chunk = view.chunks[selected.current];
      for (const [editor, from] of [[view.a, chunk.fromA], [view.b, chunk.fromB]] as const) {
        const pos = Math.min(from, editor.state.doc.length);
        editor.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
      }
      view.a.focus();
    },
  }), []);
  useEffect(() => {
    let pending = 0;
    const report = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        if (merge.current) callback.current(merge.current.a.state.doc.toString(), merge.current.b.state.doc.toString(), merge.current.chunks.length);
      });
    };
    const extensions = (side: number) => [basicSetup, placeholder(side ? 'Paste your modified text here…' : 'Paste your original text here…'), EditorView.contentAttributes.of({ 'aria-label': side ? 'Modified text' : 'Original text', spellcheck: 'false' }), compartments.current[side].of([]), EditorView.updateListener.of(update => { if (update.docChanged) { selected.current = -1; report(); } })];
    const view = new MergeView({ parent: container.current!, a: { doc: initial.current[0], extensions: extensions(0) }, b: { doc: initial.current[1], extensions: extensions(1) }, gutter: true, diffConfig: { timeout: 100 } });
    merge.current = view;
    report();
    return () => { cancelAnimationFrame(pending); view.destroy(); merge.current = null; };
  }, []);
  useEffect(() => {
    const view = merge.current;
    if (!view) return;
    for (const [i, editor] of [view.a, view.b].entries()) editor.dispatch({ effects: compartments.current[i].reconfigure([languageExtension(props.language), ...(props.wrap ? [EditorView.lineWrapping] : []), EditorView.theme({}, { dark: props.dark })]) });
    view.reconfigure({ collapseUnchanged: props.collapse ? { margin: 2, minSize: 3 } : undefined });
  }, [props.wrap, props.collapse, props.language, props.dark]);
  return <div ref={container} className="diff-editor h-full min-h-0 flex-1 overflow-hidden" />;
});
