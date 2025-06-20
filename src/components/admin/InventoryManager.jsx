// src/components/admin/InventoryManager.jsx (The Ultimate Version)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// --- Form หลักสำหรับ "เพิ่ม" และ "แก้ไขรายละเอียดทั้งหมด" ---
const ItemForm = ({ currentItem, onSave, onCancel }) => {
  const [itemData, setItemData] = useState({ name: '', category: '', quantity_on_hand: 0, reorder_level: 0 });

  useEffect(() => {
    if (currentItem) {
      // โหมดแก้ไข: โหลดข้อมูลเดิมมาใส่ฟอร์ม
      setItemData({
        name: currentItem.name || '',
        category: currentItem.category || '',
        quantity_on_hand: currentItem.quantity_on_hand || 0,
        reorder_level: currentItem.reorder_level || 0,
      });
    } else {
      // โหมดเพิ่มใหม่: เคลียร์ฟอร์ม
      setItemData({ name: '', category: '', quantity_on_hand: 0, reorder_level: 0 });
    }
  }, [currentItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = e.target.type === 'number' ? parseInt(value, 10) || 0 : value;
    setItemData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(itemData);
  };

  return (
    <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem', backgroundColor: '#f9f9f9' }}>
      <h3 style={{marginTop: 0}}>{currentItem ? `กำลังแก้ไข: ${currentItem.name}` : 'เพิ่มรายการใหม่ในสต็อก'}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <label>ชื่ออุปกรณ์*</label>
          <input name="name" type="text" value={itemData.name} onChange={handleChange} required style={{width: '90%'}} />
        </div>
        <div>
          <label>หมวดหมู่</label>
          <input name="category" type="text" value={itemData.category} onChange={handleChange} style={{width: '90%'}} />
        </div>
        <div>
          <label>จุดสั่งซื้อเพิ่ม*</label>
          <input name="reorder_level" type="number" value={itemData.reorder_level} onChange={handleChange} required min="0" style={{width: '90%'}} />
        </div>
        <div>
          <label>{currentItem ? 'จำนวนคงเหลือ*' : 'จำนวนเริ่มต้น*'}</label>
          <input name="quantity_on_hand" type="number" value={itemData.quantity_on_hand} onChange={handleChange} required min="0" style={{width: '90%'}} />
        </div>
        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
          <button type="submit" style={{ backgroundColor: 'blue', color: 'white', marginRight: '0.5rem' }}>บันทึกข้อมูล</button>
          <button type="button" onClick={onCancel}>ยกเลิก</button>
        </div>
      </form>
    </div>
  );
};

// --- Modal สำหรับ "เติมสต็อก" ---
const RestockForm = ({ item, onRestock, onCancel }) => {
    // ... โค้ดส่วนนี้สมบูรณ์แล้ว ไม่ต้องแก้ไข ...
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [restockDate, setRestockDate] = useState(new Date());
    return (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001}}>
            <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px'}}>
                <h3>เติมสต็อก: {item.name}</h3><p>คงเหลือ: {item.quantity_on_hand}</p>
                <div><label>วันที่เติมสต็อก:</label><DatePicker selected={restockDate} onChange={(date) => setRestockDate(date)} /></div>
                <div style={{marginTop: '1rem'}}><label>จำนวนที่เติม:</label><input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} /></div>
                <div style={{marginTop: '1rem'}}><label>หมายเหตุ:</label><input type="text" placeholder="เช่น เลขที่บิล" value={notes} onChange={e => setNotes(e.target.value)} /></div>
                <div style={{marginTop: '1.5rem'}}>
                    <button onClick={() => onRestock(item.id, quantity, notes, restockDate)}>ยืนยัน</button>
                    <button onClick={onCancel} style={{marginLeft: '10px'}}>ยกเลิก</button>
                </div>
            </div>
        </div>
    );
};


// --- Component หลัก ---
export const InventoryManager = () => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [restockingItem, setRestockingItem] = useState(null);

    const fetchItems = async () => { /* ... โค้ด fetchItems สมบูรณ์เหมือนเดิม ... */ };
    useEffect(() => { fetchItems(); }, []);

    const handleSaveItem = async (itemData) => {
      // ไม่ว่าจะเป็นการสร้างใหม่หรือแก้ไข จะใช้ข้อมูลทั้งหมดจากฟอร์ม
      const dataToSave = {
          name: itemData.name,
          category: itemData.category,
          quantity_on_hand: itemData.quantity_on_hand,
          reorder_level: itemData.reorder_level,
      };

      if (editingItem) { // โหมดแก้ไข
        const { error } = await supabase.from('items').update(dataToSave).eq('id', editingItem.id);
        if (error) { alert(error.message); } 
        else { alert('แก้ไขรายการสำเร็จ!'); }
      } else { // โหมดเพิ่มใหม่
        const { error } = await supabase.from('items').insert(dataToSave);
        if (error) { alert(error.message); } 
        else { alert('เพิ่มรายการใหม่สำเร็จ!'); }
      }
      setShowItemForm(false); setEditingItem(null); fetchItems();
    };
    
    const handleRestock = async (itemId, quantity, notes, date) => { /* ... โค้ดเหมือนเดิม ... */ };
    const handleDeleteItem = async (itemId) => { /* ... โค้ดเหมือนเดิม ... */ };

    const handleEditClick = (item) => {
      setEditingItem(item); setShowItemForm(true);
    };

    const handleCancelForm = () => {
      setShowItemForm(false); setEditingItem(null);
    };
    
    if (loading) return <p>Loading inventory...</p>;

    return (
        <div>
            {restockingItem && <RestockForm item={restockingItem} onRestock={handleRestock} onCancel={() => setRestockingItem(null)} />}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>จัดการสต็อกสินค้าทั้งหมด</h2>
                {!showItemForm && <button onClick={() => { setEditingItem(null); setShowItemForm(true); }}>+ เพิ่มรายการใหม่</button>}
            </div>

            {showItemForm && <ItemForm currentItem={editingItem} onSave={handleSaveItem} onCancel={handleCancelForm} />}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  {/* ... thead เหมือนเดิม ... */}
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.id} style={{ backgroundColor: item.quantity_on_hand <= item.reorder_level && item.quantity_on_hand > 0 ? '#fffbe6' : item.quantity_on_hand === 0 ? '#ffdddd' : 'transparent' }}>
                        {/* ... td แสดงข้อมูลเหมือนเดิม ... */}
                        <td style={{padding: '8px', display: 'flex', gap: '5px'}}>
                            <button onClick={() => setRestockingItem(item)} style={{backgroundColor: 'green', color: 'white'}}>+ เติมสต็อก</button>
                            <button onClick={() => handleEditClick(item)}>แก้ไข</button>
                            <button onClick={() => handleDeleteItem(item.id)}>ลบ</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};
