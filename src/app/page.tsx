'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col">
      {/* Header */}
      <header className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
          <span className="text-4xl">🏫</span>
        </div>
        <h1 className="text-3xl font-bold text-white">ระบบประเมิน SDQ ออนไลน์</h1>
        <p className="text-blue-200 mt-2 text-lg">
          Strengths and Difficulties Questionnaire สำหรับโรงเรียนประถมศึกษา
        </p>
      </header>

      {/* Cards */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Teacher */}
          <Link href="/assess/teacher" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="text-4xl mb-4">👩‍🏫</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">ครูประเมิน</h2>
              <p className="text-gray-500 text-sm mb-4">
                สำหรับครูประจำชั้นประเมินพฤติกรรมนักเรียน
              </p>
              <div className="text-blue-700 font-medium text-sm group-hover:underline">
                เข้าสู่แบบประเมิน →
              </div>
            </div>
          </Link>

          {/* Parent */}
          <Link href="/assess/parent" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="text-4xl mb-4">👨‍👩‍👧</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">ผู้ปกครองประเมิน</h2>
              <p className="text-gray-500 text-sm mb-4">
                สำหรับผู้ปกครองประเมินพฤติกรรมบุตรหลาน
              </p>
              <div className="text-blue-700 font-medium text-sm group-hover:underline">
                เข้าสู่แบบประเมิน →
              </div>
            </div>
          </Link>

          {/* Student */}
          <Link href="/assess/student" className="group">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="text-4xl mb-4">🧒</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">นักเรียนประเมินตนเอง</h2>
              <p className="text-gray-500 text-sm mb-4">
                สำหรับนักเรียน ป.4-ป.6 ประเมินตนเอง
              </p>
              <div className="text-blue-700 font-medium text-sm group-hover:underline">
                เข้าสู่แบบประเมิน →
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Link */}
        <div className="mt-8 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 px-6 py-3 rounded-xl hover:bg-white/20 transition"
          >
            <span>⚙️</span>
            <span>เข้าสู่ระบบผู้ดูแล</span>
          </Link>
          <span className="mx-4 text-white/40">|</span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 px-6 py-3 rounded-xl hover:bg-white/20 transition"
          >
            <span>📊</span>
            <span>Dashboard รายงาน</span>
          </Link>
        </div>
      </main>

      <footer className="text-center text-blue-200/60 text-sm pb-6">
        ระบบประเมิน SDQ ออนไลน์ — อ้างอิงเกณฑ์กรมสุขภาพจิต กระทรวงสาธารณสุข
      </footer>
    </div>
  );
}
