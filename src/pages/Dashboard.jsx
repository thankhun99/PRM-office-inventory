// src/pages/Dashboard.jsx (Final, Complete, Polished Version)

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { RequestModal } from '../components/RequestModal';
import { ProcurementModal } from '../components/ProcurementModal';

// --- Component สำหรับแสดงป้ายสถานะสีๆ ---
const StatusBadge = ({ status }) => {
  const baseStyle = { color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize' };
  let style = {};
  switch (status) {
    case 'pending': style = { ...baseStyle, backgroundColor: '#faad14' }; break;
    case 'backorder': style = { ...baseStyle, backgroundColor: '#108ee9' }; break;
    case 'approved': style = { ...baseStyle, backgroundColor: 'green' }; break;
    case 'rejected': style = { ...baseStyle, backgroundColor: 'red' }; break;
    case 'new': style = { ...baseStyle, backgroundColor: '#28a745' }; break;
    case 'completed': style = { ...baseStyle, backgroundColor: 'green' }; break;
    default: style = { ...baseStyle, backgroundColor: '#8c8c8c' };
  }
  return <span style={style}>{status}</span>;
};

// --- Component สำหรับฟอร์มกรอกข้อมูลโปรไฟล์ ---
const CompleteProfileForm = ({ onProfileUpdated }) => {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('profiles').update({ full_name: fullName, department: department }).eq('id', user.id);
      if (error) throw error;
      alert('บันทึกข้อมูลโปรไฟล์สำเร็จ!');
      onProfileUpdated();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>กรุณากรอกข้อมูลเพิ่มเติม</h2>
      <p>เพื่อให้สามารถใช้งานระบบได้อย่างสมบูรณ์ กรุณากรอกชื่อและแผนกของคุณ</p>
      <form onSubmit={handleUpdateProfile}>
        <div style={{ marginBottom: '1rem' }}><label htmlFor="fullName">ชื่อ-นามสกุล:</label><input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '95%', padding: '0.5rem', marginTop: '0.25rem' }} /></div>
        <div style={{ marginBottom: '1rem' }}><label htmlFor="department">แผนก:</label><input id="department" type="text" value={department} onChange={e => setDepartment(e.target.value)} required style={{ width: '95%', padding: '0.5rem', marginTop: '0.25rem' }}/></div>
        <button type="submit" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
      </form>
    </div>
  );
};


