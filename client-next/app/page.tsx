import HomeClient from './components/HomeClient';
import { Post } from './types';

// Force dynamic rendering since data changes
export const dynamic = 'force-dynamic';

const API_URL = 'http://localhost:5000/api';

async function getPosts(category: string): Promise<Post[]> {
  try {
    const res = await fetch(`${API_URL}/posts?category=${category}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 5);
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return [];
  }
}

export default async function Home() {
  const [generalPosts, marketPosts, leaguePosts, lifePosts] = await Promise.all([
    getPosts('general'),
    getPosts('market'),
    getPosts('leagues'),
    getPosts('life'),
  ]);

  return (
    <HomeClient 
      generalPosts={generalPosts}
      marketPosts={marketPosts}
      leaguePosts={leaguePosts}
      lifePosts={lifePosts}
    />
  );
}