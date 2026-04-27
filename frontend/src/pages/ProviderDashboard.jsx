import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import API from '../api/axios';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const StatusBanner = styled.div`
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: bold;
  background: ${(props) => {
    if (props.$status === 'Pending') return '#fff3cd';
    if (props.$status === 'Approved') return '#d4edda';
    if (props.$status === 'Rejected') return '#f8d7da';
    return '#f8d7da';
  }};
  color: ${(props) => {
    if (props.$status === 'Pending') return '#856404';
    if (props.$status === 'Approved') return '#155724';
    if (props.$status === 'Rejected') return '#721c24';
    return '#721c24';
  }};
  border: 1px solid ${(props) => {
    if (props.$status === 'Pending') return '#ffeeba';
    if (props.$status === 'Approved') return '#c3e6cb';
    if (props.$status === 'Rejected') return '#f5c6cb';
    return '#f5c6cb';
  }};
`;

const FormCard = styled.div`
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #eee;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 700;
  color: #2d3436;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  &:focus { border-color: #e74c3c; }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background: white;
  &:focus { border-color: #e74c3c; }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  resize: vertical;
  min-height: 100px;
  &:focus { border-color: #e74c3c; }
`;

const SubmitButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;

const EditButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #2980b9; }
`;

const ProfileText = styled.p`
  margin: 8px 0 0 0;
  color: #636e72;
  line-height: 1.6;
  font-size: 1.05rem;
`;

const TabGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const TabBtn = styled.button`
  flex: 1;
  padding: 14px;
  background: ${(props) => props.active ? '#3498db' : '#f8f9fa'};
  color: ${(props) => props.active ? '#fff' : '#2d3436'};
  border: 1px solid ${(props) => props.active ? '#3498db' : '#eee'};
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
  &:hover { background: ${(props) => props.active ? '#2980b9' : '#e9ecef'}; }
