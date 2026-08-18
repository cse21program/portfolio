export type SocialLink = {
  label: string;
  href: string;
};

export type SkillTopic = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  images?: string[];
  videoUrl?: string | null;
  embedVideoUrl?: string | null;
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
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
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  skill: string;
  publishedAt: string;
  readingTime: string;
  content: string[];
};

export type Tutorial = {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  price: string;
  free: boolean;
  skill: string;
  sections: { title: string; summary: string }[];
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
