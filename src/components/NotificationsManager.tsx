import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, Bell, AlertCircle, Clock } from 'lucide-react';

export default function NotificationsManager({ session }: { session: any }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
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
        fetchNotifications(memberData.restaurant_id);
      }
    }
    fetchData();
  }, [session.user.id]);

  async function fetchNotifications(rId: string) {
    setIsLoading(true);
    const now = new Date();
    // 3 days from now
    const warningThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch items where expiry_date is less than 3 days away and quantity > 0
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('restaurant_id', rId)
      .gt('quantity', 0)
      .not('expiry_date', 'is', null)
      .lt('expiry_date', warningThreshold)
      .order('expiry_date', { ascending: true });

    if (data) {
      // Process into generic notifications
      const notifs = data.map(item => {
        const isExpired = new Date(item.expiry_date) < now;
        return {
          id: item.id,
          title: isExpired ? `Expired Item: ${item.item_name}` : `Expiring Soon: ${item.item_name}`,
          message: isExpired 
            ? `You have ${item.quantity} ${item.unit} of ${item.item_name} that expired on ${new Date(item.expiry_date).toLocaleDateString()}. Please discard it in the Food Spoilage tab.`
            : `You have ${item.quantity} ${item.unit} of ${item.item_name} expiring on ${new Date(item.expiry_date).toLocaleDateString()}.`,
          type: isExpired ? 'danger' : 'warning',
          date: item.expiry_date
        };
      });
      setNotifications(notifs);
    }
    setIsLoading(false);
  }

  return (
    <div className="menu-manager fade-in">
      <div className="menu-header" style={{ marginBottom: '2rem' }}>
        <h2>Notifications</h2>
        <p>System alerts and inventory expiration warnings.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="spin" size={32} color="var(--brand-color)" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <Bell size={48} color="var(--border-color)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)' }}>You're all caught up! No new notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', backgroundColor: notif.type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)', border: `1px solid ${notif.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`, borderRadius: '8px', flexWrap: 'wrap' }}>
                <div style={{ color: notif.type === 'danger' ? '#fca5a5' : '#fcd34d', marginTop: '0.2rem' }}>
                  {notif.type === 'danger' ? <AlertCircle size={24} /> : <Clock size={24} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: notif.type === 'danger' ? '#fca5a5' : '#fcd34d', fontSize: '1.1rem' }}>
                    {notif.title}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
