import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import API from '../api/axios';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// --- SIDEBAR STYLES ---
const Sidebar = styled.div`
  width: 280px;
  background: ${(props) => props.theme.colors.cardBg};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #f0f0f0;
`;

const UserOverview = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fafafa;
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  font-weight: bold;
`;

const Greeting = styled.div`
  p { margin: 0; font-size: 0.85rem; color: ${(props) => props.theme.colors.textLight}; }
  h4 { margin: 0; color: ${(props) => props.theme.colors.textDark}; font-size: 1.1rem; }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f5f5f5;
  color: ${(props) => props.active ? props.theme.colors.primary : props.theme.colors.textDark};
  background: ${(props) => props.active ? '#fff0f0' : 'transparent'};
  font-weight: ${(props) => props.active ? 'bold' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    color: ${(props) => props.theme.colors.primary};
    background: #fafafa;
  }

  ${(props) => props.isLogout && `
    color: #e74c3c;
    border-bottom: none;
    margin-top: 1rem;
    &:hover { background: #fcebeb; color: #c0392b; }
  `}
`;

// --- MAIN CONTENT STYLES ---
const MainContent = styled.div`
  flex-grow: 1;
  background: ${(props) => props.theme.colors.cardBg};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 2rem;
  border: 1px solid #f0f0f0;
  min-height: 400px;
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
  color: ${(props) => props.theme.colors.textDark};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.span`
  color: ${(props) => props.theme.colors.textLight};
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const Value = styled.div`
  color: ${(props) => props.theme.colors.textDark};
  font-size: 1.1rem;
  font-weight: 500;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
