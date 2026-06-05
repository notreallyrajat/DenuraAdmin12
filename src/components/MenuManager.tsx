import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, X, Save, Loader2, ImagePlus } from 'lucide-react';

interface Size {
  name: string;
  price: number;
}

interface Extra {
  id?: string;
  name: string;
  price: number;
  ingredients?: any[];
}

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

interface Ingredient {
  inventory_id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function MenuManager({ session }: { session: any }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [basePrice, setBasePrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Dynamic Arrays
  const [sizes, setSizes] = useState<Size[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Inventory
  // Inventory & Extras
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  const [availableExtrasList, setAvailableExtrasList] = useState<any[]>([]);
  
  // UI State
  const [creationMode, setCreationMode] = useState<'Dish' | 'Extra'>('Dish');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch the owner's restaurant ID on mount
  useEffect(() => {
    async function fetchRestaurant() {
      const { data, error } = await supabase
        .from('restaurant_members')
        .select('restaurant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (data) {
        setRestaurantId(data.restaurant_id);
        fetchInventory(data.restaurant_id);
        fetchExtras(data.restaurant_id);
      }
      if (error) console.error("Could not fetch restaurant:", error);
    }
    fetchRestaurant();
  }, [session.user.id]);

  async function fetchInventory(rId: string) {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('restaurant_id', rId)
      .order('item_name', { ascending: true });
    if (data) setAvailableInventory(data);
  }

  async function fetchExtras(rId: string) {
    const { data } = await supabase
      .from('dishes')
      .select('*')
      .eq('restaurant_id', rId)
      .eq('category', 'Extras (Add-ons)');
    if (data) setAvailableExtrasList(data);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addSize = () => setSizes([...sizes, { name: '', price: 0 }]);
  const updateSize = (index: number, field: keyof Size, value: string | number) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setSizes(newSizes);
  };
  const removeSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));

  const addExtra = () => setExtras([...extras, { name: '', price: 0 }]);
  const updateExtra = (index: number, field: keyof Extra, value: string | number) => {
    const newExtras = [...extras];
    newExtras[index] = { ...newExtras[index], [field]: value };
    setExtras(newExtras);
  };
  const removeExtra = (index: number) => setExtras(extras.filter((_, i) => i !== index));

  const addIngredient = () => {
    if (availableInventory.length === 0) return;
    const item = availableInventory[0];
    setIngredients([...ingredients, { inventory_id: item.id, name: item.item_name, quantity: 0, unit: item.unit }]);
  };
  
  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients];
    if (field === 'inventory_id') {
      const item = availableInventory.find(i => i.id === value);
      if (item) {
        newIngredients[index] = { ...newIngredients[index], inventory_id: item.id, name: item.item_name, unit: item.unit };
      }
    } else {
      newIngredients[index] = { ...newIngredients[index], [field]: value };
    }
    setIngredients(newIngredients);
  };
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setErrorMsg("Error: No restaurant linked to your account.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let imageUrl = null;

      // 1. Upload Image to Storage (if selected)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${restaurantId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('menu_images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('menu_images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      const finalCategory = creationMode === 'Extra' ? 'Extras (Add-ons)' : category;

      // 2. Insert into Database
      const { error: dbError } = await supabase.from('dishes').insert({
        restaurant_id: restaurantId,
        name,
        description,
        category: finalCategory,
        price: parseFloat(basePrice) || 0,
        image_url: imageUrl,
        sizes: sizes,
        extras: extras,
        ingredients: ingredients,
        is_available: true
      });

      if (dbError) throw dbError;

      setSuccessMsg(`Successfully added ${name} as a ${creationMode}!`);
      
      if (creationMode === 'Extra') {
        fetchExtras(restaurantId); // refresh extras list
      }
      // Reset Form
      setName('');
      setDescription('');
      setBasePrice('');
      setImageFile(null);
      setImagePreview(null);
      setSizes([]);
      setExtras([]);
      setIngredients([]);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="menu-manager fade-in">
      <div className="menu-header">
        <h2>{creationMode === 'Dish' ? 'Add New Menu Item' : 'Create New Extra'}</h2>
        <p>{creationMode === 'Dish' ? 'Create a beautiful digital listing for your culinary creations.' : 'Create reusable extras/add-ons to attach to your main menu items.'}</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            onClick={() => setCreationMode('Dish')}
            style={{ padding: '0.8rem 1.5rem', background: creationMode === 'Dish' ? 'var(--accent-color)' : 'transparent', color: creationMode === 'Dish' ? '#fff' : 'var(--text-secondary)', border: '2px solid var(--accent-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Create Main Course
          </button>
          <button 
            type="button" 
            onClick={() => setCreationMode('Extra')}
            style={{ padding: '0.8rem 1.5rem', background: creationMode === 'Extra' ? 'var(--accent-color)' : 'transparent', color: creationMode === 'Extra' ? '#fff' : 'var(--text-secondary)', border: '2px solid var(--accent-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >Create Extra / Add-on</button>
        </div>
      </div>

      {errorMsg && <div className="alert error">{errorMsg}</div>}
      {successMsg && <div className="alert success">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="menu-form">
        <div className="form-grid">
          
          {/* Left Column: Basic Details */}
          <div className="form-col">
            <div className="input-group">
              <label>Item Name</label>
              <input required type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kraken Signature Burger" />
            </div>

            {creationMode === 'Dish' && (
              <div className="input-group">
                <label>Category</label>
                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                  <option>Appetizers</option>
                  <option>Main Course</option>
                  <option>Fast Food</option>
                  <option>Beverages</option>
                  <option>Desserts</option>
                </select>
              </div>
            )}

            <div className="input-group">
              <label>Base Price ($)</label>
              <input required type="number" step="0.01" className="input-field" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea className="input-field" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="A mouth-watering description..."></textarea>
            </div>
          </div>

          {/* Right Column: Image & Options */}
          <div className="form-col">
            <div className="input-group">
              <label>Dish Image</label>
              <div className="image-upload-area" onClick={() => document.getElementById('image-upload')?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <ImagePlus size={32} />
                    <span>Click to upload image</span>
                  </div>
                )}
                <input id="image-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>
            </div>

            {creationMode === 'Dish' && (
              <>
                {/* Sizes */}
                <div className="options-section">
                  <div className="options-header">
                    <label>Sizes (e.g. Small, Large)</label>
                    <button type="button" className="btn-small" onClick={addSize}><Plus size={14} /> Add Size</button>
                  </div>
                  {sizes.map((size, idx) => (
                    <div key={idx} className="option-row">
                      <input type="text" className="input-field" placeholder="Size Name" value={size.name} onChange={e => updateSize(idx, 'name', e.target.value)} />
                      <input type="number" className="input-field" placeholder="Price ($)" value={size.price || ''} onChange={e => updateSize(idx, 'price', parseFloat(e.target.value))} />
                      <button type="button" className="icon-btn remove" onClick={() => removeSize(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* Extras */}
                <div className="options-section">
                  <div className="options-header">
                    <label>Link Existing Extras</label>
                    <button type="button" className="btn-small" onClick={addExtra}><Plus size={14} /> Link Extra</button>
                  </div>
                  {extras.map((extra, idx) => (
                    <div key={idx} className="option-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select 
                        className="input-field" 
                        value={extra.id || ''} 
                        onChange={e => {
                          const selected = availableExtrasList.find(ex => ex.id === e.target.value);
                          const newExtras = [...extras];
                          if (selected) {
                            newExtras[idx] = {
                              id: selected.id,
                              name: selected.name,
                              price: selected.price,
                              ingredients: selected.ingredients
                            };
                          } else {
                            newExtras[idx] = { id: '', name: '', price: 0, ingredients: [] };
                          }
                          setExtras(newExtras);
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="">Select an Extra...</option>
                        {availableExtrasList.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name} (+${ex.price})</option>
                        ))}
                      </select>
                      <button type="button" className="icon-btn remove" onClick={() => removeExtra(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recipe Ingredients */}
            <div className="options-section" style={{ marginTop: '1.5rem' }}>
              <div className="options-header">
                <label>Recipe Ingredients</label>
                <button type="button" className="btn-small" onClick={addIngredient} disabled={availableInventory.length === 0}>
                  <Plus size={14} /> Add Ingredient
                </button>
              </div>
              {availableInventory.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No inventory items found. Add items to inventory first.</p>
              )}
              {ingredients.map((ing, idx) => (
                <div key={idx} className="option-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select className="input-field" value={ing.inventory_id} onChange={e => updateIngredient(idx, 'inventory_id', e.target.value)} style={{ flex: 2 }}>
                    {availableInventory.map(item => (
                      <option key={item.id} value={item.id}>{item.item_name}</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" className="input-field" placeholder="Qty" value={ing.quantity || ''} onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', width: '40px' }}>{ing.unit}</span>
                  <button type="button" className="icon-btn remove" onClick={() => removeIngredient(idx)}><X size={16} /></button>
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={18} className="spin" /> Saving...</> : <><Save size={18} /> Publish Menu Item</>}
          </button>
        </div>
      </form>
    </div>
  );
}
