import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, BookOpen, Award, Shield, Brain, Zap, BarChart3, Globe, Layers, Target, Flame } from "lucide-react";
import { MODULES, LEVEL_STYLES } from "../data/academyData";
import type { Lesson } from "../data/academyData";

export { BookOpen, Shield, Brain, Zap, BarChart3, Globe, Target, Flame };

export default function TradingAcademy() {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");
  const [selectedLesson, setSelectedLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);
  const [expandedSubLesson, setExpandedSubLesson] = useState<number>(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [levelFilter, setLevelFilter] = useState("ALL");

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const progress = Math.round((completedLessons.size / totalLessons) * 100);

  const filteredModules = useMemo(() => {
    if (levelFilter === "ALL") return MODULES;
    return MODULES.filter((m) => m.level === levelFilter);
  }, [levelFilter]);

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const handleQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const submitQuiz = () => setQuizSubmitted(true);
  const resetQuiz = () => { setQuizAnswers({}); setQuizSubmitted(false); };

  const openLesson = (moduleId: string, lesson: Lesson) => {
    setSelectedLesson({ moduleId, lesson });
    setExpandedSubLesson(0);
    setQuizMode(false);
    resetQuiz();
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">🎓</span>}
          title="Trading Academy"
          subtitle="Formez-vous au trading crypto avec notre académie structurée. Des bases de l’analyse technique aux stratégies avancées, progressez à votre rythme."
          accentColor="blue"
          steps={[
            { n: "1", title: "Choisissez votre niveau", desc: "Filtrez les modules par niveau : Débutant, Intermédiaire ou Avancé. Commencez par les bases si vous débutez." },
            { n: "2", title: "Suivez les leçons", desc: "Chaque module contient plusieurs leçons structurées. Cochez les leçons terminées pour suivre votre progression." },
            { n: "3", title: "Pratiquez", desc: "Après chaque module, mettez en pratique les concepts appris sur le simulateur de trading avant de risquer du capital réel." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1300px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🎓 Trading Academy
            </h1>
            <p className="text-gray-500 mt-3 text-lg">La formation trading crypto la plus complète au monde — Du débutant à l&apos;expert</p>
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <span className="bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1 text-xs text-blue-400 font-bold">{MODULES.length} Modules</span>
              <span className="bg-purple-500/10 border border-purple-500/25 rounded-full px-4 py-1 text-xs text-purple-400 font-bold">{totalLessons} Leçons</span>
              <span className="bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1 text-xs text-amber-400 font-bold">
                {MODULES.reduce((s, m) => s + m.lessons.reduce((s2, l) => s2 + l.subLessons.length, 0), 0)} Chapitres
              </span>
              <span className="bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1 text-xs text-emerald-400 font-bold">
                {MODULES.reduce((s, m) => s + m.lessons.reduce((s2, l) => s2 + l.quiz.length, 0), 0)} Questions Quiz
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Votre Progression</h2>
              </div>
              <span className="text-sm font-bold text-blue-400">{completedLessons.size}/{totalLessons} leçons</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{progress}% complété</span>
              <span className="text-xs text-gray-500">
                {progress === 100 ? "🏆 Félicitations ! Formation terminée !" : progress > 75 ? "🔥 Presque fini !" : progress > 50 ? "💪 Plus de la moitié !" : progress > 25 ? "📈 Bon début !" : "🚀 C'est parti !"}
              </span>
            </div>
          </div>

          {/* Level Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {["ALL", "Débutant", "Intermédiaire", "Avancé", "Expert"].map((l) => (
              <button key={l} onClick={() => setLevelFilter(l)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${levelFilter === l ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {l === "ALL" ? `Tous (${MODULES.length})` : `${l} (${MODULES.filter((m) => m.level === l).length})`}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Module List */}
            <div className="lg:col-span-1 space-y-3">
              {filteredModules.map((mod) => {
                const isExpanded = expandedModule === mod.id;
                const moduleCompleted = mod.lessons.every((l) => completedLessons.has(l.id));
                const done = mod.lessons.filter((l) => completedLessons.has(l.id)).length;
                return (
                  <div key={mod.id} className="bg-slate-900/70 border border-white/5 rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-all text-left">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {moduleCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : mod.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{mod.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${LEVEL_STYLES[mod.level].bg} ${LEVEL_STYLES[mod.level].text}`}>{mod.level}</span>
                          <span className="text-[10px] text-gray-500">{mod.lessons.length} leçons</span>
                          <span className="text-[10px] text-gray-600">{done}/{mod.lessons.length}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-1.5">
                        <p className="text-[11px] text-gray-500 mb-2 px-1">{mod.description}</p>
                        {mod.lessons.map((lesson) => {
                          const isCompleted = completedLessons.has(lesson.id);
                          const isSel = selectedLesson?.lesson.id === lesson.id;
                          return (
                            <button key={lesson.id} onClick={() => openLesson(mod.id, lesson)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isSel ? "bg-blue-500/10 border border-blue-500/30" : "bg-white/[0.02] hover:bg-white/[0.04] border border-transparent"}`}>
                              {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{lesson.icon} {lesson.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Clock className="w-3 h-3 text-gray-600" />
                                  <span className="text-[10px] text-gray-500">{lesson.duration}</span>
                                  <span className="text-[10px] text-gray-600">• {lesson.subLessons.length} chapitres</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Lesson Content */}
            <div className="lg:col-span-2">
              {!selectedLesson ? (
                <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-10 text-center">
                  <Layers className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">Sélectionnez une leçon</h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">Choisissez un module dans le menu de gauche, puis cliquez sur une leçon pour commencer. Commencez par le Module 1 si vous êtes débutant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lesson Header */}
                  <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">{selectedLesson.lesson.icon} {selectedLesson.lesson.title}</h2>
                        <p className="text-sm text-gray-400 mt-1">{selectedLesson.lesson.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedLesson.lesson.duration}</span>
                          <span className="text-xs text-gray-500">{selectedLesson.lesson.subLessons.length} chapitres</span>
                          <span className="text-xs text-gray-500">{selectedLesson.lesson.quiz.length} questions</span>
                        </div>
                      </div>
                      <button onClick={() => toggleComplete(selectedLesson.lesson.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${completedLessons.has(selectedLesson.lesson.id) ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"}`}>
                        {completedLessons.has(selectedLesson.lesson.id) ? "✅ Terminé" : "Marquer terminé"}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setQuizMode(false); resetQuiz(); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!quizMode ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.03] text-gray-500 border border-white/[0.06]"}`}>
                        📖 Contenu
                      </button>
                      <button onClick={() => setQuizMode(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${quizMode ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/[0.03] text-gray-500 border border-white/[0.06]"}`}>
                        🧪 Quiz ({selectedLesson.lesson.quiz.length})
                      </button>
                    </div>
                  </div>

                  {/* Content Mode */}
                  {!quizMode && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.lesson.subLessons.map((sub, i) => (
                          <button key={i} onClick={() => setExpandedSubLesson(i)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${expandedSubLesson === i ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-white"}`}>
                            {i + 1}. {sub.title}
                          </button>
                        ))}
                      </div>

                      {selectedLesson.lesson.subLessons.map((sub, i) => (
                        expandedSubLesson === i && (
                          <div key={i} className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                              {sub.title}
                            </h3>
                            <div className="space-y-4 mb-6">
                              {sub.content.map((p, pi) => (
                                <p key={pi} className="text-sm text-gray-300 leading-relaxed">{p}</p>
                              ))}
                            </div>

                            {sub.example && (
                              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-amber-400 mb-2">💡 Exemple pratique</h4>
                                <p className="text-sm text-gray-300">{sub.example}</p>
                              </div>
                            )}

                            {sub.proTips && sub.proTips.length > 0 && (
                              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-emerald-400 mb-3">🎯 Pro Tips</h4>
                                <ul className="space-y-2">
                                  {sub.proTips.map((tip, ti) => (
                                    <li key={ti} className="flex items-start gap-2 text-xs text-gray-300">
                                      <span className="text-emerald-400 mt-0.5">▸</span>{tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sub.commonMistakes && sub.commonMistakes.length > 0 && (
                              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-red-400 mb-3">⚠️ Erreurs courantes</h4>
                                <ul className="space-y-2">
                                  {sub.commonMistakes.map((err, ei) => (
                                    <li key={ei} className="flex items-start gap-2 text-xs text-gray-300">
                                      <span className="text-red-400 mt-0.5">✗</span>{err}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4 mb-4">
                              <h4 className="text-xs font-bold text-blue-400 mb-3">📌 Points clés à retenir</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {sub.keyPoints.map((point, ki) => (
                                  <div key={ki} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-gray-300">{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {sub.exercise && (
                              <div className="bg-purple-500/[0.06] border border-purple-500/20 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-purple-400 mb-2">📝 Exercice pratique</h4>
                                <p className="text-sm text-gray-300">{sub.exercise}</p>
                              </div>
                            )}

                            <div className="flex justify-between mt-6">
                              <button onClick={() => setExpandedSubLesson(Math.max(0, i - 1))} disabled={i === 0}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                                ← Précédent
                              </button>
                              {i < selectedLesson.lesson.subLessons.length - 1 ? (
                                <button onClick={() => setExpandedSubLesson(i + 1)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20">
                                  Suivant →
                                </button>
                              ) : (
                                <button onClick={() => setQuizMode(true)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                                  🧪 Passer le Quiz →
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {/* Quiz Mode */}
                  {quizMode && (
                    <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-6">🧪 Quiz — {selectedLesson.lesson.title}</h3>
                      <div className="space-y-6">
                        {selectedLesson.lesson.quiz.map((q, qi) => {
                          const answered = quizAnswers[qi] !== undefined;
                          const isCorrect = quizSubmitted && quizAnswers[qi] === q.correct;
                          const isWrong = quizSubmitted && answered && quizAnswers[qi] !== q.correct;
                          return (
                            <div key={qi} className={`p-5 rounded-xl border ${isCorrect ? "bg-emerald-500/[0.06] border-emerald-500/30" : isWrong ? "bg-red-500/[0.06] border-red-500/30" : "bg-white/[0.02] border-white/[0.06]"}`}>
                              <p className="text-sm font-bold text-white mb-3"><span className="text-gray-500 mr-2">Q{qi + 1}.</span>{q.question}</p>
                              <div className="space-y-2">
                                {q.options.map((opt, oi) => {
                                  const isSel = quizAnswers[qi] === oi;
                                  const showCorrect = quizSubmitted && oi === q.correct;
                                  const showWrong = quizSubmitted && isSel && oi !== q.correct;
                                  return (
                                    <button key={oi} onClick={() => handleQuizAnswer(qi, oi)} disabled={quizSubmitted}
                                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${showCorrect ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold" : showWrong ? "bg-red-500/10 text-red-400 border-red-500/30" : isSel ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-white/[0.02] text-gray-400 border-white/[0.04] hover:bg-white/[0.04] hover:text-white"}`}>
                                      <span className="font-mono mr-2 text-xs">{String.fromCharCode(65 + oi)}.</span>{opt}{showCorrect && " ✅"}{showWrong && " ❌"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        {!quizSubmitted ? (
                          <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < selectedLesson.lesson.quiz.length}
                            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            Valider mes réponses
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-bold text-white">
                              Score : {selectedLesson.lesson.quiz.filter((q, i) => quizAnswers[i] === q.correct).length}/{selectedLesson.lesson.quiz.length}
                              {selectedLesson.lesson.quiz.every((q, i) => quizAnswers[i] === q.correct) && " 🏆 Parfait !"}
                            </div>
                            <button onClick={resetQuiz} className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.05] text-gray-400 hover:text-white">🔄 Recommencer</button>
                          </div>
                        )}
                        <button onClick={() => toggleComplete(selectedLesson.lesson.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20">
                          ✅ Marquer terminé
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}