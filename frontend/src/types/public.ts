export type SocialLink = {
  label: string;
  href: string;
};

export type TopicLink = {
  label: string;
  url: string;
};

export type TopicSnippet = {
  label: string;
  language: string;
  code: string;
};

export type SkillTopic = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  body?: string;
  images?: string[];
  videoUrl?: string | null;
  embedVideoUrl?: string | null;
  codeSnippets?: TopicSnippet[];
  resources?: TopicLink[];
  externalLinks?: TopicLink[];
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
  relatedProjectSlugs?: string[];
  relatedCertificateSlugs?: string[];
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
};

export type KnowledgeTopic = SkillTopic & {
  skill: string;
  skillSlug: string;
  field: string;
  fieldSlug: string;
};

export type Skill = {
  id?: string;
  slug: string;
  name: string;
  field: string;
  fieldSlug?: string;
  level: string;
  years: string;
  summary: string;
  overview: string;
  iconUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  embedVideoUrl?: string | null;
  fieldVideoUrl?: string | null;
  fieldEmbedVideoUrl?: string | null;
  featured: boolean;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
  topics: SkillTopic[];
};

export type SkillField = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  overview: string;
  iconUrl?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  videoUrl?: string | null;
  embedVideoUrl?: string | null;
  featured: boolean;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
};

export type Project = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  featured: boolean;
  shortDescription: string;
  fullDescription?: string;
  thumbnailUrl?: string | null;
  images?: string[];
  demoVideoUrl?: string | null;
  problem: string;
  requirements?: string;
  solution: string;
  architecture: string;
  features: string[];
  technologies: string[];
  challenges: string[];
  solutions?: string[];
  lessons: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  docsUrl?: string | null;
  startDate: string;
  endDate: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
};

export type Experience = {
  id?: string;
  company: string;
  position: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  logoUrl?: string | null;
  website?: string | null;
  sortOrder?: number;
};

export type Education = {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  grade: string;
  location: string;
  description: string;
  achievements: string[];
  logoUrl?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  website?: string | null;
  sortOrder?: number;
};

export type Certificate = {
  slug: string;
  title: string;
  organization: string;
  issueDate: string;
  credentialId?: string;
  skill: string;
  featured: boolean;
  description: string;
  verificationUrl?: string;
};

export type Article = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  skill: string;
  topic?: string;
  author?: string;
  featuredImageUrl?: string | null;
  publishedAt: string;
  readingTime: string;
  content: string[];
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  sortOrder?: number;
  updatedAt?: string;
};

export type TutorialSection = {
  title: string;
  summary: string;
  body?: string[];
  videoUrl?: string | null;
  images?: string[];
  codeSnippets?: TopicSnippet[];
  resources?: TopicLink[];
  downloads?: TopicLink[];
};

export type Tutorial = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  prerequisites?: string[];
  duration: string;
  thumbnailUrl?: string | null;
  price: string;
  free: boolean;
  skill: string;
  relatedSkillSlugs?: string[];
  relatedCourseSlugs?: string[];
  sections: TutorialSection[];
  status?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  sortOrder?: number;
  updatedAt?: string;
};

export type Course = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: string;
  duration: string;
  price: string;
  salePrice?: string;
  featured: boolean;
  outcomes: string[];
  modules: { title: string; lessons: string[] }[];
};

export type Service = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  startingPrice: string;
  pricingType: string;
  deliveryTime: string;
  featured: boolean;
  features: string[];
  technologies: string[];
  faq: { question: string; answer: string }[];
};

export type Testimonial = {
  name: string;
  position: string;
  company: string;
  rating: number;
  comment: string;
};
