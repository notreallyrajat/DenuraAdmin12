import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

export default function FoodSpoilage({ session }: { session: any }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [spoiledItems, setSpoiledItems] = useState<any[]>([]);
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
        fetchSpoiled(memberData.restaurant_id);
      }
    }
    fetchData();
  }, [session.user.id]);

  async function fetchSpoiled(rId: string) {
    setIsLoading(true);
    const now = new Date().toISOString();
    
    // Fetch items where expiry_date is in the past and quantity > 0
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('restaurant_id', rId)
      .gt('quantity', 0)
      .lt('expiry_date', now)
      .order('expiry_date', { ascending: true });

    if (data) setSpoiledItems(data);
    setIsLoading(false);
  }

  const handleDiscard = async (item: any) => {
    if (!confirm(`Are you sure you want to discard ${item.quantity} ${item.unit} of ${item.item_name}?`)) return;
    
    // Set quantity to 0 to "discard" the spoiled food
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: 0 })
      .eq('id', item.id);
      
    if (!error && restaurantId) {
      fetchSpoiled(restaurantId);
    }
  };

  return (
    <div className="menu-manager fade-in">
      <div className="menu-header" style={{ marginBottom: '2rem' }}>
        <h2>Food Spoilage</h2>
        <p>Monitor and manage inventory items that have passed their expiration date.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="spin" size={32} color="var(--brand-color)" />
          </div>
        ) : spoiledItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <AlertTriangle size={48} color="var(--border-color)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)' }}>No spoiled food detected. Great inventory management!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {spoiledItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> {item.item_name}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Expired on: <strong>{new Date(item.expiry_date).toLocaleDateString()}</strong>
                  </p>
                  <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Spoiled Quantity: <strong>{item.quantity} {item.unit}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => handleDiscard(item)}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                >
                  <Trash2 size={16} /> Discard Item
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
