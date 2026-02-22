export interface LessonImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface SubLesson {
  title: string;
  content: string[];
  keyPoints: string[];
  proTips?: string[];
  commonMistakes?: string[];
  example?: string;
  exercise?: string;
  images?: LessonImage[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  duration: string;
  description: string;
  subLessons: SubLesson[];
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  lessons: Lesson[];
}

export const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Débutant": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Intermédiaire": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Avancé": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  "Expert": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};
