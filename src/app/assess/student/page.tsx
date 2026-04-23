'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SDQForm from '@/components/SDQForm';
import type { Student, AssessmentPeriod } from '@/types';
import toast from 'react-hot-toast';

export default function StudentAssessPage() {
  const [studentCode, setStudentCode] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [period, setPeriod] = useState<AssessmentPeriod | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState<'input' | 'assess' | 'done'>('input');
  const [loading, setLoading] = useState(false);

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const [studentRes, periodRes] = await Promise.all([
      supabase.from('students').select('*, classroom:classrooms(grade,section)').eq('student_code', studentCode.trim().toUpperCase()).eq('is_active', true).single(),
      supabase.from('assessment_periods').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
    ]);

    if (studentRes.error || !studentRes.data) {
      toast.error('ไม่พบรหัสนักเรียน');
      setLoading(false);
      return;
    }

    const s = studentRes.data as unknown as Student & { classroom: { grade: number; section: string } };
    const classroom = s.classroom;

    // Only allow ป.4-ป.6
    if (!classroom || classroom.grade < 4) {
      toast.error('แบบประเมินตนเองสำหรับนักเรียนชั้น ป.4-ป.6 เท่านั้น');
      setLoading(false);
      return;
    }

    if (!periodRes.data) {
      toast.error('ขณะนี้ยังไม่ได้เปิดรับการประเมิน');
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from('assessments')
      .select('id')
      .eq('student_id', studentRes.data.id)
      .eq('period_id', periodRes.data.id)
      .eq('assessor_type', 'student')
      .single();

    setStudent(s);
    setPeriod(periodRes.data);
    if (existing) setAlreadyDone(true);
    setStep('assess');
    setLoading(false);
  }

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🧒</div>
            <h1 className="text-xl font-bold">แบบประเมินตนเอง</h1>
            <p className="text-gray-500 text-sm mt-1">สำหรับนักเรียน ป.4-ป.6</p>
          </div>
          <form onSubmit={handleFind} className="space-y-4">
            <div>
              <label className="label">รหัสนักเรียนของคุณ</label>
              <input
                className="input text-center font-mono text-2xl tracking-widest"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="P401001"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary w-full" style={{ backgroundColor: '#7c3aed' }} disabled={loading}>
              {loading ? 'กำลังค้นหา...' : 'เริ่มทำแบบประเมิน'}
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
          <h2 className="text-xl font-bold mb-2">ทำแบบประเมินไปแล้ว</h2>
          <p className="text-gray-500">คุณได้ทำแบบประเมินในรอบ {period?.name} ไปแล้ว</p>
          <button onClick={() => { setStep('input'); setAlreadyDone(false); setStudentCode(''); }} className="btn-primary mt-4">
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const classroom = student?.classroom as unknown as { grade: number; section: string };
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium mb-3">
          <span>🧒</span> แบบประเมินตนเอง
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          สวัสดี {student?.first_name} {student?.last_name}
        </h1>
        <p className="text-sm text-gray-500">
          ป.{classroom?.grade}/{classroom?.section} | รอบ: {period?.name}
        </p>
      </div>
      <div className="card mb-4 bg-purple-50 border-purple-100">
        <p className="text-sm text-purple-900">
          📌 ในแบบสอบถามนี้ จะมีคำถามเกี่ยวกับตัวเอง ให้ตอบตามความเป็นจริงมากที่สุด ไม่มีคำตอบที่ถูกหรือผิด
        </p>
      </div>
      <div className="card">
        <SDQForm
          studentId={student!.id}
          studentName={`${student!.first_name} ${student!.last_name}`}
          periodId={period!.id}
          assessorType="student"
          onDone={() => setStep('done')}
        />
      </div>
    </div>
  );
}
