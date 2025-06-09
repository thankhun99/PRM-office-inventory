// supabase/functions/suggest-reorder-level/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "suggest-reorder-level" up and running!`)

// Logic การคำนวณ
const calculateSuggestion = (dailyUsage: number): number => {
  const LEAD_TIME_DAYS = 7; // ระยะเวลาที่รอของมาส่ง (วัน)
  const SAFETY_FACTOR = 1.5; // ตัวคูณเพื่อความปลอดภัย (50% safety stock)

  const suggestion = Math.ceil((dailyUsage * LEAD_TIME_DAYS) * SAFETY_FACTOR);
  return suggestion;
};

Deno.serve(async (req) => {
  // จัดการ Preflight request สำหรับ CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { itemId } = await req.json();
    if (!itemId) {
      throw new Error("Item ID is required.");
    }

    // คำนวณวันที่ 90 วันย้อนหลัง
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // ดึงข้อมูลการเบิกที่ "อนุมัติแล้ว" ของ item นี้ใน 90 วันล่าสุด
    const { data: requests, error } = await supabaseClient
      .from('requests')
      .select('quantity_requested')
      .eq('item_id', itemId)
      .eq('status', 'approved')
      .gte('created_at', ninetyDaysAgo.toISOString());

    if (error) throw error;

    // คำนวณผลรวม
    const totalUsage = requests.reduce((sum, req) => sum + req.quantity_requested, 0);
    const averageDailyUsage = totalUsage / 90;

    // คำนวณค่าที่แนะนำ
    const suggestedLevel = calculateSuggestion(averageDailyUsage);

    return new Response(JSON.stringify({ suggestedLevel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})