'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertOctagon,
  Atom,
  Award,
  Loader2,
} from 'lucide-react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submission_id');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subId =
      submissionId ||
      (typeof window !== 'undefined' ? localStorage.getItem('active_submission_id') : null);

    if (!subId) {
      setLoading(false);
      return;
    }

    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/exam/session?submission_id=${encodeURIComponent(subId!)}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch test details.');
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || 'Error loading test receipt.');
      } finally {
        setLoading(false);
      }
    }

    fetchReceipt();
  }, [submissionId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Finalizing Test Submission...</p>
        </div>
      </main>
    );
  }

  const submission = data?.submission;
  const student = data?.student;
  const exam = data?.exam;
  const questions = data?.questions || [];
  const savedAnswers = data?.savedAnswers || {};
  const answeredCount = questions.filter(
    (q: any) => savedAnswers[q.id] && savedAnswers[q.id].trim().length > 0
  ).length;

  const isTabDisqualified = submission?.status === 'auto_submitted_tabs';
  const isTimeout = submission?.status === 'auto_submitted_time';

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Main Status Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Atom className="w-4 h-4 text-indigo-600" />
            Cyclotron Physics
          </div>

          {/* Status Icon */}
          <div className="mx-auto mb-4 flex items-center justify-center">
            {isTabDisqualified ? (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertOctagon className="w-9 h-9 text-red-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isTabDisqualified
              ? 'Test Auto-Submitted'
              : 'Physics Test Completed!'}
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-600">
            {isTabDisqualified
              ? 'Your test was automatically submitted due to repeated tab-switching proctoring violations.'
              : isTimeout
              ? 'The test time limit expired. All recorded responses have been successfully finalized.'
              : 'Thank you! Your NEET Physics responses have been recorded by Cyclotron Physics.'}
          </p>

          {/* Submission Receipt */}
          {submission && (
            <div className="mt-8 text-left bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <span className="font-bold text-slate-800">Test Submission Receipt</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                    isTabDisqualified
                      ? 'bg-red-100 text-red-800'
                      : isTimeout
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {submission.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-bold text-slate-900">{student?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Mobile Number:</span>
                <span className="font-mono font-bold text-slate-900">{student?.phone || student?.roll_number}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="text-slate-800">{student?.email}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Test Series:</span>
                <span className="font-semibold text-slate-900">{exam?.title}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Questions Attempted:</span>
                <span className="font-bold text-slate-900">
                  {answeredCount} of {questions.length} MCQs
                </span>
              </div>

              {/* Evaluated Score */}
              <div className="flex justify-between items-center py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-indigo-900 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Calculated Score:
                </span>
                <span className="font-extrabold text-base text-indigo-700">
                  {typeof submission.score === 'number' ? submission.score : 0} / {questions.length * 4 || 140}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tab-Switch Warnings:</span>
                <span
                  className={`font-bold ${
                    submission.tab_switch_count > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {submission.tab_switch_count} violations logged
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Submitted At:</span>
                <span className="font-mono text-slate-700">
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString()
                    : 'Recorded'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Receipt Reference:</span>
                <span className="truncate max-w-[200px]">{submission.id}</span>
              </div>
            </div>
          )}

          {/* Safe Exit Notice */}
          <div className="mt-8 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Integrity check completed. You may safely close this browser window.</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">Verifying Test Submission...</p>
          </div>
        </main>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
