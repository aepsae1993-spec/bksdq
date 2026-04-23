export interface SDQQuestion {
  num: number;
  text_teacher: string;  // Teacher/Parent version
  text_student: string;  // Self-report version
  subscale: 'emotional' | 'conduct' | 'hyperactivity' | 'peer' | 'prosocial';
  reverse: boolean;
}

export const SDQ_QUESTIONS: SDQQuestion[] = [
  { num: 1, text_teacher: 'เอาใจใส่ความรู้สึกของผู้อื่น', text_student: 'ฉันเอาใจใส่ความรู้สึกของผู้อื่น', subscale: 'prosocial', reverse: false },
  { num: 2, text_teacher: 'กระสับกระส่าย ไม่สามารถอยู่นิ่งได้นาน', text_student: 'ฉันกระสับกระส่าย ไม่สามารถอยู่นิ่งได้นาน', subscale: 'hyperactivity', reverse: false },
  { num: 3, text_teacher: 'บ่นว่าปวดหัว ปวดท้อง หรือเจ็บป่วยบ่อย', text_student: 'ฉันบ่นว่าปวดหัว ปวดท้อง หรือเจ็บป่วยบ่อย', subscale: 'emotional', reverse: false },
  { num: 4, text_teacher: 'แบ่งปันสิ่งของกับเด็กคนอื่นๆ ได้ง่าย', text_student: 'ฉันแบ่งปันสิ่งของกับเพื่อนๆ ได้ง่าย', subscale: 'prosocial', reverse: false },
  { num: 5, text_teacher: 'มักโกรธฉุนเฉียว หงุดหงิดง่าย', text_student: 'ฉันมักโกรธฉุนเฉียว หงุดหงิดง่าย', subscale: 'conduct', reverse: false },
  { num: 6, text_teacher: 'อยู่คนเดียวมากกว่า ไม่ค่อยเล่นกับคนอื่น', text_student: 'ฉันอยู่คนเดียวมากกว่า ไม่ค่อยเล่นกับคนอื่น', subscale: 'peer', reverse: false },
  { num: 7, text_teacher: 'โดยปกติเชื่อฟัง ทำตามที่ผู้ใหญ่บอก', text_student: 'โดยปกติฉันเชื่อฟัง ทำตามที่ผู้ใหญ่บอก', subscale: 'conduct', reverse: true },
  { num: 8, text_teacher: 'กังวลเรื่องต่างๆ บ่อยๆ หรือดูเหมือนกังวลเสมอ', text_student: 'ฉันกังวลเรื่องต่างๆ บ่อยๆ', subscale: 'emotional', reverse: false },
  { num: 9, text_teacher: 'พร้อมช่วยเหลือเมื่อมีคนได้รับบาดเจ็บ รู้สึกไม่สบาย หรือเสียใจ', text_student: 'ฉันพร้อมช่วยเหลือเมื่อมีคนได้รับบาดเจ็บ หรือเสียใจ', subscale: 'prosocial', reverse: false },
  { num: 10, text_teacher: 'นิ่งไม่ได้ ดิ้นรนอยู่ตลอดเวลา', text_student: 'ฉันนิ่งไม่ได้ ดิ้นรนอยู่ตลอดเวลา', subscale: 'hyperactivity', reverse: false },
  { num: 11, text_teacher: 'มีเพื่อนสนิทอย่างน้อยหนึ่งคน', text_student: 'ฉันมีเพื่อนสนิทอย่างน้อยหนึ่งคน', subscale: 'peer', reverse: true },
  { num: 12, text_teacher: 'มักต่อสู้กับเด็กคนอื่น หรือรังแกผู้อื่น', text_student: 'ฉันมักต่อสู้กับคนอื่น หรือรังแกผู้อื่น', subscale: 'conduct', reverse: false },
  { num: 13, text_teacher: 'มักรู้สึกไม่มีความสุข หดหู่ หรือร้องไห้บ่อย', text_student: 'ฉันมักรู้สึกไม่มีความสุข หดหู่ หรือร้องไห้บ่อย', subscale: 'emotional', reverse: false },
  { num: 14, text_teacher: 'โดยทั่วไปเด็กคนอื่นๆ ชอบ', text_student: 'โดยทั่วไปเพื่อนๆ ชอบฉัน', subscale: 'peer', reverse: true },
  { num: 15, text_teacher: 'ใจลอย วอกแวกง่าย ขาดสมาธิ', text_student: 'ฉันใจลอย วอกแวกง่าย ขาดสมาธิ', subscale: 'hyperactivity', reverse: false },
  { num: 16, text_teacher: 'ประหม่าหรือยึดติดกับผู้ใหญ่มากกว่าเด็กทั่วไป', text_student: 'ฉันประหม่าหรือยึดติดกับผู้ใหญ่มากกว่าเด็กทั่วไป', subscale: 'emotional', reverse: false },
  { num: 17, text_teacher: 'ใจดีต่อเด็กที่อ่อนแอหรือด้อยกว่า', text_student: 'ฉันใจดีต่อเพื่อนที่อ่อนแอหรือด้อยกว่า', subscale: 'prosocial', reverse: false },
  { num: 18, text_teacher: 'โกหกหรือโกงบ่อยๆ', text_student: 'ฉันโกหกหรือโกงบ่อยๆ', subscale: 'conduct', reverse: false },
  { num: 19, text_teacher: 'ถูกเด็กคนอื่นแกล้ง รังแก หรือกลั่นแกล้ง', text_student: 'ฉันถูกคนอื่นแกล้ง รังแก หรือกลั่นแกล้ง', subscale: 'peer', reverse: false },
  { num: 20, text_teacher: 'มักอาสาช่วยเหลือผู้อื่น (พ่อแม่ ครู เพื่อน)', text_student: 'ฉันมักอาสาช่วยเหลือผู้อื่น', subscale: 'prosocial', reverse: false },
  { num: 21, text_teacher: 'คิดก่อนทำสิ่งต่างๆ', text_student: 'ฉันคิดก่อนทำสิ่งต่างๆ', subscale: 'hyperactivity', reverse: true },
  { num: 22, text_teacher: 'ขโมยของที่บ้าน โรงเรียน หรือที่อื่น', text_student: 'ฉันขโมยของที่บ้าน โรงเรียน หรือที่อื่น', subscale: 'conduct', reverse: false },
  { num: 23, text_teacher: 'เข้ากันได้ดีกับผู้ใหญ่มากกว่าเด็กรุ่นเดียวกัน', text_student: 'ฉันเข้ากันได้ดีกับผู้ใหญ่มากกว่าเพื่อนรุ่นเดียวกัน', subscale: 'peer', reverse: false },
  { num: 24, text_teacher: 'มีความกลัวมากกว่าปกติ หรือตกใจง่าย', text_student: 'ฉันมีความกลัวมากกว่าปกติ หรือตกใจง่าย', subscale: 'emotional', reverse: false },
  { num: 25, text_teacher: 'ทำงานที่ได้รับมอบหมายให้เสร็จ มีสมาธิดี', text_student: 'ฉันทำงานที่ได้รับมอบหมายให้เสร็จ มีสมาธิดี', subscale: 'hyperactivity', reverse: true },
];

export const ANSWER_OPTIONS = [
  { value: 0, label: 'ไม่จริง' },
  { value: 1, label: 'จริงบ้าง' },
  { value: 2, label: 'จริงมาก' },
];
