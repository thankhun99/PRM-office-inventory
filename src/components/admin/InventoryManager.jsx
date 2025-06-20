// src/components/admin/InventoryManager.jsx (Final Corrected Version)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// --- Form หลักสำหรับ "เพิ่ม" และ "แก้ไขรายละเอียด" ---
const ItemForm = ({ currentItem, onSave, onCancel }) => {
  const [itemData, setItemData] = useState({ name: '', category: '', quantity_on_hand: 0, reorder_level: 0 });

  useEffect(() => {
    if (currentItem) {
      setItemData({
        name: currentItem.name || '',
        category: currentItem.category || '',
        quantity_on_hand: currentItem.quantity_on_hand,
        reorder_level: currentItem.reorder_level || 0,
      });
    } else {
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
        <div><label>ชื่ออุปกรณ์*</label><input name="name" value={itemData.name} onChange={handleChange} required /></div>
        <div><label>หมวดหมู่</label><input name="category" value={itemData.category} onChange={handleChange} /></div>
        <div><label>จุดสั่งซื้อเพิ่ม*</label><input name="reorder_level" type="number" value={itemData.reorder_level} onChange={handleChange} required min="0" /></div>
        <div><label>จำนวนเริ่มต้น*</label><input name="quantity_on_hand" type="number" value={itemData.quantity_on_hand} onChange={handleChange} required min="0" disabled={!!currentItem} title={currentItem ? 'ใช้ปุ่ม "+ เติมสต็อก" เพื่อเพิ่มจำนวน' : ''} /></div>
        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
          <button type="submit">บันทึกข้อมูล</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>ยกเลิก</button>
        </div>
      </form>
    </div>
  );
};

// --- Modal สำหรับ "เติมสต็อก" ---
const RestockForm = ({ item, onRestock, onCancel }) => {
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [restockDate, setRestockDate] = useState(new Date());

    return (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001}}>
            <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px'}}>
                <h3>เติมสต็อก: {item.name}</h3>
                <p>จำนวนคงเหลือปัจจุบัน: {item.quantity_on_hand}</p>
                <div><label>วันที่เติมสต็อก:</label><DatePicker selected={restockDate} onChange={(date) => setRestockDate(date)} /></div>
                <div style={{marginTop: '1rem'}}><label>จำนวนที่เติม:</label><input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} /></div>
                <div style={{marginTop: '1rem'}}><label>หมายเหตุ (ถ้ามี):</label><input type="text" placeholder="เช่น เลขที่บิล" value={notes} onChange={e => setNotes(e.target.value)} /></div>
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

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('items').select('*').order('name', { ascending: true });
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            alert('Error fetching items: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSaveItem = async (itemData) => {
      if (editingItem) {
        const { id, created_at, quantity_on_hand, ...dataToUpdate } = itemData;
        const { error } = await supabase.from('items').update(dataToUpdate).eq('id', editingItem.id);
        if (error) { alert(error.message); } 
        else { alert('แก้ไขรายละเอียดสำเร็จ!'); }
      } else {
        const { error } = await supabase.from('items').insert(itemData);
        if (error) { alert(error.message); } 
        else { alert('เพิ่มรายการใหม่สำเร็จ!'); }
      }
      setShowItemForm(false);
      setEditingItem(null);
      fetchItems();
    };
    
    const handleRestock = async (itemId, quantity, notes, date) => {
        if (!quantity || quantity <= 0) {
            alert('กรุณาใส่จำนวนที่มากกว่า 0');
            return;
        }
        const { error } = await supabase.rpc('log_and_restock_item', {
            p_item_id: itemId,
            p_quantity_added: quantity,
            p_notes: notes,
            p_restock_date: date.toISOString()
        });
        if (error) { alert('เกิดข้อผิดพลาด: ' + error.message); } 
        else { alert('เติมสต็อกสำเร็จ!'); setRestockingItem(null); fetchItems(); }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
            const { error } = await supabase.from('items').delete().eq('id', itemId);
            if(error) { alert(error.message); }
            else { alert('ลบรายการสำเร็จ'); fetchItems(); }
        }
    };

    const handleEditClick = (item) => {
      setEditingItem(item);
      setShowItemForm(true);
    };

    const handleCancelForm = () => {
      setShowItemForm(false);
      setEditingItem(null);
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
                    <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                        <th style={{padding: '8px'}}>ชื่ออุปกรณ์</th>
                        <th style={{padding: '8px'}}>หมวดหมู่</th>
                        <th style={{padding: '8px'}}>จำนวนคงเหลือ</th>
                        <th style={{padding: '8px'}}>จุดสั่งซื้อเพิ่ม</th>
                        <th style={{padding: '8px'}}>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.id} style={{ backgroundColor: item.quantity_on_hand <= item.reorder_level && item.quantity_on_hand > 0 ? '#fffbe6' : item.quantity_on_hand === 0 ? '#ffdddd' : 'transparent', borderBottom: '1px solid #eee' }}>
                        <td style={{padding: '8px'}}>{item.name}</td>
                        <td style={{padding: '8px'}}>{item.category}</td>
                        <td style={{padding: '8px'}}>{item.quantity_on_hand}</td>
                        <td style={{padding: '8px'}}>{item.reorder_level}</td>
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
