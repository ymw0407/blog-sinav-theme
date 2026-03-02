import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

type EmojiItem = { emoji: string; name: string; keywords: string[] };

const EMOJIS: EmojiItem[] = [
  { emoji: '😀', name: 'grinning', keywords: ['smile'] },
  { emoji: '😂', name: 'joy', keywords: ['lol', 'funny'] },
  { emoji: '🥲', name: 'smile_tear', keywords: ['bittersweet'] },
  { emoji: '😍', name: 'heart_eyes', keywords: ['love'] },
  { emoji: '👍', name: 'thumbsup', keywords: ['like', 'ok'] },
  { emoji: '🙏', name: 'pray', keywords: ['thanks', 'please'] },
  { emoji: '🔥', name: 'fire', keywords: ['hot'] },
  { emoji: '✨', name: 'sparkles', keywords: ['star'] },
  { emoji: '💡', name: 'bulb', keywords: ['idea'] },
  { emoji: '🧠', name: 'brain', keywords: ['think'] },
  { emoji: '📝', name: 'memo', keywords: ['note', 'write'] },
  { emoji: '📌', name: 'pin', keywords: ['pinned'] },
  { emoji: '✅', name: 'check', keywords: ['done', 'ok'] },
  { emoji: '❌', name: 'cross', keywords: ['no'] },
  { emoji: '⚠️', name: 'warning', keywords: ['caution'] },
  { emoji: '🔎', name: 'search', keywords: ['find'] },
  { emoji: '🚀', name: 'rocket', keywords: ['launch'] },
  { emoji: '🛠️', name: 'tools', keywords: ['build'] },
  { emoji: '🐛', name: 'bug', keywords: ['debug'] },
  { emoji: '📷', name: 'camera', keywords: ['photo'] },
  { emoji: '🎞️', name: 'film', keywords: ['movie'] },
  { emoji: '☕', name: 'coffee', keywords: ['cafe'] },
  { emoji: '🍺', name: 'beer', keywords: ['drink'] },
  { emoji: '🌙', name: 'moon', keywords: ['night'] },
  { emoji: '🌊', name: 'wave', keywords: ['sea', 'ocean'] },
  { emoji: '🌲', name: 'tree', keywords: ['nature'] },
  { emoji: '📚', name: 'books', keywords: ['study'] },
  { emoji: '🎓', name: 'graduation', keywords: ['education'] },
  { emoji: '🏆', name: 'trophy', keywords: ['award'] },
  { emoji: '🏅', name: 'medal', keywords: ['award'] },
  { emoji: '🧩', name: 'puzzle', keywords: ['problem'] },
  { emoji: '💻', name: 'laptop', keywords: ['code', 'dev'] },
  { emoji: '🧪', name: 'test_tube', keywords: ['test'] },
  { emoji: '📦', name: 'package', keywords: ['deploy'] },
  { emoji: '🔒', name: 'lock', keywords: ['security'] },
  { emoji: '🌐', name: 'globe', keywords: ['web'] }
];

type EmojiState =
  | { active: false }
  | { active: true; from: number; to: number; query: string; selected: number };

const key = new PluginKey<EmojiState>('emojiSuggestion');

