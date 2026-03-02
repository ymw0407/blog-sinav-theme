import React from 'react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

function detectLineCount(text: string) {
  if (!text) return 1;
  // Preserve trailing empty line when text ends with '\n'
  const parts = text.split('\n');
  return Math.max(1, parts.length);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / restricted contexts
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function FancyCodeBlockView(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props;
  const editable = editor.isEditable;

  const lang = String(node.attrs.language ?? 'plain');
  const title = String(node.attrs.title ?? '');
  const text = String(node.textContent ?? '');
  const lineCount = detectLineCount(text);

  const [copied, setCopied] = React.useState(false);

  return (
    <NodeViewWrapper className="fancyCodeBlock" data-language={lang} data-has-title={title ? 'true' : 'false'}>
      <div className="fancyCodeHeader" contentEditable={false}>
        <div className="fancyCodeTitleWrap">
          {editable ? (
            <input
              className="fancyCodeTitleInput"
              value={title}
              placeholder="Untitled"
              onChange={(e) => updateAttributes({ title: e.target.value })}
            />
          ) : title ? (
            <div className="fancyCodeTitleText">{title}</div>
          ) : null}
        </div>

        <div className="fancyCodeActions">
          {editable ? (
            <select
              className="select fancyCodeLangSelect"
              aria-label="Code language"
              value={lang}
              onChange={(e) => updateAttributes({ language: e.target.value })}
            >
              <option value="plain">Plain</option>
              <option value="bash">Bash</option>
              <option value="cpp">C++</option>
              <option value="css">CSS</option>
              <option value="go">Go</option>
              <option value="html">HTML</option>
              <option value="js">JavaScript</option>
              <option value="ts">TypeScript</option>
              <option value="json">JSON</option>
              <option value="md">Markdown</option>
              <option value="python">Python</option>
              <option value="sql">SQL</option>
              <option value="yaml">YAML</option>
            </select>
          ) : (
            <span className="fancyCodeLangPill" aria-label="Code language">
              {lang}
            </span>
          )}
          <button
            type="button"
            className="fancyCodeCopyBtn"
            onClick={async () => {
              const ok = await copyToClipboard(text);
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 900);
            }}
            aria-label="Copy code"
            title="Copy"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="fancyCodeScroller">
        <div className="fancyCodeGutter" aria-hidden="true">
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx} className="fancyCodeLineNo">
              {idx + 1}
            </div>
          ))}
        </div>

        <pre className="fancyCodePre">
          <NodeViewContent as="code" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
