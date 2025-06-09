// src/components/RequestModal.jsx

import { useState } from 'react';

export const RequestModal = ({ item, onClose, onSubmit }) => {
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(quantity);
  };

  // --- ส่วนของ Styles ---
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '400px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    fontSize: '1rem',
    marginBottom: '1rem',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>เบิกอุปกรณ์</h2>
        <p>คุณกำลังจะเบิก: <strong>{item.name}</strong></p>
        <p>จำนวนคงเหลือในสต็อก: {item.quantity_on_hand} ชิ้น</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="quantity">จำนวนที่ต้องการเบิก:</label>
          <input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            min="1"
            max={item.quantity_on_hand}
            style={inputStyle}
            required
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose}>ยกเลิก</button>
            <button type="submit" style={{ backgroundColor: '#007bff', color: 'white' }}>ยืนยันการเบิก</button>
          </div>
        </form>
      </div>
    </div>
  );
};