export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
  author: string;
  createdAt: string;
  readTime: string;
  content?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'digital-patient-file',
    title: 'איך לנהל תיק מטופל דיגיטלי בצורה נכונה',
    description: 'מדריך מעשי לניהול תיק מטופל דיגיטלי — מה חייב להיות בתיק, איך מארגנים מסמכים ואיך חוסכים זמן בכל ביקור.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=640&q=80',
    category: 'ניהול מטופלים',
    author: 'צוות ClinicFlow',
    createdAt: '2026-04-01',
    readTime: '6 דקות קריאה',
  },
  {
    slug: 'clinic-management-software-israel',
    title: 'תוכנה לניהול מרפאה פרטית בישראל — המדריך המלא',
    description: 'כל מה שצריך לדעת לפני שבוחרים תוכנה לניהול מרפאה: מה להשוות, אילו תכונות חיוניות ולמה גיבוי מקומי משנה.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=640&q=80',
    category: 'ניהול מרפאה',
    author: 'צוות ClinicFlow',
    createdAt: '2026-03-24',
    readTime: '8 דקות קריאה',
  },
  {
    slug: 'icd10-codes-guide',
    title: 'ICD-10 בעברית — מדריך לרופאים בקליניקה הפרטית',
    description: 'הסבר פשוט על קודי ICD-10, איך משתמשים בהם נכון בסיכומי ביקור ולמה קופות החולים וחברות הביטוח דורשות אותם.',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=640&q=80',
    category: 'תיעוד רפואי',
    author: 'צוות ClinicFlow',
    createdAt: '2026-03-18',
    readTime: '5 דקות קריאה',
  },
  {
    slug: 'medical-data-backup',
    title: 'גיבוי נתונים רפואיים — כמה זה חשוב ואיך עושים את זה',
    description: 'נתונים רפואיים הם הנכס הכי יקר של הקליניקה שלכם. כך תוודאו שהם תמיד מוגנים, גם אם המחשב קורס.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&q=80',
    category: 'אבטחת מידע',
    author: 'צוות ClinicFlow',
    createdAt: '2026-03-10',
    readTime: '4 דקות קריאה',
  },
  {
    slug: 'visit-documentation-tips',
    title: '5 טיפים לתיעוד ביקור מהיר ומדויק',
    description: 'איך תועדו ביקור תוך דקות בלי לאבד פרטים חשובים — טמפלטים, קיצורי דרך וסדר עבודה שיחסוך לכם שעות בשבוע.',
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=640&q=80',
    category: 'תיעוד רפואי',
    author: 'צוות ClinicFlow',
    createdAt: '2026-03-03',
    readTime: '5 דקות קריאה',
  },
  {
    slug: 'clinic-invoicing-guide',
    title: 'חשבוניות וקבלות במרפאה פרטית — מה חייבים לדעת',
    description: 'חשבונית מס קבלה, קבלה פשוטה, דוחות לרואה חשבון — כל מה שקשור לניהול הכספי של הקליניקה בצורה חוקית ומסודרת.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&q=80',
    category: 'ניהול כספי',
    author: 'צוות ClinicFlow',
    createdAt: '2026-02-24',
    readTime: '7 דקות קריאה',
  },
  {
    slug: 'appointment-scheduling',
    title: 'ניהול יומן תורים — איך להפחית אי-הגעות ולמלא את הלו"ז',
    description: 'סטטיסטיקה על no-shows בקליניקות ישראליות, ומה אפשר לעשות כדי למלא את הלוח בצורה חכמה.',
    image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=640&q=80',
    category: 'ניהול תורים',
    author: 'צוות ClinicFlow',
    createdAt: '2026-02-17',
    readTime: '6 דקות קריאה',
  },
  {
    slug: 'offline-vs-cloud-clinic',
    title: 'תוכנה מקומית מול ענן — מה עדיף למרפאה שלך?',
    description: 'השוואה אמיתית בין תוכנות ענן לתוכנות מקומיות לניהול מרפאה: פרטיות, זמינות, עלויות ואבטחת מידע.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&q=80',
    category: 'ניהול מרפאה',
    author: 'צוות ClinicFlow',
    createdAt: '2026-02-10',
    readTime: '9 דקות קריאה',
  },
  {
    slug: 'prescription-management',
    title: 'ניהול מרשמים ותרופות — איך לא לפספס כלום',
    description: 'מעקב אחר תרופות קבועות, עדכון מרשמים, התראות על שינויים — כך תנהלו את הצד התרופתי של הטיפול בצורה בטוחה.',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=640&q=80',
    category: 'ניהול מטופלים',
    author: 'צוות ClinicFlow',
    createdAt: '2026-02-03',
    readTime: '5 דקות קריאה',
  },
];

export const categoryColors: Record<string, string> = {
  'ניהול מטופלים': '#0d47a1',
  'ניהול מרפאה': '#00838f',
  'תיעוד רפואי': '#6d4c41',
  'אבטחת מידע': '#1b5e20',
  'ניהול כספי': '#4a148c',
  'ניהול תורים': '#e65100',
};
