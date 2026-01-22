import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, Card, ListGroup, Button, Form, Alert, Table } from 'react-bootstrap';
import axios from 'axios';

// --- Auth Context & Helper ---
const AuthContext = React.createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// --- Components ---

const Navigation = () => {
  const { user, logout } = useAuth();
  return (
    <Navbar className="navbar-custom" expand="lg">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">⚾ BaseballUSA</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/board/general">General</Nav.Link>
            <Nav.Link as={Link} to="/board/equipment">Equipment</Nav.Link>
            <Nav.Link as={Link} to="/board/leagues">Leagues</Nav.Link>
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="text-white me-3">
                  Welcome, {user.username}
                </Navbar.Text>
                <Nav.Link onClick={logout} className="text-white">Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="text-white">Login</Nav.Link>
                <Nav.Link as={Link} to="/register" className="text-white">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

const Sidebar = () => (
  <div className="sidebar d-none d-md-block">
    <h5>Community Boards</h5>
    <ListGroup variant="flush">
      <ListGroup.Item action as={Link} to="/board/general">General Discussion</ListGroup.Item>
      <ListGroup.Item action as={Link} to="/board/mlb">MLB Talk</ListGroup.Item>
      <ListGroup.Item action as={Link} to="/board/kbo">KBO / Asian Baseball</ListGroup.Item>
      <ListGroup.Item action as={Link} to="/board/equipment">Equipment Exchange</ListGroup.Item>
      <ListGroup.Item action as={Link} to="/board/leagues">League Recruitment</ListGroup.Item>
    </ListGroup>
    
    <h5 className="mt-4">Marketplace</h5>
    <ListGroup variant="flush">
      <ListGroup.Item action>Used Bats</ListGroup.Item>
      <ListGroup.Item action>Gloves</ListGroup.Item>
    </ListGroup>

    <div className="mt-4 p-3 bg-light border text-center">
      <small>Ad Space</small>
      <br/>
      <strong>Support Local Leagues!</strong>
    </div>
  </div>
);

const Home = () => (
  <div>
    <h3>Welcome to BaseballUSA</h3>
    <p>The premier community for US Baseball enthusiasts.</p>
    
    <Row>
      <Col md={6}>
        <Card className="mb-3">
          <Card.Header className="card-header-custom">Latest News</Card.Header>
          <Card.Body>
            <ul>
              <li>Spring Training schedules released!</li>
              <li>New composite bat regulations for 2026.</li>
              <li>Local tournament sign-ups open.</li>
            </ul>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6}>
        <Card className="mb-3">
          <Card.Header className="card-header-custom">Hot Topics</Card.Header>
          <Card.Body>
             <ul>
              <li>Best glove oil?</li>
              <li>Who is winning the World Series?</li>
              <li>Looking for catcher (NY area)</li>
            </ul>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </div>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h3 className="mb-3">Login</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100 btn-baseball">Login</Button>
      </Form>
    </div>
  );
};

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', { username, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h3 className="mb-3">Register</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100 btn-baseball">Sign Up</Button>
      </Form>
    </div>
  );
};

const Board = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/posts?category=${category}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-capitalize">{category} Board</h3>
        {user && (
          <Link to={`/create/${category}`} className="btn btn-baseball">
            New Post
          </Link>
        )}
      </div>

      <Table hover responsive>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Date</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id}>
              <td><Link to={`/post/${post.id}`}>{post.title}</Link></td>
              <td>{post.author}</td>
              <td>{new Date(post.created_at).toLocaleDateString()}</td>
              <td>{post.views || 0}</td>
            </tr>
          ))}
          {posts.length === 0 && !loading && (
            <tr>
              <td colSpan="4" className="text-center">No posts yet. Be the first!</td>
            </tr>
          )}
        </tbody>
      </Table>
      {loading && <p>Loading...</p>}
    </div>
  );
};

const CreatePost = () => {
  const { category } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await axios.post('/api/posts', { title, content, category });
      navigate(`/board/${category}`);
    } catch (err) {
      console.error(err);
      alert('Failed to post');
    }
  };

  return (
    <div>
      <h3>Create Post in {category}</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control as="textarea" rows={5} value={content} onChange={e => setContent(e.target.value)} required />
        </Form.Group>
        <Button type="submit" className="btn-baseball">Post</Button>
      </Form>
    </div>
  );
};

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`/api/posts/${id}`);
        setPost(res.data);
        setEditContent(res.data.content);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/api/posts/${id}`);
      navigate(`/board/${post.category}`);
    } catch (err) {
      alert("Failed to delete. You might not be the author.");
    }
  };

  const handleUpdate = async () => {
    try {
        await axios.put(`/api/posts/${id}`, { content: editContent });
        setPost({...post, content: editContent});
        setIsEditing(false);
    } catch(err) {
        alert("Failed to update.");
    }
  }

  if (!post) return <p>Loading...</p>;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>{post.title}</h5>
        <small>{new Date(post.created_at).toLocaleString()}</small>
      </Card.Header>
      <Card.Body>
        <Card.Subtitle className="mb-2 text-muted">Posted by: {post.author}</Card.Subtitle>
        <hr />
        {isEditing ? (
             <Form.Group className="mb-3">
             <Form.Control as="textarea" rows={5} value={editContent} onChange={e => setEditContent(e.target.value)} required />
             <div className="mt-2">
                 <Button variant="success" size="sm" onClick={handleUpdate} className="me-2">Save</Button>
                 <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
             </div>
           </Form.Group>
        ) : (
            <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
            {post.content}
            </Card.Text>
        )}
        
        {user && user.username === post.author && !isEditing && (
          <div className="mt-4">
            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => setIsEditing(true)}>Edit</Button>
            <Button variant="outline-danger" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Container fluid>
          <Row>
            <Col md={3} lg={2} className="p-0">
              <Sidebar />
            </Col>
            <Col md={9} lg={10} className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/board/:category" element={<Board />} />
                <Route path="/create/:category" element={<CreatePost />} />
                <Route path="/post/:id" element={<PostDetail />} />
              </Routes>
            </Col>
          </Row>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;