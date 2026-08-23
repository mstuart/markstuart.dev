export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  /** Two authored first-person sentences for the announcement email; falls back to description. */
  teaser?: string;
  /** Reading time in minutes, computed from the post body. */
  minutes: number;
  sample?: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

export interface TalkLink {
  label: string;
  href: string;
}

export interface Talk {
  title: string;
  event: string;
  date: string;
  sample?: boolean;
  url?: string;
  note?: string;
  links?: TalkLink[];
  /** Path to a small logo tile under /public, e.g. "/talks/midwestjs.png". */
  iconSrc?: string;
}

export interface Appearance {
  title: string;
  show: string;
  date: string;
  url?: string;
  description?: string;
  /** Path to a small logo tile under /public, e.g. "/talks/codetv.png". */
  iconSrc?: string;
}

export interface Attended {
  event: string;
  date: string;
  note?: string;
  url?: string;
  /** Path to a small logo tile under /public, e.g. "/talks/thisdot.png". */
  iconSrc?: string;
}

export type WritingSource = "PayPal Technology Blog" | "Rocket Technology Blog";

export interface WritingEntry {
  title: string;
  date: string;
  url: string;
  source: WritingSource;
  views?: number;
}

export type MentionKind = "press" | "book" | "newsletter" | "education" | "community";

export interface Mention {
  kind: MentionKind;
  title: string;
  date?: string;
  description: string;
  url: string;
  urls?: string[];
  /** Path to a small logo tile under /public, e.g. "/press/apollo.png". */
  iconSrc?: string;
}

export type ProjectRole = "author" | "core contributor";

export interface Project {
  name: string;
  description: string;
  stars: number;
  url: string;
  role: ProjectRole;
  /** Phosphor icon component name. */
  icon?: string;
  /** Year the project was created (repo creation, or first commit for org-migrated repos). */
  createdAt?: string;
}

export interface WorkEntry {
  company: string;
  role: string;
  period: string;
  summary?: string;
}

export type SocialIconKey = "github" | "linkedin" | "x";

export interface SocialLink {
  name: string;
  href: string;
  icon: SocialIconKey;
}

export interface SiteConfig {
  name: string;
  role: string;
  tagline: string;
  url: string;
  description: string;
  social: SocialLink[];
}
