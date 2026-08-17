export type SocialLink = {
  label: string;
  href: string;
};

export type SkillTopic = {
  slug: string;
  title: string;
  summary: string;
  overview: string;
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
};

export type Skill = {
  slug: string;
  name: string;
  field: string;
  level: string;
  years: string;
  summary: string;
  overview: string;
  featured: boolean;
  topics: SkillTopic[];
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  status: string;
  featured: boolean;
  shortDescription: string;
  problem: string;
  solution: string;
  architecture: string;
  features: string[];
  technologies: string[];
  challenges: string[];
  lessons: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate: string;
  endDate: string;
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
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
  location: string;
  description: string;
  achievements: string[];
  website?: string;
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
