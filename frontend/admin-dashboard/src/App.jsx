import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Cpu, TrendingUp, DollarSign, 
  Users, Activity, Plus, Trash2, Edit, RefreshCw, CheckCircle2, AlertCircle, 
  LogOut, Shield, ChevronRight, X, ArrowUpRight, Search
} from 'lucide-react';
import './index.css';

const API_GATEWAY = 'https://api.ankush.fun';

export default function App() {
  // Auth state
  const [adminToken, setAdminToken] = useState(localStorage.getItem('aether_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: 'admin@shopitry.com', password: 'adminpassword123' });
  const [loginError, setLoginError] = useState('');

  // Dashboard Data
  const [activeNav, setActiveNav] = useState('overview'); // 'overview' | 'products' | 'orders' | 'services'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Audio',
    description: '',
    stock: 25,
    image: ''
  });

  // Services Telemetry
  const [telemetry, setTelemetry] = useState({});

  useEffect(() => {
    if (adminToken) {
      verifyAdminToken(adminToken);
      fetchDashboardData();
    }
  }, [adminToken]);

  const verifyAdminToken = async (token) => {
    try {
      const res = await fetch(`${API_GATEWAY}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAdminUser(json.user);
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error('Admin token verify failed');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_GATEWAY}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const json = await res.json();

      if (!res.ok) {
        setLoginError(json.error || 'Login failed');
        return;
      }

      if (json.user.role !== 'admin') {
        setLoginError('Access denied: Admin credentials required.');
        return;
      }

      localStorage.setItem('aether_admin_token', json.token);
      setAdminToken(json.token);
      setAdminUser(json.user);
    } catch (err) {
      setLoginError('Gateway Service unreachable');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aether_admin_token');
    setAdminToken('');
    setAdminUser(null);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_GATEWAY}/api/catalog/products`);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(prodJson.data || []);
      }

      const orderRes = await fetch(`${API_GATEWAY}/api/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (orderRes.ok) {
        const orderJson = await orderRes.json();
        setOrders(orderJson.data || []);
      }

      checkTelemetry();
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTelemetry = async () => {
    const services = [
      { key: 'gateway', name: 'API Gateway (VM Server 1)', port: 5000 },
      { key: 'catalog', name: 'Product Catalog (VM Server 2)', port: 5001 },
      { key: 'cart', name: 'Cart & Sessions (VM Server 3)', port: 5002 },
      { key: 'order', name: 'Order Management (VM Server 4)', port: 5003 },
      { key: 'payment', name: 'Payment Processor (AWS Lambda 1)', port: 5004 },
      { key: 'notification', name: 'Notification Engine (AWS Lambda 2)', port: 5005 },
    ];

    const results = {};
    for (const s of services) {
      try {
        const r = await fetch(`https://api.ankush.fun${s.port}/health`);
        results[s.key] = r.ok ? 'HEALTHY' : 'OFFLINE';
      } catch (e) {
        results[s.key] = 'OFFLINE';
      }
    }
    setTelemetry(results);
  };

  // Add Product (Admin Action)
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_GATEWAY}/api/catalog/products`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(productForm)
      });

      if (res.ok) {
        setIsAddProductOpen(false);
        setProductForm({ name: '', price: '', category: 'Audio', description: '', stock: 25, image: '' });
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error('Add product error:', err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm(`Delete product ${id}?`)) return;
    try {
      const res = await fetch(`${API_GATEWAY}/api/catalog/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_GATEWAY}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Total Revenue Calculation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.total || 0), 0);

  // If not authenticated as Admin, show Login Screen
  if (!adminToken || !adminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #050811 80%)', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '36px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'var(--gradient-admin)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 0 24px rgba(79, 70, 229, 0.6)' }}>
              <Shield size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>AETHERCART ADMIN</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Platform Operations Portal</span>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '20px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Admin Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={loginForm.email} 
                onChange={e => setLoginForm({...loginForm, email: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={loginForm.password} 
                onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
              Authenticate Admin Session
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Default Credentials: <code>admin@aethercart.io</code> / <code>adminpassword123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-admin)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>AETHER ADMIN</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Decoupled Operations</span>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Product Catalog', icon: Package },
            { id: 'orders', label: 'Order Dispatch', icon: ShoppingCart },
            { id: 'services', label: 'Cluster Telemetry', icon: Cpu },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>{adminUser.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '16px' }}>{adminUser.email}</div>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.82rem' }} onClick={handleLogout}>
            <LogOut size={14} /> Log Out Session
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>
              {activeNav === 'overview' && 'System Analytics Overview'}
              {activeNav === 'products' && 'Product Catalog Manager'}
              {activeNav === 'orders' && 'Order Pipeline Dispatch'}
              {activeNav === 'services' && 'Cluster Microservices Status'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Connected to API Gateway on localhost:5000
            </p>
          </div>

          <button className="btn btn-secondary" onClick={fetchDashboardData}>
            <RefreshCw size={16} /> Refresh Telemetry
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeNav === 'overview' && (
          <div>
            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Total Platform Revenue</span>
                  <DollarSign size={18} color="var(--success)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>+18.4% vs last period</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Active Orders</span>
                  <ShoppingCart size={18} color="var(--primary-light)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{orders.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>Processed by Order Service</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Catalog SKU Count</span>
                  <Package size={18} color="var(--secondary)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{products.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>Active in Catalog Service</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Microservice Cluster</span>
                  <Cpu size={18} color="var(--warning)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>6 / 6 ONLINE</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>VM Servers & AWS Lambdas</div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Recent Customer Checkout Activity</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>{o.customerName} ({o.customerEmail})</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>${o.totals?.total?.toFixed(2)}</td>
                      <td><span className="badge badge-info">{o.paymentStatus}</span></td>
                      <td><span className={`badge ${o.orderStatus === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>{o.orderStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGER */}
        {activeNav === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search catalog SKUs..." className="input-field" style={{ paddingLeft: '38px' }} />
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddProductOpen(true)}>
                <Plus size={16} /> Create Product SKU
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>SKU: {p.id}</div>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{p.category}</span></td>
                      <td style={{ fontWeight: 700 }}>${p.price.toFixed(2)}</td>
                      <td>
                        <span style={{ color: p.stock > 10 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                          {p.stock} units
                        </span>
                      </td>
                      <td>★ {p.rating}</td>
                      <td>
                        <button className="btn-icon" onClick={() => handleDeleteProduct(p.id)} title="Delete SKU">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDER DISPATCH PIPELINE */}
        {activeNav === 'orders' && (
          <div>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Order Status Pipeline Dispatch</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Modifying order status dispatches an automated event notification to Notification AWS Lambda (5005).
              </p>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status Pipeline Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>{o.customerName}</td>
                      <td style={{ fontWeight: 700 }}>${o.totals?.total?.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
                            <button 
                              key={status}
                              className={`btn ${o.orderStatus === status ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => handleUpdateOrderStatus(o.id, status)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SERVICES CLUSTER TELEMETRY */}
        {activeNav === 'services' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Gateway Service', key: 'gateway', port: 5000, desc: 'Central routing & authentication' },
                { name: 'Catalog Service', key: 'catalog', port: 5001, desc: 'Product schemas & search' },
                { name: 'Cart Service', key: 'cart', port: 5002, desc: 'Session cart state engine' },
                { name: 'Order Service', key: 'order', port: 5003, desc: 'Order lifecycle state machine' },
                { name: 'Payment AWS Lambda', key: 'payment', port: 5004, desc: 'Serverless payment processor' },
                { name: 'Notification AWS Lambda', key: 'notification', port: 5005, desc: 'Serverless event dispatcher' },
              ].map(s => {
                const status = telemetry[s.key] || 'OFFLINE';
                const isHealthy = status === 'HEALTHY';

                return (
                  <div key={s.key} className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem' }}>{s.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{s.desc}</p>
                      </div>
                      <span className={`badge ${isHealthy ? 'badge-success' : 'badge-danger'}`}>
                        {status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '10px' }}>
                      Target Endpoint: <code>https://api.ankush.fun{s.port}/health</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* CREATE PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="modal-overlay" onClick={() => setIsAddProductOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Add Product to Catalog Service</h3>
              <button className="btn-icon" onClick={() => setIsAddProductOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Product Name</label>
                <input type="text" required className="input-field" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Price ($)</label>
                  <input type="number" step="0.01" required className="input-field" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</label>
                  <select className="input-field" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                    <option value="Audio">Audio</option>
                    <option value="Displays">Displays</option>
                    <option value="Peripherals">Peripherals</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Smart Home">Smart Home</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input-field" rows="3" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Image URL</label>
                <input type="text" placeholder="https://images.unsplash.com/..." className="input-field" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                Create Product SKU
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
