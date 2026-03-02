type TokenKind =
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'builtin'
  | 'type'
  | 'tag'
  | 'attr'
  | 'const'
  | 'punct';

export type CodeToken = {
  from: number; // inclusive, 0-based
  to: number; // exclusive, 0-based
  kind: TokenKind;
};

function isIdentStart(ch: string) {
  return /[A-Za-z_$]/.test(ch);
}
function isIdent(ch: string) {
  return /[A-Za-z0-9_$]/.test(ch);
}
function isWs(ch: string) {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function readWhile(text: string, i: number, pred: (ch: string) => boolean) {
  const start = i;
  while (i < text.length && pred(text[i]!)) i++;
  return { start, end: i };
}

function readString(text: string, i: number, quote: string) {
  const start = i;
  i++; // consume quote
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      i++;
      break;
    }
    i++;
  }
  return { start, end: i };
}

function readLineComment(text: string, i: number) {
  const start = i;
  while (i < text.length && text[i] !== '\n') i++;
  return { start, end: i };
}

function readBlockComment(text: string, i: number, endSeq: string) {
  const start = i;
  i += endSeq.length === 2 && text.slice(i, i + 2) === '/*' ? 2 : 0;
  // For callers that already advanced (e.g. "<!--"), keep current i.
  while (i < text.length) {
    if (text.startsWith(endSeq, i)) {
      i += endSeq.length;
      break;
    }
    i++;
  }
  return { start, end: i };
}

const JS_TS_KEYWORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'async',
  'await',
  'as',
  'from',
  'get',
  'set'
]);
const JS_TS_CONST = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
const JS_TS_BUILTIN = new Set([
  'console',
  'Math',
  'Date',
  'RegExp',
  'Error',
  'Promise',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Symbol',
  'JSON',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'BigInt',
  'Intl'
]);
const TS_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'never',
  'void',
  'object',
  'Record',
  'Partial',
  'Pick',
  'Omit',
  'Readonly',
  'Required'
]);

const PY_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'False',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'None',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'True',
  'try',
  'while',
  'with',
  'yield'
]);
const PY_BUILTIN = new Set(['print', 'len', 'range', 'dict', 'list', 'set', 'tuple', 'str', 'int', 'float', 'bool']);

const SQL_KEYWORDS = new Set([
  'select',
  'from',
  'where',
  'group',
  'by',
  'order',
  'limit',
  'offset',
  'join',
  'left',
  'right',
  'inner',
  'outer',
  'on',
  'as',
  'and',
  'or',
  'insert',
  'into',
  'values',
  'update',
  'set',
  'delete',
  'create',
  'table',
  'alter',
  'drop',
  'distinct',
  'having',
  'union',
  'all',
  'null',
  'is',
  'not',
  'in',
  'exists',
  'case',
  'when',
  'then',
  'else',
  'end'
]);

const GO_KEYWORDS = new Set([
  'break',
  'case',
  'chan',
  'const',
  'continue',
  'default',
  'defer',
  'else',
  'fallthrough',
  'for',
  'func',
  'go',
  'goto',
  'if',
  'import',
  'interface',
  'map',
  'package',
  'range',
  'return',
  'select',
  'struct',
  'switch',
  'type',
  'var'
]);
const GO_CONST = new Set(['true', 'false', 'iota', 'nil']);
const GO_BUILTIN = new Set([
  'append',
  'cap',
  'close',
  'complex',
  'copy',
  'delete',
  'imag',
  'len',
  'make',
  'new',
  'panic',
  'print',
  'println',
  'real',
  'recover'
]);
const GO_TYPES = new Set([
  'any',
  'bool',
  'byte',
  'comparable',
  'complex64',
  'complex128',
  'error',
  'float32',
  'float64',
  'int',
  'int8',
  'int16',
  'int32',
  'int64',
  'rune',
  'string',
  'uint',
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'uintptr'
]);

