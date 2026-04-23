'use client';
import { useState } from 'react';
import { SDQ_QUESTIONS, ANSWER_OPTIONS } from '@/lib/sdq/questions';
import { calculateSDQScores } from '@/lib/sdq/scoring';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { AssessorType } from '@/types';

interface Props {
  studentId: string;
  studentName: string;
  periodId: string;
  assessorType: AssessorType;
  assessorTeacherId?: string;
  assessorName?: string;
  onDone?: () => void;
}

export default function SDQForm({ studentId, studentName, periodId, assessorType, assessorTeacherId, assessorName, onDone }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isStudent = assessorType === 'student';
  const total = SDQ_QUESTIONS.length;
  const answered = Object.keys(answers).length;

  function setAnswer(q: number, v: number) {
    setAnswers(prev => ({ ...prev, [`q${q}`]: v }));
  }

  async function handleSubmit() {
    if (answered < total) {
      toast.error(`กรุณาตอบคำถามให้ครบทุกข้อ (${answered}/${total})`);
      return;
    }
    setSubmitting(true);
    const scores = calculateSDQScores(answers);
    const supabase = createClient();

    const payload = {
      student_id: studentId,
      period_id: periodId,
      assessor_type: assessorType,
      assessor_teacher_id: assessorTeacherId ?? null,
      assessor_name: assessorName ?? null,
      ...Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
      emotional_score: scores.emotional,
      conduct_score: scores.conduct,
      hyperactivity_score: scores.hyperactivity,
      peer_score: scores.peer,
      prosocial_score: scores.prosocial,
      total_difficulties: scores.total,
      status: scores.status,
    };

    const { error } = await supabase.from('assessments').insert(payload);
    if (error) {
      if (error.message.includes('unique') || error.code === '23505') {
        toast.error('ได้ทำการประเมินนักเรียนคนนี้ในรอบนี้ไปแล้ว');
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + error.message);
      }
      setSubmitting(false);
      return;
    }

    toast.success('บันทึกผลการประเมินสำเร็จ!');
    setDone(true);
    onDone?.();
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">บันทึกผลสำเร็จ</h2>
        <p className="text-gray-500">ขอบคุณที่ทำแบบประเมินสำหรับ {studentName}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>ความคืบหน้า</span>
          <span>{answered}/{total} ข้อ</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {SDQ_QUESTIONS.map((q) => {
          const key = `q${q.num}`;
          const text = isStudent ? q.text_student : q.text_teacher;
          const val = answers[key];
          return (
            <div key={q.num} className={`p-4 rounded-xl border transition ${val !== undefined ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                  {q.num}
                </span>
                <div className="flex-1">
                  <p className="text-gray-900 mb-3">{text}</p>
                  <div className="flex gap-2 flex-wrap">
                    {ANSWER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(q.num, opt.value)}
                        className={`px-4 py-1.5 rounded-full text-sm border transition ${
                          val === opt.value
                            ? 'bg-blue-700 text-white border-blue-700 font-medium'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          disabled={submitting || answered < total}
          className="btn-primary px-8 py-3 text-base"
        >
          {submitting ? 'กำลังบันทึก...' : '✅ ส่งแบบประเมิน'}
        </button>
        {answered < total && (
          <p className="text-sm text-gray-400 mt-2">กรุณาตอบให้ครบ {total} ข้อ</p>
        )}
      </div>
    </div>
  );
}
