import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ProductCard from '../components/ProductCard';
import OcrScanner from '../components/OcrScanner'; 
import API from '../api/axios'; 
import { useLocation } from 'react-router-dom';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1300px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  color: ${(props) => props.theme.colors.textDark};
  margin: 2rem 0 1rem 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavLabel = styled.h4`
  color: ${(props) => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.85rem;
  margin: 1.5rem 0 0.5rem 0;
`;

const CategoryWrapper = styled.div`
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scrollbar-width: none; 
  &::-webkit-scrollbar { display: none; } 
`;

const LiveCategoryWrapper = styled(CategoryWrapper)`
  background: #f0f7ff;
  padding: 1rem;
  border-radius: 12px;
  border: 1px dashed #74b9ff;
`;

const CategoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 90px;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: translateY(-3px); }
`;

const IconCircle = styled.div`
  width: 65px;
  height: 65px;
  border-radius: 50%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  border: 3px solid ${(props) => props.$active ? props.theme.colors.primary : 'transparent'};
  transition: border 0.3s ease;
`;

const CategoryText = styled.span`
  font-size: 0.85rem;
  font-weight: ${(props) => props.$active ? '800' : '600'};
  color: ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.textDark};
  text-align: center;
  transition: color 0.3s ease;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center;
  z-index: 1000; padding: 1rem;
`;

const ModalBox = styled.div`
  background: white; width: 100%; max-width: 650px; max-height: 85vh;
  border-radius: 12px; overflow-y: auto; padding: 2rem; position: relative;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;

const CloseButton = styled.button`
  position: absolute; top: 15px; right: 20px; background: transparent; border: none;
  font-size: 1.5rem; cursor: pointer; color: #888;
  &:hover { color: #e74c3c; }
`;

const CatalogGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1.5rem;
`;

const CatalogItemCard = styled.div`
  display: flex; gap: 1rem; border: 1px solid #eee; padding: 1rem; border-radius: 8px;
  align-items: center; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  @media (max-width: 600px) { flex-direction: column; text-align: center; }
`;

const CatalogImg = styled.img`
  width: 100px; height: 100px; border-radius: 8px; object-fit: cover; background: #f8f9fa;
