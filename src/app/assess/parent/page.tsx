'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SDQForm from '@/components/SDQForm';
import type { Student, AssessmentPeriod } from '@/types';
import toast from 'react-hot-toast';

export default function ParentAssessPage() {
  const [studentCode, setStudentCode] = useState('');
  const [parentName, setParentName] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [period, setPeriod] = useState<AssessmentPeriod | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState<'input' | 'assess' | 'done'>('input');
  const [loading, setLoading] = useState(false);

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    if (!parentName.trim()) { toast.error('กรุณากรอกชื่อผู้ปกครอง'); return; }
    setLoading(true);
    const supabase = createClient();
    const [studentRes, periodRes] = await Promise.all([
      supabase.from('students').select('*, classroom:classrooms(grade,section)').eq('student_code', studentCode.trim().toUpperCase()).eq('is_active', true).single(),
      supabase.from('assessment_periods').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
    ]);

    if (studentRes.error || !studentRes.data) {
      toast.error('ไม่พบรหัสนักเรียน กรุณาตรวจสอบอีกครั้ง');
      setLoading(false);
      return;
    }
    if (!periodRes.data) {
      toast.error('ขณะนี้ยังไม่ได้เปิดรับการประเมิน');
      setLoading(false);
      return;
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('assessments')
      .select('id')
      .eq('student_id', studentRes.data.id)
      .eq('period_id', periodRes.data.id)
      .eq('assessor_type', 'parent')
      .single();

    setStudent(studentRes.data as unknown as Student);
    setPeriod(periodRes.data);
    if (existing) { setAlreadyDone(true); }
    setStep('assess');
    setLoading(false);
  }

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👨‍👩‍👧</div>
            <h1 className="text-xl font-bold">แบบประเมินผู้ปกครอง</h1>
            <p className="text-gray-500 text-sm mt-1">ประเมินพฤติกรรมและพัฒนาการบุตรหลาน</p>
          </div>
          <form onSubmit={handleFind} className="space-y-4">
            <div>
              <label className="label">รหัสนักเรียน <span className="text-red-500">*</span></label>
              <input
                className="input text-center font-mono text-lg tracking-widest"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="P101001"
                required
              />
              <p className="text-xs text-gray-400 mt-1">รหัสอยู่ในเอกสารที่โรงเรียนส่งมา</p>
            </div>
            <div>
              <label className="label">ชื่อผู้ปกครอง <span className="text-red-500">*</span></label>
              <input
                className="input"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="เช่น นายสมชาย ใจดี"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" style={{ backgroundColor: '#16a34a' }} disabled={loading}>
              {loading ? 'กำลังค้นหา...' : 'ยืนยันและเริ่มประเมิน'}
            </button>
          </form>
          <div className="mt-4 text-center"><a href="/" className="text-sm text-gray-400 hover:underline">← กลับหน้าแรก</a></div>
        </div>
      </div>
    );
  }

  if (alreadyDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ท่านได้ทำแบบประเมินไปแล้ว</h2>
          <p className="text-gray-500">การประเมินบุตรหลาน {student?.first_name} {student?.last_name} ในรอบ {period?.name} บันทึกไว้แล้ว</p>
          <button onClick={() => { setStep('input'); setAlreadyDone(false); setStudentCode(''); }} className="btn-primary mt-4">
            ประเมินนักเรียนอีกคน
          </button>
        </div>
      </div>
    );
  }

  const classroom = student?.classroom as unknown as { grade: number; section: string };
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium mb-3">
          <span>👨‍👩‍👧</span> แบบประเมินผู้ปกครอง
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          ประเมิน: {student?.first_name} {student?.last_name}
        </h1>
        <p className="text-sm text-gray-500">
          รหัส {student?.student_code} | ป.{classroom?.grade}/{classroom?.section} | รอบ: {period?.name}
        </p>
        <p className="text-sm text-gray-500 mt-1">ผู้ประเมิน: {parentName}</p>
      </div>
      <div className="card">
        <SDQForm
          studentId={student!.id}
          studentName={`${student!.first_name} ${student!.last_name}`}
          periodId={period!.id}
          assessorType="parent"
          assessorName={parentName}
          onDone={() => setStep('done')}
        />
      </div>
    </div>
  );
}
