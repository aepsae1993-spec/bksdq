import type { Assessment, SDQScores, Status } from '@/types';

// Items that are reverse-scored (score = 2 - raw)
const REVERSE_ITEMS = [7, 11, 14, 21, 25];

// Subscale item numbers
const SUBSCALES = {
  emotional: [3, 8, 13, 16, 24],
  conduct: [5, 7, 12, 18, 22],
  hyperactivity: [2, 10, 15, 21, 25],
  peer: [6, 11, 14, 19, 23],
  prosocial: [1, 4, 9, 17, 20],
};

// Cutoffs (กรมสุขภาพจิต)
const CUTOFFS = {
  total: { borderline: 15, abnormal: 18 },
  emotional: { borderline: 5, abnormal: 6 },
  conduct: { borderline: 3, abnormal: 4 },
  hyperactivity: { borderline: 6, abnormal: 7 },
  peer: { borderline: 3, abnormal: 4 },
  // Prosocial: lower = worse
  prosocial: { borderline: 5, normal_min: 6 },
};

function getScore(raw: number, questionNum: number): number {
  if (REVERSE_ITEMS.includes(questionNum)) {
    return 2 - raw;
  }
  return raw;
}

function getStatus(score: number, scale: keyof typeof CUTOFFS): Status {
  if (scale === 'prosocial') {
    if (score >= CUTOFFS.prosocial.normal_min) return 'normal';
    if (score >= CUTOFFS.prosocial.borderline) return 'borderline';
    return 'abnormal';
  }
  const cut = CUTOFFS[scale as Exclude<keyof typeof CUTOFFS, 'prosocial'>];
  if (score < cut.borderline) return 'normal';
  if (score < cut.abnormal) return 'borderline';
  return 'abnormal';
}

export function calculateSDQScores(answers: Record<string, number>): SDQScores {
  const scored: Record<number, number> = {};
  for (let i = 1; i <= 25; i++) {
    const raw = answers[`q${i}`] ?? 0;
    scored[i] = getScore(raw, i);
  }

  const emotional = SUBSCALES.emotional.reduce((sum, q) => sum + scored[q], 0);
  const conduct = SUBSCALES.conduct.reduce((sum, q) => sum + scored[q], 0);
  const hyperactivity = SUBSCALES.hyperactivity.reduce((sum, q) => sum + scored[q], 0);
  const peer = SUBSCALES.peer.reduce((sum, q) => sum + scored[q], 0);
  const prosocial = SUBSCALES.prosocial.reduce((sum, q) => sum + scored[q], 0);
  const total = emotional + conduct + hyperactivity + peer;

  return {
    emotional,
    conduct,
    hyperactivity,
    peer,
    prosocial,
    total,
    status: getStatus(total, 'total'),
    subscaleStatuses: {
      emotional: getStatus(emotional, 'emotional'),
      conduct: getStatus(conduct, 'conduct'),
      hyperactivity: getStatus(hyperactivity, 'hyperactivity'),
      peer: getStatus(peer, 'peer'),
      prosocial: getStatus(prosocial, 'prosocial'),
    },
  };
}

export function assessmentToScores(a: Assessment): SDQScores | null {
  if (a.total_difficulties === undefined || a.total_difficulties === null) return null;
  return {
    emotional: a.emotional_score ?? 0,
    conduct: a.conduct_score ?? 0,
    hyperactivity: a.hyperactivity_score ?? 0,
    peer: a.peer_score ?? 0,
    prosocial: a.prosocial_score ?? 0,
    total: a.total_difficulties,
    status: a.status ?? 'normal',
    subscaleStatuses: {
      emotional: getStatus(a.emotional_score ?? 0, 'emotional'),
      conduct: getStatus(a.conduct_score ?? 0, 'conduct'),
      hyperactivity: getStatus(a.hyperactivity_score ?? 0, 'hyperactivity'),
      peer: getStatus(a.peer_score ?? 0, 'peer'),
      prosocial: getStatus(a.prosocial_score ?? 0, 'prosocial'),
    },
  };
}

export const STATUS_LABEL: Record<Status, string> = {
  normal: 'ปกติ',
  borderline: 'เสี่ยง',
  abnormal: 'มีปัญหา',
};

export const STATUS_COLOR: Record<Status, string> = {
  normal: 'bg-green-100 text-green-800 border-green-300',
  borderline: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  abnormal: 'bg-red-100 text-red-800 border-red-300',
};

export const STATUS_DOT: Record<Status, string> = {
  normal: 'bg-green-500',
  borderline: 'bg-yellow-500',
  abnormal: 'bg-red-500',
};

export const SUBSCALE_LABELS = {
  emotional: 'อารมณ์',
  conduct: 'พฤติกรรม',
  hyperactivity: 'สมาธิสั้น',
  peer: 'เพื่อน',
  prosocial: 'สังคม',
};

export const ASSESSOR_LABELS: Record<string, string> = {
  teacher: 'ครูประเมิน',
  parent: 'ผู้ปกครองประเมิน',
  student: 'นักเรียนประเมินตนเอง',
};
