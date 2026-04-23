'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Student, Classroom } from '@/types';

const GENDER_LABEL: Record<string, string> = { M: 'ชาย', F: 'หญิง' };

interface PasteRow {
  student_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  grade: string;
  section: string;
  parent_contact: string;
  _error?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [filter, setFilter] = useState({ grade: '', search: '' });
  const [form, setForm] = useState({ student_code: '', first_name: '', last_name: '', gender: '', classroom_id: '', parent_contact: '' });
  const [pasteText, setPasteText] = useState('');
  const [pasteRows, setPasteRows] = useState<PasteRow[]>([]);
  const [importing, setImporting] = useState(false);
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

  // Parse paste text (tab-separated from Excel)
  function parsePaste(text: string): PasteRow[] {
    const lines = text.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      const cols = line.split('\t').map(c => c.trim().replace(/\r/g, ''));
      // Expected columns: รหัสนักเรียน | ชื่อ | นามสกุล | เพศ(ช/ห หรือ M/F) | ชั้น(1-6) | ห้อง | เบอร์ผู้ปกครอง
      const [student_code = '', first_name = '', last_name = '', gender_raw = '', grade = '', section = '', parent_contact = ''] = cols;
      const gender = gender_raw === 'ช' || gender_raw.toUpperCase() === 'M' ? 'M'
        : gender_raw === 'ห' || gender_raw.toUpperCase() === 'F' ? 'F' : '';
      let error = '';
      if (!student_code) error = 'ไม่มีรหัสนักเรียน';
      else if (!first_name) error = 'ไม่มีชื่อ';
      else if (!grade || isNaN(parseInt(grade)) || parseInt(grade) < 1 || parseInt(grade) > 6) error = 'ชั้นไม่ถูกต้อง';
      return { student_code, first_name, last_name, gender, grade, section, parent_contact, _error: error };
    });
  }

  function handlePasteChange(text: string) {
    setPasteText(text);
    if (text.trim()) setPasteRows(parsePaste(text));
    else setPasteRows([]);
  }

  async function handleImport() {
    const validRows = pasteRows.filter(r => !r._error);
    if (validRows.length === 0) { toast.error('ไม่มีข้อมูลที่ถูกต้อง'); return; }
    if (!schoolId) { toast.error('กรุณาตั้งค่าข้อมูลโรงเรียนก่อน'); return; }
    setImporting(true);
    const supabase = createClient();
    let success = 0;
    let dup = 0;
    for (const row of validRows) {
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
      else if (error.message.includes('unique')) dup++;
    }
    let msg = `นำเข้าสำเร็จ ${success} คน`;
    if (dup > 0) msg += ` (ซ้ำ ${dup} คน)`;
    toast.success(msg);
    setPasteText('');
    setPasteRows([]);
    setShowPaste(false);
    load();
    setImporting(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { toast.error('กรุณาตั้งค่าข้อมูลโรงเรียนก่อน'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('students').insert({
      ...form, school_id: schoolId,
      gender: form.gender || null,
      classroom_id: form.classroom_id || null,
    });
    if (error) toast.error(error.message.includes('unique') ? 'รหัสนักเรียนซ้ำ' : 'เกิดข้อผิดพลาด');
    else {
      toast.success('เพิ่มนักเรียนสำเร็จ');
      setShowForm(false);
      setForm({ student_code: '', first_name: '', last_name: '', gender: '', classroom_id: '', parent_contact: '' });
      load();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบนักเรียนคนนี้?')) return;
    const supabase = createClient();
    await supabase.from('students').update({ is_active: false }).eq('id', id);
    toast.success('ลบนักเรียนสำเร็จ');
    load();
  }

  const filtered = students.filter(s => {
    const c = s.classroom as unknown as Classroom;
    if (filter.grade && String(c?.grade) !== filter.grade) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q);
    }
    return true;
  });

  const validCount = pasteRows.filter(r => !r._error).length;
  const errorCount = pasteRows.filter(r => r._error).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นักเรียน</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลนักเรียนทั้งหมด ({students.length} คน)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowPaste(!showPaste); setShowForm(false); }} className="btn-secondary text-sm">
            📋 วางข้อมูลจาก Excel
          </button>
          <button onClick={() => { setShowForm(!showForm); setShowPaste(false); }} className="btn-primary">
            + เพิ่มนักเรียน
          </button>
        </div>
      </div>

      {/* Paste from Excel */}
      {showPaste && (
        <div className="card mb-6">
          <h2 className="font-bold text-gray-900 mb-1">วางข้อมูลจาก Excel</h2>
          <p className="text-sm text-gray-500 mb-3">
            คัดลอกข้อมูลจาก Excel แล้ววางที่นี่ (ไม่ต้องมี header)
          </p>

          {/* Column guide */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs font-mono overflow-x-auto">
            <div className="text-gray-400 mb-1">ลำดับคอลัมน์ใน Excel (A → G):</div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['A: รหัสนักเรียน', 'B: ชื่อ', 'C: นามสกุล', 'D: เพศ (ช/ห หรือ M/F)', 'E: ชั้น (1-6)', 'F: ห้อง', 'G: เบอร์ผู้ปกครอง'].map(h => (
                <div key={h} className="bg-blue-100 text-blue-800 rounded px-1 py-1 leading-tight">{h}</div>
              ))}
            </div>
            <div className="text-gray-400 mt-2">ตัวอย่าง:</div>
            <div className="text-gray-700">P101001{'  '}สมชาย{'  '}ใจดี{'  '}ช{'  '}1{'  '}1{'  '}0812345678</div>
          </div>

          <textarea
            className="input font-mono text-sm h-48 resize-y"
            placeholder="วางข้อมูลจาก Excel ที่นี่..."
            value={pasteText}
            onChange={e => handlePasteChange(e.target.value)}
          />

          {/* Preview */}
          {pasteRows.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-3 mb-2 text-sm">
                <span className="text-green-700 font-medium">✓ ถูกต้อง {validCount} แถว</span>
                {errorCount > 0 && <span className="text-red-600 font-medium">✕ มีข้อผิดพลาด {errorCount} แถว</span>}
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">รหัส</th>
                      <th className="text-left px-3 py-2">ชื่อ-นามสกุล</th>
                      <th className="text-left px-3 py-2">เพศ</th>
                      <th className="text-left px-3 py-2">ชั้น/ห้อง</th>
                      <th className="text-left px-3 py-2">เบอร์</th>
                      <th className="text-left px-3 py-2">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pasteRows.map((r, i) => (
                      <tr key={i} className={r._error ? 'bg-red-50' : 'bg-white'}>
                        <td className="px-3 py-1.5 font-mono">{r.student_code || '-'}</td>
                        <td className="px-3 py-1.5">{r.first_name} {r.last_name}</td>
                        <td className="px-3 py-1.5">{r.gender === 'M' ? 'ชาย' : r.gender === 'F' ? 'หญิง' : '-'}</td>
                        <td className="px-3 py-1.5">ป.{r.grade}/{r.section}</td>
                        <td className="px-3 py-1.5">{r.parent_contact || '-'}</td>
                        <td className="px-3 py-1.5">
                          {r._error
                            ? <span className="text-red-600">⚠ {r._error}</span>
                            : <span className="text-green-600">✓ โอเค</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleImport} disabled={importing || validCount === 0} className="btn-primary">
                  {importing ? 'กำลังนำเข้า...' : `📥 นำเข้า ${validCount} คน`}
                </button>
                <button onClick={() => { setPasteText(''); setPasteRows([]); }} className="btn-secondary">ล้างข้อมูล</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add single student form */}
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
