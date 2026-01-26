'use client';

import React, { useState } from 'react';
import { Row, Col, Button, Form, ListGroup } from 'react-bootstrap';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from './AuthProvider';

const LoginWidget = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Using relative path, Next.js rewrites will handle it
      const res = await axios.post("/api/login", { username, password });
      login(res.data.user, res.data.token);
      setError("");
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="login-box mb-3">
      <Form onSubmit={handleSubmit}>
        <Row className="g-2">
          <Col xs={8}>
            <Form.Control size="sm" type="text" placeholder="ID" className="mb-1" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Form.Control size="sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Col>
          <Col xs={4}>
            <Button type="submit" className="login-btn">
              Login
            </Button>
          </Col>
        </Row>
        {error && <small className="text-danger d-block mt-1">{error}</small>}
        <div className="d-flex justify-content-between mt-2" style={{ fontSize: "0.8rem" }}>
          <a href="#" className="text-muted">
            Find ID/PW
          </a>
          <Link href="/register" className="text-muted">
            Sign Up
          </Link>
        </div>
      </Form>
    </div>
  );
};

const UserWidget = () => {
  const { user, logout } = useAuth();
  return (
    <div className="login-box mb-3 text-center">
      <p className="mb-2">
        Welcome, <strong>{user?.username}</strong>!
      </p>
      <div className="d-grid gap-2">
        <Button variant="outline-secondary" size="sm">
          My Page
        </Button>
        <Button variant="secondary" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const { user } = useAuth();
  return (
    <div className="sidebar">
      {user ? <UserWidget /> : <LoginWidget />}

      {/* Banner Area */}
      <div className="bg-secondary text-white text-center py-4 mb-3">Banner Ad</div>

      <h5>Hot Categories</h5>
      <ListGroup variant="flush" className="mb-4">
        <ListGroup.Item action as={Link} href="/board/general">Talk Lounge</ListGroup.Item>
        <ListGroup.Item action as={Link} href="/board/health">Health & Beauty</ListGroup.Item>
        <ListGroup.Item action as={Link} href="/board/food">Home & Food</ListGroup.Item>
      </ListGroup>

      <div className="bg-light border text-center p-3">
        <small>Ad Space</small>
        <br />
        <strong>Support Local Leagues!</strong>
      </div>
    </div>
  );
};