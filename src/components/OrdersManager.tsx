import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function OrdersManager({ session }: { session: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the owner's restaurant ID on mount
  async function fetchOrders(restId: string) {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restId)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setIsLoading(false);

    // Subscribe to new orders
    supabase.channel('orders-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
          }
        }
      )
      .subscribe();
  }

  useEffect(() => {
    async function fetchRestaurant() {
      const { data, error } = await supabase
        .from('restaurant_members')
        .select('restaurant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) {
        fetchOrders(data.restaurant_id);
      }
      if (error) console.error("Could not fetch restaurant:", error);
    }
    fetchRestaurant();
  }, [session.user.id]);

  const updateOrderStatus = async (order: any, status: string) => {
    let updatePayload: any = { status };
    if (status === 'accepted') {
      updatePayload.points_earned = Math.floor((order.total_amount || 0) * 0.10);
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id);
      
    if (error) {
      alert("Failed to update order: " + error.message);
      return;
    }
    
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status, points_earned: updatePayload.points_earned || o.points_earned } : o));

    // Deduct inventory when accepted
    if (status === 'accepted' && order.items) {
      try {
        for (const item of order.items) {
          if (item.ingredients && Array.isArray(item.ingredients)) {
            for (const ing of item.ingredients) {
              // Fetch current quantity
              const { data: invData, error: invError } = await supabase
                .from('inventory')
                .select('quantity')
                .eq('id', ing.inventory_id)
                .single();

              if (!invError && invData) {
                // Update quantity (prevent going below 0)
                await supabase
                  .from('inventory')
                  .update({ quantity: Math.max(0, invData.quantity - ing.quantity) })
                  .eq('id', ing.inventory_id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to deduct inventory:", err);
      }
    }
  };

  if (isLoading) return <div className="placeholder-view"><Loader2 className="spin" size={32}/></div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const pastOrders = orders.filter(o => o.status !== 'pending');

  return (
    <div className="fade-in">
      <header className="content-header">
        <div>
          <h1 className="page-title">Live Orders</h1>
          <p className="page-subtitle">Accept or reject incoming orders from the dining room.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr' }}>
        <section>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Pending Orders ({pendingOrders.length})</h2>
          {pendingOrders.length === 0 ? (
            <div className="alert success">No pending orders at the moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingOrders.map(order => (
                <div key={order.id} className="order-card-responsive">
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} color="#eab308"/> Order #{order.id.slice(0, 8)}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', color: 'var(--text-primary)' }}>
                      {order.items?.map((item: any) => (
                        <li key={item.id}>1x {item.name} (${item.price.toFixed(2)})</li>
                      ))}
                    </ul>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>Total: ${order.total_amount?.toFixed(2)}</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => updateOrderStatus(order, 'rejected')} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => updateOrderStatus(order, 'accepted')} style={{ flex: 1, background: '#22c55e', color: '#fff', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <CheckCircle size={16} /> Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Past Orders</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pastOrders.map(order => (
              <div key={order.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Order #{order.id.slice(0, 8)}</span>
                  <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>${order.total_amount?.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ 
                    padding: '0.3rem 0.8rem', 
                    borderRadius: '999px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    background: order.status === 'accepted' ? '#dcfce7' : '#fee2e2',
                    color: order.status === 'accepted' ? '#166534' : '#991b1b'
                  }}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