`;

const ProviderDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [providerData, setProviderData] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({ itemName: '', price: '', description: '', photo: '' });

  const [formData, setFormData] = useState({
    name: '', shopType: 'Services', description: '', price: '',
    address: '', phone: '', gender: 'Male', experience: '',
    website: '', photo: '', catalog: [] 
  });

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo._id : null; // FIXED: Safely extract the User ID

  // FIXED: The useEffect dependency array now only watches for the string `userId`, preventing infinite resets!
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await API.get(`/shop/my-listing/${userId}`);
        if (data) {
          setProviderData(data);
          
          setFormData({
            name: data.name || '',
            shopType: data.shopType || 'Services',
            description: data.description || '',
            price: data.price || '',
            address: data.address || '',
            phone: data.phone || '',
            gender: data.gender || 'Male',
            experience: data.experience || '',
            website: data.website || '',
            photo: data.photo || '',
            catalog: data.catalog || []
          });
          
          try {
            const orderRes = await API.get(`/orders/provider/${userId}`);
            setOrders(orderRes.data);
          } catch (orderErr) {
            console.error("Failed to fetch orders", orderErr);
          }
        }
      } catch (error) {
        console.log("No existing listing found.");
      }
    };
    if (userId) checkStatus();
  }, [userId]); // <--- BUG FIXED HERE

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
    }
  };

  const handleCatalogImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setNewItem({ ...newItem, photo: reader.result });
      };
    }
  };

  const addCatalogItem = () => {
    if (!newItem.itemName || !newItem.price) return alert("Item Name and Price are required!");
    setFormData({ ...formData, catalog: [...formData.catalog, newItem] });
    setNewItem({ itemName: '', price: '', description: '', photo: '' }); // Clear input
  };

  const removeCatalogItem = (index) => {
    const updated = formData.catalog.filter((_, i) => i !== index);
    setFormData({ ...formData, catalog: updated });
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await API.put('/orders/update-status', { orderId, approvalStatus: status });
      setOrders(orders.map(o => o._id === orderId ? { ...o, approvalStatus: status } : o));
      alert(`Request has been ${status}!`);
    } catch (error) {
      alert("Failed to update status. Make sure backend is running.");
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      let data;
      const payload = { ownerId: userId, ...formData, lat: 22.5726, lng: 88.3639 };

      if (providerData && providerData._id) {
        const response = await API.put(`/shop/update/${providerData._id}`, payload);
        data = response.data;
        alert("Profile & Catalog updated successfully!");
      } else {
        const response = await API.post('/shop/register', payload);
        data = response.data;
        alert("Application submitted successfully!");
      }
      
      setProviderData(data.shop);
      setIsEditing(false); 
    } catch (error) {
      alert("Error submitting. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing && providerData?.status === 'Approved') {
    return (
      <DashboardContainer>
        
        <div style={{ background: '#d4edda', color: '#155724', padding: '12px 20px', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #c3e6cb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div><strong>✅ Profile Status: LIVE</strong></div>
          {providerData.adminMessage && (
            <div style={{ fontSize: '0.95rem' }}><em>Admin Note: {providerData.adminMessage}</em></div>
          )}
        </div>

        <TabGroup>
          <TabBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>🏪 Store Profile</TabBtn>
          <TabBtn active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')}>📋 Manage Menu / Rooms</TabBtn>
          <TabBtn active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>📚 Live Requests</TabBtn>
        </TabGroup>

        {activeTab === 'profile' && (
          <FormCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '2rem', marginBottom: '2rem' }}>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {providerData.photo ? (
                  <img src={providerData.photo} alt="Profile" style={{ width: '110px', height: '110px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #ddd' }} />
                ) : (
                  <div style={{ width: '110px', height: '110px', borderRadius: '12px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid #ddd' }}>🏪</div>
                )}
                
                <div>
                  <h1 style={{ margin: '0 0 10px 0', color: '#2d3436', fontSize: '1.8rem' }}>{providerData.name}</h1>
                  <span style={{ background: '#e8f4fd', color: '#2980b9', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {providerData.shopType}
                  </span>
                  {providerData.website && (
                    <a href={providerData.website} target="_blank" rel="noreferrer" style={{ marginLeft: '12px', color: '#3498db', fontSize: '0.95rem', textDecoration: 'none', fontWeight: '500' }}>
                      🌐 Visit Website
                    </a>
                  )}
                </div>
              </div>

              <EditButton onClick={startEditing}>✏️ Edit Profile</EditButton>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
              <div>
                <Label>Description</Label>
                <ProfileText>{providerData.description}</ProfileText>
              </div>

              <div>
                <Label>Base Pricing / Rate</Label>
                <ProfileText style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {providerData.shopType === 'Medical' ? 'N/A' : providerData.price}
                </ProfileText>
              </div>

              <div>
                <Label>Contact & Location</Label>
                <ProfileText>📞 {providerData.phone}</ProfileText>
                <ProfileText>📍 {providerData.address}</ProfileText>
              </div>

              <div>
                <Label>Provider Details</Label>
                <ProfileText>👤 Gender: {providerData.gender}</ProfileText>
                <ProfileText>⭐ Experience: {providerData.experience}</ProfileText>
              </div>
            </div>
          </FormCard>
        )}

        {activeTab === 'catalog' && (
          <FormCard>
            <h2 style={{ marginTop: 0, color: '#2d3436' }}>Add to your Catalog</h2>
            <p style={{ color: '#636e72', marginBottom: '1.5rem' }}>Add specific rooms, food recipes, grocery bundles, or items to your profile.</p>
            
            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <Input type="text" placeholder="Item Name (e.g. Single AC Room, Mutton Biryani)" value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} />
                <Input type="text" placeholder="Price (e.g. ₹5000/mo, ₹150)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              </div>
              <TextArea placeholder="Short Description..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} style={{ minHeight: '60px', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Input type="file" accept="image/*" onChange={handleCatalogImageUpload} style={{ flex: 1, minWidth: '200px' }} />
                {/* FIXED: type="button" prevents accidental form submission */}
                <button type="button" onClick={addCatalogItem} style={{ background: '#3498db', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Item</button>
              </div>
            </div>

            <h3 style={{ color: '#2d3436', marginBottom: '1rem' }}>Current Items ({formData.catalog.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {formData.catalog.map((item, index) => (
                <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                  {item.photo && <img src={item.photo} alt={item.itemName} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />}
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{item.itemName}</h4>
                    <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: '0 0 10px 0' }}>{item.price}</p>
                    <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 10px 0' }}>{item.description}</p>
                    {/* FIXED: type="button" prevents accidental form submission */}
                    <button type="button" onClick={() => removeCatalogItem(index)} style={{ background: '#ff7675', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <SubmitButton onClick={handleSubmit}>💾 Save Catalog to Live Profile</SubmitButton>
          </FormCard>
        )}

        {activeTab === 'orders' && (
          <FormCard>
            <h2 style={{ marginTop: 0, color: '#2d3436' }}>Incoming Requests</h2>
            <p style={{ color: '#636e72', marginBottom: '1.5rem' }}>Review student requests and confirm availability.</p>
            
            {orders.length === 0 ? (
              <p style={{ color: '#888', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
                No active requests right now.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f2f6', color: '#2d3436' }}>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Requested Service</th>
                      <th style={{ padding: '12px' }}>Amount</th>
                      <th style={{ padding: '12px' }}>Payment Status</th>
                      <th style={{ padding: '12px' }}>Your Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#636e72', fontSize: '0.9rem' }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{order.student?.name || 'Guest'}</td>
                        <td style={{ padding: '12px' }}>{order.serviceName}</td>
                        <td style={{ padding: '12px', color: '#27ae60', fontWeight: 'bold' }}>₹{order.amount}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#888' }}>{order.status}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {order.approvalStatus === 'Pending Approval' || !order.approvalStatus ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleOrderStatus(order._id, 'Accepted')} style={{ background: '#27ae60', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Accept</button>
                              <button onClick={() => handleOrderStatus(order._id, 'Rejected')} style={{ background: '#e74c3c', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ 
                              background: order.approvalStatus === 'Accepted' ? '#d4edda' : '#f8d7da', 
                              color: order.approvalStatus === 'Accepted' ? '#155724' : '#721c24', 
                              padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold'
                            }}>
                              {order.approvalStatus}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FormCard>
        )}

      </DashboardContainer>
    );
  }

  if (!isEditing && providerData?.status === 'Rejected') {
    return (
      <DashboardContainer>
        <StatusBanner $status="Rejected">❌ Application Declined</StatusBanner>
        <FormCard style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: '#e74c3c' }}>Your application was not approved.</h2>
          <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f5c6cb', borderRadius: '8px', marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Reason from Admin:</h4>
            <p style={{ color: '#333', fontSize: '1.1rem', fontStyle: 'italic' }}>"{providerData.adminMessage || 'No specific reason provided.'}"</p>
          </div>
          <EditButton onClick={startEditing} style={{ marginTop: '2rem' }}>🔄 Fix Details & Re-apply</EditButton>
        </FormCard>
      </DashboardContainer>
    );
  }

  if (!isEditing && providerData?.status === 'Pending') {
    return (
      <DashboardContainer>
        <StatusBanner $status="Pending">⏳ Application Under Review</StatusBanner>
        <FormCard style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>We received your application!</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>Our Admin team is currently verifying your details for <b>{providerData.name}</b>. We will activate your profile as soon as verification is complete.</p>
          <EditButton onClick={startEditing} style={{ background: '#bdc3c7', color: '#333', marginTop: '1.5rem' }}>✏️ Make a quick edit</EditButton>
        </FormCard>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <h2 style={{ color: '#2d3436', marginBottom: '1.5rem' }}>
        {isEditing ? '✏️ Edit Your Profile' : '💼 Become a Provider'}
      </h2>
      <p style={{ color: '#636e72', marginBottom: '2rem' }}>
        {isEditing ? 'Make your changes below. Saving will send your profile back to the Admin for quick review.' : 'Fill out the details below to offer your services.'}
      </p>

      <FormCard>
        <form onSubmit={handleSubmit}>
          
          <FormGroup>
            <Label>Service Category</Label>
            <Select name="shopType" value={formData.shopType} onChange={handleChange}>
              <option value="Services">🔧 Handyman / Services (Plumber, AC Repair)</option>
              <option value="Tutors">👨‍🏫 Tutoring / Teaching</option>
              <option value="Restaurant">🍔 Restaurant / Food</option>
              <option value="Medical">🏥 Medical / Pharmacy</option>
              <option value="Grocery">🛒 Grocery Store</option>
              <option value="Hostel">🏠 PG / Hostel</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Business or Service Name</Label>
            <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </FormGroup>

          <FormGroup>
            <Label>Service Description</Label>
            <TextArea name="description" value={formData.description} onChange={handleChange} required />
          </FormGroup>

          <FormGroup>
            <Label>Base Pricing / Rate</Label>
            <Input type="text" name="price" value={formData.price} onChange={handleChange} required />
          </FormGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <FormGroup style={{ marginBottom: 0 }}>
              <Label>Gender</Label>
              <Select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </FormGroup>
            <FormGroup style={{ marginBottom: 0 }}>
              <Label>Years of Experience</Label>
              <Input type="text" name="experience" value={formData.experience} onChange={handleChange} required />
            </FormGroup>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <Label>Contact Phone</Label>
              <Input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
            </FormGroup>
            <FormGroup>
              <Label>Service Area / Address</Label>
              <Input type="text" name="address" value={formData.address} onChange={handleChange} required />
            </FormGroup>
          </div>

          <FormGroup>
            <Label>Portfolio / Website Link (Optional)</Label>
            <Input type="url" name="website" value={formData.website} onChange={handleChange} />
          </FormGroup>

          <FormGroup>
            <Label>Provider Photo / ID Card (Required) 📸</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} required={!formData.photo} />
            {formData.photo && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 5px 0' }}>Current Photo:</p>
                <img src={formData.photo} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #ddd' }} />
              </div>
            )}
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Save Changes & Resubmit' : 'Submit for Admin Approval')}
          </SubmitButton>

          {isEditing && (
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              style={{ width: '100%', padding: '14px', background: 'transparent', border: 'none', color: '#888', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
            >
              Cancel Edit
            </button>
          )}

        </form>
      </FormCard>
    </DashboardContainer>
  );
};

export default ProviderDashboard;