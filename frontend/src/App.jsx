import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import styled from 'styled-components';
import Auth from './pages/Auth';
import Home from './pages/Home';
import DashboardHub from './pages/DashboardHub'; 

const AppContainer = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  min-height: 100vh;
  font-family: 'Inter', 'Segoe UI', sans-serif;
`;

const Navbar = styled.nav`
  background: ${(props) => props.theme.colors.cardBg};
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
`;

// Updated Brand to act as an image container instead of text
const Brand = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

// FIXED: Added zooming and blending to fix the tiny logo!
const LogoImg = styled.img`
  height: 60px; /* Base height */
  width: auto;
  object-fit: contain;
  transform: scale(1.6); /* Zooms in to cut out the white space */
  transform-origin: left center; /* Keeps it locked to the left side */
  mix-blend-mode: multiply; /* Makes the white background transparent */
`;

const SearchBar = styled.input`
  flex: 0.5;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${(props) => props.theme.colors.secondary};
    background: white;
  }

  @media (max-width: 768px) {
    display: none; 
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${(props) => props.theme.colors.textDark};
  font-weight: 600;
  font-size: 0.95rem;
  
  &:hover { color: ${(props) => props.theme.colors.primary}; }
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid ${(props) => props.theme.colors.primary};
  color: ${(props) => props.theme.colors.primary};
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.primary};
    color: white;
  }
`;

const TopNav = ({ userInfo, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Keep search box text in sync if they hit "Back" in the browser
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || "");
  }, [location.search]);

  // Push the search term to the URL instantly
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === "") {
      navigate('/'); // Clear search, go to normal home
    } else {
      navigate(`/?search=${encodeURIComponent(value)}`); // Attach search query to URL
    }
  };

  return (
    <Navbar>
      {/* Replaced CampusHub text with your new Orbito logo */}
      <Brand to="/">
        <LogoImg src="/orbito-logo.png" alt="Orbito Logo" />
      </Brand>
      
      {/* Updated placeholder text to match the new name */}
      <SearchBar 
        placeholder="Search for food, books, services, or tutors on Orbito..." 
        value={searchTerm}
        onChange={handleSearchChange} 
      />

      <NavLinks>
        <NavLink to="/">Home</NavLink>
        {userInfo ? (
          <>
            <NavLink to="/dashboard">Profile</NavLink>
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </>
        ) : (
          <NavLink to="/auth">Login / Register</NavLink>
        )}
        <div style={{ cursor: 'pointer', fontSize: '1.2rem' }}>🛒</div>
      </NavLinks>
    </Navbar>
  );
};

function App() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/auth'; 
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContainer>
          
          <TopNav userInfo={userInfo} handleLogout={handleLogout} />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardHub />} />
            <Route path="/profile" element={<DashboardHub />} /> 
          </Routes>

        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;