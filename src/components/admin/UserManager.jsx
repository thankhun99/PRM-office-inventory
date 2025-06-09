// src/components/admin/UserManager.jsx (ฉบับแก้ไข)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUsers();
    }, []);

    const getUsers = async () => {
        setLoading(true);
        // === จุดที่แก้ไข ===
        // นำ 'email' ออกจากคำสั่ง select เพราะไม่มีคอลัมน์นี้ในตาราง profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, department')
            .order('full_name', { ascending: true });

        if (error) {
            alert(error.message);
        } else if (data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId, newRole) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยน Role ของผู้ใช้คนนี้เป็น '${newRole}'?`)) {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            if (error) {
                alert(error.message);
            } else {
                alert('อัปเดต Role สำเร็จ');
                getUsers();
            }
        }
    };

    if (loading) return <p>Loading users...</p>;

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem' }}>จัดการผู้ใช้</h2>
            <p>คุณสามารถเลื่อนขั้นพนักงานให้เป็น Admin หรือลดขั้น Admin กลับมาเป็นพนักงานได้ที่หน้านี้</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                 <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>ชื่อ</th>
                        <th style={{ padding: '0.5rem' }}>แผนก</th>
                        <th style={{ padding: '0.5rem' }}>Role ปัจจุบัน</th>
                        <th style={{ padding: '0.5rem' }}>เปลี่ยนเป็น</th>
                    </tr>
                </thead>
                 <tbody>
                    {users.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>{user.full_name || 'N/A'}</td>
                            <td style={{ padding: '0.5rem' }}>{user.department || 'ยังไม่ระบุ'}</td>
                            <td style={{ padding: '0.5rem' }}>{user.role}</td>
                            <td style={{ padding: '0.5rem' }}>
                                {user.role === 'admin' 
                                 ? <button onClick={() => handleRoleChange(user.id, 'employee')}>ลดขั้นเป็น Employee</button>
                                 : <button onClick={() => handleRoleChange(user.id, 'admin')}>เลื่อนขั้นเป็น Admin</button>
                                }
                            </td>
                        </tr>
                    ))}
                 </tbody>
            </table>
        </div>
    );
};