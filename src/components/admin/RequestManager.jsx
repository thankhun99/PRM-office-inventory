// src/components/admin/RequestManager.jsx (ฉบับแก้ไขสมบูรณ์)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const StatusBadge = ({ status }) => {
  const baseStyle = { color: 'white', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'capitalize', fontWeight: 500 };
  let style = {};
  switch (status) {
    case 'pending': style = { ...baseStyle, backgroundColor: '#faad14' }; break;
    case 'backorder': style = { ...baseStyle, backgroundColor: '#108ee9' }; break;
    case 'new': style = { ...baseStyle, backgroundColor: '#28a745' }; break;
    case 'approved': style = { ...baseStyle, backgroundColor: 'green' }; break;
    case 'rejected': style = { ...baseStyle, backgroundColor: 'red' }; break;
    default: style = { ...baseStyle, backgroundColor: '#8c8c8c' };
  }
  return <span style={style}>{status}</span>;
};

export const RequestManager = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const getActiveRequests = async () => {
    setLoading(true);
    try {
      const [stockResult, procurementResult] = await Promise.all([
        supabase.from('detailed_requests').select('*').in('status', ['pending', 'backorder']),
        supabase.from('detailed_procurement_requests').select('*').eq('status', 'new')
      ]);

      if (stockResult.error) throw stockResult.error;
      if (procurementResult.error) throw procurementResult.error;

      const stockRequests = stockResult.data || [];
      const procurementRequests = procurementResult.data || [];

      const formattedStock = stockRequests.map(r => ({ ...r, type: 'เบิกสต็อก' }));
      const formattedProcure = procurementRequests.map(r => ({ ...r, type: 'ขอจัดหาใหม่', quantity_requested: r.quantity }));
      
      const allRequests = [...formattedStock, ...formattedProcure];
      allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setRequests(allRequests);
    } catch (error) {
      console.error("Error fetching active requests:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getActiveRequests();
  }, []);

  const handleUpdateStockRequest = async (requestId, newStatus) => {
    const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', requestId);
    if (error) { 
      alert(error.message); 
    } else {
      alert('อัปเดตสถานะสำเร็จ!');
      getActiveRequests();
    }
  };

  const handleApproveProcurement = async (procurementId) => {
    if (window.confirm('การอนุมัตินี้จะสร้าง Item ใหม่ในสต็อก และสร้างคำขอ Backorder คุณต้องการดำเนินการต่อหรือไม่?')) {
        const { error } = await supabase.rpc('approve_procurement_request', { procurement_id: procurementId });
        if (error) { 
            alert(error.message); 
        } else {
            alert('อนุมัติคำขอจัดหาสำเร็จ!');
            getActiveRequests();
        }
    }
  };

  const handleRejectProcurement = async (procurementId) => {
    if (window.confirm('คุณต้องการปฏิเสธคำขอจัดหานี้ใช่หรือไม่?')) {
        const { error } = await supabase.from('procurement_requests').update({ status: 'rejected' }).eq('id', procurementId);
        if (error) { 
            alert(error.message); 
        } else {
            alert('ปฏิเสธคำขอเรียบร้อย');
            getActiveRequests();
        }
    }
  };

  if (loading) return <p>Loading requests...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem' }}>คำขอที่ต้องดำเนินการ (ทั้งหมด)</h2>
      {requests.length === 0 ? <p>ไม่มีคำขอที่ต้องดำเนินการ</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{padding: '0.5rem'}}>วันที่ขอ</th>
              <th style={{padding: '0.5rem'}}>ประเภท</th>
              <th style={{padding: '0.5rem'}}>อุปกรณ์/รายละเอียด</th>
              <th style={{padding: '0.5rem'}}>ผู้ขอ</th>
              <th style={{padding: '0.5rem'}}>จำนวน</th>
              <th style={{padding: '0.5rem'}}>สถานะ</th>
              <th style={{padding: '0.5rem'}}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr key={`${request.type}-${request.id}`}>
                <td style={{padding: '0.5rem'}}>{new Date(request.created_at).toLocaleString('th-TH')}</td>
                <td style={{padding: '0.5rem'}}>{request.type}</td>
                <td style={{padding: '0.5rem'}}>
                    <div>{request.item_name}</div>
                    <div style={{ fontSize: '0.8em', color: 'gray' }}>{request.item_description}</div>
                </td>
                <td style={{padding: '0.5rem'}}>{request.requester_name || 'N/A'}</td>
                <td style={{padding: '0.5rem'}}>{request.quantity_requested}</td>
                <td style={{padding: '0.5rem'}}><StatusBadge status={request.status} /></td>
                <td style={{padding: '0.5rem', display: 'flex', gap: '0.5rem'}}>
                  {request.type === 'เบิกสต็อก' ? (
                    <>
                      <button onClick={() => handleUpdateStockRequest(request.id, 'approved')} style={{backgroundColor: 'green', color: 'white'}}>อนุมัติ</button>
                      <button onClick={() => handleUpdateStockRequest(request.id, 'rejected')} style={{backgroundColor: 'red', color: 'white'}}>ปฏิเสธ</button>
                    </>
                  ) : ( // ประเภท 'ขอจัดหาใหม่'
                    <>
                      <button onClick={() => handleApproveProcurement(request.id)} style={{backgroundColor: '#28a745', color: 'white'}}>อนุมัติจัดหา</button>
                      <button onClick={() => handleRejectProcurement(request.id)} style={{backgroundColor: 'red', color: 'white'}}>ปฏิเสธ</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
