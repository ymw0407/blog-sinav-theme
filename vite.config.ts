import react from '@vitejs/plugin-react-swc';
import mdx from '@mdx-js/rollup';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig, loadEnv } from 'vite';

function remarkNoMdxJsx() {
  return (tree: any, file: any) => {
    const disallowed = new Set([
      'mdxFlowExpression',
      'mdxTextExpression',
      'mdxJsxFlowElement',
      'mdxJsxTextElement'
    ]);
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (disallowed.has(node.type)) {
        file.fail(
          `MDX JSX/Expression is disabled for security. Use plain Markdown only. (node: ${node.type})`,
          node
        );
      }
      const children: any[] = node.children ?? [];
      for (const child of children) visit(child);
    };
    visit(tree);
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mdxPlugin = mdx({
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm, remarkNoMdxJsx],
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypeSanitize]
  }) as any;

  // @vitejs/plugin-react-swc requires MDX plugin to be ordered before it (after Vite's internal sorting).
  mdxPlugin.enforce = 'pre';

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      mdxPlugin,
      vanillaExtractPlugin(),
      react()
    ],
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@tiptap/')) return 'tiptap';
            if (id.includes('react-router')) return 'router';
            if (id.includes('/yaml/')) return 'yaml';
            return 'vendor';
          }
        }
      }
    }
  };
});
