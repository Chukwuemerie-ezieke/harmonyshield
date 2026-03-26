import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TrainingCourse, TrainingProgress } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Shield,
  MailWarning,
  KeyRound,
  Database,
  Siren,
  Lock,
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  BarChart3,
  Play,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Shield> = {
  shield: Shield,
  "mail-warning": MailWarning,
  "key-round": KeyRound,
  database: Database,
  siren: Siren,
  lock: Lock,
};

function getIconForCourse(iconName: string | null) {
  if (!iconName) return BookOpen;
  return ICON_MAP[iconName] || BookOpen;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; color: string }
> = {
  completed: {
    label: "Completed",
    variant: "default",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    variant: "secondary",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  },
  not_started: {
    label: "Not Started",
    variant: "outline",
    color: "",
  },
};

function getProgressForCourse(
  courseId: number,
  progressList: TrainingProgress[]
): TrainingProgress | undefined {
  return progressList.find((p) => p.courseId === courseId);
}

function getCourseStatus(
  courseId: number,
  progressList: TrainingProgress[]
): string {
  const p = getProgressForCourse(courseId, progressList);
  return p?.status || "not_started";
}

// Simple markdown renderer - handles ##, ###, **bold**, - list items, \n
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // ### h3
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold mt-4 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // ## h2
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold mt-5 mb-2 border-b pb-1 border-border">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // # h1
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // - list item
    if (trimmed.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 text-sm">
          <span className="text-muted-foreground shrink-0">•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered list items (e.g., "1. ")
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 text-sm">
          <span className="text-muted-foreground shrink-0 font-medium">
            {numberedMatch[1]}.
          </span>
          <span>{renderInline(numberedMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Lines starting with checkmark emoji
    if (trimmed.startsWith("✅") || trimmed.startsWith("❌")) {
      elements.push(
        <p key={i} className="text-sm ml-2">
          {renderInline(trimmed)}
        </p>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  return elements;
}

function renderInline(text: string) {
  // Convert **bold** to <strong>
  const parts: (string | JSX.Element)[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatsCards({
  courses,
  progress,
  loading,
}: {
  courses: TrainingCourse[];
  progress: TrainingProgress[];
  loading: boolean;
}) {
  const completed = progress.filter((p) => p.status === "completed").length;
  const inProgressCount = progress.filter((p) => p.status === "in_progress").length;
  const avgScore =
    completed > 0
      ? Math.round(
          progress
            .filter((p) => p.status === "completed" && p.score != null)
            .reduce((sum, p) => sum + (p.score || 0), 0) / completed
        )
      : 0;

  const stats = [
    {
      title: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: BarChart3,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      title: "Average Score",
      value: avgScore,
      icon: Trophy,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      suffix: "%",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.title}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {s.title}
              </p>
              {loading ? (
                <Skeleton className="h-6 w-12 mt-1" />
              ) : (
                <p className="text-xl font-bold tabular-nums">
                  {s.value}
                  {(s as any).suffix || ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CourseCard({
  course,
  progress,
  onOpen,
}: {
  course: TrainingCourse;
  progress: TrainingProgress | undefined;
  onOpen: () => void;
}) {
  const Icon = getIconForCourse(course.icon);
  const status = progress?.status || "not_started";
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const quizQuestions: QuizQuestion[] = (() => {
    try {
      return JSON.parse(course.quizJson);
    } catch {
      return [];
    }
  })();

  const progressPercent =
    status === "completed"
      ? 100
      : status === "in_progress"
        ? 50
        : 0;

  return (
    <Card
      className="flex flex-col transition-shadow hover:shadow-md cursor-pointer"
      data-testid={`card-course-${course.id}`}
      onClick={onOpen}
    >
      <CardContent className="p-4 flex flex-col flex-1 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 bg-primary/10 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2">
              {course.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.durationMin} min
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            {quizQuestions.length} questions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${statusCfg.color}`}
          >
            {statusCfg.label}
          </Badge>
          {status === "completed" && progress?.score != null && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Score: {progress.score}%
            </span>
          )}
          {status === "failed" && progress?.score != null && (
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              Score: {progress.score}%
            </span>
          )}
        </div>

        {status === "in_progress" && (
          <Progress value={progressPercent} className="h-1.5" />
        )}

        <div className="mt-auto pt-1">
          <Button
            size="sm"
            variant={status === "not_started" ? "default" : "outline"}
            className="w-full text-xs"
            data-testid={`button-course-action-${course.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {status === "not_started" && (
              <>
                <Play className="h-3 w-3 mr-1" /> Start Course
              </>
            )}
            {status === "in_progress" && (
              <>
                <ChevronRight className="h-3 w-3 mr-1" /> Continue
              </>
            )}
            {(status === "completed" || status === "failed") && (
              <>
                <RotateCcw className="h-3 w-3 mr-1" /> Retake
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseDetailDialog({
  course,
  progress,
  open,
  onOpenChange,
}: {
  course: TrainingCourse | null;
  progress: TrainingProgress | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const { toast } = useToast();

  const quizQuestions: QuizQuestion[] = useMemo(() => {
    if (!course) return [];
    try {
      return JSON.parse(course.quizJson);
    } catch {
      return [];
    }
  }, [course]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      courseId: number;
      status: string;
      score: number | null;
      startedAt: string | null;
      completedAt: string | null;
    }) => {
      const res = await apiRequest("POST", "/api/training/progress", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training/progress", 1] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/courses"] });
    },
  });

  const handleStartQuiz = useCallback(() => {
    setShowQuiz(true);
    setAnswers({});
    setSubmitted(false);
    setQuizScore(null);

    // Mark as in_progress if not already started
    if (course && (!progress || progress.status === "not_started")) {
      saveMutation.mutate({
        userId: 1,
        courseId: course.id,
        status: "in_progress",
        score: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      });
    }
  }, [course, progress, saveMutation]);

  const handleSubmitQuiz = useCallback(() => {
    if (!course) return;

    let correct = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
      if (answers[i] === quizQuestions[i].correct) {
        correct++;
      }
    }
    const score = Math.round((correct / quizQuestions.length) * 100);
    const passed = score >= (course.passMark || 70);

    setQuizScore(score);
    setSubmitted(true);

    saveMutation.mutate({
      userId: 1,
      courseId: course.id,
      status: passed ? "completed" : "failed",
      score,
      startedAt: progress?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    toast({
      title: passed ? "Congratulations!" : "Not quite there yet",
      description: passed
        ? `You scored ${score}% — you passed!`
        : `You scored ${score}%. You need ${course.passMark}% to pass. Try again!`,
    });
  }, [course, quizQuestions, answers, progress, saveMutation, toast]);

  const handleSelectAnswer = useCallback(
    (questionIndex: number, optionIndex: number) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    },
    [submitted]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setShowQuiz(false);
        setAnswers({});
        setSubmitted(false);
        setQuizScore(null);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  if (!course) return null;

  const allAnswered = quizQuestions.every((_, i) => answers[i] !== undefined);
  const passed = quizScore !== null && quizScore >= (course.passMark || 70);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {(() => {
              const Icon = getIconForCourse(course.icon);
              return <Icon className="h-4 w-4" />;
            })()}
            {course.title}
          </DialogTitle>
          <DialogDescription>
            {course.durationMin} min • {quizQuestions.length} quiz questions •
            Pass mark: {course.passMark}%
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {!showQuiz ? (
            <div className="space-y-1 pb-4">
              {renderMarkdown(course.contentMd)}
            </div>
          ) : (
            <div className="space-y-5 pb-4">
              {/* Quiz result banner */}
              {submitted && quizScore !== null && (
                <div
                  className={`rounded-lg p-4 flex items-center gap-3 ${
                    passed
                      ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800"
                      : "bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-800"
                  }`}
                >
                  {passed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        passed
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {passed ? "You Passed!" : "Try Again"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your score: {quizScore}% (Pass mark: {course.passMark}%)
                    </p>
                  </div>
                </div>
              )}

              {/* Quiz questions */}
              {quizQuestions.map((question, qi) => {
                const isCorrect =
                  submitted && answers[qi] === question.correct;
                const isWrong =
                  submitted &&
                  answers[qi] !== undefined &&
                  answers[qi] !== question.correct;

                return (
                  <div key={qi} className="space-y-2">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-1">
                        Q{qi + 1}.
                      </span>
                      {question.q}
                    </p>
                    <div className="grid gap-1.5">
                      {question.options.map((option, oi) => {
                        const isSelected = answers[qi] === oi;
                        const isCorrectOption =
                          submitted && oi === question.correct;

                        let optionClasses =
                          "flex items-center gap-2 rounded-lg border p-2.5 text-sm cursor-pointer transition-colors";

                        if (submitted) {
                          if (isCorrectOption) {
                            optionClasses +=
                              " border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50";
                          } else if (isSelected && !isCorrectOption) {
                            optionClasses +=
                              " border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/50";
                          } else {
                            optionClasses +=
                              " border-border opacity-60";
                          }
                        } else {
                          optionClasses += isSelected
                            ? " border-primary bg-primary/5"
                            : " border-border hover:border-primary/50 hover:bg-muted/50";
                        }

                        return (
                          <button
                            key={oi}
                            className={optionClasses}
                            onClick={() => handleSelectAnswer(qi, oi)}
                            disabled={submitted}
                            data-testid={`button-quiz-option-${qi}-${oi}`}
                          >
                            <span
                              className={`flex items-center justify-center h-5 w-5 rounded-full border text-[10px] font-semibold shrink-0 ${
                                isSelected
                                  ? submitted
                                    ? isCorrectOption
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "bg-red-500 border-red-500 text-white"
                                    : "bg-primary border-primary text-primary-foreground"
                                  : isCorrectOption && submitted
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-muted-foreground/30"
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span>{option}</span>
                            {submitted && isCorrectOption && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto shrink-0" />
                            )}
                            {submitted && isSelected && !isCorrectOption && (
                              <XCircle className="h-4 w-4 text-red-600 ml-auto shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-3">
          {!showQuiz ? (
            <Button
              onClick={handleStartQuiz}
              data-testid="button-start-quiz"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Take Quiz
            </Button>
          ) : !submitted ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!allAnswered || saveMutation.isPending}
              data-testid="button-submit-quiz"
            >
              {saveMutation.isPending ? "Submitting..." : "Submit Answers"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                data-testid="button-close-quiz"
              >
                Close
              </Button>
              {!passed && (
                <Button
                  onClick={handleStartQuiz}
                  data-testid="button-retake-quiz"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Training() {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<
    TrainingCourse[]
  >({
    queryKey: ["/api/training/courses"],
  });

  const { data: progressList = [], isLoading: progressLoading } = useQuery<
    TrainingProgress[]
  >({
    queryKey: ["/api/training/progress", 1],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/training/progress/1");
      return res.json();
    },
  });

  const isLoading = coursesLoading || progressLoading;

  const handleOpenCourse = useCallback(
    (course: TrainingCourse) => {
      setSelectedCourse(course);
      setDialogOpen(true);
    },
    []
  );

  const selectedProgress = selectedCourse
    ? getProgressForCourse(selectedCourse.id, progressList)
    : undefined;

  // Overall completion percentage
  const completionPercent =
    courses.length > 0
      ? Math.round(
          (progressList.filter((p) => p.status === "completed").length /
            courses.length) *
            100
        )
      : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Staff Training
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cybersecurity awareness and NDPR compliance training modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Overall completion
          </span>
          <div className="w-32">
            <Progress value={completionPercent} className="h-2" />
          </div>
          <span className="text-xs font-semibold">{completionPercent}%</span>
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        courses={courses}
        progress={progressList}
        loading={isLoading}
      />

      {/* Course grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No training courses available</p>
            <p className="text-xs mt-1">
              Courses will appear here once they are added by your administrator
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={getProgressForCourse(course.id, progressList)}
              onOpen={() => handleOpenCourse(course)}
            />
          ))}
        </div>
      )}

      {/* Course detail dialog */}
      <CourseDetailDialog
        course={selectedCourse}
        progress={selectedProgress}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
