import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import ResolvedImage from '../../shared/ui/ResolvedImage';

const mdxModules = {
  ...import.meta.glob('/content/posts/**/*.mdx')
} as Record<string, () => Promise<any>>;

export async function loadMdxByImportPath(importPath: string) {
  const loader = mdxModules[importPath];
  if (!loader) throw new Error(`MDX module not found for path: ${importPath}`);
  const mod = await loader();
  return {
    Component: mod.default as React.ComponentType,
    frontmatter: (mod.frontmatter ?? null) as any
  };
}

const mdxComponents = {
  a: (props: any) => <a {...props} target="_blank" rel="noreferrer" />,
  img: (props: any) => <ResolvedImage {...props} loading={(props as any)?.loading ?? 'lazy'} />
};

export function Mdx({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}
