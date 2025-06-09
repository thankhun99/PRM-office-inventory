// src/pages/AdminDashboard.jsx (ฉบับทำความสะอาดแล้ว)

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { RequestManager } from '../components/admin/RequestManager';
import { InventoryManager } from '../components/admin/InventoryManager';
import { UserManager } from '../components/admin/UserManager';
import { ReportDashboard } from '../components/admin/ReportDashboard';

// **ลบ import ProcurementManager ทิ้งไปแล้ว**

export default function AdminDashboard() {
  // ตั้งค่าเริ่มต้นให้เป็น 'requests' ซึ่งเป็นหน้าหลัก
  const [view, setView] = useState('requests'); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const renderView = () => {
    switch (view) {
      case 'inventory':
        return <InventoryManager />;
      case 'users':
        return <UserManager />;
      case 'reports':
        return <ReportDashboard />;
      case 'requests':
      default:
        return <RequestManager />; // หน้าจัดการคำขอจะจัดการทุกอย่าง
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem' }}>การบริหารจัดการสต๊อกอุปกรณ์สำนักงานสำหรับ ผู้ดูแลระบบ PRM</h1>
        <button onClick={handleLogout}>ออกจากระบบ</button>
      </div>
      
      <nav style={{ margin: '2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <button onClick={() => setView('requests')} style={{ fontWeight: view === 'requests' ? 'bold' : 'normal' }}>จัดการคำขอ (ทั้งหมด)</button>
        <button onClick={() => setView('inventory')} style={{ fontWeight: view === 'inventory' ? 'bold' : 'normal' }}>จัดการสต็อกสินค้า</button>
        <button onClick={() => setView('users')} style={{ fontWeight: view === 'users' ? 'bold' : 'normal' }}>จัดการผู้ใช้</button>
        <button onClick={() => setView('reports')} style={{ fontWeight: view === 'reports' ? 'bold' : 'normal' }}>สรุปรีพอร์ต</button>
        {/* **ลบปุ่ม "คำขอจัดหาใหม่" ทิ้งไปแล้ว** */}
      </nav>

      <div>
        {renderView()}
      </div>
    </div>
  );
}