const CPP_KEYWORDS = new Set([
  'alignas',
  'alignof',
  'and',
  'and_eq',
  'asm',
  'auto',
  'bitand',
  'bitor',
  'bool',
  'break',
  'case',
  'catch',
  'char',
  'char8_t',
  'char16_t',
  'char32_t',
  'class',
  'compl',
  'concept',
  'const',
  'consteval',
  'constexpr',
  'constinit',
  'const_cast',
  'continue',
  'co_await',
  'co_return',
  'co_yield',
  'decltype',
  'default',
  'delete',
  'do',
  'double',
  'dynamic_cast',
  'else',
  'enum',
  'explicit',
  'export',
  'extern',
  'false',
  'float',
  'for',
  'friend',
  'goto',
  'if',
  'inline',
  'int',
  'long',
  'mutable',
  'namespace',
  'new',
  'noexcept',
  'not',
  'not_eq',
  'nullptr',
  'operator',
  'or',
  'or_eq',
  'private',
  'protected',
  'public',
  'register',
  'reinterpret_cast',
  'requires',
  'return',
  'short',
  'signed',
  'sizeof',
  'static',
  'static_assert',
  'static_cast',
  'struct',
  'switch',
  'template',
  'this',
  'thread_local',
  'throw',
  'true',
  'try',
  'typedef',
  'typeid',
  'typename',
  'union',
  'unsigned',
  'using',
  'virtual',
  'void',
  'volatile',
  'wchar_t',
  'while',
  'xor',
  'xor_eq'
]);
const CPP_BUILTIN = new Set([
  'std',
  'cout',
  'cin',
  'cerr',
  'clog',
  'endl',
  'move',
  'forward',
  'swap',
  'printf',
  'scanf'
]);
const CPP_TYPES = new Set([
  'size_t',
  'string',
  'wstring',
  'u8string',
  'u16string',
  'u32string',
  'vector',
  'map',
  'unordered_map',
  'set',
  'unordered_set',
  'pair',
  'tuple',
  'optional',
  'variant',
  'unique_ptr',
  'shared_ptr'
]);

function classifyIdent(lang: string, ident: string): TokenKind | null {
  const low = ident.toLowerCase();
  if (lang === 'ts') {
    if (JS_TS_KEYWORDS.has(ident)) return 'keyword';
    if (JS_TS_CONST.has(ident)) return 'const';
    if (JS_TS_BUILTIN.has(ident)) return 'builtin';
    if (TS_TYPES.has(ident)) return 'type';
    if (SQL_KEYWORDS.has(low)) return 'keyword';
    return null;
  }
  if (lang === 'js') {
    if (JS_TS_KEYWORDS.has(ident)) return 'keyword';
    if (JS_TS_CONST.has(ident)) return 'const';
    if (JS_TS_BUILTIN.has(ident)) return 'builtin';
    return null;
  }
  if (lang === 'python' || lang === 'py') {
    if (PY_KEYWORDS.has(ident)) return 'keyword';
    if (PY_BUILTIN.has(ident)) return 'builtin';
    return null;
  }
  if (lang === 'sql') {
    if (SQL_KEYWORDS.has(low)) return 'keyword';
    return null;
  }
  if (lang === 'yaml' || lang === 'yml') {
    if (ident === 'true' || ident === 'false' || ident === 'null') return 'const';
    return null;
  }
  if (lang === 'bash' || lang === 'sh') {
    if (ident === 'true' || ident === 'false') return 'const';
    if (ident === 'echo' || ident === 'cd' || ident === 'export' || ident === 'set' || ident === 'unset') return 'builtin';
    return null;
  }
  if (lang === 'css') {
    if (ident.startsWith('--')) return 'attr';
    return null;
  }
  if (lang === 'go') {
    if (GO_KEYWORDS.has(ident)) return 'keyword';
    if (GO_CONST.has(ident)) return 'const';
    if (GO_BUILTIN.has(ident)) return 'builtin';
    if (GO_TYPES.has(ident)) return 'type';
    return null;
  }
  if (lang === 'cpp' || lang === 'c') {
    if (CPP_KEYWORDS.has(ident)) return 'keyword';
    if (CPP_BUILTIN.has(ident)) return 'builtin';
    if (CPP_TYPES.has(ident)) return 'type';
    return null;
  }
  return null;
}

