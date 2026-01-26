'use client';

import React, { useState } from 'react';
import { Navbar, Container, Nav, Form, InputGroup, FormControl, Button } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export const Navigation = () => {
  const { user, logout } = useAuth(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      {/* Top Header */}
      <Navbar className="bg-white border-bottom pb-2 pt-3" expand="lg">
        <Container>
          <Navbar.Brand as={Link} href="/" className="d-flex align-items-center">
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f26522' }}>⚾ BaseballUSA</span>
          </Navbar.Brand>
          
          <Form className="d-flex mx-auto" style={{ width: '40%' }} onSubmit={handleSearch}>
            <InputGroup>
              <Form.Select style={{ maxWidth: '100px' }}>
                <option>All</option>
                <option>Posts</option>
                <option>Market</option>
              </Form.Select>
              <FormControl
                type="search"
                placeholder="Search..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-secondary" type="submit">Search</Button>
            </InputGroup>
          </Form>

          <Nav>
            <Nav.Link href="#" className="small">USA List</Nav.Link>
            <Nav.Link href="#" className="small">Shopping Mall</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {/* Main Navigation Bar */}
      <Navbar className="navbar-custom pt-0 pb-0" expand="lg">
        <Container>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} href="/">Home</Nav.Link>
              <Nav.Link as={Link} href="/board/general">Talk Lounge</Nav.Link>
              <Nav.Link as={Link} href="/board/mlb">MLB Talk</Nav.Link>
              <Nav.Link as={Link} href="/board/equipment">Equipment</Nav.Link>
              <Nav.Link as={Link} href="/board/leagues">Leagues</Nav.Link>
              <Nav.Link as={Link} href="/board/market">Buy & Sell</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};