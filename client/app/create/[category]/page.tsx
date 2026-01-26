'use client';
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../components/AuthProvider';

export default function CreatePost() {
  const params = useParams();
  const category = params.category as string;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await axios.post("/api/posts", { title, content, category });
      router.push(`/board/${category}`);
    } catch (err) {
      console.error(err);
      alert("Failed to post");
    }
  };

  return (
    <div>
      <h3 className="mb-3" style={{ color: "#f26522" }}>
        Write: {category}
      </h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control as="textarea" rows={10} value={content} onChange={(e) => setContent(e.target.value)} required />
        </Form.Group>
        <Button type="submit" className="btn-baseball">
          Post
        </Button>
      </Form>
    </div>
  );
}