`;

const BuyBtn = styled.button`
  background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 6px;
  font-weight: bold; cursor: pointer; white-space: nowrap; transition: background 0.2s;
  &:hover { background: #219a52; }
`;

const campusCategories = [
  { icon: '🌟', name: 'All' },
  { icon: '🍱', name: 'Ghar Ka Khana' },
  { icon: '👨‍🏫', name: 'Tutors' },
  { icon: '🛠', name: 'Services' },
  { icon: '📄', name: 'OCR Notes' },
  { icon: '🎓', name: 'Marketplace' },
  { icon: '💼', name: 'Internships' },
  { icon: '🧺', name: 'Laundry' },
  { icon: '🏠', name: 'PG/Hostel' },
];

const liveCategories = [
  { icon: '🍔', name: 'Restaurants' },
  { icon: '🛒', name: 'Groceries' },
  { icon: '🏥', name: 'Medical SOS' },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyFood, setNearbyFood] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]); 
  const [nearbyTutors, setNearbyTutors] = useState([]); 
  const [nearbyServices, setNearbyServices] = useState([]); 

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const location = useLocation();
  const searchParam = new URLSearchParams(location.search).get('search') || "";
  const searchQuery = searchParam.toLowerCase();

  useEffect(() => {
    if (searchQuery && activeCategory !== 'All') {
      setActiveCategory('All');
    }
  }, [searchQuery]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location access denied or failed", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (activeCategory === 'All' || activeCategory === 'Ghar Ka Khana') {
      const fetchNearbyFood = async () => {
        try {
          const { data } = await API.get(`/food/nearby?lat=&lng=&type=Ghar Ka Khana`);
          setNearbyFood(data);
        } catch (error) {
          console.error("Error fetching nearby food:", error);
        }
      };
      fetchNearbyFood();
    }
  }, [activeCategory]);

  useEffect(() => {
    if (['All', 'Groceries', 'Medical SOS', 'Restaurants', 'PG/Hostel'].includes(activeCategory)) {
      const fetchNearbyShops = async () => {
        try {
          let type = 'All'; 
          if (activeCategory === 'Groceries') type = 'Grocery';
          if (activeCategory === 'Medical SOS') type = 'Medical';
          if (activeCategory === 'Restaurants') type = 'Restaurant';
          if (activeCategory === 'PG/Hostel') type = 'Hostel'; 
          
          const { data } = await API.get(`/shop/nearby?lat=&lng=&type=${type}`);
          setNearbyShops(data);
        } catch (error) {
          console.error("Error fetching nearby shops:", error);
        }
      };
      fetchNearbyShops();
    }
  }, [activeCategory]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const tutorsRes = await API.get(`/shop/nearby?lat=&lng=&type=Tutors`);
        setNearbyTutors(tutorsRes.data);

        const servicesRes = await API.get(`/shop/nearby?lat=&lng=&type=Services`);
        setNearbyServices(servicesRes.data);
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };
    fetchProviders();
  }, []); 

  // --- FIXED: Safely separating the shops by category so they show up beautifully in the 'All' tab! ---
  const filteredFood = nearbyFood.filter(item => item.name?.toLowerCase().includes(searchQuery));
  const filteredTutors = nearbyTutors.filter(item => item.name?.toLowerCase().includes(searchQuery));
  const filteredServices = nearbyServices.filter(item => item.name?.toLowerCase().includes(searchQuery));
  
  const filteredRestaurants = nearbyShops.filter(item => item.shopType === 'Restaurant' && (item.name?.toLowerCase().includes(searchQuery) || item.shopType?.toLowerCase().includes(searchQuery)));
  const filteredGroceries = nearbyShops.filter(item => item.shopType === 'Grocery' && (item.name?.toLowerCase().includes(searchQuery) || item.shopType?.toLowerCase().includes(searchQuery)));
  const filteredHostels = nearbyShops.filter(item => item.shopType === 'Hostel' && (item.name?.toLowerCase().includes(searchQuery) || item.shopType?.toLowerCase().includes(searchQuery)));
  const filteredMedical = nearbyShops.filter(item => item.shopType === 'Medical' && (item.name?.toLowerCase().includes(searchQuery) || item.shopType?.toLowerCase().includes(searchQuery)));
  // --------------------------------------------------------------------------------------------------

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true); 
  };

  const handleCheckout = async (shop, catalogItem = null) => {
    if (!userInfo) return alert("Please login to place a request or order.");

    const res = await loadRazorpayScript();
    if (!res) return alert("Razorpay SDK failed to load. Are you online?");

    let rawPrice = catalogItem ? catalogItem.price : shop.price;
    let amountStr = rawPrice ? String(rawPrice) : "";
    let amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (!amount || isNaN(amount)) amount = 100; 

    let serviceName = catalogItem ? `${shop.name} - ${catalogItem.itemName}` : shop.name;

    try {
      const { data } = await API.post('/orders/create', {
        studentId: userInfo._id,
        providerId: shop.owner || shop.provider?._id || shop.provider, 
        shopId: shop._id,
        serviceName: serviceName,
        amount: amount
      });

      const options = {
        key: 'rzp_test_ShxFQSsP6EuAnT', 
        amount: data.razorpayOrder.amount,
        currency: "INR",
        name: "CampusHub Marketplace",
        description: `Request for ${serviceName}`,
        order_id: data.razorpayOrder.id,
        handler: async function (response) {
          try {
            await API.post('/orders/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId: data.dbOrder._id
            });
            alert("✅ Request Sent! The provider will confirm availability shortly.");
            setIsModalOpen(false); 
          } catch (err) {
            alert("Verification failed!");
          }
        },
        prefill: { name: userInfo.name, email: userInfo.email },
        theme: { color: "#e74c3c" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Error initiating checkout. Please ensure your backend is running.");
    }
  };

  const handleSOSCall = () => {
    if (filteredMedical.length > 0 && filteredMedical[0].phone) {
      window.location.href = `tel:${filteredMedical[0].phone}`;
    } else {
      alert("No valid phone number found for the nearest medical shop.");
    }
  };

  const handleSOSWhatsApp = () => {
    if (filteredMedical.length > 0 && filteredMedical[0].phone) {
      let message = "🚨 *EMERGENCY SOS* 🚨\nI need immediate medical assistance.";
      if (userLocation) {
        message += `\n\n📍 *My Current Location:*\nhttps://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
      }
      window.open(`https://wa.me/91${filteredMedical[0].phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert("No valid phone number found for the nearest medical shop.");
    }
  };

  return (
    <PageContainer>
      
      {/* MODAL OVERLAY */}
      {isModalOpen && selectedProvider && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setIsModalOpen(false)}>✖</CloseButton>
            
            <h2 style={{ marginTop: 0, color: '#2d3436' }}>{selectedProvider.name}</h2>
            <p style={{ color: '#636e72', marginBottom: '1rem' }}>{selectedProvider.address} • 📞 {selectedProvider.phone}</p>
            
            <hr style={{ borderColor: '#eee' }} />
            
            <h3 style={{ marginTop: '1.5rem', color: '#2d3436' }}>Available Menu / Rooms</h3>
            
            {selectedProvider.catalog && selectedProvider.catalog.length > 0 ? (
              <CatalogGrid>
                {selectedProvider.catalog.map((item, idx) => (
                  <CatalogItemCard key={idx}>
                    {item.photo ? (
                      <CatalogImg src={item.photo} alt={item.itemName} />
                    ) : (
                      <div style={{ width: '100px', height: '100px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{item.itemName}</h4>
                      <p style={{ color: '#e74c3c', fontWeight: 'bold', margin: '0 0 5px 0' }}>{item.price}</p>
                      <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>{item.description}</p>
                    </div>
                    
                    <BuyBtn onClick={() => handleCheckout(selectedProvider, item)}>
                      Request / Buy
                    </BuyBtn>
                  </CatalogItemCard>
                ))}
              </CatalogGrid>
            ) : (
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: '#2d3436' }}>Standard Availability</h4>
                  <span style={{ background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#27ae60', borderRadius: '50%', display: 'inline-block' }}></span>
                    Available Now
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1.2rem', borderRadius: '8px', border: '1px solid #eee', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <div style={{ width: '70px', height: '70px', background: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {selectedProvider.shopType === 'Hostel' ? '🛏️' : '🏷️'}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <h5 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: '#2d3436' }}>
                      {selectedProvider.shopType === 'Hostel' ? 'Base Category Room' : 'Standard Service'}
                    </h5>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#636e72', lineHeight: '1.4' }}>
                      Specific photos haven't been uploaded yet. Booking will secure a standard spot at this property.
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                  <BuyBtn onClick={() => handleCheckout(selectedProvider, null)}>
                    Book Base Service ({selectedProvider.price || 'Standard Rate'})
                  </BuyBtn>
                </div>
              </div>
            )}

          </ModalBox>
        </ModalOverlay>
      )}

      {/* Top Nav Buttons */}
      {!searchQuery && (
        <>
          <NavLabel>Campus Hub Modules</NavLabel>
          <CategoryWrapper>
            {campusCategories.map((cat, index) => (
              <CategoryItem key={index} onClick={() => setActiveCategory(cat.name)}>
                <IconCircle $active={activeCategory === cat.name}>{cat.icon}</IconCircle>
                <CategoryText $active={activeCategory === cat.name}>{cat.name}</CategoryText>
              </CategoryItem>
            ))}
          </CategoryWrapper>

          <NavLabel>📍 Live Local Services</NavLabel>
          <LiveCategoryWrapper>
            {liveCategories.map((cat, index) => (
              <CategoryItem key={index} onClick={() => setActiveCategory(cat.name)}>
                <IconCircle $active={activeCategory === cat.name}>{cat.icon}</IconCircle>
                <CategoryText $active={activeCategory === cat.name}>{cat.name}</CategoryText>
              </CategoryItem>
            ))}
          </LiveCategoryWrapper>
        </>
      )}

      {searchQuery && (
        <SectionTitle>🔍 Search Results for "{searchQuery}"</SectionTitle>
      )}

      {/* 1. Ghar Ka Khana */}
      {(activeCategory === 'Ghar Ka Khana' || ((activeCategory === 'All' || searchQuery) && filteredFood.length > 0)) && (
        <>
          <SectionTitle>🍱 Trending Homemade Food</SectionTitle>
          <Grid>
            {filteredFood.length > 0 ? (
              filteredFood.map((item) => (
                <ProductCard 
                  key={item._id}
                  title={item.name} 
                  subtext={`By ${item.provider?.name || 'Local Kitchen'}`} 
                  price={item.price} 
                  badge="Homemade" 
                  btnText="View Menu"
                  img={item.photo || item.image || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80"} 
                  onClick={() => handleProviderClick(item)} 
                />
              ))
            ) : activeCategory === 'Ghar Ka Khana' ? (
              <>
                <ProductCard title="Rajma Chawal Combo" subtext="By Mrs. Sharma" price="80" badge="Bestseller" btnText="View Menu" img="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80" onClick={() => alert("Please search for live listings to order.")} />
                <ProductCard title="Aloo Paratha (2 Pcs)" subtext="By Student Kitchen" price="50" badge="Breakfast" btnText="View Menu" img="https://img.freepik.com/premium-photo/authentic-aloo-dhaniya-paratha-popular-street-food-aloo-paratha-alu-paratha-picture_1020697-123129.jpg" onClick={() => alert("Please search for live listings to order.")} />
                <ProductCard title="Chicken Biryani" subtext="By Zaika House" price="120" badge="Dinner" btnText="View Menu" img="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80" onClick={() => alert("Please search for live listings to order.")} />
              </>
            ) : null}
          </Grid>
        </>
      )}

      {/* 2. Tutors */}
      {(activeCategory === 'Tutors' || ((activeCategory === 'All' || searchQuery) && filteredTutors.length > 0)) && (
        <>
          <SectionTitle>👨‍🏫 Expert Tutors</SectionTitle>
          <Grid>
            {filteredTutors.length > 0 ? (
              filteredTutors.map(tutor => (
                <ProductCard 
                  key={tutor._id}
                  title={tutor.name}
                  subtext={tutor.experience ? `⭐ ${tutor.experience} • ${tutor.description}` : tutor.description}
                  price={tutor.price}
                  badge="Tutor"
                  btnText="View Details"
                  img={tutor.photo || "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80"}
                  onClick={() => handleProviderClick(tutor)} 
                />
              ))
            ) : activeCategory === 'Tutors' ? (
              <ProductCard title="Engineering Math Tutor (Dummy)" subtext="3 Years Exp • 1st Year Syllabus" price="₹500/hr" badge="Tutor" btnText="Contact" img="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80" />
            ) : null}
          </Grid>
        </>
      )}

      {!searchQuery && activeCategory === 'OCR Notes' && (
        <>
          <SectionTitle>📄 Scan & Digitize Notes</SectionTitle>
          <OcrScanner />
        </>
      )}

      {/* 3. Services */}
      {(activeCategory === 'Services' || ((activeCategory === 'All' || searchQuery) && filteredServices.length > 0)) && (
        <>
          <SectionTitle>🛠 Quick Services</SectionTitle>
          <Grid>
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <ProductCard 
                  key={service._id}
                  title={service.name}
                  subtext={service.experience ? `⭐ ${service.experience} • ${service.description}` : service.description}
                  price={service.price}
                  badge="Service"
                  btnText="View Services"
                  img={service.photo || "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80"}
                  onClick={() => handleProviderClick(service)} 
                />
              ))
            ) : activeCategory === 'Services' ? (
              <>
                <ProductCard title="AC Repair & Cleaning" subtext="Tech: Ramesh • Same Day" price="499" badge="Electrical" btnText="Book" img="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80" />
                <ProductCard title="Room Cleaning (Maid)" subtext="Deep clean for single room" price="150" badge="Cleaning" btnText="Book" img="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80" />
              </>
            ) : null}
          </Grid>
        </>
      )}

      {/* 4. Restaurants */}
      {(activeCategory === 'Restaurants' || ((activeCategory === 'All' || searchQuery) && filteredRestaurants.length > 0)) && (
        <>
          <SectionTitle>🍔 Nearby Restaurants</SectionTitle>
          <Grid>
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map(shop => (
                <ProductCard 
                  key={shop._id} 
                  title={shop.name} 
                  subtext={shop.address} 
                  price={shop.price || "Menu inside"} 
                  badge="Restaurant" 
                  btnText="View Menu" 
                  img={shop.photo || "https://images.unsplash.com/photo-1517248135467-4c7ed9d8c47c?w=500&q=80"} 
                  onClick={() => handleProviderClick(shop)} 
                />
              ))
            ) : activeCategory === 'Restaurants' ? (
               <p style={{ color: '#888', gridColumn: '1 / -1' }}>No registered restaurants found yet.</p>
            ) : null}
          </Grid>
        </>
      )}

      {/* 5. Groceries */}
      {(activeCategory === 'Groceries' || ((activeCategory === 'All' || searchQuery) && filteredGroceries.length > 0)) && (
        <>
          <SectionTitle>🛒 Nearby Grocery Stores</SectionTitle>
          <Grid>
            {filteredGroceries.length > 0 ? (
              filteredGroceries.map(shop => (
                <ProductCard 
                  key={shop._id} 
                  title={shop.name} 
                  subtext={shop.address} 
                  price={shop.price || "Essentials"} 
                  badge="Grocery" 
                  btnText="Shop Now" 
                  img={shop.photo || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"} 
                  onClick={() => handleProviderClick(shop)} 
                />
              ))
            ) : activeCategory === 'Groceries' ? (
               <ProductCard title="FreshMart Groceries" subtext="Campus Square" price="₹149 onwards" badge="Grocery" btnText="Shop Now" img="https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80" />
            ) : null}
          </Grid>
        </>
      )}

      {/* 6. PG / HOSTEL */}
      {(activeCategory === 'PG/Hostel' || ((activeCategory === 'All' || searchQuery) && filteredHostels.length > 0)) && (
        <>
          <SectionTitle>🏠 Nearby PG & Hostels</SectionTitle>
          <Grid>
            {filteredHostels.length > 0 ? (
              filteredHostels.map(shop => (
                <ProductCard 
                  key={shop._id} 
                  title={shop.name} 
                  subtext={shop.address} 
                  price={shop.price || "Rooms inside"} 
                  badge="Accommodation" 
                  btnText="View Rooms" 
                  img={shop.photo || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80"} 
                  onClick={() => handleProviderClick(shop)} 
                />
              ))
            ) : activeCategory === 'PG/Hostel' ? (
               <ProductCard title="Sunrise Boys Hostel" subtext="Campus Gate 2" price="₹4000/mo" badge="Hostel" btnText="View Rooms" img="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80" />
            ) : null}
          </Grid>
        </>
      )}

      {/* 7. Medical Section */}
      {(activeCategory === 'Medical SOS' || ((activeCategory === 'All' || searchQuery) && filteredMedical.length > 0)) && (
        <>
          <SectionTitle>🏥 Emergency Medical Support</SectionTitle>
          
          {activeCategory === 'Medical SOS' && (
            <div style={{ background: '#fff0f0', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '2px solid #ff6b6b' }}>
              <h3 style={{ color: '#ff6b6b', marginTop: 0 }}>🚨 SOS System</h3>
              <p>Clicking the buttons below will instantly connect you with the nearest registered medical shop.</p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSOSCall}>📞 CALL NEAREST SHOP</button>
                <button style={{ background: '#25D366', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSOSWhatsApp}>💬 WHATSAPP LOCATION</button>
              </div>
            </div>
          )}

          <Grid>
            {filteredMedical.length > 0 ? (
              filteredMedical.map(shop => (
                <ProductCard 
                  key={shop._id} 
                  title={shop.name} 
                  subtext={shop.address} 
                  price="N/A" 
                  badge={shop.isSosEnabled ? "SOS ACTIVE" : "Pharmacy"} 
                  btnText="Order Medicine" 
                  img={shop.photo || "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=500&q=80"} 
                  onClick={() => handleProviderClick(shop)} 
                />
              ))
            ) : activeCategory === 'Medical SOS' ? (
              <ProductCard title="City Care Pharmacy" subtext="Main Road" price="N/A" badge="SOS ACTIVE" btnText="Order Medicine" img="https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=500&q=80" />
            ) : null}
          </Grid>
        </>
      )}

      {/* Empty Search Fallback */}
      {searchQuery && filteredFood.length === 0 && filteredTutors.length === 0 && filteredServices.length === 0 && filteredRestaurants.length === 0 && filteredGroceries.length === 0 && filteredHostels.length === 0 && filteredMedical.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
          <h3>No results found for "{searchQuery}"</h3>
          <p>Try searching for something else like "pizza", "repair", or "hostel".</p>
        </div>
      )}

    </PageContainer>
  );
};

export default Home;