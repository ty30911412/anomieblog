
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tags: string[];
  readTime: string;
  coverImage: string;
  initialLikes: number;
  likes?: number;
}

export interface Comment {
  id: string;
  author: string;
  date: string;
  content: string;
}
