'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { AssessmentPeriod } from '@/types';

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', academic_year: new Date().getFullYear() + 543, semester: '1', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [schoolRes, periodsRes] = await Promise.all([
      supabase.from('schools').select('id').limit(1).single(),
      supabase.from('assessment_periods').select('*').order('created_at', { ascending: false }),
    ]);
    if (schoolRes.data) setSchoolId(schoolRes.data.id);
    setPeriods(periodsRes.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { toast.error('กรุณาตั้งค่าข้อมูลโรงเรียนก่อน'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('assessment_periods').insert({
      school_id: schoolId,
      name: form.name,
      academic_year: form.academic_year,
      semester: parseInt(form.semester),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: true,
    });
    if (error) toast.error('เกิดข้อผิดพลาด');
    else { toast.success('เพิ่มรอบประเมินสำเร็จ'); setShowForm(false); load(); }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('assessment_periods').update({ is_active: !current }).eq('id', id);
    toast.success(!current ? 'เปิดรับการประเมินแล้ว' : 'ปิดรับการประเมินแล้ว');
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบรอบประเมินนี้? ข้อมูลการประเมินทั้งหมดในรอบนี้จะถูกลบด้วย')) return;
    const supabase = createClient();
    await supabase.from('assessment_periods').delete().eq('id', id);
    toast.success('ลบรอบประเมินสำเร็จ');
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รอบการประเมิน</h1>
          <p className="text-gray-500 mt-1">กำหนดและจัดการรอบการประเมิน SDQ</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ เพิ่มรอบประเมิน</button>
      </div>

      {showForm && (
        <div className="card mb-6 max-w-lg">
          <h2 className="font-bold mb-4">เพิ่มรอบประเมินใหม่</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">ชื่อรอบประเมิน <span className="text-red-500">*</span></label>
              <input className="input" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ภาคเรียนที่ 1/2567" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ปีการศึกษา</label>
                <input type="number" className="input" value={form.academic_year} onChange={(e) => setForm(p => ({ ...p, academic_year: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="label">ภาคเรียน</label>
                <select className="input" value={form.semester} onChange={(e) => setForm(p => ({ ...p, semester: e.target.value }))}>
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">วันเริ่มต้น</label>
                <input type="date" className="input" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">วันสิ้นสุด</label>
                <input type="date" className="input" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>บันทึก</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {periods.map(p => (
          <div key={p.id} className={`card border flex items-center justify-between ${p.is_active ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{p.name}</span>
                {p.is_active && <span className="badge-normal">เปิดอยู่</span>}
                {!p.is_active && <span className="badge-abnormal" style={{ background: '#f3f4f6', color: '#6b7280' }}>ปิดแล้ว</span>}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ปีการศึกษา {p.academic_year} ภาคเรียนที่ {p.semester}
                {p.start_date && ` | ${p.start_date} - ${p.end_date ?? '...'}`}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(p.id, p.is_active)}
                className={p.is_active ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
              >
                {p.is_active ? '⏸ ปิดรับ' : '▶ เปิดรับ'}
              </button>
              <button onClick={() => handleDelete(p.id)} className="btn-danger text-sm">ลบ</button>
            </div>
          </div>
        ))}
        {periods.length === 0 && (
          <div className="card text-center text-gray-400 py-8">ยังไม่มีรอบประเมิน</div>
        )}
      </div>
    </div>
  );
}
