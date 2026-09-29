import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Filter, Star, User, LogIn, LogOut, Check, X, 
  Trash2, Plus, Minus, ArrowRight, ShieldCheck, Zap, Truck, CreditCard, 
  ChevronRight, RefreshCw, Cpu, Activity, Clock, Box
} from 'lucide-react';
import './index.css';

const API_GATEWAY = 'https://api.ankush.fun';

export default function App() {
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Selected Product Modal
  const [activeProduct, setActiveProduct] = useState(null);

  // Cart State
  const [cart, setCart] = useState({ items: [], totals: { subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 } });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth State
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('aether_token') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [shippingAddress, setShippingAddress] = useState({
    street: '742 Evergreen Terrace',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    country: 'USA'
  });
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Orders Tab State
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'orders' | 'services'
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Services Telemetry
  const [telemetry, setTelemetry] = useState({
    gateway: { status: 'checking', port: 5000 },
    catalog: { status: 'checking', port: 5001 },
    cart: { status: 'checking', port: 5002 },
    order: { status: 'checking', port: 5003 },
    payment: { status: 'checking', port: 5004 },
    notification: { status: 'checking', port: 5005 },
  });

  // Fetch Products & Categories
  useEffect(() => {
    fetchCatalogData();
    checkHealthTelemetry();
    if (authToken) {
      verifyCurrentAuthToken(authToken);
      fetchUserCart();
    } else {
      fetchUserCart();
    }
  }, []);

  useEffect(() => {
    fetchCatalogData();
  }, [selectedCategory, searchQuery, sortBy]);

  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      let url = `${API_GATEWAY}/api/catalog/products?sort=${sortBy}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data || []);
      }

      const catRes = await fetch(`${API_GATEWAY}/api/catalog/categories`);
      if (catRes.ok) {
        const catJson = await catRes.json();
        setCategories(catJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCart = async () => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_GATEWAY}/api/cart`, { headers });
      if (res.ok) {
        const json = await res.json();
        setCart(json.data || { items: [], totals: { subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 } });
      }
    } catch (err) {
      console.error('Cart fetch failed:', err);
    }
  };

  const verifyCurrentAuthToken = async (token) => {
    try {
      const res = await fetch(`${API_GATEWAY}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
      } else {
        localStorage.removeItem('aether_token');
        setAuthToken('');
      }
    } catch (err) {
      console.error('Auth verify error:', err);
    }
  };

  const checkHealthTelemetry = async () => {
    const servicesMap = [
      { key: 'gateway', url: 'https://api.ankush.fun/health' },
      { key: 'catalog', url: 'https://api.ankush.fun/health' },
      { key: 'cart', url: 'https://api.ankush.fun/health' },
      { key: 'order', url: 'https://api.ankush.fun/health' },
      { key: 'payment', url: 'https://api.ankush.fun/health' },
      { key: 'notification', url: 'https://api.ankush.fun/health' },
    ];

    const results = {};
    for (const service of servicesMap) {
      try {
        const res = await fetch(service.url);
        if (res.ok) {
          const json = await res.json();
          results[service.key] = { status: 'HEALTHY', details: json };
        } else {
          results[service.key] = { status: 'OFFLINE' };
        }
      } catch (err) {
        results[service.key] = { status: 'OFFLINE' };
      }
    }
    setTelemetry(results);
  };

  // Add to Cart
  const handleAddToCart = async (product, quantity = 1) => {
    try {
      const headers = { 'content-type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_GATEWAY}/api/cart/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity
        })
      });

      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
        setIsCartOpen(true);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  // Update Cart Quantity
  const handleUpdateCartQty = async (productId, quantity) => {
    try {
      const headers = { 'content-type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_GATEWAY}/api/cart/items/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity })
      });

      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.error('Update cart error:', err);
    }
  };

  // Remove Item
  const handleRemoveCartItem = async (productId) => {
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_GATEWAY}/api/cart/items/${productId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        const json = await res.json();
        setCart(json.data);
      }
    } catch (err) {
      console.error('Remove item error:', err);
    }
  };

  // Submit Authentication
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${API_GATEWAY}${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(authFormData)
      });

      const json = await res.json();
      if (!res.ok) {
        setAuthError(json.error || 'Authentication failed.');
        return;
      }

      localStorage.setItem('aether_token', json.token);
      setAuthToken(json.token);
      setUser(json.user);
      setIsAuthModalOpen(false);
      fetchUserCart();
    } catch (err) {
      setAuthError('Connection error to Gateway Service.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aether_token');
    setAuthToken('');
    setUser(null);
    fetchUserCart();
  };

  // Fetch User Orders
  const fetchUserOrders = async () => {
    setOrdersLoading(true);
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_GATEWAY}/api/orders`, { headers });
      if (res.ok) {
        const json = await res.json();
        setUserOrders(json.data || []);
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Handle Checkout Submission
  const handleProcessCheckout = async () => {
    try {
      const headers = { 'content-type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const payload = {
        items: cart.items,
        shippingAddress,
        paymentMethod,
        customerName: user ? user.name : 'Guest Shopper',
        customerEmail: user ? user.email : 'guest@aethercart.io'
      };

      const res = await fetch(`${API_GATEWAY}/api/orders/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setPlacedOrder(json.data);
        setCheckoutStep(3); // Confirmation step
        fetchUserCart();
        fetchUserOrders();
      } else {
        alert('Checkout process encountered an issue. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('shop')}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>
              <Zap size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SHOPITRY
              </h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Microservices Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              className={`btn ${activeTab === 'shop' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('shop')}
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Shop Catalog
            </button>
            <button 
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('orders'); fetchUserOrders(); }}
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              My Orders
            </button>
            <button 
              className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveTab('services'); checkHealthTelemetry(); }}
              style={{ padding: '8px 16px', fontSize: '0.9rem', gap: '6px' }}
            >
              <Cpu size={16} /> Services Telemetry
            </button>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="input-field" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', height: '40px', fontSize: '0.88rem' }}
              />
            </div>

            {/* Cart Button */}
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', padding: '10px 16px', gap: '8px' }}
            >
              <ShoppingBag size={20} />
              <span>Cart</span>
              {cart.totals.itemCount > 0 && (
                <span className="badge badge-brand" style={{ borderRadius: '999px', padding: '2px 8px', fontSize: '0.75rem' }}>
                  {cart.totals.itemCount}
                </span>
              )}
            </button>

            {/* Auth Dropdown */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
                <button className="btn-icon" onClick={handleLogout} title="Log Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => setIsAuthModalOpen(true)}
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                <LogIn size={16} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* TAB 1: SHOP CATALOG */}
        {activeTab === 'shop' && (
          <>
            {/* Hero Banner */}
            <div className="glass-panel" style={{ padding: '48px', marginBottom: '40px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ maxWidth: '650px', position: 'relative', zIndex: 2 }}>
                <span className="badge badge-brand" style={{ marginBottom: '16px' }}>Decoupled Microservices Platform</span>
                <h2 style={{ fontSize: '2.8rem', lineHeight: 1.1, marginBottom: '16px' }}>
                  Next-Gen Tech Essentials. <br />
                  <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Engineered for Precision.
                  </span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '28px' }}>
                  Experience seamless microservice routing across Catalog, Cart, Order, Lambda Payments, and SNS Notifications.
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="btn btn-primary" onClick={() => setSelectedCategory('All')}>Browse All Gear</button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('services')}>View Microservices</button>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${selectedCategory === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory('All')}
                  style={{ borderRadius: '999px', padding: '6px 18px', fontSize: '0.85rem' }}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    className={`btn ${selectedCategory === cat.name ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(cat.name)}
                    style={{ borderRadius: '999px', padding: '6px 18px', fontSize: '0.85rem' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Sorting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</span>
                <select 
                  className="input-field" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: '160px', height: '38px', padding: '4px 12px', fontSize: '0.85rem' }}
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '16px' }}>Fetching live catalog from Catalog Microservice (5001)...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <p>No products matching your search criteria.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {products.map(prod => (
                  <div key={prod.id} className="glass-panel glass-panel-hover" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Image Container */}
                    <div style={{ height: '220px', position: 'relative', overflow: 'hidden', background: '#0b1120' }}>
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      {prod.badge && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                          <span className="badge badge-brand">{prod.badge}</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(9, 13, 22, 0.8)', padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <span>{prod.rating}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                          {prod.category}
                        </div>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', lineHeight: 1.3 }}>{prod.name}</h3>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {prod.description}
                        </p>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>${prod.price.toFixed(2)}</span>
                          {prod.originalPrice && (
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)', textDecoration: 'line-through' }}>
                              ${prod.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ flex: 1, fontSize: '0.85rem' }}
                            onClick={() => setActiveProduct(prod)}
                          >
                            Quick Specs
                          </button>
                          <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, fontSize: '0.85rem' }}
                            onClick={() => handleAddToCart(prod)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: MY ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>My Orders & Order History</h2>
            
            {ordersLoading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading orders from Order Microservice (5003)...</p>
            ) : userOrders.length === 0 ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Box size={48} style={{ marginBottom: '16px', color: 'var(--text-subtle)' }} />
                <h3>No Orders Found</h3>
                <p style={{ marginTop: '8px' }}>Place your first order to track state transitions in real time.</p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setActiveTab('shop')}>
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {userOrders.map(order => (
                  <div key={order.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Order #{order.id}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <Clock size={14} /> Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${order.orderStatus === 'DELIVERED' ? 'badge-success' : 'badge-brand'}`}>
                          {order.orderStatus}
                        </span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>${order.totals.total.toFixed(2)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} × ${item.price.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SERVICES TELEMETRY */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Microservices Cluster Telemetry</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Live status of backend VM servers and AWS Lambda primitives.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={checkHealthTelemetry}>
                <RefreshCw size={16} /> Refresh Health Checks
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {[
                { name: 'API Gateway & Auth', key: 'gateway', port: 5000, type: 'VM Server 1' },
                { name: 'Product Catalog', key: 'catalog', port: 5001, type: 'VM Server 2' },
                { name: 'Cart & Sessions', key: 'cart', port: 5002, type: 'VM Server 3' },
                { name: 'Order Processing', key: 'order', port: 5003, type: 'VM Server 4' },
                { name: 'Payment Processor', key: 'payment', port: 5004, type: 'AWS Lambda 1' },
                { name: 'Notification Engine', key: 'notification', port: 5005, type: 'AWS Lambda 2' },
              ].map(s => {
                const info = telemetry[s.key] || { status: 'UNKNOWN' };
                const isOnline = info.status === 'HEALTHY';

                return (
                  <div key={s.key} className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem' }}>{s.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{s.type} • Port {s.port}</span>
                      </div>
                      <span className={`badge ${isOnline ? 'badge-success' : 'badge-brand'}`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace' }}>
                      {isOnline ? (
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(info.details, null, 2)}</pre>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>Service unavailable on localhost:{s.port}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* QUICK SPECS PRODUCT MODAL */}
      {activeProduct && (
        <div className="modal-overlay" onClick={() => setActiveProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-brand">{activeProduct.category}</span>
                <h2 style={{ fontSize: '1.5rem', marginTop: '8px' }}>{activeProduct.name}</h2>
              </div>
              <button className="btn-icon" onClick={() => setActiveProduct(null)}><X size={20} /></button>
            </div>

            <img src={activeProduct.image} alt={activeProduct.name} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} />

            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{activeProduct.description}</p>

            <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>Technical Specifications</h4>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              {activeProduct.specs && Object.entries(activeProduct.specs).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>${activeProduct.price.toFixed(2)}</span>
              <button className="btn btn-primary" onClick={() => { handleAddToCart(activeProduct); setActiveProduct(null); }}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ width: '100%', maxWidth: '440px', height: '100vh', background: '#090d16', borderLeft: '1px solid var(--border-glass)', padding: '24px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} /> Shopping Cart
              </h3>
              <button className="btn-icon" onClick={() => setIsCartOpen(false)}><X size={20} /></button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.items.map(item => (
                  <div key={item.productId} className="glass-panel" style={{ padding: '14px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 700 }}>${item.price.toFixed(2)}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 6px' }}>
                          <button className="btn-icon" style={{ padding: '2px' }} onClick={() => handleUpdateCartQty(item.productId, item.quantity - 1)}>
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                          <button className="btn-icon" style={{ padding: '2px' }} onClick={() => handleUpdateCartQty(item.productId, item.quantity + 1)}>
                            <Plus size={12} />
                          </button>
                        </div>

                        <button className="btn-icon" onClick={() => handleRemoveCartItem(item.productId)}>
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Checkout */}
            {cart.items.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>${cart.totals.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Estimated Tax (8%)</span>
                  <span>${cart.totals.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Shipping</span>
                  <span>{cart.totals.shipping === 0 ? 'FREE' : `$${cart.totals.shipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.2rem', fontWeight: 800 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-light)' }}>${cart.totals.total.toFixed(2)}</span>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}>
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>AetherCart Checkout Pipeline</h2>
              <button className="btn-icon" onClick={() => setIsCheckoutOpen(false)}><X size={20} /></button>
            </div>

            {checkoutStep === 1 && (
              <div>
                <h4 style={{ marginBottom: '16px' }}>1. Shipping Address</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Street Address" className="input-field" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" placeholder="City" className="input-field" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} />
                    <input type="text" placeholder="State" className="input-field" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="text" placeholder="Postal Code" className="input-field" value={shippingAddress.postalCode} onChange={e => setShippingAddress({...shippingAddress, postalCode: e.target.value})} />
                    <input type="text" placeholder="Country" className="input-field" value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setCheckoutStep(2)}>
                  Continue to Payment
                </button>
              </div>
            )}

            {checkoutStep === 2 && (
              <div>
                <h4 style={{ marginBottom: '16px' }}>2. Payment Method</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {['Credit Card (**** 4242)', 'Apple Pay / Digital Wallet', 'Crypto (USDC / ETH)'].map(m => (
                    <label key={m} className="glass-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="radio" name="payMethod" checked={paymentMethod.includes(m.split(' ')[0])} onChange={() => setPaymentMethod(m)} />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', marginBottom: '24px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Order Total:</span>
                    <span style={{ fontWeight: 800 }}>${cart.totals.total.toFixed(2)}</span>
                  </div>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>
                    Triggering AWS Lambda Payment Function (5004) & SNS Notification (5005)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setCheckoutStep(1)}>Back</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleProcessCheckout}>
                    Authorize Payment & Place Order
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 3 && placedOrder && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <Check size={32} color="var(--success)" />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Order Confirmed!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
                  Order <strong>#{placedOrder.id}</strong> has been successfully placed and routed to Order Microservice (5003).
                </p>

                <div className="glass-panel" style={{ padding: '16px', textAlign: 'left', borderRadius: '12px', marginBottom: '24px', fontSize: '0.85rem' }}>
                  <div><strong>Transaction ID:</strong> {placedOrder.transactionId}</div>
                  <div><strong>Payment Status:</strong> {placedOrder.paymentStatus}</div>
                  <div><strong>Dispatched Event:</strong> SNS Notification to {placedOrder.customerEmail}</div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setIsCheckoutOpen(false); setCheckoutStep(1); setActiveTab('orders'); }}>
                  View My Orders
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '32px', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <button className="btn-icon" onClick={() => setIsAuthModalOpen(false)}><X size={20} /></button>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'register' && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="input-field" 
                  required
                  value={authFormData.name} 
                  onChange={e => setAuthFormData({...authFormData, name: e.target.value})} 
                />
              )}
              <input 
                type="email" 
                placeholder="Email Address" 
                className="input-field" 
                required
                value={authFormData.email} 
                onChange={e => setAuthFormData({...authFormData, email: e.target.value})} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input-field" 
                required
                value={authFormData.password} 
                onChange={e => setAuthFormData({...authFormData, password: e.target.value})} 
              />

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                {authMode === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {authMode === 'login' ? (
                <span>Don't have an account? <a href="#reg" style={{ color: 'var(--primary-light)' }} onClick={() => setAuthMode('register')}>Sign up</a></span>
              ) : (
                <span>Already have an account? <a href="#log" style={{ color: 'var(--primary-light)' }} onClick={() => setAuthMode('login')}>Log in</a></span>
              )}
            </div>

            {/* Quick Demo Credentials helper */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              <div><strong>Demo Customer:</strong> elena@example.com / customerpassword123</div>
              <div><strong>Demo Admin:</strong> admin@shopitry.com / adminpassword123</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="glass-panel" style={{ marginTop: 'auto', borderRadius: 0, borderBottom: 0, borderLeft: 0, borderRight: 0, padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>© 2026 <strong>AetherCart</strong> Architecture Ecosystem. Decoupled Microservices on AWS primitives.</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>API Gateway: 5000</span>
            <span>Catalog: 5001</span>
            <span>Cart: 5002</span>
            <span>Order: 5003</span>
            <span>AWS Lambda: 5004/5005</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
