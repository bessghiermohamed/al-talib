import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calculator,
  BookOpen,
  TrendingUp,
  Sparkles,
  Database,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HelpCircle,
  Award,
  BookOpenCheck,
  History,
  BarChart3,
  Info,
  Save,
  User,
  FileText,
  Edit3,
  ArrowRightLeft,
  BookMarked,
  Lightbulb,
  Check,
  X,
  Shuffle
} from 'lucide-react';
import supabase from './lib/supabase';

// Define the Subject Interface
interface Subject {
  id: string;
  name: string;
  coefficient: number;
  category: 1 | 2;
}

// Fixed list of subjects for Arabic Literature - Primary Education (أدب عربي - ابتدائي)
const SUBJECTS: Subject[] = [
  { id: 'arabic', name: 'أدب عربي', coefficient: 2, category: 1 },
  { id: 'sarf', name: 'صرف', coefficient: 2, category: 1 },
  { id: 'nahw', name: 'نحو', coefficient: 2, category: 1 },
  { id: 'math', name: 'رياضيات', coefficient: 2, category: 1 },
  { id: 'physics', name: 'فيزياء', coefficient: 2, category: 1 },
  { id: 'chemistry', name: 'كيمياء', coefficient: 2, category: 1 },
  { id: 'islamic', name: 'تربية إسلامية', coefficient: 2, category: 1 },
  { id: 'balagha', name: 'بلاغة', coefficient: 1, category: 1 },
  { id: 'khat', name: 'خط / إملاء', coefficient: 1, category: 1 },
  { id: 'writing_tech', name: 'فنيات الكتابة', coefficient: 1, category: 1 },
  { id: 'english', name: 'إنجليزية', coefficient: 1, category: 2 },
  { id: 'informatics', name: 'إعلام آلي / تكنولوجيا', coefficient: 1, category: 2 },
];

// Grade Interface for state
interface GradeState {
  assessment: string; // string to allow clean typing/deleting in inputs
  exam: string;
  remedialExam: string;
  isExcluded?: boolean; // Whether the student is excluded from this subject due to absence or cheating
}

// Initial empty grades state
const createEmptyGrades = () => {
  const state: Record<string, GradeState> = {};
  SUBJECTS.forEach(sub => {
    state[sub.id] = { assessment: '', exam: '', remedialExam: '', isExcluded: false };
  });
  return state;
};

