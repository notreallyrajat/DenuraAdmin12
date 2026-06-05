import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Package, Loader2, RefreshCw } from 'lucide-react';

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

export default function InventoryManager({ session }: { session: any }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  
  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [expiryValue, setExpiryValue] = useState('1');
  const [expiryUnit, setExpiryUnit] = useState('weeks');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        fetchInventory(memberData.restaurant_id);
      }
    }
    fetchData();
  }, [session.user.id]);

  async function fetchInventory(rId: string) {
    setIsLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('restaurant_id', rId)
      .order('item_name', { ascending: true });
      
    if (data) setItems(data);
    setIsLoading(false);
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setIsSubmitting(true);

    let expiryDate = null;
    if (expiryValue && parseInt(expiryValue) > 0) {
      const now = new Date();
      const val = parseInt(expiryValue);
      if (expiryUnit === 'days') now.setDate(now.getDate() + val);
      if (expiryUnit === 'weeks') now.setDate(now.getDate() + (val * 7));
      if (expiryUnit === 'months') now.setMonth(now.getMonth() + val);
      expiryDate = now.toISOString();
    }

    const { error } = await supabase.from('inventory').insert({
      restaurant_id: restaurantId,
      item_name: newItemName,
      quantity: parseFloat(newQuantity) || 0,
      unit: newUnit,
      expiry_date: expiryDate
    });

    if (!error) {
      setNewItemName('');
      setNewQuantity('');
      setExpiryValue('1');
      fetchInventory(restaurantId);
    }
    setIsSubmitting(false);
  };

  const handleUpdateQuantity = async (item: InventoryItem) => {
    const newVal = prompt(`Enter new total quantity for ${item.item_name} (${item.unit}):\n\n(Current: ${item.quantity})`, item.quantity.toString());
    if (newVal === null) return;
    
    const parsed = parseFloat(newVal);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    const { error } = await supabase
      .from('inventory')
      .update({ quantity: parsed })
      .eq('id', item.id);

    if (!error && restaurantId) {
      fetchInventory(restaurantId);
    } else if (error) {
      alert("Failed to update inventory: " + error.message);
    }
  };

  return (
    <div className="menu-manager fade-in">
      <div className="menu-header">
        <h2>Inventory Management</h2>
        <p>Track raw ingredients and stock levels in real-time.</p>
      </div>

      <div className="form-grid">
        <div className="form-col" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Add New Ingredient</h3>
          <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Ingredient Name</label>
              <input required type="text" className="input-field" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Mozzarella Cheese" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Initial Quantity</label>
                <input required type="number" step="0.01" className="input-field" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} placeholder="0.0" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Unit</label>
                <select className="input-field" value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  <option>kg</option>
                  <option>grams</option>
                  <option>liters</option>
                  <option>ml</option>
                  <option>pieces</option>
                  <option>slices</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Expires In (0-99)</label>
                <input required type="number" min="1" max="99" className="input-field" value={expiryValue} onChange={e => setExpiryValue(e.target.value)} placeholder="1" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Timeframe</label>
                <select className="input-field" value={expiryUnit} onChange={e => setExpiryUnit(e.target.value)}>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? <Loader2 size={18} className="spin" /> : <Plus size={18} />} Add to Stock
            </button>
          </form>
        </div>

        <div className="form-col">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Current Stock</h3>
            <button className="btn-small" onClick={() => restaurantId && fetchInventory(restaurantId)}><RefreshCw size={14} /> Refresh</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}><Loader2 className="spin" size={24} /></div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                <Package size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>Your inventory is empty.</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: item.quantity < 5 ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                      {item.quantity} {item.unit}
                    </span>
                    <button 
                      onClick={() => handleUpdateQuantity(item)}
                      style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
