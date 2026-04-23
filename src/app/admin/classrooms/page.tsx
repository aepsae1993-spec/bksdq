'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Classroom, Teacher } from '@/types';

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ grade: '1', section: '1', teacher_id: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [schoolRes, classRes, teacherRes] = await Promise.all([
      supabase.from('schools').select('id').limit(1).single(),
      supabase.from('classrooms').select('*, teacher:teachers(id,name)').order('grade').order('section'),
      supabase.from('teachers').select('id,name').order('name'),
    ]);
    if (schoolRes.data) setSchoolId(schoolRes.data.id);
    setClassrooms((classRes.data as unknown as Classroom[]) ?? []);
    setTeachers((teacherRes.data as unknown as Teacher[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { toast.error('กรุณาตั้งค่าข้อมูลโรงเรียนก่อน'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('classrooms').insert({
      school_id: schoolId,
      grade: parseInt(form.grade),
      section: form.section,
      teacher_id: form.teacher_id || null,
    });
    if (error) toast.error(error.message.includes('unique') ? 'ห้องเรียนนี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด');
    else { toast.success('เพิ่มห้องเรียนสำเร็จ'); setShowForm(false); load(); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบห้องเรียนนี้?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('classrooms').delete().eq('id', id);
    if (error) toast.error('เกิดข้อผิดพลาด');
    else { toast.success('ลบห้องเรียนสำเร็จ'); load(); }
  }

  const grouped = classrooms.reduce<Record<number, Classroom[]>>((acc, c) => {
    if (!acc[c.grade]) acc[c.grade] = [];
    acc[c.grade].push(c);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ห้องเรียน</h1>
          <p className="text-gray-500 mt-1">จัดการห้องเรียนและครูประจำชั้น</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ เพิ่มห้องเรียน</button>
      </div>

      {showForm && (
        <div className="card mb-6 max-w-md">
          <h2 className="font-bold mb-4">เพิ่มห้องเรียนใหม่</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ชั้น</label>
                <select className="input" value={form.grade} onChange={(e) => setForm(p => ({ ...p, grade: e.target.value }))}>
                  {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>ป.{g}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ห้อง</label>
                <input className="input" value={form.section} onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))} placeholder="1" required />
              </div>
            </div>
            <div>
              <label className="label">ครูประจำชั้น</label>
              <select className="input" value={form.teacher_id} onChange={(e) => setForm(p => ({ ...p, teacher_id: e.target.value }))}>
                <option value="">-- ยังไม่กำหนด --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>บันทึก</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {[1, 2, 3, 4, 5, 6].map(grade => (
          <div key={grade}>
            <h2 className="font-semibold text-gray-700 mb-2">ชั้นประถมศึกษาปีที่ {grade}</h2>
            {(grouped[grade] ?? []).length === 0 ? (
              <p className="text-gray-400 text-sm italic">ยังไม่มีห้องเรียน</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(grouped[grade] ?? []).map(c => (
                  <div key={c.id} className="card border border-gray-200 flex items-center justify-between p-4">
                    <div>
                      <div className="font-bold">ป.{c.grade}/{c.section}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {(c.teacher as unknown as Teacher)?.name ?? 'ยังไม่มีครู'}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
