import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  height?: string;
  onChange?: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language = 'typescript',
  readOnly = false,
  height = '400px',
  onChange
}) => {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      options={{
        readOnly,
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-light',
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
      }}
    />
  );
};

export default CodeEditor;
