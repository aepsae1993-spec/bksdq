'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SDQForm from '@/components/SDQForm';
import type { Student, AssessmentPeriod, Classroom, Teacher } from '@/types';
import toast from 'react-hot-toast';

export default function TeacherAssessPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activePeriod, setActivePeriod] = useState<AssessmentPeriod | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'login' | 'select' | 'assess'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !authData.user) {
      toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      setLoading(false);
      return;
    }
    const { data: teacherData } = await supabase.from('teachers').select('*').eq('auth_user_id', authData.user.id).single();
    if (!teacherData) {
      toast.error('ไม่พบข้อมูลครูในระบบ');
      setLoading(false);
      return;
    }
    setTeacher(teacherData);

    // Load active period and classrooms
    const [periodRes, classRes] = await Promise.all([
      supabase.from('assessment_periods').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('classrooms').select('*').eq('school_id', teacherData.school_id).order('grade').order('section'),
    ]);
    if (!periodRes.data) { toast.error('ไม่มีรอบประเมินที่เปิดอยู่ กรุณาติดต่อผู้ดูแลระบบ'); setLoading(false); return; }
    setActivePeriod(periodRes.data);
    setClassrooms(classRes.data ?? []);
    setStep('select');
    setLoading(false);
  }

  async function loadStudents(classroomId: string) {
    if (!classroomId || !activePeriod) return;
    setSelectedClassroom(classroomId);
    const supabase = createClient();
    const [studentsRes, doneRes] = await Promise.all([
      supabase.from('students').select('*').eq('classroom_id', classroomId).eq('is_active', true).order('student_code'),
      supabase.from('assessments').select('student_id').eq('period_id', activePeriod.id).eq('assessor_type', 'teacher'),
    ]);
    setStudents(studentsRes.data ?? []);
    setDone(new Set((doneRes.data ?? []).map((a) => a.student_id)));
  }

  function selectStudent(s: Student) {
    if (done.has(s.id)) { toast('ประเมินนักเรียนคนนี้ไปแล้ว'); return; }
    setSelectedStudent(s);
    setStep('assess');
  }

  function onDone() {
    if (selectedStudent) {
      setDone(prev => new Set(Array.from(prev).concat(selectedStudent.id)));
    }
    setSelectedStudent(null);
    setStep('select');
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👩‍🏫</div>
            <h1 className="text-xl font-bold">แบบประเมินครู</h1>
            <p className="text-gray-500 text-sm mt-1">กรุณาเข้าสู่ระบบด้วยบัญชีครู</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">อีเมล</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <div className="mt-4 text-center"><a href="/" className="text-sm text-blue-600 hover:underline">← กลับ</a></div>
        </div>
      </div>
    );
  }

  if (step === 'select') {
    const remaining = students.filter(s => !done.has(s.id)).length;
    return (
      <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">แบบประเมินครู</h1>
          <p className="text-gray-500 text-sm">สวัสดี {teacher?.name} | รอบ: {activePeriod?.name}</p>
        </div>

        <div className="card mb-4">
          <label className="label">เลือกห้องเรียน</label>
          <select className="input" value={selectedClassroom} onChange={(e) => loadStudents(e.target.value)}>
            <option value="">-- เลือกห้องเรียน --</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>ป.{c.grade}/{c.section}</option>)}
          </select>
        </div>

        {selectedClassroom && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">รายชื่อนักเรียน</h2>
              <span className="text-sm text-gray-500">เหลือ {remaining}/{students.length} คน</span>
            </div>
            <div className="space-y-2">
              {students.map(s => {
                const isDone = done.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                      isDone
                        ? 'bg-green-50 border-green-200 opacity-70 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-gray-400">{s.student_code}</span>
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                    </div>
                    {isDone ? (
                      <span className="text-green-600 text-sm">✓ ประเมินแล้ว</span>
                    ) : (
                      <span className="text-blue-600 text-sm">ประเมิน →</span>
                    )}
                  </button>
                );
              })}
              {students.length === 0 && <p className="text-gray-400 text-center py-4">ไม่พบนักเรียนในห้องนี้</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setStep('select'); setSelectedStudent(null); }} className="text-blue-600 hover:underline text-sm">← กลับ</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ประเมิน: {selectedStudent?.first_name} {selectedStudent?.last_name}</h1>
          <p className="text-sm text-gray-500">รหัส {selectedStudent?.student_code} | ครู: {teacher?.name}</p>
        </div>
      </div>
      <div className="card">
        <SDQForm
          studentId={selectedStudent!.id}
          studentName={`${selectedStudent!.first_name} ${selectedStudent!.last_name}`}
          periodId={activePeriod!.id}
          assessorType="teacher"
          assessorTeacherId={teacher?.id}
          assessorName={teacher?.name}
          onDone={onDone}
        />
      </div>
    </div>
  );
}
