import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, ListGroup, Button, Form, Alert, Table, InputGroup, FormControl, Card } from 'react-bootstrap';
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
    <>
      {/* Top Header: Logo, Search, Utility Links */}
      <Navbar className="bg-white border-bottom pb-2 pt-3" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f26522' }}>⚾ BaseballUSA</span>
          </Navbar.Brand>
          
          <Form className="d-flex mx-auto" style={{ width: '40%' }}>
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
              />
              <Button variant="outline-secondary"><i className="bi bi-search"></i> Search</Button>
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
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/board/general">Talk Lounge</Nav.Link>
              <Nav.Link as={Link} to="/board/mlb">MLB Talk</Nav.Link>
              <Nav.Link as={Link} to="/board/equipment">Equipment</Nav.Link>
              <Nav.Link as={Link} to="/board/leagues">Leagues</Nav.Link>
              <Nav.Link as={Link} to="/board/market">Buy & Sell</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

const LoginWidget = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      login(res.data.user, res.data.token);
      setError('');
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="login-box mb-3">
      <Form onSubmit={handleSubmit}>
        <Row className="g-2">
          <Col xs={8}>
            <Form.Control 
              size="sm" 
              type="text" 
              placeholder="ID" 
              className="mb-1"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <Form.Control 
              size="sm" 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)} 
            />
          </Col>
          <Col xs={4}>
            <Button type="submit" className="login-btn">Login</Button>
          </Col>
        </Row>
        {error && <small className="text-danger d-block mt-1">{error}</small>}
        <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.8rem' }}>
          <a href="#" className="text-muted">Find ID/PW</a>
          <Link to="/register" className="text-muted">Sign Up</Link>
        </div>
      </Form>
    </div>
  );
};

const UserWidget = () => {
  const { user, logout } = useAuth();
  return (
    <div className="login-box mb-3 text-center">
      <p className="mb-2">Welcome, <strong>{user.username}</strong>!</p>
      <div className="d-grid gap-2">
        <Button variant="outline-secondary" size="sm">My Page</Button>
        <Button variant="secondary" size="sm" onClick={logout}>Logout</Button>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  return (
    <div className="sidebar">
      {user ? <UserWidget /> : <LoginWidget />}
      
      {/* Banner Area */}
      <div className="bg-secondary text-white text-center py-4 mb-3">
        Banner Ad
      </div>

      <h5>Hot Categories</h5>
      <ListGroup variant="flush" className="mb-4">
        <ListGroup.Item action as={Link} to="/board/general">Talk Lounge</ListGroup.Item>
        <ListGroup.Item action as={Link} to="/board/health">Health & Beauty</ListGroup.Item>
        <ListGroup.Item action as={Link} to="/board/food">Home & Food</ListGroup.Item>
      </ListGroup>

      <div className="bg-light border text-center p-3">
        <small>Ad Space</small>
        <br/>
        <strong>Support Local Leagues!</strong>
      </div>
    </div>
  );
};

const Home = () => {

  const [generalPosts, setGeneralPosts] = useState([]);

  const [marketPosts, setMarketPosts] = useState([]);

  const [leaguePosts, setLeaguePosts] = useState([]);

  const [lifePosts, setLifePosts] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);

        const [resGeneral, resMarket, resLeagues, resLife] = await Promise.all([

          axios.get('/api/posts?category=general'),

          axios.get('/api/posts?category=market'),

          axios.get('/api/posts?category=leagues'),

          axios.get('/api/posts?category=life')

        ]);

        setGeneralPosts(resGeneral.data.slice(0, 5));

        setMarketPosts(resMarket.data.slice(0, 5));

        setLeaguePosts(resLeagues.data.slice(0, 5));

        setLifePosts(resLife.data.slice(0, 5));

      } catch (err) {

        console.error('Error fetching home data:', err);

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, []);



  return (

    <div>

      {/* Promo Banner */}

      <div className="bg-dark text-white p-4 mb-4 text-center rounded">

        <h2>2026 Season Kickoff Event!</h2>

        <p>Sign up now for early bird discounts.</p>

      </div>



      {loading ? <p>Loading data...</p> : (

        <>

          <Row>

            <Col md={6} className="mb-4">

              <div className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: '2px solid #f26522', paddingBottom: '5px' }}>

                <h5 className="m-0">

                  <Link to="/board/general" style={{ color: '#f26522', textDecoration: 'none' }}>Talk Lounge</Link>

                </h5>

                <Link to="/board/general" className="text-muted small">See More &raquo;</Link>

              </div>

              <ul className="portal-list">

                {generalPosts.map(p => (

                  <li key={p.id} className="clickable-li">

                    <Link to={`/post/${p.id}`} className="d-block w-100 h-100 text-decoration-none color-inherit">

                      <span className="category-tag">[{p.category}]</span>

                      <span className="post-title-text">{p.title}</span>

                    </Link>

                  </li>

                ))}

                {generalPosts.length === 0 && <li>No posts yet</li>}

              </ul>

            </Col>

            <Col md={6} className="mb-4">

              <div className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: '2px solid #f26522', paddingBottom: '5px' }}>

                <h5 className="m-0">

                  <Link to="/board/market" style={{ color: '#f26522', textDecoration: 'none' }}>Marketplace</Link>

                </h5>

                <Link to="/board/market" className="text-muted small">See More &raquo;</Link>

              </div>

              <ul className="portal-list">

                {marketPosts.map(p => (

                  <li key={p.id} className="clickable-li">

                    <Link to={`/post/${p.id}`} className="d-block w-100 h-100 text-decoration-none color-inherit">

                      <span className="category-tag">[{p.category}]</span>

                      <span className="post-title-text">{p.title}</span>

                    </Link>

                  </li>

                ))}

                {marketPosts.length === 0 && <li>No posts yet</li>}

              </ul>

            </Col>

          </Row>



          <Row>

            <Col md={6} className="mb-4">

              <div className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: '2px solid #f26522', paddingBottom: '5px' }}>

                <h5 className="m-0">

                  <Link to="/board/leagues" style={{ color: '#f26522', textDecoration: 'none' }}>League Info</Link>

                </h5>

                <Link to="/board/leagues" className="text-muted small">See More &raquo;</Link>

              </div>

              <ul className="portal-list">

                {leaguePosts.map(p => (

                  <li key={p.id} className="clickable-li">

                    <Link to={`/post/${p.id}`} className="d-block w-100 h-100 text-decoration-none color-inherit">

                      <span className="category-tag">[{p.category}]</span>

                      <span className="post-title-text">{p.title}</span>

                    </Link>

                  </li>

                ))}

                {leaguePosts.length === 0 && <li>No posts yet</li>}

              </ul>

            </Col>

            <Col md={6} className="mb-4">

              <div className="d-flex justify-content-between align-items-center mb-2" style={{ borderBottom: '2px solid #f26522', paddingBottom: '5px' }}>

                <h5 className="m-0">

                  <Link to="/board/life" style={{ color: '#f26522', textDecoration: 'none' }}>Life & Culture</Link>

                </h5>

                <Link to="/board/life" className="text-muted small">See More &raquo;</Link>

              </div>

              <ul className="portal-list">

                {lifePosts.map(p => (

                  <li key={p.id} className="clickable-li">

                    <Link to={`/post/${p.id}`} className="d-block w-100 h-100 text-decoration-none color-inherit">

                      <span className="category-tag">[{p.category}]</span>

                      <span className="post-title-text">{p.title}</span>

                    </Link>

                  </li>

                ))}

                {lifePosts.length === 0 && <li>No posts yet</li>}

              </ul>

            </Col>

          </Row>

        </>

      )}

    </div>

  );

};

