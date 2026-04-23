export type AssessorType = 'teacher' | 'parent' | 'student';
export type Status = 'normal' | 'borderline' | 'abnormal';

export interface School {
  id: string;
  name: string;
  address?: string;
  district?: string;
  province?: string;
  affiliation?: string;
  phone?: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  auth_user_id?: string;
  name: string;
  employee_code?: string;
  email?: string;
  is_admin: boolean;
  created_at: string;
}

export interface Classroom {
  id: string;
  school_id: string;
  grade: number;
  section: string;
  teacher_id?: string;
  teacher?: Teacher;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  classroom_id?: string;
  student_code: string;
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F';
  birth_date?: string;
  parent_contact?: string;
  is_active: boolean;
  created_at: string;
  classroom?: Classroom;
}

export interface AssessmentPeriod {
  id: string;
  school_id: string;
  name: string;
  academic_year?: number;
  semester?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface Assessment {
  id: string;
  student_id: string;
  period_id: string;
  assessor_type: AssessorType;
  assessor_teacher_id?: string;
  assessor_name?: string;
  q1?: number; q2?: number; q3?: number; q4?: number; q5?: number;
  q6?: number; q7?: number; q8?: number; q9?: number; q10?: number;
  q11?: number; q12?: number; q13?: number; q14?: number; q15?: number;
  q16?: number; q17?: number; q18?: number; q19?: number; q20?: number;
  q21?: number; q22?: number; q23?: number; q24?: number; q25?: number;
  emotional_score?: number;
  conduct_score?: number;
  hyperactivity_score?: number;
  peer_score?: number;
  prosocial_score?: number;
  total_difficulties?: number;
  status?: Status;
  submitted_at: string;
  student?: Student;
  period?: AssessmentPeriod;
}

export interface SDQScores {
  emotional: number;
  conduct: number;
  hyperactivity: number;
  peer: number;
  prosocial: number;
  total: number;
  status: Status;
  subscaleStatuses: {
    emotional: Status;
    conduct: Status;
    hyperactivity: Status;
    peer: Status;
    prosocial: Status;
  };
}

export interface Notification {
  id: string;
  school_id: string;
  teacher_id: string;
  student_id: string;
  period_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  student?: Student;
}
