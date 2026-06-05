import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { LogOut, LayoutDashboard, UtensilsCrossed, Package, Receipt, TrendingUp, Users, DollarSign, Activity, BellRing, Gem, AlertTriangle, Bell } from 'lucide-react';
import MenuManager from './components/MenuManager';
import InventoryManager from './components/InventoryManager';
import OrdersManager from './components/OrdersManager';
import LoyaltyManager from './components/LoyaltyManager';
import SalesManager from './components/SalesManager';
import FoodSpoilage from './components/FoodSpoilage';
import NotificationsManager from './components/NotificationsManager';

export default function Dashboard({ session }: { session: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasGlobalAlert, setHasGlobalAlert] = useState(false);

  useEffect(() => {
    async function checkNotifications() {
      const { data: memberData } = await supabase
        .from('restaurant_members')
        .select('restaurant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (!memberData) return;
      
      const now = new Date();
      const warningThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data } = await supabase
        .from('inventory')
        .select('id')
        .eq('restaurant_id', memberData.restaurant_id)
        .gt('quantity', 0)
        .not('expiry_date', 'is', null)
        .lt('expiry_date', warningThreshold)
        .limit(1);

      if (data && data.length > 0) {
        setHasGlobalAlert(true);
      }
    }
    checkNotifications();
  }, [session.user.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="dashboard-layout">
      {/* Sleek Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="brand-logo-icon" style={{ width: 32, height: 32 }}>
            <UtensilsCrossed size={18} color="#fff" />
          </div>
          DinovaAdmin
        </div>

        <div className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'live_orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('live_orders')}
          >
            <BellRing size={18} /> Live Orders
          </button>
          <button 
            className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <UtensilsCrossed size={18} /> Menu
          </button>
          <button 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Package size={18} /> Inventory
          </button>
          <button 
            className={`nav-item ${activeTab === 'loyalty' ? 'active' : ''}`}
            onClick={() => setActiveTab('loyalty')}
          >
            <Gem size={18} /> Loyalty
          </button>
          <button 
            className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <TrendingUp size={18} /> Sales
          </button>
          <button 
            className={`nav-item ${activeTab === 'spoilage' ? 'active' : ''}`}
            onClick={() => setActiveTab('spoilage')}
          >
            <AlertTriangle size={18} /> Spoilage
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setHasGlobalAlert(false); }}
            style={{ position: 'relative' }}
          >
            <Bell size={18} /> Notifications
            {hasGlobalAlert && (
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
            )}
          </button>
        </div>

        <div className="nav-actions">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            <header className="content-header">
              <div>
                <h1 className="page-title">Overview</h1>
                <p className="page-subtitle">Here is what's happening at The Golden Kraken Cafe today.</p>
              </div>
            </header>

            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">Total Revenue</span>
                  <div className="kpi-icon-wrapper"><DollarSign size={18} /></div>
                </div>
                <div className="kpi-value">$4,289.50</div>
                <div className="kpi-trend positive">
                  <TrendingUp size={14} /> +12.5% from yesterday
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">Active Orders</span>
                  <div className="kpi-icon-wrapper"><Activity size={18} /></div>
                </div>
                <div className="kpi-value">24</div>
                <div className="kpi-trend">
                  4 ready to serve
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">Total Customers</span>
                  <div className="kpi-icon-wrapper"><Users size={18} /></div>
                </div>
                <div className="kpi-value">156</div>
                <div className="kpi-trend positive">
                  <TrendingUp size={14} /> +8% this week
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">Items Sold</span>
                  <div className="kpi-icon-wrapper"><UtensilsCrossed size={18} /></div>
                </div>
                <div className="kpi-value">312</div>
                <div className="kpi-trend">
                  Top seller: Kraken Burger
                </div>
              </div>
            </div>

            {/* Mock Chart Area */}
            <div className="chart-section">
              <div className="chart-header">
                <h3>Revenue Overview</h3>
              </div>
              <div className="mock-chart">
                {/* CSS Mock Chart Bars */}
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <div key={i} className="chart-bar-container">
                    <div className="chart-bar" style={{ height: `${height}%` }}></div>
                    <span className="chart-label">Day {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Orders Tab */}
        {activeTab === 'live_orders' && (
          <OrdersManager session={session} />
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <MenuManager session={session} />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager session={session} />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyManager session={session} />
        )}

        {activeTab === 'sales' && (
          <SalesManager session={session} />
        )}

        {activeTab === 'spoilage' && (
          <FoodSpoilage session={session} />
        )}

        {activeTab === 'notifications' && (
          <NotificationsManager session={session} />
        )}
      </main>

      {/* Global Alert Popup */}
      {hasGlobalAlert && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 999, maxWidth: '300px' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <AlertTriangle color="#ef4444" size={24} />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c' }}>Items Expiring Soon!</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#4b5563' }}>You have inventory items that are expiring within the next 3 days.</p>
              <button 
                onClick={() => { setHasGlobalAlert(false); setActiveTab('notifications'); }}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                View Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
