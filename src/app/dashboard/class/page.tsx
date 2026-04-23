'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { AssessmentPeriod, Student, Assessment, Classroom } from '@/types';
import { STATUS_LABEL, STATUS_COLOR, ASSESSOR_LABELS } from '@/lib/sdq/scoring';

interface StudentRow {
  student: Student;
  assessments: Record<string, Assessment>;
}

export default function ClassDashboardPage() {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [perRes, classRes] = await Promise.all([
        supabase.from('assessment_periods').select('*').order('created_at', { ascending: false }),
        supabase.from('classrooms').select('*').order('grade').order('section'),
      ]);
      setPeriods(perRes.data ?? []);
      setClassrooms(classRes.data ?? []);
      if (perRes.data?.[0]) setSelectedPeriod(perRes.data[0].id);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedPeriod || !selectedClassroom) return;
    setLoading(true);
    async function load() {
      const supabase = createClient();
      const [studentsRes, assessmentsRes] = await Promise.all([
        supabase.from('students').select('*').eq('classroom_id', selectedClassroom).eq('is_active', true).order('student_code'),
        supabase.from('assessments').select('*').eq('period_id', selectedPeriod),
      ]);
      const students = (studentsRes.data ?? []) as Student[];
      const assessments = (assessmentsRes.data ?? []) as Assessment[];
      const byStudent: Record<string, Record<string, Assessment>> = {};
      assessments.forEach(a => {
        if (!byStudent[a.student_id]) byStudent[a.student_id] = {};
        byStudent[a.student_id][a.assessor_type] = a;
      });
      setRows(students.map(s => ({ student: s, assessments: byStudent[s.id] ?? {} })));
      setLoading(false);
    }
    load();
  }, [selectedPeriod, selectedClassroom]);

  const filtered = rows.filter(r => {
    if (!filterStatus) return true;
    return Object.values(r.assessments).some(a => a.status === filterStatus);
  });

  const classroom = classrooms.find(c => c.id === selectedClassroom);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard รายห้อง</h1>
          <p className="text-gray-500 mt-1">ตารางรายชื่อนักเรียนพร้อมผลประเมิน</p>
        </div>
        <Link href="/dashboard" className="btn-secondary text-sm">← ภาพรวม</Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">รอบประเมิน</label>
            <select className="input" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ห้องเรียน</label>
            <select className="input" value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)}>
              <option value="">-- เลือกห้อง --</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>ป.{c.grade}/{c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="label">กรองสถานะ</label>
            <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="normal">ปกติ</option>
              <option value="borderline">เสี่ยง</option>
              <option value="abnormal">มีปัญหา</option>
            </select>
          </div>
        </div>
      </div>

      {selectedClassroom && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            {classroom ? `ชั้น ป.${classroom.grade}/${classroom.section}` : ''} — {filtered.length} คน
          </h2>
          <div className="flex gap-2 text-xs">
            {['normal', 'borderline', 'abnormal'].map(s => (
              <span key={s} className={`px-2 py-1 rounded-full border ${STATUS_COLOR[s as keyof typeof STATUS_COLOR]}`}>
                {STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="card text-center py-8 text-gray-400">กำลังโหลด...</div>}

      {!loading && selectedClassroom && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส / ชื่อ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">👩‍🏫 ครู</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">👨‍👩‍👧 ผู้ปกครอง</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">🧒 นักเรียน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(({ student, assessments }) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-gray-400">{student.student_code}</div>
                    <div className="font-medium">{student.first_name} {student.last_name}</div>
                  </td>
                  {(['teacher', 'parent', 'student'] as const).map(type => {
                    const a = assessments[type];
                    return (
                      <td key={type} className="text-center px-4 py-3">
                        {a ? (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs border ${STATUS_COLOR[a.status ?? 'normal']}`}>
                            {STATUS_LABEL[a.status ?? 'normal']}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/individual/${student.id}?period=${selectedPeriod}`} className="text-blue-600 text-xs hover:underline">
                      รายงาน →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedClassroom && (
        <div className="card text-center py-12 text-gray-400">กรุณาเลือกห้องเรียน</div>
      )}
    </div>
  );
}
