type MetaInput = { name?: string; property?: string; content: string };

function upsertMetaTag(input: MetaInput) {
  if (typeof document === 'undefined') return;
  const key = input.name ? `meta[name="${CSS.escape(input.name)}"]` : input.property ? `meta[property="${CSS.escape(input.property)}"]` : null;
  if (!key) return;
  const el = document.head.querySelector<HTMLMetaElement>(key) ?? document.createElement('meta');
  if (!el.parentElement) document.head.appendChild(el);
  if (input.name) el.setAttribute('name', input.name);
  if (input.property) el.setAttribute('property', input.property);
  el.setAttribute('content', input.content);
}

function upsertLinkTag(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  const key = `link[rel="${CSS.escape(rel)}"]`;
  const el = document.head.querySelector<HTMLLinkElement>(key) ?? document.createElement('link');
  if (!el.parentElement) document.head.appendChild(el);
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
}

export function applyBasicSeo(params: { title: string; description: string; canonicalUrl: string; imageUrl: string }) {
  if (typeof document === 'undefined') return;

  document.title = params.title;
  upsertLinkTag('canonical', params.canonicalUrl);

  upsertMetaTag({ name: 'description', content: params.description });
  upsertMetaTag({ name: 'robots', content: 'index,follow' });

  upsertMetaTag({ property: 'og:type', content: 'website' });
  upsertMetaTag({ property: 'og:locale', content: 'ko_KR' });
  upsertMetaTag({ property: 'og:title', content: params.title });
  upsertMetaTag({ property: 'og:description', content: params.description });
  upsertMetaTag({ property: 'og:url', content: params.canonicalUrl });
  upsertMetaTag({ property: 'og:image', content: params.imageUrl });

  upsertMetaTag({ name: 'twitter:card', content: 'summary_large_image' });
  upsertMetaTag({ name: 'twitter:title', content: params.title });
  upsertMetaTag({ name: 'twitter:description', content: params.description });
  upsertMetaTag({ name: 'twitter:image', content: params.imageUrl });
}

