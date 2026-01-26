'use client';

import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Post } from '../types';

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      const fetchResults = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
          setResults(res.data);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }
  }, [query]);

  return (
    <div>
      <h3 className="mb-4" style={{ color: '#f26522', borderBottom: '2px solid #f26522', paddingBottom: '10px' }}>
        Search Results for: "{query}"
      </h3>

      {loading ? <p>Searching...</p> : (
        <Table hover responsive size="sm" className="table-portal">
          <thead className="table-light">
            <tr>
              <th>Board</th>
              <th>Title</th>
              <th>Author</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {results.map(post => (
              <tr key={post.id} className="clickable-li">
                <td className="text-muted small">[{post.category}]</td>
                <td>
                  <Link href={`/post/${post.id}`} className="text-dark d-block">
                    {post.title}
                  </Link>
                </td>
                <td>{post.author}</td>
                <td>{new Date(post.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && results.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted">
                  No results found for "{query}". Try a different keyword.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
