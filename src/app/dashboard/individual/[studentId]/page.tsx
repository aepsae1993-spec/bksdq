'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { assessmentToScores, STATUS_LABEL, STATUS_COLOR, STATUS_DOT, SUBSCALE_LABELS, ASSESSOR_LABELS } from '@/lib/sdq/scoring';
import Link from 'next/link';
import type { Student, Assessment, Classroom } from '@/types';

export default function IndividualReportPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const periodId = searchParams.get('period') ?? '';

  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [sRes, aRes] = await Promise.all([
        supabase.from('students').select('*, classroom:classrooms(grade,section)').eq('id', studentId).single(),
        supabase.from('assessments').select('*').eq('student_id', studentId).eq('period_id', periodId),
      ]);
      setStudent(sRes.data as unknown as Student);
      setAssessments(aRes.data ?? []);
      setLoading(false);
    }
    if (studentId && periodId) load();
  }, [studentId, periodId]);

  async function handleExportPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('SDQ Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Student: ${student?.first_name} ${student?.last_name} (${student?.student_code})`, 14, 32);
    const rows = assessments.map(a => {
      const s = assessmentToScores(a);
      return [
        ASSESSOR_LABELS[a.assessor_type],
        s?.emotional ?? '-', s?.conduct ?? '-', s?.hyperactivity ?? '-', s?.peer ?? '-', s?.prosocial ?? '-', s?.total ?? '-',
        STATUS_LABEL[a.status ?? 'normal'],
      ];
    });
    autoTable(doc, {
      startY: 40,
      head: [['ผู้ประเมิน', 'อารมณ์', 'พฤติกรรม', 'สมาธิ', 'เพื่อน', 'สังคม', 'รวม', 'สถานะ']],
      body: rows,
    });
    doc.save(`SDQ_${student?.student_code}.pdf`);
  }

  const radarData = (() => {
    const subscales: (keyof typeof SUBSCALE_LABELS)[] = ['emotional', 'conduct', 'hyperactivity', 'peer', 'prosocial'];
    return subscales.map(key => {
      const entry: Record<string, string | number> = { subject: SUBSCALE_LABELS[key] };
      assessments.forEach(a => {
        const s = assessmentToScores(a);
        if (s) entry[ASSESSOR_LABELS[a.assessor_type]] = s[key];
      });
      return entry;
    });
  })();

  const RADAR_COLORS = ['#3b82f6', '#16a34a', '#7c3aed'];

  const classroom = student?.classroom as unknown as { grade: number; section: string } | undefined;

  if (loading) return <div className="p-8 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/class" className="text-blue-600 text-sm hover:underline">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {student?.first_name} {student?.last_name}
          </h1>
          <p className="text-gray-500 text-sm">
            {student?.student_code} | ป.{classroom?.grade}/{classroom?.section}
          </p>
        </div>
        <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
          <span>📄</span> Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {(['teacher', 'parent', 'student'] as const).map(type => {
          const a = assessments.find(x => x.assessor_type === type);
          const scores = a ? assessmentToScores(a) : null;
          return (
            <div key={type} className={`card border ${a ? `border-l-4 ${a.status === 'normal' ? 'border-green-400' : a.status === 'borderline' ? 'border-yellow-400' : 'border-red-400'}` : 'border-gray-200 opacity-60'}`}>
              <div className="text-sm font-medium text-gray-600 mb-2">{ASSESSOR_LABELS[type]}</div>
              {scores ? (
                <>
                  <div className="text-3xl font-bold text-gray-900">{scores.total}</div>
                  <div className="text-xs text-gray-500">คะแนนรวม (Total Difficulties)</div>
                  <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${STATUS_COLOR[scores.status]}`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[scores.status]}`}></span>
                    {STATUS_LABEL[scores.status]}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-sm mt-2">ยังไม่ได้ประเมิน</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Radar Chart */}
      {assessments.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-bold text-gray-900 mb-4">เปรียบเทียบคะแนน 5 ด้าน (Triangulation)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip />
              {assessments.map((a, i) => (
                <Radar
                  key={a.id}
                  name={ASSESSOR_LABELS[a.assessor_type]}
                  dataKey={ASSESSOR_LABELS[a.assessor_type]}
                  stroke={RADAR_COLORS[i]}
                  fill={RADAR_COLORS[i]}
                  fillOpacity={0.15}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            {assessments.map((a, i) => (
              <div key={a.id} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: RADAR_COLORS[i] }}></span>
                {ASSESSOR_LABELS[a.assessor_type]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Table */}
      {assessments.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ด้าน</th>
                {assessments.map(a => (
                  <th key={a.id} className="text-center px-4 py-3 font-medium text-gray-600">{ASSESSOR_LABELS[a.assessor_type]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(SUBSCALE_LABELS) as (keyof typeof SUBSCALE_LABELS)[]).map(key => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{SUBSCALE_LABELS[key]}</td>
                  {assessments.map(a => {
                    const s = assessmentToScores(a);
                    const val = s?.[key] ?? 0;
                    const status = s?.subscaleStatuses[key] ?? 'normal';
                    return (
                      <td key={a.id} className="text-center px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs border ${STATUS_COLOR[status]}`}>{val}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">คะแนนรวม (Total)</td>
                {assessments.map(a => {
                  const s = assessmentToScores(a);
                  return (
                    <td key={a.id} className="text-center px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs border ${STATUS_COLOR[s?.status ?? 'normal']}`}>{s?.total ?? 0}</span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {assessments.length === 0 && (
        <div className="card text-center py-8 text-gray-400">ยังไม่มีผลการประเมินในรอบนี้</div>
      )}
    </div>
  );
}
