// src/components/ProcurementModal.jsx

import { useState } from 'react';

export const ProcurementModal = ({ onClose, onSubmit }) => {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    // ส่งข้อมูลทั้งหมดกลับไปให้ Dashboard จัดการ
    onSubmit({
      item_name: itemName,
      item_description: itemDescription,
      quantity: quantity,
    });
  };

  // --- Styles (เหมือนกับ RequestModal) ---
  const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalContentStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
  const inputStyle = { width: '95%', padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' };
  const textareaStyle = { ...inputStyle, height: '80px', fontFamily: 'sans-serif' };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>ขอจัดหาอุปกรณ์ใหม่</h2>
        <p>กรุณากรอกรายละเอียดของอุปกรณ์ที่ไม่มีในสต็อกและคุณต้องการใช้งาน</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="itemName">ชื่ออุปกรณ์ที่ต้องการ:</label>
          <input id="itemName" type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} style={inputStyle} required autoFocus />
          
          <label htmlFor="itemDescription">คำอธิบาย / สเปค (ถ้ามี):</label>
          <textarea id="itemDescription" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} style={textareaStyle}></textarea>
          
          <label htmlFor="quantity">จำนวนที่ต้องการ:</label>
          <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} min="1" style={inputStyle} required />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose}>ยกเลิก</button>
            <button type="submit" style={{ backgroundColor: '#28a745', color: 'white' }}>ส่งคำขอ</button>
          </div>
        </form>
      </div>
    </div>
  );
};