// Re-using existing Login/Register pages as fallbacks or for specific routing needs
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
        <h3 className="text-capitalize" style={{ color: '#f26522', borderBottom: '2px solid #f26522' }}>{category} Board</h3>
        {user && (
          <Link to={`/create/${category}`} className="btn btn-baseball btn-sm">
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
          {posts.map(post => (
            <tr key={post.id}>
              <td><Link to={`/post/${post.id}`} className="text-dark">{post.title}</Link></td>
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
      <h3 className="mb-3" style={{ color: '#f26522' }}>Write: {category}</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control as="textarea" rows={10} value={content} onChange={e => setContent(e.target.value)} required />
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

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setError(null);
        const res = await axios.get(`/api/posts/${id}`);
        setPost(res.data);
        setEditContent(res.data.content);
      } catch (err) {
        console.error(err);
        setError('Post not found or server error');
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

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!post) return <p>Loading...</p>;

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom-0 pt-3">
        <h4 style={{ color: '#333' }}>{post.title}</h4>
        <div className="d-flex justify-content-between text-muted small">
          <span>By: {post.author}</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </Card.Header>
      <Card.Body>
        <hr className="mt-0" />
        {isEditing ? (
             <Form.Group className="mb-3">
             <Form.Control as="textarea" rows={10} value={editContent} onChange={e => setEditContent(e.target.value)} required />
             <div className="mt-2">
                 <Button variant="success" size="sm" onClick={handleUpdate} className="me-2">Save</Button>
                 <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
             </div>
           </Form.Group>
        ) : (
            <Card.Text style={{ whiteSpace: 'pre-wrap', minHeight: '200px' }}>
            {post.content}
            </Card.Text>
        )}
        
        {user && user.username === post.author && !isEditing && (
          <div className="mt-4 text-end">
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
        <Container>
          <Row className="mt-4">
            {/* Main Content: Left */}
            <Col md={9} className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/board/:category" element={<Board />} />
                <Route path="/create/:category" element={<CreatePost />} />
                <Route path="/post/:id" element={<PostDetail />} />
              </Routes>
            </Col>
            
            {/* Sidebar: Right */}
            <Col md={3} className="p-0">
              <Sidebar />
            </Col>
          </Row>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;