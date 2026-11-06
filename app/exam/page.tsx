'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Cloud,
  ShieldAlert,
  Loader2,
  Atom,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Question, Exam, Student, Submission } from '@/lib/types';

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submission_id');

  // Exam Data
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected Option Map: questionId -> "A" | "B" | "C" | "D"
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline_saved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Server-Authoritative Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tab-switch Proctoring
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const lastSwitchEventTime = useRef<number>(0);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // UI Modals
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isViolationLockout, setIsViolationLockout] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const subIdRef = useRef(submissionId);
  subIdRef.current = submissionId;
  const departureTimestampRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fullscreen Enforcer
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (e) {
      console.warn('Fullscreen entry error:', e);
    }
  }, []);

  // 1. Initial Load & Session Validation
  useEffect(() => {
    const subId =
      submissionId ||
      (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);

    if (!subId) {
      router.push('/');
      return;
    }

    async function loadSession() {
      try {
        const res = await fetch(`/api/exam/session?submission_id=${encodeURIComponent(subId!)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load NEET exam session.');
        }

        if (data.isClosed) {
          router.push(`/thank-you?submission_id=${encodeURIComponent(subId!)}`);
          return;
        }

        setExam(data.exam);
        setStudent(data.student);
        setSubmission(data.submission);
        setQuestions(data.questions);
        setTabSwitchCount(data.tabSwitchCount || 0);
        setRemainingSeconds(data.serverRemainingSeconds);

        let initialAnswers = data.savedAnswers || {};
        if (typeof window !== 'undefined') {
          const offlineBackupRaw = localStorage.getItem(`exam_backup_${subId}`);
          if (offlineBackupRaw) {
            try {
              const offlineBackup = JSON.parse(offlineBackupRaw);
              Object.keys(offlineBackup).forEach((qId) => {
                if (!initialAnswers[qId] && offlineBackup[qId]) {
                  initialAnswers[qId] = offlineBackup[qId];
                }
              });
            } catch (e) {
              console.warn('Could not parse offline backup', e);
            }
          }
        }

        setAnswers(initialAnswers);
        setLoading(false);
      } catch (err: any) {
        alert(err.message || 'Error loading examination.');
        router.push('/');
      }
    }

    loadSession();
  }, [submissionId, router]);

  // 2. Save Answer Routine (MCQ selection)
  const saveAnswer = useCallback(
    async (qIndex: number, optionToSave?: string) => {
      const qList = questionsRef.current;
      if (!qList || qList.length === 0) return;
      const question = qList[qIndex];
      if (!question) return;

      const subId = subIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);
      if (!subId) return;

      const currentAnswers = answersRef.current;
      const selected = optionToSave !== undefined ? optionToSave : currentAnswers[question.id] || '';

      if (typeof window !== 'undefined') {
        const updatedBackup = { ...currentAnswers, [question.id]: selected };
        localStorage.setItem(`exam_backup_${subId}`, JSON.stringify(updatedBackup));
      }

      setSaveStatus('saving');

      try {
        const res = await fetch('/api/exam/save-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: subId,
            question_id: question.id,
            answer_text: selected,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error && data.error.includes('expired')) {
            handleFinalSubmit('timeout');
            return;
          }
          throw new Error(data.error || 'Autosave error');
        }

        if (typeof data.remainingSeconds === 'number') {
          setRemainingSeconds(data.remainingSeconds);
        }

        setSaveStatus('saved');
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (err) {
        console.warn('Autosave network drop, backed up locally:', err);
        setSaveStatus('offline_saved');
      }
    },
    []
  );

  // 3. Periodic Autosave Interval (every 20 seconds)
  useEffect(() => {
    if (loading) return;

    autoSaveIntervalRef.current = setInterval(() => {
      saveAnswer(currentIndexRef.current);
    }, 20000);

    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [loading, saveAnswer]);

  // 4. Server-Authoritative Timer Countdown
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinalSubmit('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  // 5. Finalize Submission Handler
  const handleFinalSubmit = async (reason: 'manual' | 'timeout' | 'tab_violations' = 'manual') => {
    setIsSubmitting(true);
    const subId = subIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);

    try {
      if (questions[currentIndex]) {
        await saveAnswer(currentIndex, answers[questions[currentIndex].id] || '');
      }
    } catch (e) {
      console.warn('Pre-submit save attempt:', e);
    }

    try {
      await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: subId,
          reason,
        }),
        keepalive: true,
      });

      if (typeof window !== 'undefined') {
        window.location.replace(`/thank-you?submission_id=${encodeURIComponent(subId!)}`);
      }
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        window.location.replace(`/thank-you?submission_id=${encodeURIComponent(subId!)}`);
      }
    }
  };

  // 6. Tab-Switch & Fullscreen Proctoring
  const handleTabSwitchEvent = useCallback(
    async (eventType: 'visibility_hidden' | 'window_blur') => {
      if (loading || isSubmitting) return;

      const now = Date.now();
      if (now - lastSwitchEventTime.current < 1200) {
        return;
      }
      lastSwitchEventTime.current = now;

      const subId = subIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);
      if (!subId) return;

      try {
        const res = await fetch('/api/exam/log-tab-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission_id: subId,
            event_type: eventType,
            details: `Detected at ${new Date().toISOString()}`,
          }),
          keepalive: true,
        });

        const data = await res.json();
        const currentCount = data.tabSwitchCount ?? (tabSwitchCount + 1);

        if (data.autoSubmitted || currentCount >= 3) {
          setShowWarningModal(false);
          setIsViolationLockout(true);
          // Auto submit immediately on reaching 3 violations without blocking alert()
          handleFinalSubmit('tab_violations');
          return;
        }

        setTabSwitchCount(currentCount);
        setWarningMessage(`Warning ${currentCount} of 3: Tab or app switching is strictly prohibited.`);
        setShowWarningModal(true);
      } catch (e) {
        console.warn('Failed to log tab switch event:', e);
      }
    },
    [loading, isSubmitting, tabSwitchCount]
  );

  useEffect(() => {
    if (loading) return;

    const onDeparture = (type: 'visibility_hidden' | 'window_blur') => {
      departureTimestampRef.current = Date.now();
    };

    const onReturn = (type: 'visibility_hidden' | 'window_blur') => {
      const elapsed = Date.now() - departureTimestampRef.current;
      if (departureTimestampRef.current > 0 && elapsed > 400) {
        departureTimestampRef.current = 0;
        handleTabSwitchEvent(type);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        onDeparture('visibility_hidden');
        handleTabSwitchEvent('visibility_hidden');
      } else {
        onReturn('visibility_hidden');
      }
    };

    const onPageHide = () => {
      onDeparture('visibility_hidden');
    };

    const onPageShow = () => {
      onReturn('visibility_hidden');
    };

    const onWindowBlur = () => {
      onDeparture('window_blur');
      handleTabSwitchEvent('window_blur');
    };

    const onWindowFocus = () => {
      onReturn('window_blur');
    };

    const onFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        handleTabSwitchEvent('window_blur');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [loading, handleTabSwitchEvent]);

  // 7. Security: Prevent Copy, Paste, Right-Click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast('Right-click is prohibited during the examination.');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast('Copying text is prohibited during the examination.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast('Cutting text is prohibited during the examination.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast('Pasting is prohibited.');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const formatTimer = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleNavigateQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    saveAnswer(currentIndex);
    setCurrentIndex(targetIndex);
  };

  const handleSelectOption = (optionLabel: string) => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: optionLabel }));
    saveAnswer(currentIndex, optionLabel);
  };

  const handleClearResponse = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: '' }));
    saveAnswer(currentIndex, '');
  };

  if (loading || !exam) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading Cyclotron Physics Test...</p>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = currentQuestion ? answers[currentQuestion.id] || '' : '';
  const answeredCount = questions.filter(
    (q) => answers[q.id] && answers[q.id].trim().length > 0
  ).length;

  const isLowTime = remainingSeconds < 300;
  const isCriticalTime = remainingSeconds < 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          {toastMessage}
        </div>
      )}

      {/* FULLSCREEN RE-ENTRY BANNER / MODAL */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-indigo-600 animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Maximize2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              FULLSCREEN MODE REQUIRED
            </h2>
            <p className="text-sm text-slate-600 mt-2 mb-5 leading-relaxed">
              Cyclotron Physics proctoring mandates full screen throughout the NEET assessment.
              Please re-enter full screen to continue answering.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
            >
              Re-enter Full Screen Mode
            </button>
          </div>
        </div>
      )}

      {/* FULL-SCREEN TAB-SWITCH WARNING MODAL */}
      {showWarningModal && !isViolationLockout && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-500 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              PROCTORING VIOLATION DETECTED
            </h2>
            <div className="my-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
              <p className="text-lg font-bold text-amber-900">{warningMessage}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              You left the test window. In accordance with <strong>Cyclotron Physics</strong> NEET examination
              rules, tab-switching is tracked. On your <span className="font-bold text-red-600">3rd violation</span>, your
              test will be terminated and submitted immediately.
            </p>
            <button
              onClick={() => {
                setShowWarningModal(false);
                enterFullscreen();
              }}
              className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-base shadow-md transition cursor-pointer"
            >
              I Understand & Resume Test
            </button>
          </div>
        </div>
      )}

      {/* FULL-SCREEN 3RD VIOLATION LOCKOUT MODAL (NON-CLOSABLE) */}
      {isViolationLockout && (
        <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-red-600 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-red-950 tracking-tight">
              MAXIMUM VIOLATIONS (3) REACHED
            </h2>
            <div className="my-4 p-3.5 bg-red-50 border border-red-300 rounded-xl">
              <p className="text-base font-bold text-red-900">
                Examination Terminated due to Proctoring Policy
              </p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              You have accumulated 3 tab or app switch warnings. Your responses are being recorded and the exam is being automatically submitted.
            </p>
            <div className="flex items-center justify-center gap-2.5 text-indigo-700 font-bold text-sm bg-indigo-50 py-3 rounded-xl border border-indigo-200">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              Finalizing & Submitting Exam...
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Finalize & Submit Test?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Review your progress. Once submitted, you cannot change your responses.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total MCQs:</span>
                <span className="font-bold text-slate-900">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Attempted:</span>
                <span className="font-bold text-emerald-600">
                  {answeredCount} of {questions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unattempted:</span>
                <span className="font-bold text-slate-500">
                  {questions.length - answeredCount}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit('manual')}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-emerald-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Yes, Submit Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP PINNED HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
              <Atom className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Cyclotron Physics — NEET Series
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                  45 MCQs • 45 Marks
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Candidate: <span className="font-semibold text-slate-800">{student?.name}</span> ({student?.phone || student?.roll_number})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={enterFullscreen}
              title={isFullscreen ? 'Fullscreen active' : 'Click to enter fullscreen'}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isFullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}</span>
            </button>

            {/* Autosave Status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Saved {lastSavedTime ? `(${lastSavedTime})` : ''}
                </span>
              )}
              {saveStatus === 'offline_saved' && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Cloud className="w-3.5 h-3.5 text-amber-500" />
                  Local Backup
                </span>
              )}
            </div>

            {/* Tab switch badge */}
            {tabSwitchCount > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-semibold text-amber-800">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Warnings: {tabSwitchCount}/3
              </div>
            )}

            {/* COUNTDOWN TIMER */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold tracking-tight ${
                isCriticalTime
                  ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                  : isLowTime
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Exam
            </button>
          </div>
        </div>
      </header>

      {/* FULL SCREEN DUAL-COLUMN WORKSPACE */}
      <main className="w-full flex-1 p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-5 items-stretch min-h-0">
        
        {/* LEFT / MAIN COLUMN: ACTIVE MCQ & RESPONSES */}
        <section className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-xs flex flex-col justify-between">
          {currentQuestion && (
            <>
              <div>
                {/* Question Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-xl font-black text-indigo-700 tracking-tight">
                      Question {currentQuestion.question_order}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400 font-medium">
                      of {questions.length} Questions
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
                      +{currentQuestion.marks || 1} Mark
                    </span>
                    {selectedOption && (
                      <button
                        type="button"
                        onClick={handleClearResponse}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear Response
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed tracking-normal select-text">
                    {currentQuestion.text}
                  </h2>
                </div>

                {/* Visual / Circuit Diagram Details Box if present */}
                {currentQuestion.visual_content && (
                  <div className="mb-6 p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-xl text-sm">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-indigo-700 mb-1.5">
                      <Atom className="w-4 h-4" />
                      Circuit & Logic Diagram Representation
                    </div>
                    <p className="text-slate-800 font-normal leading-relaxed">
                      {currentQuestion.visual_content}
                    </p>
                  </div>
                )}

                {/* 4 MCQ OPTIONS LIST */}
                <div className="space-y-3.5 mb-6">
                  {(currentQuestion.options || []).map((optText, optIdx) => {
                    const optionKey = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                    const isSelected = selectedOption === optionKey;

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optionKey)}
                        className={`p-4 sm:p-5 rounded-xl border-2 transition flex items-start gap-4 cursor-pointer select-none ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs sm:text-sm transition ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                              : 'border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          {optionKey}
                        </div>

                        <div className="flex-1 text-base sm:text-lg text-slate-800 leading-normal font-normal">
                          {optText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Question Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleNavigateQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="text-xs sm:text-sm text-slate-500 font-medium">
                  {saveStatus === 'saving' ? (
                    <span className="text-indigo-600 font-medium">Saving choice...</span>
                  ) : selectedOption ? (
                    <span className="text-emerald-600 font-semibold">Option ({selectedOption}) selected</span>
                  ) : (
                    <span>Not answered yet</span>
                  )}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(currentIndex + 1)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Save & Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Review & Submit
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        {/* RIGHT / SIDEBAR COLUMN: QUESTION PALETTE & PROGRESS */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-full">
            {/* Palette Header */}
            <div className="border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Question Palette</span>
                <span className="text-xs font-normal text-slate-500 lowercase">45 total</span>
              </h3>
            </div>

            {/* Attempt Summary Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-medium text-emerald-800">Answered</span>
                <span className="font-extrabold text-emerald-700 text-sm">{answeredCount}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="font-medium text-slate-600">Remaining</span>
                <span className="font-extrabold text-slate-800 text-sm">{questions.length - answeredCount}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 inline-block"></span> Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-indigo-600 bg-white inline-block"></span> Current
              </span>
            </div>

            {/* 45 Questions Grid */}
            <div className="flex-1 overflow-y-auto pr-1 max-h-[calc(100vh-360px)] lg:max-h-none">
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id] && answers[q.id].trim().length > 0);
                  const isCurrent = idx === currentIndex;

                  let style = 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                  if (isAnswered) {
                    style = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700';
                  }
                  if (isCurrent) {
                    style = 'ring-2 ring-indigo-500 border-indigo-600 font-black shadow-sm ' + (isAnswered ? 'bg-emerald-600 text-white' : 'bg-indigo-50 text-indigo-900 border-indigo-500');
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleNavigateQuestion(idx)}
                      className={`h-9 sm:h-10 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center transition cursor-pointer ${style}`}
                    >
                      {q.question_order}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Submit inside palette */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submit Test ({answeredCount}/{questions.length} Answered)
              </button>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">Loading Cyclotron Physics Test...</p>
          </div>
        </main>
      }
    >
      <ExamContent />
    </Suspense>
  );
}