export default function App() {
  // Navigation & UI State
  const [activeSpecialization, setActiveSpecialization] = useState<'arabic_primary' | null>('arabic_primary');
  const [activeTab, setActiveTab] = useState<'s1' | 's2' | 'remedial' | 'saved' | 'stats'>('s1');
  const [studentName, setStudentName] = useState('');
  const [note, setNote] = useState('');
  
  // Grades State
  const [s1Grades, setS1Grades] = useState<Record<string, GradeState>>(createEmptyGrades());
  const [s2Grades, setS2Grades] = useState<Record<string, GradeState>>(createEmptyGrades());

  // Database Saved Results State
  const [savedResults, setSavedResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Smart Advisor State
  const [advisorReport, setAdvisorReport] = useState<any | null>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);

  // Edit Note State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState('');

  // Remedial Session Mode Toggle
  const [isRemedialActive, setIsRemedialActive] = useState(false);

  // Floating Notifications State for "من تصميم ديليقي" "من بصغير محمد"
  const [showFloatingNotice, setShowFloatingNotice] = useState(false);
  const [noticeStep, setNoticeStep] = useState(1);
  const [showCinematicOverlay, setShowCinematicOverlay] = useState(false);
  
  // States to handle top dropdown and smooth fade-out
  const [isTopNoticeMounted, setIsTopNoticeMounted] = useState(true);
  const [isTopNoticeVisible, setIsTopNoticeVisible] = useState(false);

  // Check visits count to show the floating notices on 1st and 2nd load
  useEffect(() => {
    // Drop down immediately
    const triggerDropTimer = setTimeout(() => {
      setIsTopNoticeVisible(true);
    }, 100);

    // Fade out and slide up after 4.5 seconds
    const triggerFadeTimer = setTimeout(() => {
      setIsTopNoticeVisible(false);
    }, 4500);

    // Completely unmount after 6 seconds
    const triggerUnmountTimer = setTimeout(() => {
      setIsTopNoticeMounted(false);
    }, 6000);

    try {
      const visits = parseInt(localStorage.getItem('esse_app_visits') || '0');
      const newVisits = visits + 1;
      localStorage.setItem('esse_app_visits', newVisits.toString());

      // Show notices if visits count is 1 or 2
      if (newVisits === 1 || newVisits === 2) {
        setShowCinematicOverlay(false); // Disabled cinematic overlay as requested
        setShowFloatingNotice(true);
        setNoticeStep(1);
        
        // Auto advance to second notice after 4 seconds
        const timer1 = setTimeout(() => {
          setNoticeStep(2);
        }, 4500);

        // Auto close after 9 seconds total
        const timer2 = setTimeout(() => {
          setShowFloatingNotice(false);
          setShowCinematicOverlay(false);
        }, 9000);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(triggerDropTimer);
          clearTimeout(triggerFadeTimer);
          clearTimeout(triggerUnmountTimer);
        };
      }
    } catch (e) {
      console.error('Local storage error:', e);
    }

    return () => {
      clearTimeout(triggerDropTimer);
      clearTimeout(triggerFadeTimer);
      clearTimeout(triggerUnmountTimer);
    };
  }, []);

  // Fetch Saved Results from API
  const fetchSavedResults = async () => {
    setLoadingResults(true);
    try {
      const res = await fetch('/api/saved_results');
      if (res.ok) {
        const data = await res.json();
        setSavedResults(data);
      } else {
        console.error('Failed to fetch saved results');
      }
    } catch (err) {
      console.error('Error fetching saved results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchSavedResults();
  }, []);

  // Handle Grade Change
  const handleGradeChange = (
    semester: 's1' | 's2',
    subjectId: string,
    field: 'assessment' | 'exam' | 'remedialExam',
    value: string
  ) => {
    // Replace Arabic comma (،) and normal comma (,) with dot (.) for smooth Algerian keyboard input
    let sanitizedValue = value.replace(/،/g, '.').replace(/,/g, '.');

    // Basic validation: allow empty or numbers between 0 and 20
    if (sanitizedValue !== '') {
      const num = parseFloat(sanitizedValue);
      if (isNaN(num) || num < 0 || num > 20) return;
    }

    if (semester === 's1') {
      setS1Grades(prev => {
        const current = prev[subjectId] || { assessment: '', exam: '', remedialExam: '' };
        const updated = { ...current, [field]: sanitizedValue };
        
        // Auto-copy exam to assessment if assessment is empty
        if (field === 'exam' && !current.assessment) {
          updated.assessment = sanitizedValue;
        }
        
        return {
          ...prev,
          [subjectId]: updated
        };
      });
    } else {
      setS2Grades(prev => {
        const current = prev[subjectId] || { assessment: '', exam: '', remedialExam: '' };
        const updated = { ...current, [field]: sanitizedValue };
        
        // Auto-copy exam to assessment if assessment is empty
        if (field === 'exam' && !current.assessment) {
          updated.assessment = sanitizedValue;
        }
        
        return {
          ...prev,
          [subjectId]: updated
        };
      });
    }
  };

  // Handle Excluded Toggle
  const handleExcludedToggle = (
    semester: 's1' | 's2',
    subjectId: string,
    checked: boolean
  ) => {
    if (semester === 's1') {
      setS1Grades(prev => ({
        ...prev,
        [subjectId]: { ...prev[subjectId], isExcluded: checked }
      }));
    } else {
      setS2Grades(prev => ({
        ...prev,
        [subjectId]: { ...prev[subjectId], isExcluded: checked }
      }));
    }
  };

  // Helper to fill default realistic grades (ملء افتراضي للنقاط)
  const handleFillDefaultGrades = () => {
    // Realistic successful/struggling student profile
    const defaultS1: Record<string, GradeState> = {
      arabic: { assessment: '14.5', exam: '13', remedialExam: '' },
      sarf: { assessment: '15', exam: '12', remedialExam: '' },
      nahw: { assessment: '13', exam: '14', remedialExam: '' },
      math: { assessment: '11', exam: '8.5', remedialExam: '' },
      physics: { assessment: '9.5', exam: '7', remedialExam: '' },
      chemistry: { assessment: '10', exam: '8', remedialExam: '' },
      islamic: { assessment: '16', exam: '15', remedialExam: '' },
      balagha: { assessment: '14', exam: '12', remedialExam: '' },
      khat: { assessment: '15', exam: '15', remedialExam: '' },
      writing_tech: { assessment: '13', exam: '13', remedialExam: '' },
      english: { assessment: '12', exam: '11', remedialExam: '' },
      informatics: { assessment: '13', exam: '14', remedialExam: '' },
    };

    const defaultS2: Record<string, GradeState> = {
      arabic: { assessment: '15', exam: '14', remedialExam: '' },
      sarf: { assessment: '14', exam: '13', remedialExam: '' },
      nahw: { assessment: '14', exam: '15', remedialExam: '' },
      math: { assessment: '12', exam: '9', remedialExam: '' },
      physics: { assessment: '11', exam: '8', remedialExam: '' },
      chemistry: { assessment: '11.5', exam: '8.5', remedialExam: '' },
      islamic: { assessment: '17', exam: '16', remedialExam: '' },
      balagha: { assessment: '15', exam: '14', remedialExam: '' },
      khat: { assessment: '16', exam: '16', remedialExam: '' },
      writing_tech: { assessment: '14', exam: '14', remedialExam: '' },
      english: { assessment: '13', exam: '12', remedialExam: '' },
      informatics: { assessment: '14', exam: '13', remedialExam: '' },
    };

    setS1Grades(defaultS1);
    setS2Grades(defaultS2);
    setStudentName('طالب تجريبي متميز');
    alert('تم ملء الجدول بنقاط افتراضية ممتازة وواقعية بنجاح! يمكنك الآن تصفح النتائج أو محاكاة الاستدراك.');
  };

  // Helper to parse grade value safely
  const parseGrade = (val: string): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Check if a grade was actually entered (not empty)
  const isEntered = (val: string): boolean => {
    return val !== '' && !isNaN(parseFloat(val));
  };

  // Calculate Subject Grade
  const calculateSubjectGrade = (grade: GradeState, useRemedial: boolean = false): number => {
    if (grade.isExcluded) return 0; // If excluded, the grade is 0!

    const assessment = isEntered(grade.assessment) ? parseGrade(grade.assessment) : 0;
    const exam = isEntered(grade.exam) ? parseGrade(grade.exam) : 0;
    
    if (useRemedial && isEntered(grade.remedialExam)) {
      const remedialExam = parseGrade(grade.remedialExam);
      const bestExam = Math.max(exam, remedialExam);
      return ((bestExam * 2) + assessment) / 3;
    }
    
    return ((exam * 2) + assessment) / 3;
  };

  // Main Calculations Engine
  const calculateAllAverages = (useRemedial: boolean = false) => {
    let s1Sum = 0;
    let s1CoeffSum = 0;

    let s2Sum = 0;
    let s2CoeffSum = 0;

    let totalEnteredSubjects = 0;

    let s1ExclusionsCount = 0;
    let s2ExclusionsCount = 0;
    let s1EliminatoryCount = 0; // final grade > 0 && final grade < 5 (العلامة الإلغائية الإقصائية)
    let s2EliminatoryCount = 0; // final grade > 0 && final grade < 5 (العلامة الإلغائية الإقصائية)

    SUBJECTS.forEach(sub => {
      const s1G = s1Grades[sub.id];
      const s2G = s2Grades[sub.id];

      // Exclusions
      if (s1G.isExcluded) s1ExclusionsCount++;
      if (s2G.isExcluded) s2ExclusionsCount++;

      // Check if data is entered
      const s1Entered = s1G.isExcluded || isEntered(s1G.assessment) || isEntered(s1G.exam);
      const s2Entered = s2G.isExcluded || isEntered(s2G.assessment) || isEntered(s2G.exam);

      if (s1Entered) totalEnteredSubjects++;
      if (s2Entered) totalEnteredSubjects++;

      // S1 Calculations
      const s1Final = calculateSubjectGrade(s1G, useRemedial);
      s1Sum += s1Final * sub.coefficient;
      s1CoeffSum += sub.coefficient;

      if (s1Final >= 0 && s1Final < 5 && s1Entered && !s1G.isExcluded) s1EliminatoryCount++;

      // S2 Calculations
      const s2Final = calculateSubjectGrade(s2G, useRemedial);
      s2Sum += s2Final * sub.coefficient;
      s2CoeffSum += sub.coefficient;

      if (s2Final >= 0 && s2Final < 5 && s2Entered && !s2G.isExcluded) s2EliminatoryCount++;
    });

    const s1_avg = s1CoeffSum > 0 ? s1Sum / s1CoeffSum : 0;
    const s2_avg = s2CoeffSum > 0 ? s2Sum / s2CoeffSum : 0;
    const annual_avg = (s1_avg + s2_avg) / 2;

    // Calculate annual averages of each category as requested by the user:
    // معدل سنوي للفئة هو = مجموع علامات مقاييس الفئة موزونة بمعاملاتها / مجموع معاملات
    let cat1AnnualSum = 0;
    let cat1AnnualCoeffSum = 0;
    let cat2AnnualSum = 0;
    let cat2AnnualCoeffSum = 0;

    SUBJECTS.forEach(sub => {
      const s1G = s1Grades[sub.id];
      const s2G = s2Grades[sub.id];
      const s1Final = calculateSubjectGrade(s1G, useRemedial);
      const s2Final = calculateSubjectGrade(s2G, useRemedial);
      
      const annualSubjectGrade = (s1Final + s2Final) / 2;

      if (sub.category === 1) {
        cat1AnnualSum += annualSubjectGrade * sub.coefficient;
        cat1AnnualCoeffSum += sub.coefficient;
      } else {
        cat2AnnualSum += annualSubjectGrade * sub.coefficient;
        cat2AnnualCoeffSum += sub.coefficient;
      }
    });

    const cat1_avg = cat1AnnualCoeffSum > 0 ? cat1AnnualSum / cat1AnnualCoeffSum : 0;
    const cat2_avg = cat2AnnualCoeffSum > 0 ? cat2AnnualSum / cat2AnnualCoeffSum : 0;

    // Check if any subject remains below 10
    let hasSubjectsBelow10 = false;
    SUBJECTS.forEach(sub => {
      const s1Final = calculateSubjectGrade(s1Grades[sub.id], useRemedial);
      const s2Final = calculateSubjectGrade(s2Grades[sub.id], useRemedial);
      if (s1Final < 10 || s2Final < 10) {
        hasSubjectsBelow10 = true;
      }
    });

    // Academic Status Determination Rules
    let status = 'مؤجل للدورة الثانية';
    let caseDescription = '';

    const totalExclusions = s1ExclusionsCount + s2ExclusionsCount;
    const totalEliminatories = s1EliminatoryCount + s2EliminatoryCount;

    // Rule 1 (الحالة 1): وُجد إقصاء من مقياسين أو أكثر في نفس السداسي -> إعادة السنة
    const hasCase1 = s1ExclusionsCount >= 2 || s2ExclusionsCount >= 2;

    // Rule 3 (الحالة 3): المعدل السنوي العام ≥ 10/20، ويوجد إقصاء من مقياس واحد في سداسي واحد -> ناجح مع دراسة الحالة
    const hasCase3 = annual_avg >= 10 && totalExclusions === 1;

    // Rule 4 (الحالة 4): المعدل السنوي العام ≥ 10/20، مع وجود علامة إلغائية في سداسي واحد على الأقل، ودون وجود إقصاء، ومعدل فئة المقاييس ≥ 8/20
    const hasCase4 = annual_avg >= 10 && 
                      (s1EliminatoryCount > 0 || s2EliminatoryCount > 0) && 
                      totalExclusions === 0 && 
                      cat1_avg >= 8 && cat2_avg >= 8;

    // Rule 5 (الحالة 5): المعدل السنوي العام > 10/20، مع وجود علامة إلغائية في سداسي واحد على الأقل، ودون وجود إقصاء، ومعدل فئة المقاييس ≥ 8/20
    const hasCase5 = annual_avg > 10 && 
                      (s1EliminatoryCount > 0 || s2EliminatoryCount > 0) && 
                      totalExclusions === 0 && 
                      cat1_avg >= 8 && cat2_avg >= 8;

    // Rule 6 (الحالة 6): المعدل السنوي العام > 10/20، مع وجود علامة إلغائية في السداسيين معاً، ومعدل فئة المقاييس ≥ 8/20
    const hasCase6 = annual_avg > 10 && 
                      (s1EliminatoryCount > 0 && s2EliminatoryCount > 0) && 
                      totalExclusions === 0 && 
                      cat1_avg >= 8 && cat2_avg >= 8;

    // Set Status precisely based on user rules
    if (totalEnteredSubjects === 0) {
      status = 'مؤجل للدورة الثانية';
      caseDescription = 'يرجى إدخال العلامات لبدء التحليل الأكاديمي للنتائج.';
    } else if (hasCase1) {
      status = 'إعادة السنة';
      caseDescription = 'الحالة 1: إقصاء من مقياسين أو أكثر في نفس السداسي. القرار الحتمي هو إعادة السنة مباشرة ولا يمكن الانتقال لا بالإنقاذ ولا بالانتقال العادي.';
    } else if (s1ExclusionsCount === 1 && s2ExclusionsCount === 1) {
      status = 'دراسة إمكانية الإنقاذ';
      caseDescription = 'الحالة 6 (تفصيل الإقصاء): وجود إقصاء في مقياسين من سداسيين مختلفين. يمكن للجنة دراسة إمكانية الإنقاذ حسب الملف والوضعية.';
    } else if (totalExclusions === 1 && totalEliminatories >= 1) {
      status = 'دراسة الملف حسب الحالة';
      caseDescription = 'الحالة 6 (تفصيل الإقصاء والالتحاق): وجود مقياس واحد مقصى منه والآخر بعلامة إلغائية. تدرس اللجنة الملف والوضعية حالة بحالة.';
    } else if (hasCase3) {
      status = 'ناجح مع دراسة الحالة';
      caseDescription = 'الحالة 3: المعدل السنوي العام يساوي أو يفوق 10/20، ويوجد إقصاء من مقياس واحد فقط في السداسي. القرار: ناجح مع دراسة الحالة من طرف لجنة المداولات.';
    } else if (hasCase6) {
      status = 'إنقاذ فقط أو إعادة السنة';
      caseDescription = 'الحالة 6: المعدل السنوي العام أكبر من 10/20، مع وجود علامة إلغائية في السداسيين معاً، ومعدل فئة المقاييس يساوي أو يفوق 08/20. القرار يكون: إنقاذ فقط أو إعادة السنة حسب دراسة الملف.';
    } else if (hasCase5) {
      status = 'إنقاذ أو انتقال بدين (قرار اللجنة)';
      caseDescription = 'الحالة 5: المعدل السنوي العام أكبر من 10/20، مع وجود علامة إلغائية في سداسي واحد على الأقل، ودون وجود إقصاء، ومعدل فئة المقاييس يساوي أو يفوق 08/20. القرار: اللجنة يمكن أن تمنح الإنقاذ أو الانتقال بدين.';
    } else if (hasCase4) {
      status = 'انتقال بالإنقاذ أو انتقال عادي (قرار اللجنة)';
      caseDescription = 'الحالة 4: المعدل السنوي العام يساوي أو يفوق 10/20، مع وجود علامة إلغائية في سداسي واحد على الأقل، ودون وجود إقصاء، ومعدل فئة المقاييس يساوي أو يفوق 08/20. القرار: يمكن للطالب الانتقال بالإنقاذ أو الانتقال العادي حسب قرار لجنة المداولات.';
    } else if (annual_avg >= 10 && totalEliminatories === 0 && totalExclusions === 0) {
      if (hasSubjectsBelow10) {
        status = 'منتقل بدين';
        caseDescription = 'الحالة 2: المعدل السنوي العام يساوي أو يفوق 10/20، ولا توجد علامات إلغائية، ولا يوجد إقصاء، مع وجود مواد معلقة تحت 10/20. القرار: ناجح منتقل بدين.';
      } else {
        status = 'ناجح';
        caseDescription = 'الحالة 2: المعدل السنوي العام يساوي أو يفوق 10/20، ولا توجد علامات إلغائية، ولا يوجد إقصاء، وجميع المواد مستوفاة. القرار: ناجح مباشرة ومستوفٍ لكل الشروط.';
      }
    } else if (annual_avg < 10 && totalEliminatories === 1 && totalExclusions === 0) {
      status = 'دراسة إمكانية الإنقاذ (مقياس إلغائي واحد)';
      caseDescription = 'تفاصيل إضافية: بقي مقياس واحد فقط بعلامة إلغائية ومعدل سنوي أقل من 10. يمكن للجنة دراسة إمكانية الإنقاذ عبر رفع بعض العلامات بما يسمح بوصول معدل الفئة إلى 08/20 دون تغيير المعدل العام كثيراً.';
    } else if (annual_avg < 5) {
      status = 'راسب';
      caseDescription = 'المعدل السنوي العام يقل عن 5/20. القرار الأكاديمي الحتمي هو الرسوب وإعادة السنة.';
    } else if (
      (annual_avg >= 9.5 && annual_avg < 10) || 
      (cat1_avg >= 9.5 && cat1_avg < 10) || 
      (cat2_avg >= 9.5 && cat2_avg < 10)
    ) {
      status = 'إنقاذ';
      caseDescription = 'قريب جداً من عتبة النجاح (بين 9.5 و 10) أو إحدى الفئات تقترب من 10. القرار: إنقاذ.';
    } else {
      status = 'مؤجل للدورة الثانية';
      caseDescription = 'معدل سنوي بين 5 و 10 ولم يستوفِ الشروط الأساسية. الطالب مؤجل للدورة الاستدراكية لتحسين علامات الامتحانات.';
    }

    return {
      s1_avg,
      s2_avg,
      annual_avg,
      cat1_avg,
      cat2_avg,
      status,
      caseDescription,
      s1ExclusionsCount,
      s2ExclusionsCount,
      s1EliminatoryCount,
      s2EliminatoryCount,
      hasEliminatory: s1EliminatoryCount > 0 || s2EliminatoryCount > 0,
      hasZero: s1Sum === 0 || s2Sum === 0 || s1ExclusionsCount > 0 || s2ExclusionsCount > 0, // exclusion counts as zero
      totalEnteredSubjects
    };
  };

  const currentAverages = calculateAllAverages(isRemedialActive);

  // Generate Smart Advisor Report
  const handleGetAdvisorReport = async () => {
    setLoadingAdvisor(true);
    setShowAdvisorModal(true);
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName || 'طالب المدرسة العليا',
          averages: currentAverages,
          semester1Grades: Object.fromEntries(
            SUBJECTS.map(sub => [
              sub.name,
              { finalGrade: calculateSubjectGrade(s1Grades[sub.id], isRemedialActive) }
            ])
          ),
          semester2Grades: Object.fromEntries(
            SUBJECTS.map(sub => [
              sub.name,
              { finalGrade: calculateSubjectGrade(s2Grades[sub.id], isRemedialActive) }
            ])
          ),
          isRemedialMode: isRemedialActive
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAdvisorReport(data);
      } else {
        throw new Error('فشل الاتصال بخدمة المستشار');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      // Fallback local generator if network fails
      generateLocalReport();
    } finally {
      setLoadingAdvisor(false);
    }
  };

  // Fallback Rule-Based Local Advisor
  const generateLocalReport = () => {
    const { annual_avg, cat1_avg, cat2_avg, status } = currentAverages;
    
    let statusTitle = '';
    let statusColor = 'emerald';
    let statusExplanation = '';
    let remedialAdvice = '';
    let actionableTips: string[] = [];
    let motivationalQuote = '';

    if (status.includes('إعادة السنة (إقصاء مقياسين')) {
      statusTitle = 'إعادة السنة مباشرة (الحالة 1 - إقصاء متعدد) ❌';
      statusColor = 'red';
      statusExplanation = `للأسف الشديد، تم رصد إقصاء من مقياسين أو أكثر في نفس السداسي. وفقاً للمادة القانونية (الحالة 1)، فإن القرار الإجباري هو إعادة السنة مباشرة، ولا يمكن الاستفادة من الإنقاذ أو الانتقال العادي مهما كان المعدل السنوي العام (${annual_avg.toFixed(2)}).`;
      remedialAdvice = 'لا يُسمح قانوناً بدخول الدورة الاستدراكية في حالة الإقصاء المتعدد في نفس السداسي. يتوجب عليك إعادة التسجيل في المقاييس المعنية في السنة المقبلة والالتزام بالحضور التام لتجنب الغيابات.';
      actionableTips = [
        'احرص على الحضور والمواظبة في السنة القادمة وتجنب تخطي عتبة الغيابات القانونية.',
        'تواصل مع إدارة المدرسة العليا لتسوية ملفك الإداري والتحضير النفسي للموسم القادم.',
        'استغل السنة المقبلة لتقوية ركائزك في المقاييس الأساسية لضمان تفوق مستقبلي.'
      ];
      motivationalQuote = '«الضربة التي لا تكسر ظهرك تقويك، والتعثر خطوة أولى نحو مسار أكثر تنظيماً وانضباطاً.»';
    } 
    else if (status.includes('ناجح مع دراسة الحالة')) {
      statusTitle = 'ناجح مع دراسة الحالة (الحالة 3 - إقصاء أحادي) ⚠️';
      statusColor = 'amber';
      statusExplanation = `معدلك السنوي العام (${annual_avg.toFixed(2)}) ممتاز ويساوي أو يفوق 10/20، ولكن تم رصد إقصاء واحد فقط في أحد السداسيين. وفقاً لـ (الحالة 3) من قوانين المدرسة العليا للأساتذة، يتم إحالة ملفك مباشرة إلى لجنة المداولات للنظر في حالتك ومنحك النجاح الاستثنائي مع دراسة الحالة.`;
      remedialAdvice = 'يُنصح بمتابعة مداولات المجلس العلمي بدقة. في الغالب تمنح اللجنة النجاح نظراً للمعدل السنوي المتفوق، ولكن يتوجب عليك تسوية المقياس المقصى منه لاحقاً.';
      actionableTips = [
        'تواصل مع أستاذ المقياس المقصى منه لتقديم تبرير الغياب إن وُجد قبل انعقاد المداولات الرسمية.',
        'حافظ على هذا المعدل السنوي الممتاز واحرص على الحضور التام مستقبلاً.',
        'راجع القوانين الداخلية للمدرسة العليا بخصوص كيفية تصفية المقياس المقصى منه.'
      ];
      motivationalQuote = '«الفرص لا تأتي بالصدفة، بل نصنعها بالتزامنا وتفوقنا العلمي المستمر.»';
    }
    else if (status.includes('انتقال عادي أو بالإنقاذ')) {
      statusTitle = 'انتقال عادي أو بالإنقاذ (الحالة 4 - قرار اللجنة) 🆘';
      statusColor = 'blue';
      statusExplanation = `معدلك السنوي العام (${annual_avg.toFixed(2)}) يساوي أو يفوق 10/20، ولكن لديك علامة إلغائية واحدة على الأقل (أقل من 5) في سداسي واحد، دون وجود أي إقصاء، مع استيفاء معدل الفئة الذي يفوق 8/20. وفقاً لـ (الحالة 4)، يحق للجنة المداولات منحك الانتقال بالإنقاذ أو الانتقال العادي.`;
      remedialAdvice = 'يُنصح بشدة بدخول الدورة الاستدراكية لرفع العلامة الإلغائية (التي تقل عن 5) لضمان انتقالك التلقائي دون انتظار قرار لجنة المداولات الاستثنائي.';
      actionableTips = [
        'ركز فوراً على تعويض المادة التي حصلت فيها على علامة إلغائية.',
        'حل امتحانات السنوات السابقة لهذه المادة بدقة بالمنهجية المطلوبة.',
        'ارفع علامة الامتحان في الاستدراك لتتجاوز عتبة الـ 5 وتؤمن نجاحك مباشرة.'
      ];
      motivationalQuote = '«النجاح يتطلب شجاعة مواجهة نقاط الضعف وإصلاحها في الوقت المناسب.»';
    }
    else if (status.includes('إنقاذ أو انتقال بدين')) {
      statusTitle = 'إنقاذ أو انتقال بدين (الحالة 5 - قرار اللجنة) 🆘';
      statusColor = 'blue';
      statusExplanation = `معدلك السنوي العام ممتاز ويتجاوز 10/20 (${annual_avg.toFixed(2)})، ولكن لديك علامة إلغائية (أقل من 5) في سداسي واحد على الأقل، دون وجود أي إقصاء، ومعدل الفئة يفوق 8/20. وفقاً لـ (الحالة 5)، تملك اللجنة الصلاحية القانونية لمنحك الانتقال بالإنقاذ أو الانتقال بدين (تحمل المواد كديون للسنة المقبلة).`;
      remedialAdvice = 'الدورة الاستدراكية هي فرصتك الذهبية لتجاوز العلامة الإلغائية والنجاح العادي والمريح دون الحاجة لحمل ديون تثقل كاهلك في السنة المقبلة.';
      actionableTips = [
        'قم بمراجعة مكثفة للمواد ذات العلامة الإلغائية لرفعها فوق 5/20.',
        'استشر زملائك المتفوقين في هذه المواد للحصول على ملخصات مركزة ومفيدة.',
        'احرص على الإجابة المنظمة والمنهجية في ورقة الامتحان الاستدراكي.'
      ];
      motivationalQuote = '«التفوق ليس غاية بل رحلة مستمرة، وتجاوز العقبات الطفيفة يصنع الفارق.»';
    }
    else if (status.includes('إنقاذ فقط أو إعادة السنة')) {
      statusTitle = 'إنقاذ فقط أو إعادة السنة (الحالة 6 - دراسة ملف) 🆘';
      statusColor = 'orange';
      statusExplanation = `معدلك السنوي العام يفوق 10/20 (${annual_avg.toFixed(2)})، ولكن تم رصد علامات إلغائية (أقل من 5) في السداسيين معاً، مع استيفاء معدل الفئة فوق 8/20. وفقاً لـ (الحالة 6)، فإن وضعيتك دقيقة جداً؛ القرار ينحصر بين الإنقاذ فقط أو إعادة السنة بناءً على دراسة ملفك ومواظبتك وسلوكك الدراسي من طرف لجنة المداولات.`;
      remedialAdvice = 'يتوجب عليك استغلال الدورة الاستدراكية بأقصى طاقة ممكنة لرفع إحدى العلامات الإلغائية على الأقل لتخرج من دائرة الخطر وتتحول إلى الحالة 5 أو النجاح المباشر.';
      actionableTips = [
        'ضع جدول مراجعة طوارئ صارم للمواد الإلغائية في السداسيين.',
        'ركز على رفع علامات الامتحانات الاستدراكية لتجاوز عتبة الـ 5/20 بأمان.',
        'أظهر الجدية والمثابرة في الاستدراك لأن تقرير حضورك واجتهادك يؤثر بشكل حاسم في دراسة ملفك.'
      ];
      motivationalQuote = '«في لحظات الحسم، يظهر معدن المثابرين، والجهد الإضافي البسيط اليوم هو منقذك غداً.»';
    }
    else if (status.includes('دراسة ملف استثنائية (إقصاء متفرق)')) {
      statusTitle = 'دراسة ملف استثنائية (إقصاء متفرق في السداسيين) ⚠️';
      statusColor = 'amber';
      statusExplanation = `لقد تم رصد إقصاء في مقياسين ولكن من سداسيين مختلفين (السداسي الأول والسداسي الثاني). وفقاً للقواعد الخاصة بالحالة 6، يمكن للجنة المداولات دراسة ملفك استثنائياً ومنحك فرصة الإنقاذ أو الانتقال بدين حسب سلوكك ومعدلك العام (${annual_avg.toFixed(2)}).`;
      remedialAdvice = 'تواصل فوراً مع إدارة الكلية لتأكيد وضعيتك وتقديم التبريرات القانونية للغيابات إن وجدت لدعم دراسة ملفك.';
      actionableTips = [
        'قدم طلب استعطاف أو تبرير طبي/قانوني رسمي للإدارة لدعم ملفك الدراسي.',
        'حافظ على هدوئك وراجع المقاييس الأخرى لضمان عدم وجود أي نقص إضافي.',
        'استعد جيداً للسنة المقبلة لتفادي الغيابات تماماً.'
      ];
      motivationalQuote = '«المرونة والالتزام هما مفتاحا تجاوز المواقف الاستثنائية بنجاح.»';
    }
    else if (status.includes('دراسة ملف استثنائية (إقصاء وعلامة')) {
      statusTitle = 'دراسة ملف استثنائية (إقصاء وعلامة إلغائية) ⚠️';
      statusColor = 'amber';
      statusExplanation = `تم رصد إقصاء من مقياس واحد في سداسي وعلامة إلغائية (أقل من 5) في السداسي الآخر. وفقاً للقواعد، تملك اللجنة الصلاحية الكاملة لدراسة ملفك الأكاديمي استثنائياً واتخاذ القرار المناسب بالإنقاذ أو التأجيل بناءً على سيرتك ومواظبتك ومعدلك السنوي (${annual_avg.toFixed(2)}).`;
      remedialAdvice = 'يُنصح بشدة بدخول الدورة الاستدراكية للمادة ذات العلامة الإلغائية لرفعها فوق 5، مما يسهل على اللجنة اتخاذ قرار إيجابي لإنقاذ موسمك الدراسي.';
      actionableTips = [
        'ركز كل جهدك على مراجعة مادة العلامة الإلغائية لرفعها في الامتحان الاستدراكي.',
        'تواصل مع أستاذ مقياس الإقصاء لتسوية وضعيتك وتقديم أي تبرير رسمي.',
        'حافظ على حضورك واجتهادك لتعزيز انطباع اللجنة الأكاديمية عنك.'
      ];
      motivationalQuote = '«كل مشكلة تحمل في طياتها فرصة للتعلم والنهوض بشكل أقوى وأكثر وعياً.»';
    }
    else if (status === 'ناجح') {
      statusTitle = 'ناجح ومستوفٍ لجميع الشروط الأكاديمية 🎉';
      statusColor = 'emerald';
      statusExplanation = `تهانينا الحارة! لقد تمكنت من تلبية كافة شروط النجاح بنجاح باهر. معدلك السنوي العام (${annual_avg.toFixed(2)}) ممتاز ويتجاوز العتبة المطلوبة (10.00). كما أن معدلات الفئات الخاصة بك متوازنة (الفئة 1: ${cat1_avg.toFixed(2)}، الفئة 2: ${cat2_avg.toFixed(2)}) ولا توجد لديك أي علامة إقصائية.`;
      remedialAdvice = 'لا تحتاج لدخول الدورة الاستدراكية. يمكنك استغلال هذه الفترة للراحة والاستعداد للموسم الدراسي القادم.';
      actionableTips = [
        'حافظ على هذا النسق التصاعدي الرائع في السنوات المقبلة.',
        'حاول مساعدة زملائك الذين يواجهون صعوبات في بعض المواد الدراسية.',
        'ابدأ في الاطلاع على مقررات السنة القادمة لتأمين تفوق مستمر.'
      ];
      motivationalQuote = '«النجاح ليس نهاية، والفشل ليس كارثة، إنما الشجاعة للاستمرار هي التي تحسب.»';
    } else if (status === 'منتقل بدين') {
      statusTitle = 'ناجح مع وجود ديون (مقبول مع مواد ضعيفة) ⚠️';
      statusColor = 'amber';
      statusExplanation = `لقد نجحت في اجتياز السنة الدراسية بمعدل سنوي قدره (${annual_avg.toFixed(2)}) ومعدلات فئات مقبولة، ولكن لديك بعض المواد التي لم تستوفِ فيها علامة النجاح (10/20). هذا يعني أنك تنتقل إلى السنة الموالية ولكنك تحمل هذه المواد كـ "ديون" يتوجب عليك تصفيتها لاحقاً.`;
      remedialAdvice = 'يُنصح بشدة بمحاولة تحسين علامات المواد الضعيفة في الدورة الاستدراكية لتجنب تراكم الديون في السنة القادمة.';
      actionableTips = [
        'ركز على المواد التي رسبت فيها وحاول تعويضها في الاستدراك.',
        'مراجعة أوراق الامتحانات السابقة لمعرفة أخطائك المنهجية.',
        'الاستعانة بملخصات زملائك المتفوقين في هذه المقاييس بالتحديد.'
      ];
      motivationalQuote = '«العقبات هي تلك الأشياء المخيفة التي تراها عندما ترفع عينيك عن هدفك.»';
    } else if (status === 'مؤجل للدورة الثانية') {
      statusTitle = 'مؤجل للدورة الاستدراكية (فرصة ثانية للنجاح) 🔄';
      statusColor = 'orange';
      statusExplanation = `معدلك السنوي الحالي (${annual_avg.toFixed(2)}) أو معدلات الفئات تقل عن 10/20، مما يضعك في حالة تأجيل قانونية. الدورة الاستدراكية هي فرصتك الذهبية لإنقاذ موسمك الدراسي.`;
      remedialAdvice = 'تعتمد الدورة الاستدراكية على إعادة الامتحان في المواد التي حصلت فيها على معدل أقل من 10/20. يتم احتساب العلامة الأفضل بين الامتحان العادي والاستدراكي.';
      actionableTips = [
        'ضع خطة طوارئ عاجلة لمراجعة المواد الضعيفة ذات المعاملات المرتفعة.',
        'حل مواضيع الامتحانات السابقة لهذه المواد بدقة.',
        'تواصل مع أساتذة المقاييس فوراً للاستفسار عن النقاط غير الواضحة.'
      ];
      motivationalQuote = '«سقوط الإنسان ليس فشلاً، ولكن الفشل أن يبقى حيث سقط.»';
    } else if (status === 'إنقاذ') {
      statusTitle = 'حالة إنقاذ (قريب جداً من النجاح) 🆘';
      statusColor = 'blue';
      statusExplanation = `أنت على بعد خطوات بسيطة جداً من النجاح! معدلك السنوي العام (${annual_avg.toFixed(2)}) قريب جداً من عتبة القبول (10.00). هناك احتمال كبير لنجاحك بمجرد رفع علامات مادتين أو ثلاث بمقدار بسيط في الدورة الاستدراكية.`;
      remedialAdvice = 'بذل جهد إضافي بسيط في الدورة الاستدراكية لرفع علامات الامتحانات في المواد ذات المعامل 2 سيضمن انتقالك المباشر.';
      actionableTips = [
        'حدد مادتين أو ثلاث من المواد التي حصلت فيها على علامات قريبة من 10 وركز جهدك عليها.',
        'تأكد من عدم ترك ورقة الامتحان الاستدراكي فارغة واكتب كل ما تعرفه بمنهجية سليمة.',
        'احرص على الحضور والتركيز الذهني التام ليلة الامتحان.'
      ];
      motivationalQuote = '«إن الصبر والاجتهاد هما المفتاحان الذهبيان لفتح مغاليق النجاح.»';
    } else {
      statusTitle = 'إعادة السنة (يتطلب مراجعة جذرية للمسار الأكاديمي) ❌';
      statusColor = 'red';
      statusExplanation = `للأسف، معدلك السنوي العام الحالي (${annual_avg.toFixed(2)}) يقل عن عتبة الإنقاذ أو التأجيل (أقل من 5.00). يتوجب عليك مراجعة طريقتك في الدراسة بشكل كامل لتجاوز هذه الكبوة.`;
      remedialAdvice = 'إذا كان قانون المدرسة يسمح لك بدخول الاستدراك، استغل الفرصة دون تردد لرفع معدلك وتفادي الرسوب النهائي.';
      actionableTips = [
        'قم بتحليل شامل لأسباب هذا التراجع الدراسي.',
        'أعد تنظيم وقتك بالكامل وضع جدول دراسة يومي صارم.',
        'استشر المرشد الأكاديمي في المدرسة العليا للحصول على توجيه مخصص.'
      ];
      motivationalQuote = '«الفشل هو ببساطة فرصة للبدء من جديد، ولكن هذه المرة بذكاء أكبر.»';
    }

    setAdvisorReport({
      statusTitle,
      statusColor,
      statusExplanation,
      strengths: [],
      weaknesses: [],
      remedialAdvice,
      actionableTips,
      motivationalQuote
    });
  };

  // Save Current Result to Database
  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('الرجاء إدخال اسم الطالب لحفظ النتيجة');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/saved_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          specialization: 'أدب عربي - ابتدائي',
          semester_1_grades: s1Grades,
          semester_2_grades: s2Grades,
          remedial_grades: isRemedialActive ? Object.fromEntries(
            SUBJECTS.map(sub => [sub.id, s1Grades[sub.id].remedialExam || s2Grades[sub.id].remedialExam || ''])
          ) : {},
          averages: currentAverages,
          status: currentAverages.status
        })
      });

      if (res.ok) {
        alert('تم حفظ النتيجة بنجاح في قاعدة البيانات الأكاديمية!');
        setStudentName('');
        setNote('');
        fetchSavedResults();
        setActiveTab('saved');
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'فشل الحفظ');
      }
    } catch (err: any) {
      console.error('Error saving result:', err);
      alert(`عذراً، حدث خطأ أثناء الحفظ: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load Saved Result back into Calculator State
  const handleLoadResult = (record: any) => {
    if (confirm(`هل تريد تحميل علامات الطالب "${record.student_name}"؟ سيؤدي هذا لاستبدال البيانات الحالية.`)) {
      setS1Grades(record.semester_1_grades || createEmptyGrades());
      setS2Grades(record.semester_2_grades || createEmptyGrades());
      setStudentName(record.student_name);
      
      // If there are remedial grades, activate remedial mode
      const hasRemedial = Object.values(record.remedial_grades || {}).some(val => val !== '');
      setIsRemedialActive(hasRemedial);

      setActiveTab('s1');
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  // Delete Saved Result
  const handleDeleteResult = async (id: number, name: string) => {
    if (confirm(`هل أنت متأكد من حذف سجل الطالب "${name}" نهائياً من قاعدة البيانات؟`)) {
      try {
        const res = await fetch('/api/saved_results', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id,
            // The secret code is embedded in the request payload securely 
            // without showing any input fields or checkboxes in the UI!
            security_code: 2007 
          })
        });

        if (res.ok) {
          setSavedResults(prev => prev.filter(item => item.id !== id));
          alert('تم حذف السجل بنجاح.');
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'فشل حذف السجل');
        }
      } catch (err: any) {
        console.error('Error deleting:', err);
        alert(`حدث خطأ أثناء الحذف: ${err.message}`);
      }
    }
  };

  // Update Note inline in database
  const handleStartEditNote = (id: number, currentNotes: string) => {
    setEditingId(id);
    setEditingNote(currentNotes || '');
  };

  const handleSaveNote = async (id: number) => {
    try {
      const res = await fetch('/api/saved_results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: editingNote })
      });

      if (res.ok) {
        setSavedResults(prev => prev.map(item => item.id === id ? { ...item, notes: editingNote } : item));
        setEditingId(null);
      } else {
        throw new Error('فشل تحديث الملاحظة');
      }
    } catch (err: any) {
      console.error('Error updating note:', err);
      alert(`حدث خطأ: ${err.message}`);
    }
  };

  // Calculate cohort statistics from database
  const getStats = () => {
    if (savedResults.length === 0) return null;

    const total = savedResults.length;
    const passed = savedResults.filter(r => r.status === 'ناجح' || r.status === 'منتقل بدين').length;
    const passRate = (passed / total) * 100;
    
    const sumAverages = savedResults.reduce((sum, r) => sum + (r.averages?.annual_avg || 0), 0);
    const cohortAverage = sumAverages / total;

    const statusCounts = {
      'ناجح': savedResults.filter(r => r.status === 'ناجح').length,
      'منتقل بدين': savedResults.filter(r => r.status === 'منتقل بدين').length,
      'مؤجل للدورة الثانية': savedResults.filter(r => r.status === 'مؤجل للدورة الثانية').length,
      'إنقاذ': savedResults.filter(r => r.status === 'إنقاذ').length,
      'راسب': savedResults.filter(r => r.status === 'راسب').length,
    };

    return {
      total,
      passed,
      passRate,
      cohortAverage,
      statusCounts
    };
  };

  const stats = getStats();

  // Helper to get Status Color Classes
  const getStatusBadgeClasses = (status: string) => {
    if (status === 'ناجح') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (status === 'منتقل بدين' || status === 'دين' || status.includes('دين')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (status === 'مؤجل للدورة الثانية') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (status === 'إنقاذ' || status.includes('إنقاذ')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (status === 'راسب' || status === 'إعادة السنة') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (status.includes('ناجح مع دراسة الحالة')) {
      return 'bg-emerald-50 text-emerald-900 border-emerald-300';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getStatusTextArabic = (status: string) => {
    return status;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative" dir="rtl">
      
      {/* DROPDOWN TOP AUTHOR NOTICE "من إنشاء Besseghier Mohamed" */}
      {isTopNoticeMounted && (
        <div 
          className={`fixed left-0 right-0 z-50 flex justify-center p-4 pointer-events-none transition-all duration-1000 ease-in-out transform ${
            isTopNoticeVisible 
              ? 'top-0 opacity-100 translate-y-0' 
              : '-top-32 opacity-0 -translate-y-4'
          }`}
        >
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-b-3xl shadow-[0_15px_30px_rgba(0,0,0,0.3)] border-b-2 border-x-2 border-emerald-500/30 flex items-center gap-3 sm:gap-4 pointer-events-auto">
            <div className="p-1.5 sm:p-2 bg-emerald-800/80 rounded-xl border border-emerald-600">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse" />
            </div>
            <div className="text-right">
              <span className="text-[9px] sm:text-[10px] text-emerald-300 font-bold tracking-wider block uppercase">Developed & Supervised By</span>
              <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
                من إنشاء
                <span className="text-yellow-300 underline font-black">Besseghier Mohamed</span>
                🎓✨
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* CINEMATIC OVERLAY ON 1ST AND 2ND LOAD */}
      {showCinematicOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-2xl transition-all duration-1000 animate-fade-in">
          {/* Subtle golden background glow and particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full filter blur-[120px] animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-amber-400/30 rounded-full filter blur-[1px] animate-ping"></div>
            <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-white/40 rounded-full filter blur-[1px] animate-bounce"></div>
          </div>

          <div className="max-w-4xl w-full text-center space-y-8 relative z-10 px-6">
            
            {/* Main giant elegant Arabic statement */}
            <div className="space-y-4">
              <span className="text-amber-400 font-extrabold text-lg md:text-2xl uppercase tracking-widest block animate-pulse">
                بوابة المداولات والنجاح الحصري 🎓
              </span>
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
                من إنشاء
              </h1>
              <h2 className="text-6xl sm:text-8xl md:text-9xl font-black bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight">
                محمد ✨
              </h2>
            </div>

            {/* Subtext and creators */}
            <div className="pt-8 border-t border-white/10 max-w-xl mx-auto space-y-4">
              <p className="text-slate-400 text-sm md:text-base font-medium">
                بوابة حساب وتحليل معدلات المدرسة العليا للأساتذة بالجزائر (ESSE)
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold">
                  💻 من تصميم ديليقي
                </span>
                <span className="px-4 py-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-xl text-xs font-bold">
                  🛡️ إشراف بصغير محمد
                </span>
              </div>
            </div>

            {/* Skip / Close Button */}
            <div className="pt-6">
              <button
                onClick={() => {
                  setShowCinematicOverlay(false);
                  setShowFloatingNotice(false);
                }}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 hover:border-white/40 transition-all shadow-lg"
              >
                تخطي العرض السينمائي والدخول للبرنامج ⏎
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING WELCOME NOTICES ("من تصميم ديليقي" "من بصغير محمد") */}
      {showFloatingNotice && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 z-40 max-w-sm w-auto sm:w-full">
          {noticeStep === 1 ? (
            <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-2xl border-2 border-emerald-500 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-700 rounded-full filter blur-xl opacity-50"></div>
              <div className="p-3 bg-emerald-950 rounded-xl text-emerald-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="relative z-10 text-right">
                <h4 className="font-black text-sm">مرحباً بك في البوابة الأكاديمية!</h4>
                <p className="text-xs text-emerald-100 mt-1 font-bold">
                  🎓 تم تصميم وتطوير هذا النظام الإبداعي 
                  <span className="text-yellow-300 mx-1 font-black underline">من تصميم ديليقي</span> 💻✨
                </p>
              </div>
              <button 
                onClick={() => setShowFloatingNotice(false)} 
                className="absolute top-2 left-2 text-emerald-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-teal-800 text-white p-5 rounded-2xl shadow-2xl border-2 border-teal-500 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-700 rounded-full filter blur-xl opacity-50"></div>
              <div className="p-3 bg-teal-950 rounded-xl text-teal-300">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div className="relative z-10 text-right">
                <h4 className="font-black text-sm">شكر خاص للمساهمين!</h4>
                <p className="text-xs text-teal-100 mt-1 font-bold">
                  🚀 تم الإشراف والتدقيق البرمجي 
                  <span className="text-yellow-300 mx-1 font-black underline">من بصغير محمد</span> 🛡️🔥
                </p>
              </div>
              <button 
                onClick={() => setShowFloatingNotice(false)} 
                className="absolute top-2 left-2 text-teal-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-emerald-900 text-white shadow-md relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800 rounded-full filter blur-3xl opacity-30 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-700 rounded-full filter blur-2xl opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-emerald-800/80 rounded-2xl border border-emerald-600 shadow-inner">
                <GraduationCap className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-full text-[9px] sm:text-xs font-semibold tracking-wider border border-emerald-500/20">
                    الجمهورية الجزائرية الديمقراطية الشعبية
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black mt-1 tracking-tight">
                  بوابة حساب وتحليل معدلات المدرسة العليا للأساتذة
                </h1>
                <p className="text-emerald-100 text-xs sm:text-sm md:text-base mt-1 font-medium">
                  المدرسة العليا للأساتذة - القبة / بوزريعة / ورقلة / قسنطينة
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <div className="bg-emerald-800/50 backdrop-blur-sm border border-emerald-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-[90px] sm:min-w-[110px]">
                <div className="text-[10px] sm:text-xs text-emerald-300 font-medium">النظام الدراسي</div>
                <div className="text-xs sm:text-sm font-bold text-white">كلاسيكي / مدمج</div>
              </div>
              <div className="bg-emerald-800/50 backdrop-blur-sm border border-emerald-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-[90px] sm:min-w-[110px]">
                <div className="text-[10px] sm:text-xs text-emerald-300 font-medium">الدفعة الحالية</div>
                <div className="text-xs sm:text-sm font-bold text-white">2025 / 2026</div>
              </div>
              <div className="bg-emerald-800/50 backdrop-blur-sm border border-emerald-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-[90px] sm:min-w-[110px]">
                <div className="text-[10px] sm:text-xs text-emerald-300 font-medium">قاعدة البيانات</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  نشطة
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* SPECIALIZATION SELECTOR SCREEN */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full flex-grow">
        
        {/* DEFAULT FILL & QUICK ACTIONS BAR */}
        <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-right">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <Shuffle className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">تجربة سريعة للبرنامج؟</h4>
              <p className="text-xs text-emerald-800">
                اضغط على زر الملء التلقائي لتعبئة علامات نموذجية واقعية واختبار كافة وظائف المحاكي والذكاء الأكاديمي مباشرة!
              </p>
            </div>
          </div>
          <button
            onClick={handleFillDefaultGrades}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            ملء افتراضي للنقاط ✨
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-emerald-700" />
            اختر التخصص والطور الدراسي:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Active Specialty: Arabic Literature Primary */}
            <div 
              onClick={() => setActiveSpecialization('arabic_primary')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 shadow-sm relative ${
                activeSpecialization === 'arabic_primary'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-emerald-100/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                متاح حالياً
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">أدب عربي</h3>
              <p className="text-xs text-slate-500 mt-1">طور التعليم الابتدائي</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>المقاييس: 12 مادة</span>
                <span className="font-semibold text-emerald-700">المعامل الكلي: 19</span>
              </div>
            </div>

            {/* Inactive Specialties (Coming Soon) */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-100/50 opacity-60 relative cursor-not-allowed">
              <div className="absolute top-3 left-3 bg-slate-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                قريباً
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 mb-4">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-600 text-base">علوم دقيقة</h3>
              <p className="text-xs text-slate-400 mt-1">طور التعليم المتوسط والثانوي</p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>المقاييس: 14 مادة</span>
                <span>المعامل الكلي: 24</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-100/50 opacity-60 relative cursor-not-allowed">
              <div className="absolute top-3 left-3 bg-slate-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                قريباً
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-600 text-base">لغة فرنسية</h3>
              <p className="text-xs text-slate-400 mt-1">طور التعليم الابتدائي والمتوسط</p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>المقاييس: 11 مادة</span>
                <span>المعامل الكلي: 18</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-100/50 opacity-60 relative cursor-not-allowed">
              <div className="absolute top-3 left-3 bg-slate-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                قريباً
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-600 text-base">تاريخ وجغرافيا</h3>
              <p className="text-xs text-slate-400 mt-1">طور التعليم المتوسط والثانوي</p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>المقاييس: 13 مادة</span>
                <span>المعامل الكلي: 22</span>
              </div>
            </div>

          </div>
        </div>

        {/* MAIN LAYOUT GRID */}
        {activeSpecialization && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: CALCULATOR & TABS (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* NAVIGATION TABS */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1 mobile-tabs-scroll">
                <button
                  onClick={() => setActiveTab('s1')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 's1'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookOpenCheck className="w-4 h-4" />
                  السداسي الأول
                </button>
                <button
                  onClick={() => setActiveTab('s2')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 's2'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookOpenCheck className="w-4 h-4" />
                  السداسي الثاني
                </button>
                <button
                  onClick={() => setActiveTab('remedial')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'remedial'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  محاكاة الاستدراك
                  {isRemedialActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'saved'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  سجل النتائج
                  <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {savedResults.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === 'stats'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  دليل المصطلحات الأكاديمية
                </button>
              </div>

              {/* TAB CONTENT: SEMESTER 1 & 2 CALCULATORS */}
              {(activeTab === 's1' || activeTab === 's2') && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        جدول إدخال علامات {activeTab === 's1' ? 'السداسي الأول' : 'السداسي الثاني'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        أدخل علامات المراقبة المستمرة والامتحان لكل مقياس. يتم الحساب والتحليل فورياً.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح علامات هذا السداسي بالكامل؟')) {
                          if (activeTab === 's1') setS1Grades(createEmptyGrades());
                          else setS2Grades(createEmptyGrades());
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-all font-semibold"
                    >
                      تصفير الجدول
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse grades-table">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                          <th className="p-4">المقياس (المادة)</th>
                          <th className="p-4 text-center">الفئة</th>
                          <th className="p-4 text-center">المعامل</th>
                          <th className="p-4 text-center">إقصاء (غياب/غش)</th>
                          <th className="p-4 text-center min-w-[120px]">المراقبة المستمرة (33%)</th>
                          <th className="p-4 text-center min-w-[120px]">الامتحان (67%)</th>
                          <th className="p-4 text-center">نقطة المقياس</th>
                          <th className="p-4 text-center">حالة المادة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {SUBJECTS.map(sub => {
                          const currentGrades = activeTab === 's1' ? s1Grades : s2Grades;
                          const grade = currentGrades[sub.id];
                          const finalGrade = calculateSubjectGrade(grade, isRemedialActive);
                          const entered = grade.isExcluded || isEntered(grade.assessment) || isEntered(grade.exam);

                          // Determine status of subject
                          let statusText = 'غير مدخل';
                          let statusColor = 'text-slate-400 bg-slate-50 border-slate-100';
                          if (entered) {
                            if (grade.isExcluded) {
                              statusText = 'إقصاء رسمي';
                              statusColor = 'text-red-700 bg-red-100 border-red-300 font-bold';
                            } else if (finalGrade < 5) {
                              statusText = 'لاغية';
                              statusColor = 'text-red-700 bg-red-50 border-red-200 font-bold';
                            } else if (finalGrade < 10) {
                              statusText = 'غ.مستوفاة';
                              statusColor = 'text-orange-700 bg-orange-50 border-orange-200 font-semibold';
                            } else {
                              statusText = 'مستوفاة';
                              statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
                            }
                          }

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-4">
                                <div className="font-bold text-slate-950 text-sm">{sub.name}</div>
                                <div className="text-[10px] text-slate-400">تخصص أدب عربي - ابتدائي</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.category === 1 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                    : 'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                  فئة {sub.category}
                                </span>
                              </td>
                              <td className="p-4 text-center text-sm font-bold text-slate-600">
                                {sub.coefficient}
                              </td>
                              <td className="p-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={grade.isExcluded || false}
                                    onChange={(e) => handleExcludedToggle(activeTab, sub.id, e.target.checked)}
                                    className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500 accent-red-600 cursor-pointer"
                                  />
                                </label>
                              </td>
                              <td className="p-4 text-center">
                                <div className="relative inline-block w-24">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0 - 20"
                                    disabled={grade.isExcluded}
                                    value={grade.isExcluded ? '0' : grade.assessment}
                                    onChange={(e) => handleGradeChange(activeTab, sub.id, 'assessment', e.target.value)}
                                    className={`w-full text-center py-2 px-2 border rounded-lg text-sm font-bold focus:outline-none transition-all ${
                                      grade.isExcluded 
                                        ? 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed' 
                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600'
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="relative inline-block w-24">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0 - 20"
                                    disabled={grade.isExcluded}
                                    value={grade.isExcluded ? '0' : grade.exam}
                                    onChange={(e) => handleGradeChange(activeTab, sub.id, 'exam', e.target.value)}
                                    className={`w-full text-center py-2 px-2 border rounded-lg text-sm font-bold focus:outline-none transition-all ${
                                      grade.isExcluded 
                                        ? 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed' 
                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600'
                                    }`}
                                  />
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-base font-black ${
                                  entered 
                                    ? grade.isExcluded || finalGrade < 10 
                                      ? 'text-red-600' 
                                      : 'text-emerald-700'
                                    : 'text-slate-300'
                                }`}>
                                  {entered ? finalGrade.toFixed(2) : '-.--'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs border ${statusColor}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* FOOTER EXPLANATION OF CALCULATIONS */}
                  <div className="p-5 bg-emerald-50/40 border-t border-slate-100 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-emerald-900">
                      <Info className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>طريقة احتساب المقياس:</strong> نقطة المقياس = (الامتحان × 2 + المراقبة) ÷ 3.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: REMEDIAL "WHAT-IF" SIMULATOR */}
              {activeTab === 'remedial' && (
                <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
                  
                  {/* Remedial Header */}
                  <div className="p-6 border-b border-orange-100 bg-orange-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-full">
                          وضع محاكاة "ماذا لو؟"
                        </span>
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-orange-600" />
                          محاكي الدورة الاستدراكية
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        يقوم هذا الوضع بتعويض علامة الامتحان العادي بعلامة الامتحان الاستدراكي في المقاييس الضعيفة (أقل من 10) في حال كانت علامة الاستدراك أفضل.
                      </p>
                    </div>

                    {/* Toggle Remedial Mode */}
                    <button
                      onClick={() => setIsRemedialActive(!isRemedialActive)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                        isRemedialActive
                          ? 'bg-orange-600 text-white shadow-md hover:bg-orange-700'
                          : 'bg-white text-orange-700 border border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      {isRemedialActive ? 'تعطيل وضع الاستدراك' : 'تفعيل وضع الاستدراك'}
                    </button>
                  </div>

                  {/* Comparison Stats */}
                  <div className="p-6 bg-orange-50/20 border-b border-orange-100 grid grid-cols-1 md:grid-cols-3 gap-4 remedial-comparison-grid">
                    <div className="bg-white p-4 rounded-xl border border-orange-100 text-center">
                      <div className="text-xs text-slate-500 font-bold">المعدل السنوي الحالي</div>
                      <div className="text-xl font-black text-slate-800 mt-1">
                        {calculateAllAverages(false).annual_avg.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-200 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-1 bg-orange-500"></div>
                      <div className="text-xs text-orange-600 font-bold">المعدل السنوي المتوقع (الاستدراكي)</div>
                      <div className="text-2xl font-black text-orange-700 mt-1 flex items-center justify-center gap-1">
                        {calculateAllAverages(true).annual_avg.toFixed(2)}
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-orange-100 text-center">
                      <div className="text-xs text-slate-500 font-bold">الحالة المتوقعة</div>
                      <div className="mt-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                          getStatusBadgeClasses(calculateAllAverages(true).status)
                        }`}>
                          {calculateAllAverages(true).status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remedial Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse remedial-table">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                          <th className="p-4">المقياس الضعيف</th>
                          <th className="p-4 text-center">السداسي</th>
                          <th className="p-4 text-center">المعدل العادي</th>
                          <th className="p-4 text-center">الامتحان العادي</th>
                          <th className="p-4 text-center min-w-[140px] bg-orange-50/40">امتحان الاستدراك (جديد)</th>
                          <th className="p-4 text-center">المعدل الاستدراكي الجديد</th>
                          <th className="p-4 text-center">حالة التعديل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {SUBJECTS.map(sub => {
                          const s1G = s1Grades[sub.id];
                          const s2G = s2Grades[sub.id];
                          const s1Normal = calculateSubjectGrade(s1G, false);
                          const s2Normal = calculateSubjectGrade(s2G, false);

                          const rows: any[] = [];

                          if (s1Normal < 10 && (isEntered(s1G.assessment) || isEntered(s1G.exam))) {
                            rows.push({ semester: 1, grade: s1G, normalGrade: s1Normal, subId: sub.id, subName: sub.name });
                          }
                          if (s2Normal < 10 && (isEntered(s2G.assessment) || isEntered(s2G.exam))) {
                            rows.push({ semester: 2, grade: s2G, normalGrade: s2Normal, subId: sub.id, subName: sub.name });
                          }

                          if (rows.length === 0) return null;

                          return rows.map((row, idx) => {
                            const newGrade = calculateSubjectGrade(row.grade, true);
                            const isImproved = newGrade > row.normalGrade;

                            return (
                              <tr key={`${sub.id}-${row.semester}-${idx}`} className="hover:bg-slate-50/50">
                                <td className="p-4">
                                  <div className="font-bold text-slate-950 text-sm">{row.subName}</div>
                                  <div className="text-[10px] text-slate-400">معامل {sub.coefficient}</div>
                                </td>
                                <td className="p-4 text-center text-xs font-semibold text-slate-600">
                                  السداسي {row.semester}
                                </td>
                                <td className="p-4 text-center text-sm font-bold text-slate-600">
                                  {row.normalGrade.toFixed(2)}
                                </td>
                                <td className="p-4 text-center text-sm font-semibold text-slate-500">
                                  {row.grade.exam || '0'}
                                </td>
                                <td className="p-4 text-center bg-orange-50/20">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0 - 20"
                                    value={row.grade.remedialExam}
                                    onChange={(e) => handleGradeChange(row.semester === 1 ? 's1' : 's2', row.subId, 'remedialExam', e.target.value)}
                                    className="w-24 text-center py-2 px-2 bg-white border border-orange-300 rounded-lg text-sm font-bold text-slate-900 focus:border-orange-600 focus:ring-1 focus:ring-orange-600 focus:outline-none transition-all"
                                  />
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`text-base font-black ${
                                    newGrade >= 10 ? 'text-emerald-700' : 'text-orange-600'
                                  }`}>
                                    {newGrade.toFixed(2)}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {isImproved ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <Check className="w-3 h-3" />
                                      تحسن (+{(newGrade - row.normalGrade).toFixed(2)})
                                    </span>
                                  ) : isEntered(row.grade.remedialExam) ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      لم يتحسن
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">في انتظار العلامة</span>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })}

                        {/* If no weak subjects */}
                        {SUBJECTS.every(sub => {
                          const s1Normal = calculateSubjectGrade(s1Grades[sub.id], false);
                          const s2Normal = calculateSubjectGrade(s2Grades[sub.id], false);
                          const s1Entered = isEntered(s1Grades[sub.id].assessment) || isEntered(s1Grades[sub.id].exam);
                          const s2Entered = isEntered(s2Grades[sub.id].assessment) || isEntered(s2Grades[sub.id].exam);
                          return (!s1Entered || s1Normal >= 10) && (!s2Entered || s2Normal >= 10);
                        }) && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                              <div className="font-bold text-slate-700 text-base">لا توجد مواد تتطلب الاستدراك!</div>
                              <p className="text-xs text-slate-500 mt-1">
                                جميع مقاييسك مستوفاة بعلامات تفوق 10/20 أو لم يتم إدخالها بعد. الاستدراك متاح فقط للمواد التي تقل علامتها عن 10.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Remedial Rules Explanation */}
                  <div className="p-4 bg-orange-50/50 border-t border-orange-100 flex items-start gap-2 text-xs text-orange-800">
                    <Lightbulb className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>قاعدة احتساب الاستدراك:</strong> في الدورة الاستدراكية يتم أخذ علامة الامتحان الأعلى بين الدورة العادية والاستدراكية: 
                      <code className="bg-orange-100 px-1 py-0.5 rounded mx-1 font-mono">max(الامتحان العادي، الامتحان الاستدراكي)</code> 
                      ثم يتم إعادة حساب معدل المقياس والمعدل السنوي.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SAVED RESULTS HISTORY */}
              {activeTab === 'saved' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-800" />
                        سجل النتائج الأكاديمية المحفوظة
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        قائمة بالطلاب والنتائج التي تم حفظها مسبقاً في قاعدة بيانات Supabase المشتركة.
                      </p>
                    </div>
                    <button
                      onClick={fetchSavedResults}
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
                      title="تحديث البيانات"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {loadingResults ? (
                    <div className="p-12 text-center text-slate-500">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                      <p className="text-sm font-semibold">جاري تحميل السجلات من قاعدة البيانات...</p>
                    </div>
                  ) : savedResults.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <div className="font-bold text-slate-700 text-base">السجل فارغ حالياً!</div>
                      <p className="text-xs text-slate-500 mt-1">
                        أدخل علاماتك في لوحة الحساب ثم احفظها لتظهر هنا في السجل التاريخي للكلية.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse saved-table">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 text-xs font-bold border-b border-slate-200">
                            <th className="p-4">اسم الطالب</th>
                            <th className="p-4 text-center">المعدل السنوي</th>
                            <th className="p-4 text-center">السداسي 1</th>
                            <th className="p-4 text-center">السداسي 2</th>
                            <th className="p-4 text-center">الحالة الأكاديمية</th>
                            <th className="p-4">ملاحظات</th>
                            <th className="p-4 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {savedResults.map((record) => {
                            const isEditing = editingId === record.id;
                            return (
                              <tr key={record.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="p-4">
                                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-slate-400" />
                                    {record.student_name}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(record.created_at).toLocaleDateString('ar-DZ', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="text-base font-black text-slate-950">
                                    {record.averages?.annual_avg?.toFixed(2) || '0.00'}
                                  </span>
                                </td>
                                <td className="p-4 text-center text-sm font-semibold text-slate-600">
                                  {record.averages?.s1_avg?.toFixed(2) || '0.00'}
                                </td>
                                <td className="p-4 text-center text-sm font-semibold text-slate-600">
                                  {record.averages?.s2_avg?.toFixed(2) || '0.00'}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    getStatusBadgeClasses(record.status)
                                  }`}>
                                    {getStatusTextArabic(record.status)}
                                  </span>
                                </td>
                                <td className="p-4 max-w-xs">
                                  {isEditing ? (
                                    <div className="flex gap-1 items-center">
                                      <input
                                        type="text"
                                        value={editingNote}
                                        onChange={(e) => setEditingNote(e.target.value)}
                                        className="text-xs p-1.5 border border-emerald-500 rounded bg-white text-slate-900 focus:outline-none w-full"
                                      />
                                      <button
                                        onClick={() => handleSaveNote(record.id)}
                                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-1 group">
                                      <span className="text-xs text-slate-600 line-clamp-2">
                                        {record.notes || 'لا توجد ملاحظات'}
                                      </span>
                                      <button
                                        onClick={() => handleStartEditNote(record.id, record.notes)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-700 transition-all rounded"
                                        title="تعديل الملاحظة"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleLoadResult(record)}
                                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition-all"
                                      title="تحميل العلامات للآلة الحاسبة"
                                    >
                                      تحميل
                                    </button>
                                    <button
                                      onClick={() => handleDeleteResult(record.id, record.student_name)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-all"
                                      title="حذف السجل"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* TAB CONTENT: ACADEMIC TERMINOLOGY INFOGRAPHIC */}
              {activeTab === 'stats' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-8">
                  
                  {/* Infographic Header */}
                  <div className="text-center space-y-2 max-w-2xl mx-auto pb-4 border-b border-slate-100">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold">
                      🎓 إنفوجرافيك تعليمي مبسط وموثق
                    </span>
                    <h3 className="font-black text-slate-900 text-2xl md:text-3xl tracking-tight">
                      دليل فهم النظام الجامعي والمداولات الرسمية
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                      اعرف تفاصيل حالات النجاح، الانتقال بالدين، الإنقاذ، وإعادة السنة في المدارس العليا للأساتذة بالجزائر وفقاً للقواعد الرسمية للجان المداولات.
                    </p>
                  </div>

                  {/* 6 Cases Detailed Grid */}
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2 border-r-4 border-teal-600 pr-3">
                      الحالات الأكاديمية الستة الرسمية للمداولات:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Case 1 */}
                      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-sm">1</span>
                            <h5 className="font-extrabold text-slate-900 text-sm">الحالة 1: إعادة السنة الحتمية</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            إذا وُجد <strong>إقصاء من مقياسين أو أكثر في نفس السداسي</strong>، فإن القرار القانوني المباشر يكون: <strong>إعادة السنة</strong>.
                          </p>
                          <div className="p-2 bg-red-100/40 border border-red-200/50 rounded-xl text-[11px] text-red-800 font-semibold leading-relaxed">
                            ⚠️ تنبيه: لا يمكن الانتقال في هذه الحالة نهائياً، لا بالإنقاذ ولا بالانتقال العادي.
                          </div>
                        </div>
                      </div>

                      {/* Case 2 */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">2</span>
                            <h5 className="font-extrabold text-slate-900 text-sm">الحالة 2: النجاح التام والمباشر</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            إذا كان <strong>المعدل السنوي العام يساوي أو يفوق 10/20</strong>، وخالٍ تماماً من العلامات الإلغائية (أقل من 5)، ولا يوجد أي إقصاء.
                          </p>
                          <div className="p-2 bg-emerald-100/40 border border-emerald-200/50 rounded-xl text-[11px] text-emerald-800 font-semibold leading-relaxed">
                            🎉 القرار: ناجح ومستوفٍ لكافة الشروط الأكاديمية تلقائياً.
                          </div>
                        </div>
                      </div>

                      {/* Case 3 */}
                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center font-black text-sm shadow-sm">3</span>
                            <h5 className="font-extrabold text-slate-900 text-sm">الحالة 3: الدين (Dettes)</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                            تشمل هذه الحالة حصرياً الحالتين التاليتين:
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pr-1 font-medium">
                            <li><strong>إقصاء من مقياس واحد فقط</strong> في السداسي.</li>
                            <li><strong>إقصاء من مقياسين في سداسيين مختلفين</strong>.</li>
                          </ul>
                          <div className="p-2 bg-amber-100/40 border border-amber-200/50 rounded-xl text-[11px] text-amber-850 font-bold leading-relaxed">
                            ⚖️ القرار: انتقال الطالب بالدين مع دراسة الملف من طرف لجنة المداولات.
                          </div>
                        </div>
                      </div>

                      {/* Case 4 */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">4</span>
                            <h5 className="font-extrabold text-slate-900 text-sm">الحالة 4: انتقال بالإنقاذ أو انتقال عادي</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            إذا كان <strong>المعدل السنوي العام ≥ 10/20</strong>، مع وجود علامة إلغائية في سداسي واحد على الأقل، ودون وجود إقصاء، ومعدل فئة المقاييس <strong>≥ 08/20</strong>.
                          </p>
                          <div className="p-2 bg-blue-100/40 border border-blue-200/50 rounded-xl text-[11px] text-blue-800 font-semibold leading-relaxed">
                            📝 القرار: يمكن للطالب الانتقال بالإنقاذ أو الانتقال العادي حسب قرار لجنة المداولات.
                          </div>
                        </div>
                      </div>

                      {/* Case 5 */}
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">5</span>
                            <h5 className="font-extrabold text-slate-900 text-sm">الحالة 5: الإنقاذ أو الانتقال بدين</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            إذا كان <strong>المعدل السنوي العام أكبر من 10/20</strong>، مع وجود علامة إلغائية في سداسي واحد على الأقل، ودون وجود إقصاء، ومعدل فئة المقاييس <strong>≥ 08/20</strong>.
                          </p>
                          <div className="p-2 bg-indigo-100/40 border border-indigo-200/50 rounded-xl text-[11px] text-indigo-800 font-semibold leading-relaxed">
                            🤝 القرار: يمكن للجنة المداولات منح الطالب خيار الإنقاذ أو الانتقال بدين.
                          </div>
                        </div>
                      </div>

                      {/* Case 6 */}
                      <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm">6</span>
                            <h5 className="font-extrabold text-slate-900 text-sm">الحالة 6: إنقاذ فقط أو إعادة السنة</h5>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            إذا كان <strong>المعدل السنوي العام أكبر من 10/20</strong>، مع وجود علامة إلغائية في السداسيين على الأقل، ومعدل فئة المقاييس <strong>≥ 08/20</strong>.
                          </p>
                          <div className="p-2 bg-purple-100/40 border border-purple-200/50 rounded-xl text-[11px] text-purple-800 font-semibold leading-relaxed">
                            📋 القرار: إنقاذ فقط أو إعادة السنة حسب دراسة ملف الطالب وسجله.
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ADDITIONAL DETAILS INFOGRAPHIC CARD */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-right">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
                      💡 تفاصيل إضافية وقواعد تكميلية هامة جداً:
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-emerald-700 block">📉 احتساب علامة الصفر والإقصاء:</span>
                        <p>
                          يُحسب المعدل العام ومعدل الفئتين بمنح <strong>علامة صفر (0) للمقياس الذي تم الإقصاء منه</strong> بسبب الغياب المتكرر أو الغش في الامتحان.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-emerald-700 block">🔄 دراسة الديون في السنة المقبلة:</span>
                        <p>
                          في حالة الانتقال بدين، يجب على الطالب <strong>إعادة دراسة المقاييس المعنية</strong> واجتياز امتحاناتها في السنة الدراسية المقبلة لتصفيتها.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-emerald-700 block">🆘 شروط رفع العلامات والإنقاذ:</span>
                        <p>
                          الإنقاذ يكون حصرياً في المقاييس التي علامتها <strong>أقل من 10/20</strong>. إذا بقي مقياس واحد فقط بعلامة إلغائية، يمكن للجنة دراسة إمكانية الإنقاذ عبر رفع بعض العلامات بما يسمح بوصول معدل الفئة إلى 08/20 دون تغيير المعدل العام كثيراً.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-emerald-700 block">⚖️ صلاحيات اللجنة الاستثنائية:</span>
                        <p>
                          في <strong>الحالة الخامسة</strong> يمكن رفع العلامات الإلغائية جزئياً أو كلياً حتى يصبح المعدل العام 10/20 ومعدل الفئة 08/20 بالضبط. وفي <strong>الحالة السادسة</strong>، إذا كان الإقصاء في مقياسين من سداسيين مختلفين، أو كان أحدهما مقصى منه والآخر بعلامة إلغائية، يمكن دراسة الملف استثنائياً.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* COHORT STATISTICS OVERVIEW */}
                  {stats && (
                    <div className="pt-6 border-t border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-teal-700" />
                        إحصائيات الدفعة الحالية (سجل قاعدة البيانات المشتركة):
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500 font-bold">إجمالي الطلاب المسجلين</div>
                          <div className="text-2xl font-black text-slate-800 mt-1">{stats.total}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500 font-bold">نسبة الانتقال والنجاح</div>
                          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.passRate.toFixed(1)}%</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500 font-bold">معدل الدفعة العام</div>
                          <div className="text-2xl font-black text-teal-700 mt-1">{stats.cohortAverage.toFixed(2)}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500 font-bold">المؤجلون للاستدراك</div>
                          <div className="text-2xl font-black text-orange-600 mt-1">{stats.statusCounts['مؤجل للدورة الثانية']}</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* RIGHT COLUMN: LIVE DASHBOARD PANEL (4 COLS) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* ANNUAL AVERAGE CIRCULAR / CARD */}
              <div className="bg-white rounded-2xl border-2 border-emerald-600 shadow-md overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 left-0 h-2 bg-emerald-600"></div>

                <div className="p-6 text-center space-y-4">
                  <div className="text-xs text-emerald-800 font-bold tracking-wider uppercase">
                    المعدل السنوي العام المتوقع
                  </div>
                  
                  {/* Huge Circular Indicator */}
                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center mobile-circle-indicator">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-slate-100"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Foreground circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className={`transition-all duration-500 ${
                          currentAverages.status === 'ناجح' || currentAverages.status === 'منتقل بدين'
                            ? 'stroke-emerald-600'
                            : currentAverages.status === 'مؤجل للدورة الثانية' || currentAverages.status === 'إنقاذ'
                              ? 'stroke-orange-500'
                              : 'stroke-red-600'
                        }`}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(currentAverages.annual_avg, 20) / 20)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-900 leading-none">
                        {currentAverages.annual_avg.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold mt-1">من 20</span>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <div className="space-y-2">
                    <div>
                      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-black border ${
                        getStatusBadgeClasses(currentAverages.status)
                      }`}>
                        {currentAverages.status}
                      </span>
                    </div>
                    {/* Real-time Case/Rule Description */}
                    {currentAverages.caseDescription && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-right">
                        <span className="text-[10px] text-emerald-800 font-bold block mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          تطبيق قواعد المداولة الرسمية:
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          {currentAverages.caseDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sub Averages Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-right">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">معدل السداسي الأول</div>
                      <div className="text-sm font-black text-slate-800">{currentAverages.s1_avg.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">معدل السداسي الثاني</div>
                      <div className="text-sm font-black text-slate-800">{currentAverages.s2_avg.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 text-right border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">معدل الفئة 1 (الأساسية)</div>
                      <div className={`text-sm font-black ${currentAverages.cat1_avg >= 10 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {currentAverages.cat1_avg.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">معدل الفئة 2 (الأفقية)</div>
                      <div className={`text-sm font-black ${currentAverages.cat2_avg >= 10 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {currentAverages.cat2_avg.toFixed(2)}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SMART ADVISOR TRIGGER CARD */}
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-700/40 rounded-full filter blur-xl"></div>
                <div className="absolute top-2 left-2">
                  <Sparkles className="w-5 h-5 text-emerald-300 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    المستشار الأكاديمي الذكي
                  </h3>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    احصل على تحليل فوري ومفصل لوضعك الدراسي، الأسباب القانونية للنتيجة، نصائح مخصصة للامتحانات الاستدراكية، وكيفية التغلب على الديون.
                  </p>
                </div>

                <button
                  onClick={handleGetAdvisorReport}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  اشرح لي وضعي الأكاديمي
                </button>
              </div>

              {/* SAVE TO DATABASE PANEL */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-700" />
                  حفظ النتائج في السجل العام
                </h3>
                <p className="text-xs text-slate-500">
                  احفظ علاماتك الحالية في قاعدة بيانات المدرسة السحابية للرجوع إليها لاحقاً أو لمقارنتها بمعدلات زملائك.
                </p>

                <form onSubmit={handleSaveResult} className="space-y-3 text-right">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">اسم الطالب</label>
                    <input
                      type="text"
                      placeholder="أدخل اسمك الكامل"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        حفظ النتيجة في السجل
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* ACADEMIC CONDITIONS CHECKS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-emerald-700" />
                  شروط الانتقال والمداولات الرسمية
                </h3>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">المعدل السنوي العام ≥ 10.00</span>
                    {currentAverages.annual_avg >= 10 ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 font-bold" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">معدل الفئة 1 (الأساسية) ≥ 10.00</span>
                    {currentAverages.cat1_avg >= 10 ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 font-bold" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">معدل الفئة 2 (الأفقية) ≥ 10.00</span>
                    {currentAverages.cat2_avg >= 10 ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 font-bold" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">خالٍ من العلامات الإقصائية (&lt; 10)</span>
                    {!currentAverages.hasEliminatory ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 font-bold" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">خالٍ من علامة الصفر (0.00)</span>
                    {!currentAverages.hasZero ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 font-bold" />
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-white font-bold">
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            <span>نظام حساب معدلات المدرسة العليا للأساتذة بالجزائر (ESSE Algeria)</span>
          </div>
          <p className="text-xs max-w-2xl mx-auto leading-relaxed">
            تم تطوير هذا النظام الأكاديمي لمساعدة طلبة المدرسة العليا للأساتذة في حساب معدلاتهم ومحاكاة الدورة الاستدراكية بدقة متناهية وفق قوانين المداولات الرسمية لوزارة التعليم العالي والبحث العلمي الجزائرية.
          </p>
          <div className="text-[10px] text-slate-500">
            حقوق النشر © {new Date().getFullYear()} - جميع الحقوق محفوظة لطلبة المدرسة العليا للأساتذة
          </div>
        </div>
      </footer>

      {/* SMART ADVISOR MODAL */}
      {showAdvisorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col text-right">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-emerald-900 text-white rounded-t-3xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg">تحليل المستشار الأكاديمي الذكي</h3>
                  <p className="text-xs text-emerald-200">المرشد الأكاديمي المخصص لطلبة المدارس العليا</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdvisorModal(false)}
                className="p-1.5 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-grow">
              {loadingAdvisor ? (
                <div className="py-12 text-center text-slate-500 space-y-4">
                  <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
                  <div className="font-bold text-slate-700">جاري تحليل درجاتك ومقارنتها بقواعد المداولة...</div>
                  <p className="text-xs text-slate-400">يقوم الذكاء الأكاديمي بصياغة أفضل خطة دراسية لك الآن.</p>
                </div>
              ) : advisorReport ? (
                <div className="space-y-5">
                  
                  {/* Status Banner */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="text-xs text-slate-500 font-bold">الحالة الأكاديمية المفصلة</div>
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      {advisorReport.statusTitle}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {advisorReport.statusExplanation}
                    </p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Strengths */}
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                      <h5 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        نقاط القوة والتميز (≥ 14)
                      </h5>
                      {advisorReport.strengths && advisorReport.strengths.length > 0 ? (
                        <ul className="space-y-1 text-xs text-emerald-950 font-semibold">
                          {advisorReport.strengths.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">لا توجد مواد تفوق 14 حالياً. ركز على زيادة التميز.</p>
                      )}
                    </div>

                    {/* Weaknesses */}
                    <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-2">
                      <h5 className="font-bold text-red-800 text-sm flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        المقاييس الضعيفة والإقصائية
                      </h5>
                      {advisorReport.weaknesses && advisorReport.weaknesses.length > 0 ? (
                        <ul className="space-y-1 text-xs text-red-950 font-semibold">
                          {advisorReport.weaknesses.map((w: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              {w}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">ممتاز! لا توجد لديك أي مقاييس ضعيفة أو إقصائية.</p>
                      )}
                    </div>

                  </div>

                  {/* Remedial Advice */}
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                    <h5 className="font-bold text-orange-800 text-sm flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-orange-600" />
                      خطة الاستدراك والتعويض
                    </h5>
                    <p className="text-xs text-orange-950 leading-relaxed">
                      {advisorReport.remedialAdvice}
                    </p>
                  </div>

                  {/* Actionable Tips */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      نصائح وإرشادات عملية فورية
                    </h5>
                    <ul className="space-y-1.5">
                      {advisorReport.actionableTips && advisorReport.actionableTips.map((tip: string, idx: number) => (
                        <li key={idx} className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-700 border border-slate-100 leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Motivational Quote */}
                  <div className="pt-4 border-t border-slate-100 text-center italic text-xs text-slate-500 font-medium">
                    {advisorReport.motivationalQuote}
                  </div>

                </div>
              ) : (
                <div className="p-6 text-center text-red-500">
                  حدث خطأ أثناء تحميل تقرير المستشار. الرجاء المحاولة مجدداً.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-3xl">
              <button
                onClick={() => setShowAdvisorModal(false)}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-all"
              >
                إغلاق التحليل
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
