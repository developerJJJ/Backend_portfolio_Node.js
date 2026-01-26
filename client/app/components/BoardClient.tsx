'use client';

import React from 'react';
import Link from 'next/link';
import { Table } from 'react-bootstrap';
import { useAuth } from './AuthProvider';
import { Post } from '../types';

interface BoardClientProps {
  category: string;
  posts: Post[];
}

export default function BoardClient({ category, posts }: BoardClientProps) {
  const { user } = useAuth();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-capitalize" style={{ color: "#f26522", borderBottom: "2px solid #f26522" }}>
          {category} Board
        </h3>
        {user && (
          <Link href={`/create/${category}`} className="btn btn-baseball btn-sm">
            New Post
          </Link>
        )}
      </div>

      <Table hover responsive size="sm" className="table-portal">
        <thead className="table-light">
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>
                <Link href={`/post/${post.id}`} className="text-dark">
                  {post.title}
                </Link>
              </td>
              <td>{post.author}</td>
              <td>{new Date(post.created_at).toLocaleDateString()}</td>
              <td>{post.views || 0}</td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center">
                No posts yet. Be the first!
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
