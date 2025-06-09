// src/components/admin/ReportDashboard.jsx (Final version with working Export)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import DatePicker from 'react-datepicker';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Component ย่อยสำหรับแสดงตาราง Preview ---
const PreviewTable = ({ data, type, onClose }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '1.5rem', border: '1px solid #007bff', borderRadius: '8px', marginBottom: '2rem' }}>
                <button onClick={onClose}>ปิดตัวอย่าง</button>
                <p>ไม่มีข้อมูลให้แสดงตัวอย่างในช่วงเวลาที่เลือก</p>
            </div>
        );
    }
    const headers = Object.keys(data[0]);
    return (
        <div style={{ padding: '1.5rem', border: '1px solid #007bff', borderRadius: '8px', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>ตัวอย่างข้อมูล: {type === 'withdrawals' ? 'รายงานการเบิก' : 'รายงานการเติมสต็อก'}</h3>
                <button onClick={onClose}>ปิดตัวอย่าง</button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', borderTop: '1px solid #ccc', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ textAlign: 'left' }}>{headers.map(h => <th key={h} style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>{h}</th>)}</tr></thead>
                    <tbody>{data.map((row, i) => (<tr key={i} style={{ borderBottom: '1px solid #eee' }}>{headers.map(h => <td key={h} style={{ padding: '8px' }}>{row[h]}</td>)}</tr>))}</tbody>
                </table>
            </div>
        </div>
    );
};

export const ReportDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('all');
    const [exporting, setExporting] = useState(false);
    const [topItems, setTopItems] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [previewData, setPreviewData] = useState(null);
    const [previewType, setPreviewType] = useState('');

const fetchAllReports = async () => {
    console.log("--- เริ่มกระบวนการ fetchAllReports ---");
    setLoading(true);
    setPreviewData(null); // เคลียร์ข้อมูลเก่า
    try {
        const dateRange = {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        };

        // เราจะดึงข้อมูลทีละส่วนเพื่อดูว่าส่วนไหนที่ Error
        console.log("DEBUG 1: กำลังดึงข้อมูล Top 10 Items...");
        const { data: topItems, error: topItemsError } = await supabase.rpc('get_top_requested_items', dateRange);
        if (topItemsError) throw topItemsError; // ถ้า Error ให้โยนไปที่ catch block
        console.log("DEBUG 1: ดึงข้อมูล Top 10 สำเร็จ");
        setTopItems(topItems || []);

        console.log("DEBUG 2: กำลังดึงข้อมูล Low Stock Items...");
        const { data: lowStock, error: lowStockError } = await supabase.rpc('get_low_stock_items');
        if (lowStockError) throw lowStockError;
        console.log("DEBUG 2: ดึงข้อมูล Low Stock สำเร็จ");
        setLowStockItems(lowStock || []);

        // fetchUsers จะถูกเรียกแยกต่างหากใน useEffect เพื่อลดความซับซ้อน

    } catch (error) {
        console.error("---!!! ERROR during fetchAllReports !!!---", error);
        alert("เกิดข้อผิดพลาดในการโหลดรีพอร์ต: " + error.message);
    } finally {
        console.log("--- จบกระบวนการ fetchAllReports, ปิดหน้า Loading ---");
        setLoading(false);
    }
};
    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
        if (data) setUsers(data || []);
    };
    
    useEffect(() => {
        fetchAllReports();
        fetchUsers();
    }, [startDate, endDate]);

    // *** นี่คือฟังก์ชันที่ขาดหายไป ***
    const exportToExcel = (apiData, fileName) => {
        if (!apiData || apiData.length === 0) {
            alert('ไม่มีข้อมูลสำหรับ Export');
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(apiData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const handleReportAction = async (action) => {
        setExporting(true);
        setPreviewData(null); // เคลียร์ preview เก่าทุกครั้ง
        try {
            const { data, error } = await supabase.rpc('export_withdrawal_report', {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                user_id_filter: selectedUser
            });
            if (error) throw error;
            if (action === 'view') {
                setPreviewData(data);
                setPreviewType('withdrawals');
            } else if (action === 'export') {
                exportToExcel(data, 'Withdrawal_Report');
            }
        } catch (error) { alert(error.message); } 
        finally { setExporting(false); }
    };
    
    const handleExportRestocks = async () => {
        setExporting(true);
        setPreviewData(null);
        try {
            const { data, error } = await supabase.rpc('export_restock_report', {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            });
            if (error) throw error;
            exportToExcel(data, 'Restock_Report');
        } catch (error) { alert(error.message); } 
        finally { setExporting(false); }
    };

    const chartOptions = { /* ...โค้ดเหมือนเดิม... */ };
    const topItemsChartData = {
        labels: topItems.map(item => item.item_name),
        datasets: [{
            label: 'จำนวนที่เบิก (ชิ้น)',
            data: topItems.map(item => item.total_requested),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }]
    };

    return (
        <div>
            <h2>สรุปรีพอร์ตและ Export ข้อมูล</h2>
            
            <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '2rem' }}>
                <h3>ตัวกรองและเครื่องมือ</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div><label>ตั้งแต่:</label> <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="dd/MM/yyyy" /></div>
                    <div><label>ถึง:</label> <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="dd/MM/yyyy" /></div>
                    <div><label>ผู้เบิก (สำหรับรายงานการเบิก):</label>
                        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                            <option value="all">ดูทั้งหมด</option>
                            {users.map(user => (<option key={user.id} value={user.id}>{user.full_name}</option>))}
                        </select>
                    </div>
                    <button onClick={() => handleReportAction('view')} disabled={exporting}>{exporting ? '...' : 'View การเบิก'}</button>
                    <button onClick={() => handleReportAction('export')} disabled={exporting}>{exporting ? '...' : 'Export การเบิก'}</button>
                    <button onClick={handleExportRestocks} disabled={exporting}>{exporting ? '...' : 'Export การเติมสต็อก'}</button>
                </div>
            </div>

            {previewData && <PreviewTable data={previewData} type={previewType} onClose={() => setPreviewData(null)} />}
            
            {loading ? <p>กำลังโหลดข้อมูลรีพอร์ต...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div>
                        <h4>10 อันดับอุปกรณ์ที่ถูกเบิกเยอะที่สุด</h4>
                        {topItems.length > 0 ? <Bar options={chartOptions} data={topItemsChartData} /> : <p>ไม่มีข้อมูลการเบิกในช่วงเวลานี้</p>}
                    </div>
                    <div>
                        <h4>สินค้าที่ต้องสั่งซื้อเพิ่ม</h4>
                        <ul>
                            {lowStockItems.length > 0 ? lowStockItems.map(item => (
                                <li key={item.name}>{item.name} (เหลือ {item.quantity_on_hand} / สั่งเมื่อเหลือ {item.reorder_level})</li>
                            )) : <p>ไม่มีรายการที่ต้องสั่งซื้อเพิ่ม</p>}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};