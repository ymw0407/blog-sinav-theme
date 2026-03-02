import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { tokenizeCode, tokenClass } from './codeHighlight';

const key = new PluginKey('codeBlockHighlight');

type Segment = {
  // Offset range in the concatenated code text
  start: number;
  end: number;
  // Absolute document position for the start of this segment
  absFrom: number;
};

function buildSegments(doc: any, codeNode: any, codePos: number) {
  const segments: Segment[] = [];
  let offset = 0;

  // Walk the *document* to get stable, absolute positions for text nodes inside this codeBlock.
  // This avoids off-by-one mismatches that can cause decorations to be dropped silently.
  doc.nodesBetween(codePos, codePos + codeNode.nodeSize, (node: any, pos: number, parent: any) => {
    if (parent?.type?.name !== 'codeBlock') return;
    if (!node.isText) return;
    const text = String(node.text ?? '');
    if (!text.length) return;
    segments.push({
      start: offset,
      end: offset + text.length,
      absFrom: pos
    });
    offset += text.length;
  });

  return { segments, total: offset };
}

function buildDecorations(doc: any) {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type?.name !== 'codeBlock') return;
    const lang = String(node.attrs?.language ?? 'plain');
    const text = String(node.textContent ?? '');
    if (!text) return;

    // Add a node-level class so we can style the frame consistently (and as a sanity check).
    decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'codehl' }));

    // Map token offsets to real PM positions by walking the codeBlock's text nodes.
    const { segments, total } = buildSegments(doc, node, pos);
    if (!segments.length || total <= 0) return;

    const tokens = tokenizeCode(text, lang);
    for (const t of tokens) {
      if (t.to <= t.from) continue;
      const from = Math.max(0, Math.min(total, t.from));
      const to = Math.max(0, Math.min(total, t.to));
      if (to <= from) continue;

      for (const seg of segments) {
        if (to <= seg.start) break;
        if (from >= seg.end) continue;
        const segFrom = Math.max(from, seg.start);
        const segTo = Math.min(to, seg.end);
        if (segTo <= segFrom) continue;
        const absFrom = seg.absFrom + (segFrom - seg.start);
        const absTo = seg.absFrom + (segTo - seg.start);
        decorations.push(Decoration.inline(absFrom, absTo, { class: tokenClass(t.kind) }));
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const CodeBlockHighlight = Extension.create({
  name: 'codeBlockHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        state: {
          init: (_, state) => buildDecorations(state.doc),
          apply: (tr, prev, _oldState, newState) => {
            if (tr.docChanged) return buildDecorations(newState.doc);
            return prev;
          }
        },
        props: {
          decorations: (state) => key.getState(state) ?? DecorationSet.empty
        }
      })
    ];
  }
});
