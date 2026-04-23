# ระบบประเมิน SDQ ออนไลน์

ระบบประเมินสุขภาพจิตนักเรียนด้วย SDQ (Strengths and Difficulties Questionnaire) สำหรับโรงเรียนประถมศึกษา ป.1-ป.6

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Deploy**: Vercel

## ขั้นตอนการตั้งค่า

### 1. สร้างโปรเจค Supabase
1. ไปที่ [supabase.com](https://supabase.com) → สร้าง Project ใหม่
2. ไปที่ **SQL Editor** → วางเนื้อหาจากไฟล์ `supabase/schema.sql` แล้วรัน
3. คัดลอก **Project URL** และ **anon key** จาก Settings > API

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` (หรือตั้งใน Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 3. รันโปรเจคในเครื่อง
```bash
npm install
npm run dev
```
เปิด http://localhost:3000

### 4. Deploy ที่ Vercel
1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → Import Repository
3. เพิ่ม Environment Variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. กด Deploy

## โครงสร้างหน้า
| หน้า | คำอธิบาย |
|------|----------|
| `/` | หน้าแรก - ลิงก์แบบประเมิน |
| `/admin` | Dashboard ผู้ดูแล |
| `/admin/school` | ข้อมูลโรงเรียน |
| `/admin/classrooms` | จัดการห้องเรียน |
| `/admin/students` | จัดการนักเรียน |
| `/admin/teachers` | จัดการครู |
| `/admin/periods` | รอบการประเมิน |
| `/assess/teacher` | แบบประเมินครู (ต้อง login) |
| `/assess/parent` | แบบประเมินผู้ปกครอง (public) |
| `/assess/student` | แบบประเมินนักเรียน ป.4-6 (public) |
| `/dashboard` | Dashboard ภาพรวมโรงเรียน |
| `/dashboard/class` | Dashboard รายห้อง |
| `/dashboard/individual/[id]` | รายงานรายบุคคล + Export PDF |

## รหัสนักเรียน
รูปแบบ: `P[ชั้น][ห้อง][เลขที่]`
- ป.1/1 เลขที่ 1 → `P101001`
- ป.4/2 เลขที่ 15 → `P402015`

## การ import นักเรียนจาก CSV
รูปแบบ header:
```
student_code,first_name,last_name,gender,grade,section,parent_contact
P101001,สมชาย,ใจดี,M,1,1,0812345678
```
