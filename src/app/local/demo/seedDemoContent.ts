import { upsertLocalPost, listLocalPosts, clearLocalPosts } from '../postsStore';
import { upsertLocalAlbum, listLocalAlbums, clearLocalAlbums } from '../albumsStore';
import { upsertLocalWork, listLocalWorks, clearLocalWorks } from '../galleryStore';
import { setLocalPortfolio, clearLocalPortfolio, getLocalPortfolio } from '../portfolioStore';
import type { Album, GalleryWork, Portfolio, PostCategory } from '../../content/types';

function paragraph(text: string) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function h2(text: string) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] };
}

function bullet(items: string[]) {
  return {
    type: 'bulletList',
    content: items.map((t) => ({ type: 'listItem', content: [paragraph(t)] }))
  };
}

function codeBlock(text: string) {
  return { type: 'codeBlock', content: [{ type: 'text', text }] };
}

function image(src: string, alt: string) {
  return { type: 'image', attrs: { src, alt, width: 100, align: 'center' } };
}

function post(params: {
  category: PostCategory;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  content: any;
}) {
  return {
    id: `${params.category}/${params.slug}`,
    slug: params.slug,
    title: params.title,
    date: params.date,
    category: params.category,
    tags: params.tags,
    summary: params.summary,
    draft: false,
    doc: params.content
  };
}

