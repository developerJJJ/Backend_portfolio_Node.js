import PostDetailClient from '../../components/PostDetailClient';
import { Post } from '../../types';

export const dynamic = 'force-dynamic';

const API_URL = 'http://localhost:5000/api';

async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching post ${id}:`, error);
    return null;
  }
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return <div className="alert alert-danger">Post not found</div>;
  }

  return <PostDetailClient post={post} />;
}
