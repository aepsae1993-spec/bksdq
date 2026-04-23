'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Stats {
  students: number;
  classrooms: number;
  assessments: number;
  pending: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ students: 0, classrooms: 0, assessments: 0, pending: 0 });
  const [schoolName, setSchoolName] = useState('');
  const [activePeriod, setActivePeriod] = useState<string>('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [schoolRes, studentsRes, classroomsRes, assessmentsRes, periodRes] = await Promise.all([
        supabase.from('schools').select('name').limit(1).single(),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('classrooms').select('id', { count: 'exact', head: true }),
        supabase.from('assessments').select('id', { count: 'exact', head: true }),
        supabase.from('assessment_periods').select('name').eq('is_active', true).limit(1).single(),
      ]);
      if (schoolRes.data) setSchoolName(schoolRes.data.name);
      if (periodRes.data) setActivePeriod(periodRes.data.name);
      setStats({
        students: studentsRes.count ?? 0,
        classrooms: classroomsRes.count ?? 0,
        assessments: assessmentsRes.count ?? 0,
        pending: 0,
      });
    }
    load();
  }, []);

  const statCards = [
    { label: 'นักเรียนทั้งหมด', value: stats.students, icon: '👩‍🎓', color: 'bg-blue-50 border-blue-200', href: '/admin/students' },
    { label: 'ห้องเรียน', value: stats.classrooms, icon: '🏛️', color: 'bg-green-50 border-green-200', href: '/admin/classrooms' },
    { label: 'การประเมินทั้งหมด', value: stats.assessments, icon: '📝', color: 'bg-purple-50 border-purple-200', href: '/dashboard' },
    { label: 'รอบที่เปิดใช้งาน', value: activePeriod || '-', icon: '📅', color: 'bg-orange-50 border-orange-200', href: '/admin/periods' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {schoolName || 'ระบบ SDQ ออนไลน์'}
        </h1>
        <p className="text-gray-500 mt-1">แผงควบคุมผู้ดูแลระบบ</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className={`card border ${card.color} hover:shadow-md transition cursor-pointer`}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-600 mt-1">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card mb-6">
        <h2 className="font-bold text-gray-900 mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/students" className="btn-primary text-center text-sm">+ เพิ่มนักเรียน</Link>
          <Link href="/admin/periods" className="btn-secondary text-center text-sm">จัดการรอบประเมิน</Link>
          <Link href="/dashboard" className="btn-secondary text-center text-sm">ดู Dashboard</Link>
          <Link href="/assess/teacher" className="btn-secondary text-center text-sm">แบบประเมินครู</Link>
        </div>
      </div>

      {/* Assessment Links */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">ลิงก์แบบประเมิน</h2>
        <p className="text-gray-500 text-sm mb-4">แชร์ลิงก์ด้านล่างให้ผู้ปกครองและนักเรียน</p>
        <div className="space-y-3">
          {[
            { label: 'แบบประเมินผู้ปกครอง', path: '/assess/parent', icon: '👨‍👩‍👧' },
            { label: 'แบบประเมินนักเรียน (ป.4-ป.6)', path: '/assess/student', icon: '🧒' },
          ].map((link) => (
            <div key={link.path} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2 text-sm">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + link.path);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                คัดลอกลิงก์
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