function normalizeLang(langRaw: string) {
  const lang = (langRaw || 'plain').toLowerCase();
  if (lang === 'typescript') return 'ts';
  if (lang === 'javascript') return 'js';
  if (lang === 'py') return 'python';
  if (lang === 'shell') return 'bash';
  if (lang === 'sh') return 'bash';
  if (lang === 'yml') return 'yaml';
  if (lang === 'golang') return 'go';
  if (lang === 'c++' || lang === 'cxx' || lang === 'cc' || lang === 'hpp' || lang === 'hxx') return 'cpp';
  if (lang === 'c') return 'c';
  return lang;
}

function readNumber(text: string, i: number) {
  const start = i;
  // 0x.. 0b.. 0o..
  if (text[i] === '0' && i + 1 < text.length) {
    const n1 = text[i + 1]!;
    if (n1 === 'x' || n1 === 'X') {
      i += 2;
      while (i < text.length && /[0-9a-fA-F]/.test(text[i]!)) i++;
      return { start, end: i };
    }
    if (n1 === 'b' || n1 === 'B') {
      i += 2;
      while (i < text.length && /[01]/.test(text[i]!)) i++;
      return { start, end: i };
    }
    if (n1 === 'o' || n1 === 'O') {
      i += 2;
      while (i < text.length && /[0-7]/.test(text[i]!)) i++;
      return { start, end: i };
    }
  }
  i = readWhile(text, i, (ch) => /[0-9_]/.test(ch)).end;
  if (text[i] === '.' && /[0-9]/.test(text[i + 1] ?? '')) {
    i++;
    i = readWhile(text, i, (ch) => /[0-9_]/.test(ch)).end;
  }
  if (/[eE]/.test(text[i] ?? '')) {
    const j = i + 1;
    const sign = text[j];
    if (sign === '+' || sign === '-' || /[0-9]/.test(sign ?? '')) {
      i++;
      if (text[i] === '+' || text[i] === '-') i++;
      i = readWhile(text, i, (ch) => /[0-9_]/.test(ch)).end;
    }
  }
  return { start, end: i };
}