function matchEmoji(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return EMOJIS.slice(0, 8);
  const scored = EMOJIS.map((e) => {
    const hay = [e.name, ...e.keywords].join(' ');
    let score = 0;
    if (e.name.startsWith(q)) score += 4;
    if (e.name.includes(q)) score += 2;
    if (hay.includes(q)) score += 1;
    return { e, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((x) => x.e);
}

function isValidQueryChar(ch: string) {
  return /[a-z0-9_+-]/i.test(ch);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const EmojiSuggestion = Extension.create({
  name: 'emojiSuggestion',
  addProseMirrorPlugins() {
    return [
      new Plugin<EmojiState>({
        key,
        state: {
          init: () => ({ active: false }),
          apply: (tr, prev) => {
            const meta = tr.getMeta(key);
            if (meta?.type === 'open') return { active: true, from: meta.from, to: meta.to, query: '', selected: 0 };
            if (meta?.type === 'close') return { active: false };
            if (!prev.active) return prev;
            if (!tr.docChanged && !tr.selectionSet) return prev;

            const selTo = tr.selection.from;
            if (selTo < prev.from) return { active: false };

            const text = tr.doc.textBetween(prev.from, selTo, '\n', '\n');
            // Must still look like ":query"
            if (!text.startsWith(':')) return { active: false };
            const q = text.slice(1);
            if (q.length > 32) return { active: false };
            if (q && !q.split('').every(isValidQueryChar)) return { active: false };
            return { ...prev, to: selTo, query: q, selected: clamp(prev.selected, 0, Math.max(0, matchEmoji(q).length - 1)) };
          }
        },
        props: {
          handleTextInput: (view, from, to, text) => {
            // Don't interfere inside code blocks.
            const inCode = (view.state as any).selection?.$from?.parent?.type?.name === 'codeBlock';
            if (inCode) return false;

            const st = key.getState(view.state) as EmojiState;

            if (text === ':') {
              const tr = view.state.tr.insertText(':', from, to);
              tr.setMeta(key, { type: 'open', from, to: from + 1 });
              view.dispatch(tr);
              return true;
            }

            if (st?.active) {
              const tr = view.state.tr.insertText(text, from, to);
              view.dispatch(tr);
              return true;
            }

            return false;
          },
          handleKeyDown: (view, event) => {
            const st = key.getState(view.state) as EmojiState;
            if (!st?.active) return false;

            const items = matchEmoji(st.query);
            if (event.key === 'Escape') {
              view.dispatch(view.state.tr.setMeta(key, { type: 'close' }));
              return true;
            }
            if (event.key === 'ArrowDown') {
              view.dispatch(view.state.tr.setMeta(key, { type: 'noop', selected: clamp(st.selected + 1, 0, Math.max(0, items.length - 1)) }));
              // Selection stored in state via apply using prev.selected, so we need to mutate prev: easiest via a doc-less tr.
              (key as any).spec.state.apply(view.state.tr.setMeta(key, { type: 'setSelected', value: clamp(st.selected + 1, 0, Math.max(0, items.length - 1)) }), st);
              return true;
            }
            if (event.key === 'ArrowUp') {
              (key as any).spec.state.apply(view.state.tr.setMeta(key, { type: 'setSelected', value: clamp(st.selected - 1, 0, Math.max(0, items.length - 1)) }), st);
              return true;
            }

            if (event.key === 'Enter' || event.key === 'Tab') {
              const pick = items[clamp(st.selected, 0, Math.max(0, items.length - 1))];
              if (!pick) return false;
              const tr = view.state.tr.insertText(pick.emoji, st.from, st.to);
              tr.setMeta(key, { type: 'close' });
              // Add a trailing space for nicer typing flow.
              tr.insertText(' ', st.from + pick.emoji.length, st.from + pick.emoji.length);
              view.dispatch(tr);
              return true;
            }

            return false;
          }
        },
        view: (view) => {
          const el = document.createElement('div');
          el.className = 'emojiSuggest';
          el.style.display = 'none';
          document.body.appendChild(el);

          const render = () => {
            const st = key.getState(view.state) as EmojiState;
            if (!st?.active) {
              el.style.display = 'none';
              el.innerHTML = '';
              return;
            }
            const items = matchEmoji(st.query);
            if (!items.length) {
              el.style.display = 'none';
              el.innerHTML = '';
              return;
            }
            el.style.display = 'block';
            el.innerHTML = `
              <div class="emojiSuggestInner">
                ${items
                  .map((it, idx) => {
                    const active = idx === st.selected ? ' emojiItemActive' : '';
                    const label = it.name.replace(/_/g, ' ');
                    return `<button class="emojiItem${active}" type="button" data-idx="${idx}">
                      <span class="emojiGlyph">${it.emoji}</span>
                      <span class="emojiLabel">${label}</span>
                    </button>`;
                  })
                  .join('')}
              </div>
            `;

            const coords = view.coordsAtPos(view.state.selection.from);
            el.style.left = `${Math.round(coords.left)}px`;
            el.style.top = `${Math.round(coords.bottom + 8)}px`;

            el.querySelectorAll('button[data-idx]').forEach((btn) => {
              btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
              });
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = Number((e.currentTarget as HTMLElement).getAttribute('data-idx') ?? '0');
                const pick = items[clamp(idx, 0, items.length - 1)];
                if (!pick) return;
                const cur = key.getState(view.state) as EmojiState;
                if (!cur?.active) return;
                const tr = view.state.tr.insertText(pick.emoji, cur.from, cur.to);
                tr.setMeta(key, { type: 'close' });
                tr.insertText(' ', cur.from + pick.emoji.length, cur.from + pick.emoji.length);
                view.dispatch(tr);
                view.focus();
              });
            });
          };

          render();
          return {
            update: () => render(),
            destroy: () => {
              document.body.removeChild(el);
            }
          };
        }
      })
    ];
  }
});

