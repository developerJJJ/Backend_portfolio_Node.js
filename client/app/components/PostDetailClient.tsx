'use client';

import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import { Post } from '../types';

interface PostDetailClientProps {
  post: Post;
}

export default function PostDetailClient({ post: initialPost }: PostDetailClientProps) {
  const [post, setPost] = useState(initialPost);
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/api/posts/${post.id}`);
      router.push(`/board/${post.category}`);
      router.refresh(); // Refresh server data
    } catch (err) {
      alert("Failed to delete. You might not be the author.");
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/posts/${post.id}`, { content: editContent });
      setPost({ ...post, content: editContent });
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      alert("Failed to update.");
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom-0 pt-3">
        <h4 style={{ color: "#333" }}>{post.title}</h4>
        <div className="d-flex justify-content-between text-muted small">
          <span>By: {post.author}</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </Card.Header>
      <Card.Body>
        <hr className="mt-0" />
        {isEditing ? (
          <Form.Group className="mb-3">
            <Form.Control as="textarea" rows={10} value={editContent} onChange={(e) => setEditContent(e.target.value)} required />
            <div className="mt-2">
              <Button variant="success" size="sm" onClick={handleUpdate} className="me-2">
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </Form.Group>
        ) : (
          <Card.Text style={{ whiteSpace: "pre-wrap", minHeight: "200px" }}>{post.content}</Card.Text>
        )}

        {user && user.username === post.author && !isEditing && (
          <div className="mt-4 text-end">
            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
