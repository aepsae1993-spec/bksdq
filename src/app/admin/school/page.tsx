'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { School } from '@/types';

export default function SchoolPage() {
  const [school, setSchool] = useState<School | null>(null);
  const [form, setForm] = useState({ name: '', address: '', district: '', province: '', affiliation: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('schools').select('*').limit(1).single();
      if (data) {
        setSchool(data);
        setForm({ name: data.name, address: data.address ?? '', district: data.district ?? '', province: data.province ?? '', affiliation: data.affiliation ?? '', phone: data.phone ?? '' });
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    if (school) {
      const { error } = await supabase.from('schools').update(form).eq('id', school.id);
      if (error) toast.error('เกิดข้อผิดพลาด');
      else toast.success('บันทึกข้อมูลสำเร็จ');
    } else {
      const { data, error } = await supabase.from('schools').insert(form).select().single();
      if (error) toast.error('เกิดข้อผิดพลาด');
      else { setSchool(data); toast.success('สร้างข้อมูลโรงเรียนสำเร็จ'); }
    }
    setLoading(false);
  }

  const fields = [
    { key: 'name', label: 'ชื่อโรงเรียน', required: true },
    { key: 'address', label: 'ที่อยู่' },
    { key: 'district', label: 'เขตพื้นที่การศึกษา' },
    { key: 'province', label: 'จังหวัด' },
    { key: 'affiliation', label: 'สังกัด (เช่น สพป./สช.)' },
    { key: 'phone', label: 'เบอร์โทรศัพท์' },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ข้อมูลโรงเรียน</h1>
      <p className="text-gray-500 mb-6">กำหนดข้อมูลพื้นฐานของโรงเรียน</p>
      <form onSubmit={handleSave} className="card space-y-4">
        {fields.map(({ key, label, required }) => (
          <div key={key}>
            <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
            <input
              className="input"
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              required={required}
            />
          </div>
        ))}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
        </button>
      </form>
    </div>
  );
}
