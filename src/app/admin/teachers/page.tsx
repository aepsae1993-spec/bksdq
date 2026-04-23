'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Teacher } from '@/types';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', employee_code: '', is_admin: false, password: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [schoolRes, teachersRes] = await Promise.all([
      supabase.from('schools').select('id').limit(1).single(),
      supabase.from('teachers').select('*').order('name'),
    ]);
    if (schoolRes.data) setSchoolId(schoolRes.data.id);
    setTeachers(teachersRes.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { toast.error('กรุณาตั้งค่าข้อมูลโรงเรียนก่อน'); return; }
    setLoading(true);
    const supabase = createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin?.createUser
      ? // @ts-ignore
        await supabase.auth.admin.createUser({ email: form.email, password: form.password, email_confirm: true })
      : { data: null, error: new Error('no admin') };

    // Fallback: just create teacher record without auth
    const { error } = await supabase.from('teachers').insert({
      school_id: schoolId,
      name: form.name,
      email: form.email,
      employee_code: form.employee_code || null,
      is_admin: form.is_admin,
      auth_user_id: authData?.user?.id ?? null,
    });

    if (error) toast.error('เกิดข้อผิดพลาด: ' + error.message);
    else { toast.success('เพิ่มครูสำเร็จ'); setShowForm(false); load(); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบครูคนนี้?')) return;
    const supabase = createClient();
    await supabase.from('teachers').delete().eq('id', id);
    toast.success('ลบสำเร็จ');
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ครูและผู้ดูแลระบบ</h1>
          <p className="text-gray-500 mt-1">จัดการบัญชีครูในระบบ</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ เพิ่มครู</button>
      </div>

      {showForm && (
        <div className="card mb-6 max-w-lg">
          <h2 className="font-bold mb-4">เพิ่มครูใหม่</h2>
          <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded mb-4">
            💡 สร้างบัญชีใน Supabase Auth Dashboard แล้วนำ User ID มาใส่ หรือใช้ฟีเจอร์ Invite Users
          </p>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="label">ชื่อครู <span className="text-red-500">*</span></label>
              <input className="input" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">อีเมล</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">รหัสครู</label>
                <input className="input" value={form.employee_code} onChange={(e) => setForm(p => ({ ...p, employee_code: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_admin} onChange={(e) => setForm(p => ({ ...p, is_admin: e.target.checked }))} className="rounded" />
              <span className="text-sm">เป็นผู้ดูแลระบบ (Admin)</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>บันทึก</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อครู</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">อีเมล</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รหัสครู</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สิทธิ์</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-gray-500">{t.email ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.employee_code ?? '-'}</td>
                <td className="px-4 py-3">
                  {t.is_admin ? <span className="badge-normal">Admin</span> : <span className="text-gray-400 text-xs">ครู</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">ยังไม่มีครูในระบบ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
