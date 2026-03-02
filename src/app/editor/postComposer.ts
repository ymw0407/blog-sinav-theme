import type { PostCategory } from '../content/types';

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function composeMdx(params: {
  title: string;
  date: string;
  category: PostCategory;
  tags: string[];
  summary: string;
  draft?: boolean;
  body: string;
}) {
  const fm: string[] = [];
  fm.push('---');
  fm.push(`title: ${JSON.stringify(params.title)}`);
  fm.push(`date: ${JSON.stringify(params.date)}`);
  fm.push(`category: ${JSON.stringify(params.category)}`);
  fm.push(`tags: [${params.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  fm.push(`summary: ${JSON.stringify(params.summary)}`);
  if (params.draft) fm.push(`draft: true`);
  fm.push('---');
  fm.push('');
  fm.push(params.body.trimStart());
  if (!params.body.endsWith('\n')) fm.push('');
  return fm.join('\n');
}

