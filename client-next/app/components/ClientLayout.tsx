'use client';

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <Container>
        <Row className="mt-4">
          <Col md={9} className="main-content">
            {children}
          </Col>
          <Col md={3} className="p-0">
            <Sidebar />
          </Col>
        </Row>
      </Container>
    </>
  );
}
