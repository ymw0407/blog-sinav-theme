const docModules = {
  ...import.meta.glob('/content/posts/**/*.json')
} as Record<string, () => Promise<any>>;

export async function loadDocByImportPath(importPath: string) {
  const loader = docModules[importPath];
  if (!loader) throw new Error(`Doc module not found for path: ${importPath}`);
  const mod = await loader();
  return mod.default ?? mod;
}
