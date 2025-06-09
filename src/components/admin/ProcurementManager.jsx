// src/components/admin/ProcurementManager.jsx (เวอร์ชันพิสูจน์)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const ProcurementManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProcurementRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('detailed_procurement_requests') // เรียกจาก View ที่ถูกต้อง
                .select('*')
                .in('status', ['new', 'reviewing', 'ordered'])
                .order('created_at', { ascending: false });

            if (error) {
                // ถ้าเกิด Error ที่นี่ มันจะแสดงใน alert
                throw error;
            }
            setRequests(data || []);
        } catch (error) {
            alert(`เกิดข้อผิดพลาดในการดึงข้อมูลคำขอจัดหา: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcurementRequests();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        // ... โค้ดส่วนนี้เหมือนเดิม ...
        try {
            await supabase.from('procurement_requests').update({ status: newStatus }).eq('id', id);
            fetchProcurementRequests();
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) return <p>Loading procurement requests...</p>;

    return (
        <div>
            {/* === สัญลักษณ์พิสูจน์เวอร์ชันล่าสุด === */}
            <h1 style={{color: 'red'}}>-- นี่คือโค้ดเวอร์ชันล่าสุด --</h1>

            <h2>คำขอจัดหาอุปกรณ์ใหม่</h2>
            {/* ... ส่วนของตารางแสดงผลเหมือนเดิม ... */}
            {requests.length === 0 ? <p>ไม่มีคำขอจัดหาใหม่</p> : (
                <table style={{ width: '100%' }}>
                    {/* ... thead ... */}
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id}>
                                <td>{new Date(req.created_at).toLocaleString('th-TH')}</td>
                                <td>{req.requester_name || 'N/A'}</td>
                                <td>{req.item_name}</td>
                                <td>{req.item_description}</td>
                                <td>{req.quantity}</td>
                                <td>
                                    <select value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)}>
                                        <option value="new">New</option>
                                        <option value="reviewing">Reviewing</option>
                                        <option value="ordered">Ordered</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};