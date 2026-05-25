import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const seedData = [
  {
    student_name: 'أحمد بن علي',
    specialization: 'أدب عربي - ابتدائي',
    semester_1_grades: {
      "أدب عربي": { assessment: 14, exam: 13, finalGrade: 13.33 },
      "صرف": { assessment: 15, exam: 12, finalGrade: 13 },
      "نحو": { assessment: 13, exam: 14, finalGrade: 13.67 },
      "رياضيات": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "فيزياء": { assessment: 11, exam: 12, finalGrade: 11.67 },
      "كيمياء": { assessment: 12, exam: 13, finalGrade: 12.67 },
      "تربية إسلامية": { assessment: 16, exam: 15, finalGrade: 15.33 },
      "بلاغة": { assessment: 14, exam: 14, finalGrade: 14 },
      "خط": { assessment: 15, exam: 15, finalGrade: 15 },
      "فنيات الكتابة": { assessment: 13, exam: 13, finalGrade: 13 },
      "إنجليزية": { assessment: 12, exam: 12, finalGrade: 12 },
      "إعلام آلي": { assessment: 13, exam: 13, finalGrade: 13 }
    },
    semester_2_grades: {
      "أدب عربي": { assessment: 15, exam: 14, finalGrade: 14.33 },
      "صرف": { assessment: 14, exam: 13, finalGrade: 13.33 },
      "نحو": { assessment: 14, exam: 15, finalGrade: 14.67 },
      "رياضيات": { assessment: 11, exam: 12, finalGrade: 11.67 },
      "فيزياء": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "كيمياء": { assessment: 13, exam: 12, finalGrade: 12.33 },
      "تربية إسلامية": { assessment: 17, exam: 16, finalGrade: 16.33 },
      "بلاغة": { assessment: 15, exam: 14, finalGrade: 14.33 },
      "خط": { assessment: 16, exam: 16, finalGrade: 16 },
      "فنيات الكتابة": { assessment: 14, exam: 14, finalGrade: 14 },
      "إنجليزية": { assessment: 13, exam: 12, finalGrade: 12.33 },
      "إعلام آلي": { assessment: 14, exam: 13, finalGrade: 13.33 }
    },
    remedial_grades: {},
    averages: {
      s1_avg: 13.20,
      s2_avg: 13.60,
      annual_avg: 13.40,
      cat1_avg: 13.50,
      cat2_avg: 12.50,
      status: 'ناجح'
    },
    status: 'ناجح',
    notes: 'طالب ممتاز ومجتهد، أداء رائع في جميع المقاييس وخاصة الأدبية والإسلامية.'
  },
  {
    student_name: 'فاطمة الزهراء',
    specialization: 'أدب عربي - ابتدائي',
    semester_1_grades: {
      "أدب عربي": { assessment: 11, exam: 10, finalGrade: 10.33 },
      "صرف": { assessment: 10, exam: 9, finalGrade: 9.33 },
      "نحو": { assessment: 10, exam: 9, finalGrade: 9.33 },
      "رياضيات": { assessment: 8, exam: 7, finalGrade: 7.33 },
      "فيزياء": { assessment: 7, exam: 7, finalGrade: 7.00 },
      "كيمياء": { assessment: 8, exam: 8, finalGrade: 8.00 },
      "تربية إسلامية": { assessment: 12, exam: 12, finalGrade: 12.00 },
      "بلاغة": { assessment: 10, exam: 10, finalGrade: 10.00 },
      "خط": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "فنيات الكتابة": { assessment: 11, exam: 10, finalGrade: 10.33 },
      "إنجليزية": { assessment: 9, exam: 8, finalGrade: 8.33 },
      "إعلام آلي": { assessment: 10, exam: 8, finalGrade: 8.67 }
    },
    semester_2_grades: {
      "أدب عربي": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "صرف": { assessment: 9, exam: 10, finalGrade: 9.67 },
      "نحو": { assessment: 9, exam: 9, finalGrade: 9.00 },
      "رياضيات": { assessment: 7, exam: 6, finalGrade: 6.33 },
      "فيزياء": { assessment: 8, exam: 6, finalGrade: 6.67 },
      "كيمياء": { assessment: 7, exam: 7, finalGrade: 7.00 },
      "تربية إسلامية": { assessment: 13, exam: 12, finalGrade: 12.33 },
      "بلاغة": { assessment: 11, exam: 10, finalGrade: 10.33 },
      "خط": { assessment: 11, exam: 11, finalGrade: 11.00 },
      "فنيات الكتابة": { assessment: 10, exam: 11, finalGrade: 10.67 },
      "إنجليزية": { assessment: 9, exam: 9, finalGrade: 9.00 },
      "إعلام آلي": { assessment: 9, exam: 8, finalGrade: 8.33 }
    },
    remedial_grades: {},
    averages: {
      s1_avg: 9.30,
      s2_avg: 9.00,
      annual_avg: 9.15,
      cat1_avg: 9.20,
      cat2_avg: 8.75,
      status: 'مؤجل للدورة الثانية'
    },
    status: 'مؤجل للدورة الثانية',
    notes: 'مؤجل بسبب ضعف في المواد العلمية والإنجليزية. يحتاج للتركيز في الاستدراك لرفع معدله السنوي.'
  },
  {
    student_name: 'محمد عبد الرحمن',
    specialization: 'أدب عربي - ابتدائي',
    semester_1_grades: {
      "أدب عربي": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "صرف": { assessment: 11, exam: 11, finalGrade: 11.00 },
      "نحو": { assessment: 11, exam: 10, finalGrade: 10.33 },
      "رياضيات": { assessment: 10, exam: 9, finalGrade: 9.33 },
      "فيزياء": { assessment: 8, exam: 7, finalGrade: 7.33 },
      "كيمياء": { assessment: 8, exam: 8, finalGrade: 8.00 },
      "تربية إسلامية": { assessment: 14, exam: 13, finalGrade: 13.33 },
      "بلاغة": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "خط": { assessment: 13, exam: 12, finalGrade: 12.33 },
      "فنيات الكتابة": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "إنجليزية": { assessment: 11, exam: 11, finalGrade: 11.00 },
      "إعلام آلي": { assessment: 11, exam: 10, finalGrade: 10.33 }
    },
    semester_2_grades: {
      "أدب عربي": { assessment: 13, exam: 12, finalGrade: 12.33 },
      "صرف": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "نحو": { assessment: 12, exam: 11, finalGrade: 11.33 },
      "رياضيات": { assessment: 10, exam: 10, finalGrade: 10.00 },
      "فيزياء": { assessment: 8, exam: 7, finalGrade: 7.33 },
      "كيمياء": { assessment: 9, exam: 8, finalGrade: 8.33 },
      "تربية إسلامية": { assessment: 15, exam: 14, finalGrade: 14.33 },
      "بلاغة": { assessment: 12, exam: 12, finalGrade: 12.00 },
      "خط": { assessment: 14, exam: 13, finalGrade: 13.33 },
      "فنيات الكتابة": { assessment: 13, exam: 12, finalGrade: 12.33 },
      "إنجليزية": { assessment: 10, exam: 10, finalGrade: 10.00 },
      "إعلام آلي": { assessment: 11, exam: 11, finalGrade: 11.00 }
    },
    remedial_grades: {},
    averages: {
      s1_avg: 10.60,
      s2_avg: 11.10,
      annual_avg: 10.85,
      cat1_avg: 10.90,
      cat2_avg: 10.50,
      status: 'منتقل بدين'
    },
    status: 'منتقل بدين',
    notes: 'انتقال ناجح مع وجود ديون في مقياس الفيزياء والكيمياء. يُنصح بالدخول للاستدراك للتخلص من هذه الديون.'
  }
];

async function run() {
  console.log('Seeding saved_results...');
  const { data, error } = await supabase
    .from('saved_results')
    .insert(seedData)
    .select();

  if (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }

  console.log('Successfully seeded database with', data.length, 'records.');
  process.exit(0);
}

run();
