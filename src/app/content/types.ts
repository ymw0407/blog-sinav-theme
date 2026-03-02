export type PostCategory = string;

export type PostIndexItem = {
  id: string;
  slug: string;
  title: string;
  date?: string; // legacy (YYYY-MM-DD)
  datetime?: string; // new (ISO)
  category: PostCategory;
  tags: string[];
  summary: string;
  thumbnail?: { src: string; alt?: string };
  draft?: boolean;
  kind: 'mdx' | 'doc';
  mdxImportPath?: string;
  docImportPath?: string;
  doc?: any; // local-only (dev)
  source?: 'static' | 'local';
};

export type ContentIndex = {
  generatedAt: string;
  posts: PostIndexItem[];
  tags: { tag: string; count: number }[];
};

export type TimelineIndex = {
  generatedAt: string;
  items: { postId: string; date?: string; datetime?: string }[];
};

export type GalleryWork = {
  id: string;
  title: string;
  intent: string;
  assets: { url: string; alt?: string }[];
  tags?: string[];
  pinned?: boolean;
  date?: string;
  camera?: string;
  lens?: string;
  film?: string;
  location?: string;
  note?: string;
};

export type GalleryIndex = { generatedAt: string; works: GalleryWork[] };

export type Album = {
  id: string;
  title: string;
  date?: string; // 대표 날짜 (YYYY-MM-DD)
  period?: { from: string; to?: string }; // 선택: 기간
  description?: string;
  cover?: { src: string; alt?: string };
  items?: { src: string; alt?: string; caption?: string; pinned?: boolean }[];
  // 확장: 빌드 시점에 외부 스토리지에서 items를 생성하는 방식(권장)
  source?: { type: 'manifest'; manifestPath: string } | { type: 's3' | 'gcs' | 'drive'; config: Record<string, unknown> };
};

export type AlbumsIndex = { generatedAt: string; albums: Album[] };

export type ResumeLink = { label: string; url: string };

export type ResumeLogo = { src: string; alt?: string };

export type ResumePeriod = { from: string; to?: string };

export type AwardEntry = {
  title: string;
  issuer?: string;
  period?: ResumePeriod;
  description?: string;
  logo?: ResumeLogo;
  links?: ResumeLink[];
};

export type EducationEntry = {
  school: string;
  degree?: string;
  period?: ResumePeriod;
  description?: string;
  logo?: ResumeLogo;
  links?: ResumeLink[];
};

export type PublicationEntry = {
  title: string;
  venue?: string;
  period?: ResumePeriod;
  description?: string;
  logo?: ResumeLogo;
  links?: ResumeLink[];
};

export type Portfolio = {
  name: string;
  headline: string;
  cover?: { src: string; alt?: string };
  photo?: { src: string; alt?: string };
  profile?: { title?: string; doc?: any; updatedAt?: string };
  summary?: string;
  ethics?: string;
  skills?: string[];
  links: ResumeLink[];
  facts?: { label: string; value: string }[];
  contact?: { phone?: string; email?: string; location?: string };
  hobbies?: string[];
  languages?: string[];
  work?: {
    org: string;
    title: string;
    period?: ResumePeriod;
    stacks?: string[];
    location?: string;
    description?: string;
    logo?: { src: string; alt?: string };
    links?: ResumeLink[];
  }[];
  awards?: AwardEntry[];
  certificates?: AwardEntry[];
  education?: EducationEntry[];
  publications?: PublicationEntry[];
  experience?: string[];
  projects: {
    title: string;
    role: string;
    period?: ResumePeriod;
    description: string;
    // Optional rich content (Tiptap JSON). Rendered in the project modal.
    doc?: any;
    links?: ResumeLink[];
    media?: { src: string; alt?: string; caption?: string }[];
    tags?: string[];
  }[];
};

export type PortfolioIndex = { generatedAt: string; portfolio: Portfolio };

export type CommentThread = {
  postId: string;
  issueNumber: number;
  comments: { id: number; user: string; body: string; createdAt: string }[];
};

export type CommentsIndex = { generatedAt: string; threads: CommentThread[] };
