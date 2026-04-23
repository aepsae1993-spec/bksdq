'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_LABEL, SUBSCALE_LABELS } from '@/lib/sdq/scoring';
import Link from 'next/link';
import type { AssessmentPeriod, Assessment } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  normal: '#16a34a',
  borderline: '#d97706',
  abnormal: '#dc2626',
};

interface DashData {
  total: number;
  byStatus: { name: string; value: number; color: string }[];
  bySubscale: { name: string; เฉลี่ย: number }[];
  assessorBreakdown: Record<string, { normal: number; borderline: number; abnormal: number }>;
}

export default function DashboardPage() {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPeriods() {
      const supabase = createClient();
      const { data } = await supabase.from('assessment_periods').select('*').order('created_at', { ascending: false });
      setPeriods(data ?? []);
      if (data?.[0]) { setSelectedPeriod(data[0].id); }
    }
    loadPeriods();
  }, []);

  useEffect(() => {
    if (!selectedPeriod) return;
    setLoading(true);
    async function loadData() {
      const supabase = createClient();
      const { data: assessments } = await supabase.from('assessments').select('*').eq('period_id', selectedPeriod);
      if (!assessments) { setLoading(false); return; }

      const total = assessments.length;
      const statusCounts = { normal: 0, borderline: 0, abnormal: 0 };
      const subscaleSum = { emotional: 0, conduct: 0, hyperactivity: 0, peer: 0, prosocial: 0 };
      const assessorBreakdown: Record<string, { normal: number; borderline: number; abnormal: number }> = {
        teacher: { normal: 0, borderline: 0, abnormal: 0 },
        parent: { normal: 0, borderline: 0, abnormal: 0 },
        student: { normal: 0, borderline: 0, abnormal: 0 },
      };

      assessments.forEach((a: Assessment) => {
        const s = a.status ?? 'normal';
        statusCounts[s as keyof typeof statusCounts]++;
        subscaleSum.emotional += a.emotional_score ?? 0;
        subscaleSum.conduct += a.conduct_score ?? 0;
        subscaleSum.hyperactivity += a.hyperactivity_score ?? 0;
        subscaleSum.peer += a.peer_score ?? 0;
        subscaleSum.prosocial += a.prosocial_score ?? 0;
        if (assessorBreakdown[a.assessor_type]) {
          assessorBreakdown[a.assessor_type][s as keyof typeof statusCounts]++;
        }
      });

      const n = total || 1;
      setData({
        total,
        byStatus: [
          { name: 'ปกติ', value: statusCounts.normal, color: STATUS_COLORS.normal },
          { name: 'เสี่ยง', value: statusCounts.borderline, color: STATUS_COLORS.borderline },
          { name: 'มีปัญหา', value: statusCounts.abnormal, color: STATUS_COLORS.abnormal },
        ],
        bySubscale: Object.entries(subscaleSum).map(([k, v]) => ({
          name: SUBSCALE_LABELS[k as keyof typeof SUBSCALE_LABELS],
          เฉลี่ย: parseFloat((v / n).toFixed(2)),
        })),
        assessorBreakdown,
      });
      setLoading(false);
    }
    loadData();
  }, [selectedPeriod]);

  const pct = (v: number) => data?.total ? `${Math.round((v / data.total) * 100)}%` : '0%';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard ภาพรวมโรงเรียน</h1>
          <p className="text-gray-500 mt-1">สรุปผลการประเมิน SDQ</p>
        </div>
        <Link href="/dashboard/class" className="btn-secondary text-sm">📋 ดูรายห้อง →</Link>
      </div>

      {/* Period Selector */}
      <div className="card mb-6">
        <label className="label">เลือกรอบประเมิน</label>
        <select className="input max-w-sm" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
          {periods.map(p => <option key={p.id} value={p.id}>{p.name}{p.is_active ? ' (เปิดอยู่)' : ''}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">กำลังโหลดข้อมูล...</div>}

      {data && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-3xl font-bold text-gray-900">{data.total}</div>
              <div className="text-sm text-gray-500 mt-1">การประเมินทั้งหมด</div>
            </div>
            {data.byStatus.map(s => (
              <div key={s.name} className="card text-center border-l-4" style={{ borderColor: s.color }}>
                <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.name} ({pct(s.value)})</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">สัดส่วนผลการประเมิน</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">คะแนนเฉลี่ยแต่ละด้าน</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.bySubscale}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="เฉลี่ย" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assessor Breakdown */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">สรุปแยกตามผู้ประเมิน</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">ผู้ประเมิน</th>
                    <th className="text-center py-2 px-3 font-medium text-green-700">ปกติ</th>
                    <th className="text-center py-2 px-3 font-medium text-yellow-700">เสี่ยง</th>
                    <th className="text-center py-2 px-3 font-medium text-red-700">มีปัญหา</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.assessorBreakdown).map(([type, counts]) => {
                    const total = counts.normal + counts.borderline + counts.abnormal;
                    if (total === 0) return null;
                    const labels: Record<string, string> = { teacher: '👩‍🏫 ครู', parent: '👨‍👩‍👧 ผู้ปกครอง', student: '🧒 นักเรียน' };
                    return (
                      <tr key={type} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">{labels[type]}</td>
                        <td className="text-center py-2 px-3 text-green-700 font-medium">{counts.normal}</td>
                        <td className="text-center py-2 px-3 text-yellow-700 font-medium">{counts.borderline}</td>
                        <td className="text-center py-2 px-3 text-red-700 font-medium">{counts.abnormal}</td>
                        <td className="text-center py-2 px-3 text-gray-700">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {data?.total === 0 && !loading && (
        <div className="card text-center py-12 text-gray-400">ยังไม่มีข้อมูลการประเมินในรอบนี้</div>
      )}
    </div>
  );
}
