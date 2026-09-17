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
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export type EditorHandle = { replace: (a: string, b: string) => void; navigate: (direction: number) => void };
type Props = { initial: [string, string]; onChange: (a: string, b: string, chunks: number) => void; wrap: boolean; collapse: boolean; language: string; dark: boolean };
const languageExtension = (name: string) => ({ TypeScript: javascript({ typescript: true }), JavaScript: javascript(), JSON: json(), CSS: css(), HTML: html(), Markdown: markdown() })[name] ?? [];
const monokaiHighlight = (dark: boolean) => HighlightStyle.define([
  { tag: tags.comment, color: dark ? '#88846f' : '#6b6b60', fontStyle: 'italic' },
  { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.definitionKeyword, tags.modifier, tags.operator], color: dark ? '#f92672' : '#ba1450' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: dark ? '#e6db74' : '#756000' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: dark ? '#ae81ff' : '#7043b5' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: dark ? '#a6e22e' : '#4f7300' },
  { tag: [tags.typeName, tags.className, tags.namespace, tags.tagName], color: dark ? '#66d9ef' : '#007b8c' },
  { tag: [tags.attributeName, tags.propertyName, tags.variableName], color: dark ? '#f8f8f2' : '#272822' },
  { tag: [tags.punctuation, tags.bracket], color: dark ? '#f8f8f2' : '#272822' },
  { tag: [tags.meta, tags.processingInstruction], color: dark ? '#fd971f' : '#a65b00' },
]);
const monokaiDark = monokaiHighlight(true);
const monokaiLight = monokaiHighlight(false);
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
    for (const [i, editor] of [view.a, view.b].entries()) editor.dispatch({ effects: compartments.current[i].reconfigure([languageExtension(props.language), ...(props.wrap ? [EditorView.lineWrapping] : []), EditorView.theme({}, { dark: props.dark }), ...(props.language !== 'Plain text' ? [syntaxHighlighting(props.dark ? monokaiDark : monokaiLight)] : [])]) });
    view.reconfigure({ collapseUnchanged: props.collapse ? { margin: 2, minSize: 3 } : undefined });
  }, [props.wrap, props.collapse, props.language, props.dark]);
  return <div ref={container} className="diff-editor h-full min-h-0 flex-1 overflow-hidden" />;
});