// --- Component หลักของ Dashboard ---
export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcureModalOpen, setIsProcureModalOpen] = useState(false);

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    }
  };

  const getItems = async () => {
    try {
      // ดึงข้อมูลจาก Supabase โดยไม่เรียงลำดับ
      const { data, error } = await supabase.from('items').select('*');
      if (error) throw error;
      
      // นำมาเรียงลำดับในฝั่ง Frontend ด้วย localeCompare สำหรับภาษาไทย
      const sortedData = (data || []).sort((a, b) => 
        a.name.localeCompare(b.name, 'th')
      );
      setItems(sortedData);

    } catch (error) { 
      console.error("Error fetching items:", error); 
    }
  };

  const getMyRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [stockResult, procureResult] = await Promise.all([
        supabase.from('requests').select(`id, created_at, status, quantity_requested, items(name)`).eq('requester_id', user.id),
        supabase.from('procurement_requests').select(`id, created_at, status, quantity, item_name`).eq('requester_id', user.id)
      ]);

      if (stockResult.error) throw stockResult.error;
      if (procureResult.error) throw procureResult.error;

      const stockHistory = stockResult.data || [];
      const procureHistory = procureResult.data || [];

      const formattedStock = stockHistory.map(r => ({ ...r, type: 'เบิกสต็อก', item_name: r.items?.name || '[ถูกลบ]', quantity: r.quantity_requested }));
      const formattedProcure = procureHistory.map(r => ({ ...r, type: 'ขอจัดหา', item_name: r.item_name, quantity: r.quantity }));

      const allHistory = [...formattedStock, ...formattedProcure];
      allHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMyRequests(allHistory);
    } catch (error) {
      console.error("Error fetching my requests history:", error);
    }
  };
  
  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleProfileUpdated = () => { getProfile(); };
  const openRequestModal = (item) => { setSelectedItem(item); setIsModalOpen(true); };

  const handleRequestSubmit = async (quantity) => {
    if (!selectedItem) return;
    let requestStatus = 'pending';
    if (quantity > selectedItem.quantity_on_hand) {
      if (!window.confirm(`ของในสต็อกมีเพียง ${selectedItem.quantity_on_hand} ชิ้น แต่คุณต้องการ ${quantity} ชิ้น\n\nคุณต้องการสร้างคำขอเบิกที่เหลือเป็น Backorder หรือไม่?`)) return;
      requestStatus = 'backorder';
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('requests').insert({ requester_id: user.id, item_id: selectedItem.id, quantity_requested: quantity, status: requestStatus });
      if (error) throw error;
      alert(`สร้างคำขอเบิก "${selectedItem.name}" สำเร็จ!`);
      setIsModalOpen(false);
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  const handleProcureRequestSubmit = async (procureData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('procurement_requests').insert({ requester_id: user.id, ...procureData, status: 'new' });
      if (error) throw error;
      alert('ส่งคำขอจัดหาอุปกรณ์ใหม่สำเร็จ!');
      setIsProcureModalOpen(false);
      getMyRequests();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await getProfile();
      await Promise.all([getItems(), getMyRequests()]);
      setLoading(false);
    };
    loadInitialData();

    const itemSub = supabase.channel('items').on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, getItems).subscribe();
    const requestSub = supabase.channel('requests').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, getMyRequests).subscribe();
    const procureSub = supabase.channel('procurement_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'procurement_requests' }, getMyRequests).subscribe();

    return () => {
      supabase.removeChannel(itemSub);
      supabase.removeChannel(requestSub);
      supabase.removeChannel(procureSub);
    };
  }, []);

  if (loading) { return <div style={{textAlign: 'center', marginTop: '5rem'}}>Loading...</div>; }
  if (profile && (!profile.full_name || !profile.department)) { return <CompleteProfileForm onProfileUpdated={handleProfileUpdated} />; }

  return (
    <>
      {isModalOpen && <RequestModal item={selectedItem} onClose={() => setIsModalOpen(false)} onSubmit={handleRequestSubmit} />}
      {isProcureModalOpen && <ProcurementModal onClose={() => setIsProcureModalOpen(false)} onSubmit={handleProcureRequestSubmit} />}

      <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-color)' }}>ระบบเบิกอุปกรณ์สำนักงาน PRM</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-light-color)' }}>
              ยินดีต้อนรับ, <strong>{profile?.full_name}</strong> ({profile?.department}) *คีย์เบิกก่อนวันพุธ รับของ วันศุกร์บ่าย*
            </p>
          </div>
          <button onClick={handleLogout} className="btn-outline">ออกจากระบบ</button>
        </header>

        <main style={{ marginTop: '2rem' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>รายการอุปกรณ์สำนักงาน</h2>
              <button onClick={() => setIsProcureModalOpen(true)} className="btn-secondary">+ ขอจัดหาอุปกรณ์ใหม่</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>{item.name}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ minWidth: '100px', textAlign: 'right', color: 'var(--text-light-color)' }}>คงเหลือ: <strong style={{color: 'var(--text-color)'}}>{item.quantity_on_hand}</strong> ชิ้น</span>
                    <button onClick={() => openRequestModal(item)} disabled={item.quantity_on_hand === 0} className="btn-primary">
                      {item.quantity_on_hand === 0 ? 'ของหมด' : 'เบิกอุปกรณ์'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
             <h2 style={{ fontSize: '1.25rem', margin: 0, marginBottom: '1.5rem' }}>ประวัติคำขอล่าสุด</h2>
             {myRequests.length === 0 ? <p>คุณยังไม่มีประวัติการเบิก</p> : (
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                   <tr style={{textAlign: 'left', borderBottom: '1px solid var(--border-color)'}}>
                     <th style={{padding: '0.75rem'}}>วันที่</th>
                     <th style={{padding: '0.75rem'}}>ประเภท</th>
                     <th style={{padding: '0.75rem'}}>อุปกรณ์</th>
                     <th style={{padding: '0.75rem'}}>จำนวน</th>
                     <th style={{padding: '0.75rem'}}>สถานะ</th>
                   </tr>
                 </thead>
                 <tbody>
                   {myRequests.map(request => (
                     <tr key={`${request.type}-${request.id}`} style={{borderBottom: '1px solid var(--border-color)'}}>
                       <td style={{padding: '0.75rem'}}>{new Date(request.created_at).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                       <td style={{padding: '0.75rem'}}>{request.type}</td>
                       <td style={{padding: '0.75rem'}}>{request.item_name}</td>
                       <td style={{padding: '0.75rem'}}>{request.quantity}</td>
                       <td style={{padding: '0.75rem'}}><StatusBadge status={request.status} /></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        </main>
      </div>
    </>
  );
}