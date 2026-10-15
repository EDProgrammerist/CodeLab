import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/languages/definitions/java/register'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }
loader.config({ monaco })

export function JavaEditor({
  value,
  onChange,
  readOnly,
}: {
  value: string
  onChange: (code: string) => void
  readOnly: boolean
}) {
  return (
    <Editor
      height="380px"
      language="java"
      value={value}
      onChange={(code) => onChange(code ?? '')}
      loading={
        <p className="p-6" role="status">
          Loading Java editor…
        </p>
      }
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbersMinChars: 3,
        padding: { top: 20 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        ariaLabel: 'Java source code',
        wordWrap: 'on',
        accessibilitySupport: 'on',
      }}
    />
  )
}
