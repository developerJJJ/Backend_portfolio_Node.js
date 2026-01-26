'use client';

import React from 'react';
import Link from 'next/link';
import { Row, Col } from 'react-bootstrap';
import { Post } from '../types';

interface HomeClientProps {
  generalPosts: Post[];
  marketPosts: Post[];
  leaguePosts: Post[];
  lifePosts: Post[];
}

export default function HomeClient({ generalPosts, marketPosts, leaguePosts, lifePosts }: HomeClientProps) {
  
  const renderCategory = (title: string, link: string, posts: Post[]) => (
     <Col md={6} className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: "2px solid #f26522", paddingBottom: "5px" }}>
        <h5 className="m-0">
            <Link href={link} style={{ color: "#f26522", textDecoration: "none" }}>
            {title}
            </Link>
        </h5>

        <Link href={link} className="text-muted small">
            See More &raquo;
        </Link>
        </div>

        <ul className="portal-list">
        {posts.map((p) => (
            <li key={p.id} className="clickable-li">
            <Link href={`/post/${p.id}`} className="d-block w-100 h-100 text-decoration-none color-inherit">
                <span className="category-tag">[{p.category}]</span>
                <span className="post-title-text">{p.title}</span>
            </Link>
            </li>
        ))}

        {posts.length === 0 && <li>No posts yet</li>}
        </ul>
    </Col>
  );

  return (
    <div>
      {/* Promo Banner */}
      <div className="bg-dark text-white p-4 mb-4 text-center rounded">
        <h2>2026 Season Kickoff Event!</h2>
        <p>Sign up now for early bird discounts.</p>
      </div>

      <Row>
        {renderCategory("Talk Lounge", "/board/general", generalPosts)}
        {renderCategory("Marketplace", "/board/market", marketPosts)}
      </Row>
      <Row>
        {renderCategory("League Info", "/board/leagues", leaguePosts)}
        {renderCategory("Life & Culture", "/board/life", lifePosts)}
      </Row>
    </div>
  );
}
