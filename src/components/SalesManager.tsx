import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, TrendingUp, DollarSign, UtensilsCrossed } from 'lucide-react';

export default function SalesManager({ session }: { session: any }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: memberData } = await supabase
        .from('restaurant_members')
        .select('restaurant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (memberData) {
        setRestaurantId(memberData.restaurant_id);
        fetchSales(memberData.restaurant_id);
      }
    }
    fetchData();
  }, [session.user.id]);

  async function fetchSales(rId: string) {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, items')
      .eq('restaurant_id', rId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (data) setSales(data);
    setIsLoading(false);
  }

  const totalRevenue = sales.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  const totalOrders = sales.length;

  return (
    <div className="menu-manager fade-in">
      <div className="menu-header" style={{ marginBottom: '2rem' }}>
        <h2>Sales & Analytics</h2>
        <p>Monitor your restaurant's revenue and performance.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 className="spin" size={32} color="var(--brand-color)" />
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Total Revenue</span>
                <div className="kpi-icon-wrapper"><DollarSign size={18} /></div>
              </div>
              <div className="kpi-value">${totalRevenue.toFixed(2)}</div>
              <div className="kpi-trend positive">
                <TrendingUp size={14} /> All Time
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Completed Orders</span>
                <div className="kpi-icon-wrapper"><UtensilsCrossed size={18} /></div>
              </div>
              <div className="kpi-value">{totalOrders}</div>
              <div className="kpi-trend">
                Total accepted orders
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Recent Transactions</h3>
            {sales.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No sales data available yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem 0' }}>Date</th>
                    <th style={{ padding: '1rem 0' }}>Order ID</th>
                    <th style={{ padding: '1rem 0' }}>Items Count</th>
                    <th style={{ padding: '1rem 0', textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0', color: 'var(--text-primary)' }}>{new Date(sale.created_at).toLocaleString()}</td>
                      <td style={{ padding: '1rem 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>{sale.id.slice(0, 8)}...</td>
                      <td style={{ padding: '1rem 0' }}>{Array.isArray(sale.items) ? sale.items.length : 0} items</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold', color: '#86efac' }}>+${Number(sale.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
