import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const getProfile = async () => {
      if (session?.user) {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setProfile(data);
        }
        setLoading(false);
      }
    };

    getProfile();
  }, [session]);

  if (loading) {
    return <div>Loading...</div>; // แสดงข้อความ Loading ระหว่างรอ
  }

if (!session) {
  return (
    // สร้าง div ครอบด้านนอกสุดเพื่อให้เต็มจอ
    <div style={{
      minHeight: '100vh',       // ทำให้ div สูงเต็มหน้าจอ
      display: 'flex',          // เปิดใช้งาน Flexbox
      alignItems: 'center',     // จัดให้อยู่ตรงกลางแนวตั้ง
      justifyContent: 'center'  // จัดให้อยู่ตรงกลางแนวนอน
    }}>
      {/* div นี้สำหรับกล่อง Login โดยเฉพาะ */}
      <div style={{ width: '360px' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          magicLink={true}
        />
      </div>
    </div>
  );
} else {
    if (profile?.role === 'admin') {
      return <AdminDashboard />;
    }
    return <Dashboard />;
  }
}

export default App;