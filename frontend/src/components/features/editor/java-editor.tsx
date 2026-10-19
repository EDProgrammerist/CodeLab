import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { java } from '@codemirror/lang-java'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export function JavaEditor({ value, onChange, readOnly }: {
  value: string; onChange: (code: string) => void; readOnly: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const change = useRef(onChange)
  const initial = useRef(value)
  const editable = useRef(new Compartment())
  useEffect(() => { change.current = onChange }, [onChange])
  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initial.current,
        extensions: [basicSetup, java(), EditorView.lineWrapping,
          editable.current.of([]),
          EditorView.contentAttributes.of({ 'aria-label': 'Java source code' }),
          EditorState.tabSize.of(4),
          EditorView.theme({
            '&': { height: 'clamp(380px, 55vh, 640px)', backgroundColor: '#fff', color: '#202020' },
            '&.cm-focused': { outline: '2px solid #0075de', outlineOffset: '-2px' },
            '.cm-scroller': { overflow: 'auto', fontFamily: 'Consolas, monospace', lineHeight: '1.7' },
            '.cm-content': { padding: '16px 0', fontSize: '14px', caretColor: '#0075de' },
            '.cm-line': { padding: '0 16px' },
            '.cm-gutters': { backgroundColor: '#fafaf9', color: '#646464', borderRight: '1px solid #e7e5e4' },
            '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#f0f7ff' },
            '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#cce5ff' },
          }),
          EditorView.updateListener.of(update => {
            if (update.docChanged) change.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = editor
    return () => { editor.destroy(); view.current = null }
  }, [])
  useEffect(() => {
    view.current?.dispatch({ effects: editable.current.reconfigure([
      EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly),
    ]) })
  }, [readOnly])
  useEffect(() => {
    const editor = view.current
    if (editor && editor.state.doc.toString() !== value)
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } })
  }, [value])
  return <div ref={host} className="min-w-0" />
}