export function tokenizeCode(text: string, langRaw: string): CodeToken[] {
  const lang = normalizeLang(langRaw);
  const tokens: CodeToken[] = [];
  let i = 0;

  const push = (from: number, to: number, kind: TokenKind) => {
    if (to > from) tokens.push({ from, to, kind });
  };

  while (i < text.length) {
    const ch = text[i]!;

    // HTML comment
    if (lang === 'html' && text.startsWith('<!--', i)) {
      const start = i;
      i += 4;
      while (i < text.length && !text.startsWith('-->', i)) i++;
      if (text.startsWith('-->', i)) i += 3;
      push(start, i, 'comment');
      continue;
    }

    // Block comment for languages that support /* ... */
    if ((lang === 'js' || lang === 'ts' || lang === 'css' || lang === 'go' || lang === 'cpp' || lang === 'c') && text.startsWith('/*', i)) {
      const start = i;
      i += 2;
      while (i < text.length && !text.startsWith('*/', i)) i++;
      if (text.startsWith('*/', i)) i += 2;
      push(start, i, 'comment');
      continue;
    }

    // Line comments
    if ((lang === 'js' || lang === 'ts' || lang === 'css' || lang === 'go' || lang === 'cpp' || lang === 'c') && text.startsWith('//', i)) {
      const r = readLineComment(text, i);
      i = r.end;
      push(r.start, r.end, 'comment');
      continue;
    }
    if ((lang === 'python' || lang === 'bash' || lang === 'yaml' || lang === 'sql') && ch === '#') {
      const r = readLineComment(text, i);
      i = r.end;
      push(r.start, r.end, 'comment');
      continue;
    }
    if (lang === 'sql' && text.startsWith('--', i)) {
      const r = readLineComment(text, i);
      i = r.end;
      push(r.start, r.end, 'comment');
      continue;
    }

    // Python triple-quoted strings
    if (lang === 'python' && (text.startsWith('"""', i) || text.startsWith("'''", i))) {
      const quote = text.slice(i, i + 3);
      const start = i;
      i += 3;
      while (i < text.length && !text.startsWith(quote, i)) i++;
      if (text.startsWith(quote, i)) i += 3;
      push(start, i, 'string');
      continue;
    }

    // C++ preprocessor directive (very lightweight): highlight "#include", "#define", ...
    if (lang === 'cpp' && ch === '#') {
      const lineStart = text.lastIndexOf('\n', i - 1) + 1;
      const prefix = text.slice(lineStart, i);
      if (/^[\t ]*$/.test(prefix)) {
        const hashPos = i;
        push(hashPos, hashPos + 1, 'punct');
        i++;
        while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
        const d = readWhile(text, i, (c) => /[A-Za-z_]/.test(c));
        if (d.end > d.start) {
          push(d.start, d.end, 'keyword');
          i = d.end;
        }
        // Optional include target: <...> or "..."
        while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
        if (text[i] === '<') {
          const start = i;
          i++;
          while (i < text.length && text[i] !== '>' && text[i] !== '\n') i++;
          if (text[i] === '>') i++;
          push(start, i, 'string');
        } else if (text[i] === '"') {
          const s = readString(text, i, '"');
          push(s.start, s.end, 'string');
          i = s.end;
        }
        continue;
      }
    }

    // JSON strings (keys vs values)
    if (lang === 'json' && (ch === '"' || ch === "'")) {
      const r = readString(text, i, ch);
      let j = r.end;
      while (j < text.length && isWs(text[j]!)) j++;
      const kind: TokenKind = text[j] === ':' ? 'attr' : 'string';
      i = r.end;
      push(r.start, r.end, kind);
      continue;
    }

    // Strings
    if (
      ch === '"' ||
      ch === "'" ||
      ((lang === 'js' || lang === 'ts' || lang === 'go') && ch === '`') // Go raw strings
    ) {
      const r = readString(text, i, ch);
      i = r.end;
      push(r.start, r.end, 'string');
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch)) {
      const r = readNumber(text, i);
      i = r.end;
      push(r.start, r.end, 'number');
      continue;
    }

    // HTML tags (very lightweight)
    if (lang === 'html' && ch === '<') {
      const start = i;
      const isClose = text[i + 1] === '/';
      const nameStart = i + (isClose ? 2 : 1);
      if (isIdentStart(text[nameStart] ?? '')) {
        // '<' and optional '/'
        push(i, nameStart, 'punct');
        i = nameStart;

        const name = readWhile(text, i, (c) => /[A-Za-z0-9:-]/.test(c));
        push(name.start, name.end, 'tag');
        i = name.end;

        // attrs until '>'
        while (i < text.length && text[i] !== '>') {
          if (isWs(text[i]!)) {
            i++;
            continue;
          }
          if (text[i] === '/' && text[i + 1] === '>') break;
          const a = readWhile(text, i, (c) => /[A-Za-z0-9_:-]/.test(c));
          if (a.end > a.start) {
            push(a.start, a.end, 'attr');
            i = a.end;
          } else {
            i++;
          }
          while (i < text.length && isWs(text[i]!)) i++;
          if (text[i] === '=') {
            push(i, i + 1, 'punct');
            i++;
            while (i < text.length && isWs(text[i]!)) i++;
            const q = text[i];
            if (q === '"' || q === "'") {
              const s = readString(text, i, q);
              push(s.start, s.end, 'string');
              i = s.end;
            }
          }
        }
        if (text[i] === '>') {
          push(i, i + 1, 'punct');
          i++;
        }
        continue;
      }
      // Not a tag, fall through.
      i = start;
    }

    // Identifiers / keywords
    if (isIdentStart(ch)) {
      const r = readWhile(text, i, isIdent);
      const ident = text.slice(r.start, r.end);
      const kind = classifyIdent(lang, ident);
      if (kind) push(r.start, r.end, kind);
      i = r.end;
      continue;
    }

    // Punctuation/operators (kept subtle)
    if (/[\[\]{}().,;:+\-*/%=!<>&|^~?:]/.test(ch)) {
      push(i, i + 1, 'punct');
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

export function tokenClass(kind: TokenKind) {
  return `tok-${kind}`;
}
