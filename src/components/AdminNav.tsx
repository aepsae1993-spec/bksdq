'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin', label: 'หน้าหลัก', icon: '🏠' },
  { href: '/admin/school', label: 'ข้อมูลโรงเรียน', icon: '🏫' },
  { href: '/admin/classrooms', label: 'ห้องเรียน', icon: '🏛️' },
  { href: '/admin/students', label: 'นักเรียน', icon: '📚' },
  { href: '/admin/teachers', label: 'ครู / ผู้ดูแล', icon: '👩‍🏫' },
  { href: '/admin/periods', label: 'รอบประเมิน', icon: '📅' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/class', label: 'รายงานรายห้อง', icon: '📋' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('ออกจากระบบแล้ว');
    router.push('/admin/login');
  }

  return (
    <aside className="w-64 bg-blue-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-blue-800">
        <div className="text-white font-bold text-lg">🎓 SDQ Admin</div>
        <div className="text-blue-300 text-xs mt-1">ระบบประเมินสุขภาพจิต</div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white text-sm transition"
        >
          <span>🚪</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
