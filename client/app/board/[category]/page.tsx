import BoardClient from '../../components/BoardClient';
import { Post } from '../../types';

export const dynamic = 'force-dynamic';

const API_URL = 'http://localhost:5000/api';

async function getPosts(category: string): Promise<Post[]> {
  try {
    const res = await fetch(`${API_URL}/posts?category=${category}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return [];
  }
}

interface PageProps {
    params: Promise<{ category: string }>
}

export default async function BoardPage({ params }: PageProps) {
  const { category } = await params;
  const posts = await getPosts(category);

  return <BoardClient category={category} posts={posts} />;
}