`;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); 
  
  const [savedNotes, setSavedNotes] = useState([]); 
  const [loadingNotes, setLoadingNotes] = useState(false);

  // For Order History
  const [studentOrders, setStudentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch basic profile info on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get('/users/profile');
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('userInfo');
          window.location.href = '/auth';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch saved notes only when the user clicks the "notes" tab
  useEffect(() => {
    if (activeTab === 'notes') {
      const fetchNotes = async () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo && userInfo._id) {
          setLoadingNotes(true);
          try {
            const { data } = await API.get(`/notes/my-notes/${userInfo._id}`);
            setSavedNotes(data);
          } catch (error) {
            console.error("Failed to fetch notes", error);
          } finally {
            setLoadingNotes(false);
          }
        }
      };
      fetchNotes();
    }
  }, [activeTab]);

  // Fetch order history only when the user clicks the "orders" tab
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo && userInfo._id) {
          setLoadingOrders(true);
          try {
            const { data } = await API.get(`/orders/student/${userInfo._id}`);
            setStudentOrders(data);
          } catch (error) {
            console.error("Failed to fetch orders", error);
          } finally {
            setLoadingOrders(false);
          }
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/auth'; 
  };

  if (loading) return <PageContainer>Loading your dashboard...</PageContainer>;
  if (!profile) return <PageContainer>Please log in to view your profile.</PageContainer>;

  return (
    <PageContainer>
      
      {/* 1. SIDEBAR */}
      <Sidebar>
        <UserOverview>
          <Avatar>{profile.name.charAt(0).toUpperCase()}</Avatar>
          <Greeting>
            <p>Hello,</p>
            <h4>{profile.name}</h4>
          </Greeting>
        </UserOverview>

        <NavList>
          <NavItem active={activeTab === 'info'} onClick={() => setActiveTab('info')}>
            👤 Personal Information
          </NavItem>
          
          <NavItem active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>
            📄 My Saved Notes
          </NavItem>

          <NavItem active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
            📦 My Orders & Bookings
          </NavItem>

          <NavItem active={activeTab === 'listings'} onClick={() => setActiveTab('listings')}>
            🏷️ My Marketplace Listings
          </NavItem>

          <NavItem active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
            🔐 Security & Settings
          </NavItem>
          
          <NavItem isLogout onClick={handleLogout}>
            🚪 Logout
          </NavItem>
        </NavList>
      </Sidebar>

      {/* 2. MAIN CONTENT AREA */}
      <MainContent>
        {activeTab === 'info' && (
          <>
            <SectionTitle>Personal Information</SectionTitle>
            <InfoGrid>
              <InfoBox>
                <Label>Full Name</Label>
                <Value>{profile.name}</Value>
              </InfoBox>
              
              <InfoBox>
                <Label>Email Address</Label>
                <Value>{profile.email}</Value>
              </InfoBox>

              <InfoBox>
                <Label>Account Role</Label>
                <Value>{profile.role}</Value>
              </InfoBox>

              <InfoBox>
                <Label>Account Status</Label>
                <Value style={{ color: profile.isInstituteVerified ? '#27ae60' : '#f39c12', fontWeight: 'bold' }}>
                  {profile.role === 'Student' 
                    ? (profile.isInstituteVerified ? 'Verified Student ✅' : 'Pending Verification ⏳') 
                    : 'Active Account'}
                </Value>
              </InfoBox>

              <InfoBox>
                <Label>Member Since</Label>
                <Value>{new Date(profile.joinedAt).toLocaleDateString()}</Value>
              </InfoBox>
            </InfoGrid>
          </>
        )}

        {/* Saved PDF Documents */}
        {activeTab === 'notes' && (
          <>
            <SectionTitle>📄 My Saved PDF Documents</SectionTitle>
            {loadingNotes ? (
              <p style={{ color: '#888' }}>Fetching your documents...</p>
            ) : savedNotes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {savedNotes.map((note) => (
                  <div key={note._id} style={{ 
                    padding: '1.5rem', 
                    border: '1px solid #eee', 
                    borderRadius: '12px', 
                    background: '#fff',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '3rem', marginBottom: '10px' }}>📕</span>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2d3436' }}>{note.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#b2bec3', marginBottom: '1.5rem' }}>
                      Generated on {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    
                    <a 
                      href={note.pdfBase64} 
                      download={`${note.title}.pdf`}
                      style={{
                        background: '#e74c3c',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '30px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '100%',
                        transition: 'background 0.2s',
                        display: 'inline-block'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#c0392b'}
                      onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                    >
                      📥 Download PDF
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888' }}>You haven't saved any PDF documents yet. Go scan some notes!</p>
            )}
          </>
        )}

        {/* UPDATED: Student Order History Table with Approval Status */}
        {activeTab === 'orders' && (
          <>
            <SectionTitle>📦 My Orders & Bookings</SectionTitle>
            {loadingOrders ? (
              <p style={{ color: '#888' }}>Loading your order history...</p>
            ) : studentOrders.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f2f6', color: '#2d3436' }}>
                      <th style={{ padding: '12px', borderTopLeftRadius: '8px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Provider Name</th>
                      <th style={{ padding: '12px' }}>Service / Item</th>
                      <th style={{ padding: '12px' }}>Amount Paid</th>
                      <th style={{ padding: '12px' }}>Payment Status</th>
                      <th style={{ padding: '12px', borderTopRightRadius: '8px' }}>Provider Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentOrders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#636e72', fontSize: '0.9rem' }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {order.provider?.name || 'Unknown Provider'}
                        </td>
                        <td style={{ padding: '12px' }}>{order.serviceName}</td>
                        <td style={{ padding: '12px', color: '#e74c3c', fontWeight: 'bold' }}>₹{order.amount}</td>
                        
                        {/* PAYMENT STATUS */}
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: order.status === 'Paid - Awaiting Service' ? '#d4edda' : '#fff3cd', 
                            color: order.status === 'Paid - Awaiting Service' ? '#155724' : '#856404', 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}>
                            {order.status}
                          </span>
                        </td>

                        {/* NEW: PROVIDER APPROVAL STATUS */}
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            background: order.approvalStatus === 'Accepted' ? '#d4edda' : order.approvalStatus === 'Rejected' ? '#f8d7da' : '#e2e3e5', 
                            color: order.approvalStatus === 'Accepted' ? '#155724' : order.approvalStatus === 'Rejected' ? '#721c24' : '#383d41', 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}>
                            {order.approvalStatus || 'Pending Approval'}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#888', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
                You have no recent orders. Start exploring Ghar Ka Khana or Services!
              </p>
            )}
          </>
        )}

        {activeTab === 'listings' && (
          <>
            <SectionTitle>My Marketplace Listings</SectionTitle>
            <p style={{ color: '#888' }}>You haven't listed any items or notes for sale yet.</p>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <SectionTitle>Security & Settings</SectionTitle>
            <p style={{ color: '#888' }}>Password change and notification preferences will appear here.</p>
          </>
        )}
      </MainContent>

    </PageContainer>
  );
};

export default Profile;