export function seedDemoContent({ force = false } = {}) {
  const hasAny =
    listLocalPosts().length > 0 || listLocalAlbums().length > 0 || listLocalWorks().length > 0 || Boolean(getLocalPortfolio());

  if (hasAny && !force) return { ok: false as const, reason: 'already-has-local-content' as const };

  if (force) {
    clearLocalPosts();
    clearLocalAlbums();
    clearLocalWorks();
    clearLocalPortfolio();
  }

  const tag = ['demo'];

  const dev = post({
    category: 'dev',
    slug: 'design-notes-glass-minimal',
    title: 'Design Notes: Glass + Minimal',
    date: '2026-02-27',
    tags: [...tag, 'design', 'vanilla-extract'],
    summary: '글라스/미니멀 무드를 과하지 않게 적용하는 규칙을 정리했습니다.',
    content: {
      type: 'doc',
      content: [
        paragraph('유행을 따라가되 경험을 해치지 않는 선에서.'),
        image('/demo/2026-02-21-dev-hero.svg', 'Dev demo'),
        h2('Principles'),
        bullet(['배경은 조용하게', '포인트 컬러는 제한된 영역에만', 'blur/opacity는 subtle하게']),
        h2('Dev Tip'),
        codeBlock("LOCAL 모드에서 'Load demo content'로 예시를 바로 채울 수 있어요.")
      ]
    }
  });

  const coffee = post({
    category: 'coffee',
    slug: 'brew-notes-15-250-92c',
    title: 'Brew Notes: 15g / 250g, 92C',
    date: '2026-02-26',
    tags: [...tag, 'brew', 'notes'],
    summary: '집에서 해본 레시피 기록.',
    content: {
      type: 'doc',
      content: [
        paragraph('진하게 좋다. 과하게 쓰면 텁텁해진다.'),
        image('/demo/2026-02-22-coffee-hero.svg', 'Coffee demo'),
        h2('Recipe'),
        bullet(['Dose: 15g', 'Water: 250g', 'Temp: 92C', 'Time: 2:45']),
        h2('Tasting'),
        paragraph('견과/초콜릿 느낌, 뒤로 갈수록 산미가 조금 올라온다.')
      ]
    }
  });

  const travel = post({
    category: 'travel',
    slug: 'weekend-trip-48h-plan',
    title: 'Weekend Trip: 48시간 플랜',
    date: '2026-02-25',
    tags: [...tag, 'itinerary', 'packing'],
    summary: '동선은 단순하게, 체력은 아끼고 사진은 여유롭게.',
    content: {
      type: 'doc',
      content: [
        paragraph('여행은 적당히 빡세야 재미있다.'),
        image('/demo/2026-02-23-travel-hero.svg', 'Travel demo'),
        h2('Day 1'),
        bullet(['걷기: 숙소 근처 1km', '카페: 60분', '사진: 포인트 20컷만']),
        h2('Packing'),
        bullet(['충전기/보조배터리', '셔츠 1 + 티셔츠 2', '현금 약간'])
      ]
    }
  });

  const photo = post({
    category: 'photo',
    slug: 'composition-notes-quiet-contrast',
    title: 'Composition Notes: Quiet Contrast',
    date: '2026-02-24',
    tags: [...tag, 'composition', 'workflow'],
    summary: '과하지 않은 대비, 시선의 흐름.',
    content: {
      type: 'doc',
      content: [
        paragraph('좋은 사진은 결국 조명과 여백이 만든다.'),
        h2('Frames'),
        image('/demo/2026-02-20-photo-01.svg', 'Photo demo 1'),
        image('/demo/2026-02-20-photo-02.svg', 'Photo demo 2'),
        image('/demo/2026-02-20-photo-03.svg', 'Photo demo 3'),
        paragraph('사진을 클릭하면 크게 볼 수 있어요.')
      ]
    }
  });

  upsertLocalPost(dev);
  upsertLocalPost(coffee);
  upsertLocalPost(travel);
  upsertLocalPost(photo);

  const album1: Album = {
    id: 'album-demo-citywalk',
    title: 'City Walk (Demo)',
    date: '2026-02-20',
    period: { from: '2026-02-20' },
    description: '라이트박스/그리드 데모. Masonry + 정렬 비율 + 레터박스.',
    items: [
      { src: '/demo/2026-02-20-photo-03.svg', alt: 'walk 1', caption: 'quiet contrast' },
      { src: '/demo/2026-02-20-photo-01.svg', alt: 'walk 2', caption: 'spacing' },
      { src: '/demo/2026-02-20-photo-02.svg', alt: 'walk 3', caption: 'tone' }
    ]
  };

  const album2: Album = {
    id: 'album-demo-weekend',
    title: 'Weekend Trip (Demo)',
    date: '2026-02-25',
    period: { from: '2026-02-24', to: '2026-02-25' },
    description: '여행 앨범 예시. 날짜/기간으로 정렬됩니다.',
    items: [
      { src: '/demo/2026-02-23-travel-hero.svg', alt: 'trip 1', caption: 'start' },
      { src: '/demo/2026-02-20-photo-01.svg', alt: 'trip 2', caption: 'pause' },
      { src: '/demo/2026-02-22-coffee-hero.svg', alt: 'trip 3', caption: 'cafe' }
    ]
  };

  upsertLocalAlbum(album1);
  upsertLocalAlbum(album2);

  const works: GalleryWork[] = [
    {
      id: 'work-demo-01',
      title: 'Glass Study',
      intent: 'Blur/opacity를 과하지 않게. 톤은 조용하게.',
      assets: [
        { url: '/demo/2026-02-21-dev-hero.svg', alt: 'glass study' },
        { url: '/demo/2026-02-20-photo-02.svg', alt: 'detail' }
      ],
      tags: ['demo', 'glass'],
      date: '2026-02-27'
    },
    {
      id: 'work-demo-portrait',
      title: 'Portrait Ratio (Demo)',
      intent: '세로 비율 데모: 아래가 잘리지 않게 표시.',
      assets: [{ url: '/demo/2026-02-20-photo-01.svg', alt: 'portrait demo' }],
      tags: ['demo', 'portrait'],
      date: '2026-02-27'
    },
    {
      id: 'work-demo-02',
      title: 'Coffee Mood',
      intent: '색은 절제하고, 사인은 한 톤만.',
      assets: [{ url: '/demo/2026-02-22-coffee-hero.svg', alt: 'coffee mood' }],
      tags: ['demo', 'coffee'],
      date: '2026-02-26'
    },
    {
      id: 'work-demo-03',
      title: 'Travel Notes',
      intent: '동선은 짧게, 기록은 길게.',
      assets: [{ url: '/demo/2026-02-23-travel-hero.svg', alt: 'travel notes' }],
      tags: ['demo', 'travel'],
      date: '2026-02-25'
    }
  ];

  for (const w of works) upsertLocalWork(w);

  const portfolio: Portfolio = {
    name: 'Your Name',
    headline: 'Platform Architect / Frontend Engineer',
    links: [
      { label: 'GitHub', url: 'https://github.com' },
      { label: 'Email', url: 'mailto:you@example.com' }
    ],
    projects: [
      {
        title: 'GitHub Pages Blog Platform',
        role: 'Owner',
        period: { from: '2026-01-01' },
        description: '2-Repo + PKCE + Octokit + 정적 인덱스 기반의 개인 블로그 플랫폼',
        links: [{ label: 'Docs', url: '/about' }]
      }
    ]
  };

  setLocalPortfolio(portfolio);

  return { ok: true as const };
}
