'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
  Save,
  CheckCircle,
  EyeOff,
  Loader2,
  Atom,
} from 'lucide-react';

function InstructionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submission_id');

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subId = submissionId || (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);

    if (!subId) {
      router.push('/');
      return;
    }

    async function fetchDetails() {
      try {
        const res = await fetch(`/api/exam/session?submission_id=${encodeURIComponent(subId!)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch exam session details.');
        }

        if (data.isClosed) {
          router.push(`/thank-you?submission_id=${encodeURIComponent(subId!)}`);
          return;
        }

        setExamData(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load instructions.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [submissionId, router]);

  const handleStartExam = async () => {
    if (!agreed) return;

    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen trigger note:', e);
    }

    const subId = submissionId || (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);
    router.push(`/exam?submission_id=${encodeURIComponent(subId!)}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading NEET Physics Test Instructions...</p>
        </div>
      </main>
    );
  }

  if (error || !examData || !examData.exam || !examData.student) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 shadow-sm text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Session Error</h2>
          <p className="text-sm text-slate-600 mt-2">{error || 'Session could not be verified.'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Return to Registration
          </button>
        </div>
      </main>
    );
  }

  const exam = examData.exam || {};
  const student = examData.student || {};
  const questions = examData.questions || [];

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Exam Card Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wide">
                <Atom className="w-4 h-4 text-indigo-600" />
                Cyclotron Physics • NEET Preparation
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {exam.title || 'Cyclotron Physics — NEET Physics Mock Test Series'}
              </h1>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              {exam.duration_minutes || 45} Minutes
            </div>
          </div>

          {/* Candidate Profile Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <div>
              <p className="text-slate-500 font-medium">Student Name</p>
              <p className="font-bold text-slate-800 mt-0.5">{student.name || 'Candidate'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Mobile Number</p>
              <p className="font-bold text-slate-800 mt-0.5">{student.phone || student.roll_number || 'N/A'}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-slate-500 font-medium">Pattern & Total</p>
              <p className="font-bold text-slate-800 mt-0.5">{questions.length} MCQs (+1 Mark each)</p>
            </div>
          </div>
        </div>

        {/* Detailed Guidelines Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            Test Instructions & Examination Rules
          </h2>

          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            {/* Rule 1: Question Format & Scoring */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <FileCheck2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">NEET MCQ Format & Scoring</h3>
                <p className="mt-0.5 text-slate-600">
                  Each question has 4 options (A, B, C, D). Select one option per question. Each
                  correct question awards <strong>+1 mark</strong> (Total: 45 Marks). You can change your selected
                  option anytime or clear your response before final submission.
                </p>
              </div>
            </div>

            {/* Rule 2: Tab Switching Warning */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-300/80">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-950 flex items-center gap-2">
                  Tab-Switch Detection & 3-Warning Auto-Submit
                </h3>
                <p className="mt-0.5 text-amber-900">
                  Switching tabs, minimizing the browser window, or opening other applications is
                  strictly recorded. A full-screen alert will appear when you return.
                  <span className="font-bold underline ml-1">
                    On the 3rd tab-switch violation, your test will be auto-submitted immediately!
                  </span>
                </p>
              </div>
            </div>

            {/* Rule 3: Server Timer */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">Server-Authoritative Timer</h3>
                <p className="mt-0.5 text-slate-600">
                  The countdown timer starts as soon as you click Start below. Reloading the page
                  resumes with the server clock time. The test auto-submits when the timer reaches 00:00.
                </p>
              </div>
            </div>

            {/* Rule 4: Autosave */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <Save className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900">Continuous Autosave</h3>
                <p className="mt-0.5 text-slate-600">
                  Your selected responses are saved automatically on click and synchronised every
                  20 seconds. An offline backup is stored in browser memory in case of network drops.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgement Checkbox */}
          <div className="pt-4 border-t border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-800 group-hover:text-slate-950 leading-snug">
                I have read all the examination instructions and agree to adhere strictly to the
                proctoring and academic integrity guidelines of Cyclotron Physics.
              </span>
            </label>
          </div>

          {/* Start Exam Button */}
          <div>
            <button
              type="button"
              onClick={handleStartExam}
              disabled={!agreed}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white disabled:text-slate-500 font-semibold rounded-xl shadow-sm transition text-base cursor-pointer disabled:cursor-not-allowed"
            >
              Start Physics Examination
              <ArrowRight className="w-5 h-5" />
            </button>
            {!agreed && (
              <p className="text-center text-xs text-slate-500 mt-2">
                Please check the acknowledgement above to enable the Start button.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function InstructionsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Loading test instructions...</p>
          </div>
        </main>
      }
    >
      <InstructionsContent />
    </Suspense>
  );
}
