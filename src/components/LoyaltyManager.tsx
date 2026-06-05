import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, Search, Gem } from 'lucide-react';

interface LoyaltyAccount {
  treasury_code: string;
  total_earned: number;
  total_used: number;
  balance: number;
  last_used: string;
}

export default function LoyaltyManager({ session }: { session: any }) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: memberData } = await supabase
        .from('restaurant_members')
        .select('restaurant_id')
        .eq('user_id', session.user.id)
        .single();
        
      if (memberData) {
        setRestaurantId(memberData.restaurant_id);
        fetchLoyaltyData(memberData.restaurant_id);
      }
    }
    fetchData();
  }, [session.user.id]);

  async function fetchLoyaltyData(rId: string) {
    setIsLoading(true);
    // Fetch all accepted orders that have a treasury code
    const { data } = await supabase
      .from('orders')
      .select('treasury_code, points_earned, points_used, created_at')
      .eq('restaurant_id', rId)
      .eq('status', 'accepted')
      .not('treasury_code', 'is', null);

    if (data) {
      const accountMap: Record<string, LoyaltyAccount> = {};

      data.forEach((order: any) => {
        const code = order.treasury_code;
        if (!code) return;

        if (!accountMap[code]) {
          accountMap[code] = {
            treasury_code: code,
            total_earned: 0,
            total_used: 0,
            balance: 0,
            last_used: order.created_at
          };
        }

        accountMap[code].total_earned += Number(order.points_earned) || 0;
        accountMap[code].total_used += Number(order.points_used) || 0;
        accountMap[code].balance = accountMap[code].total_earned - accountMap[code].total_used;

        // Track most recent order date
        if (new Date(order.created_at) > new Date(accountMap[code].last_used)) {
          accountMap[code].last_used = order.created_at;
        }
      });

      // Convert to array and sort by balance descending
      const accountsArray = Object.values(accountMap).sort((a, b) => b.balance - a.balance);
      setAccounts(accountsArray);
    }
    setIsLoading(false);
  }

  const filteredAccounts = accounts.filter(acc => 
    acc.treasury_code.includes(searchQuery.replace(/[^0-9]/g, ''))
  );

  return (
    <div className="menu-manager fade-in">
      <div className="menu-header" style={{ marginBottom: '2rem' }}>
        <h2>Loyalty Treasury</h2>
        <p>Manage customer points, cross-verify passcodes, and track top customers.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="input-group" style={{ marginBottom: 0, width: '300px' }}>
            <div className="input-field-wrapper">
              <Search className="input-icon" size={16} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search 16-digit passcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Total Active Accounts: <strong style={{ color: 'var(--text-primary)' }}>{accounts.length}</strong>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="spin" size={32} color="var(--brand-color)" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <Gem size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No loyalty accounts found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 0' }}>Treasury Passcode</th>
                  <th style={{ padding: '1rem 0' }}>Total Earned</th>
                  <th style={{ padding: '1rem 0' }}>Total Used</th>
                  <th style={{ padding: '1rem 0' }}>Current Balance</th>
                  <th style={{ padding: '1rem 0', textAlign: 'right' }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => (
                  <tr key={acc.treasury_code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 'bold' }}>
                      {acc.treasury_code.match(/.{1,4}/g)?.join('-') || acc.treasury_code}
                    </td>
                    <td style={{ padding: '1rem 0', color: '#86efac' }}>+${acc.total_earned.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0', color: '#fca5a5' }}>-${acc.total_used.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--brand-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      ${acc.balance.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(acc.last_used).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
