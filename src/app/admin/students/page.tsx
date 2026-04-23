'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Student, Classroom } from '@/types';
import Papa from 'papaparse';

const GENDER_LABEL: Record<string, string> = { M: 'ชาย', F: 'หญิง' };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ grade: '', section: '', search: '' });
  const [form, setForm] = useState({ student_code: '', first_name: '', last_name: '', gender: '', classroom_id: '', parent_contact: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [schoolRes, classRes, studentsRes] = await Promise.all([
      supabase.from('schools').select('id').limit(1).single(),
      supabase.from('classrooms').select('*').order('grade').order('section'),
      supabase.from('students').select('*, classroom:classrooms(id,grade,section)').eq('is_active', true).order('student_code'),
    ]);
    if (schoolRes.data) setSchoolId(schoolRes.data.id);
    setClassrooms(classRes.data ?? []);
    setStudents((studentsRes.data as unknown as Student[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { toast.error('กรุณาตั้งค่าข้อมูลโรงเรียนก่อน'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('students').insert({ ...form, school_id: schoolId, gender: form.gender || null, classroom_id: form.classroom_id || null });
    if (error) toast.error(error.message.includes('unique') ? 'รหัสนักเรียนซ้ำ' : 'เกิดข้อผิดพลาด');
    else { toast.success('เพิ่มนักเรียนสำเร็จ'); setShowForm(false); setForm({ student_code: '', first_name: '', last_name: '', gender: '', classroom_id: '', parent_contact: '' }); load(); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบนักเรียนคนนี้?')) return;
    const supabase = createClient();
    await supabase.from('students').update({ is_active: false }).eq('id', id);
    toast.success('ลบนักเรียนสำเร็จ');
    load();
  }

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const supabase = createClient();
        const rows = results.data as Record<string, string>[];
        let success = 0;
        for (const row of rows) {
          const classroom = classrooms.find(c => c.grade === parseInt(row.grade) && c.section === row.section);
          const { error } = await supabase.from('students').insert({
            school_id: schoolId,
            student_code: row.student_code,
            first_name: row.first_name,
            last_name: row.last_name,
            gender: row.gender || null,
            classroom_id: classroom?.id || null,
            parent_contact: row.parent_contact || null,
          });
          if (!error) success++;
        }
        toast.success(`นำเข้าสำเร็จ ${success}/${rows.length} คน`);
        load();
      },
    });
    e.target.value = '';
  }

  const filtered = students.filter(s => {
    const c = s.classroom as unknown as Classroom;
    if (filter.grade && String(c?.grade) !== filter.grade) return false;
    if (filter.section && c?.section !== filter.section) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นักเรียน</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลนักเรียนทั้งหมด ({students.length} คน)</p>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer text-sm">
            📥 นำเข้า CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ เพิ่มนักเรียน</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 max-w-lg">
          <h2 className="font-bold mb-4">เพิ่มนักเรียนใหม่</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">รหัสนักเรียน <span className="text-red-500">*</span></label>
                <input className="input" value={form.student_code} onChange={(e) => setForm(p => ({ ...p, student_code: e.target.value }))} placeholder="P101001" required />
              </div>
              <div>
                <label className="label">ห้องเรียน</label>
                <select className="input" value={form.classroom_id} onChange={(e) => setForm(p => ({ ...p, classroom_id: e.target.value }))}>
                  <option value="">-- เลือกห้อง --</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>ป.{c.grade}/{c.section}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ชื่อ <span className="text-red-500">*</span></label>
                <input className="input" value={form.first_name} onChange={(e) => setForm(p => ({ ...p, first_name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">นามสกุล <span className="text-red-500">*</span></label>
                <input className="input" value={form.last_name} onChange={(e) => setForm(p => ({ ...p, last_name: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">เพศ</label>
                <select className="input" value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">-- เลือก --</option>
                  <option value="M">ชาย</option>
                  <option value="F">หญิง</option>
                </select>
              </div>
              <div>
                <label className="label">เบอร์ผู้ปกครอง</label>
                <input className="input" value={form.parent_contact} onChange={(e) => setForm(p => ({ ...p, parent_contact: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>บันทึก</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Template hint */}
      <div className="card mb-4 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>รูปแบบ CSV:</strong> student_code, first_name, last_name, gender (M/F), grade (1-6), section, parent_contact
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="ค้นหาชื่อหรือรหัส..." value={filter.search} onChange={(e) => setFilter(p => ({ ...p, search: e.target.value }))} />
        <select className="input max-w-xs" value={filter.grade} onChange={(e) => setFilter(p => ({ ...p, grade: e.target.value }))}>
          <option value="">ทุกชั้น</option>
          {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>ป.{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อ-นามสกุล</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ห้อง</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เพศ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ผู้ปกครอง</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(s => {
              const c = s.classroom as unknown as Classroom;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.student_code}</td>
                  <td className="px-4 py-3">{s.first_name} {s.last_name}</td>
                  <td className="px-4 py-3">{c ? `ป.${c.grade}/${c.section}` : '-'}</td>
                  <td className="px-4 py-3">{s.gender ? GENDER_LABEL[s.gender] : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.parent_contact ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบข้อมูลนักเรียน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
