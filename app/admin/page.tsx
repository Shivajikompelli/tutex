'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Download,
  Search,
  Eye,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  X,
  Users,
  CheckCheck,
  AlertCircle,
  Atom,
  Award,
  Check,
  Trash2,
} from 'lucide-react';
import { SubmissionAdminSummary, SubmissionDetail, isOptionMatch } from '@/lib/types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Data states
  const [submissions, setSubmissions] = useState<SubmissionAdminSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Submission Detail Modal
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions');
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load submissions');
      }
      const data = await res.json();
      setSubmissions(data);
      setIsAuthenticated(true);
    } catch (e) {
      console.warn('Submissions load check:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid password.');
      }

      setIsAuthenticated(true);
      fetchSubmissions();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setSubmissions([]);
    setSelectedSubmissionId(null);
    setSubmissionDetail(null);
  };

  const handleViewDetail = async (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}`);
      if (!res.ok) throw new Error('Failed to load candidate response sheet.');
      const data = await res.json();
      setSubmissionDetail(data);
    } catch (err: any) {
      alert(err.message || 'Error loading responses.');
      setSelectedSubmissionId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/admin/export-csv';
  };

  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  const handleCleanData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clean all test submissions and student records? This resets student attempts so fresh candidates can take the exam.'
    );
    if (!confirmed) return;

    setIsCleaning(true);
    try {
      const res = await fetch('/api/admin/clean-data', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to wipe data.');
      alert(data.message || 'All test submissions have been wiped clean.');
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to clean data.');
    } finally {
      setIsCleaning(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const term = searchTerm.toLowerCase();
    const student = s.student || ({} as any);
    return (
      (student.name && student.name.toLowerCase().includes(term)) ||
      (student.phone && student.phone.toLowerCase().includes(term)) ||
      (student.roll_number && student.roll_number.toLowerCase().includes(term)) ||
      (student.email && student.email.toLowerCase().includes(term)) ||
      (s.status && s.status.toLowerCase().includes(term))
    );
  });

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Atom className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900">
            Cyclotron Physics
          </h1>
          <p className="text-sm text-center text-slate-600 mt-1 mb-6">
            Faculty Evaluation & NEET Assessment Dashboard
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Faculty Passcode
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition shadow-sm cursor-pointer"
            >
              {isLoggingIn ? 'Verifying Passcode...' : 'Access Faculty Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-indigo-600 hover:underline">
              Return to Student Test Portal
            </a>
          </div>
        </div>
      </main>
    );
  }

  const totalCount = submissions.length;
  const completedCount = submissions.filter((s) => s.status !== 'in_progress').length;
  const tabViolationCount = submissions.filter((s) => s.tab_switch_count > 0).length;
  const highestScore = submissions.reduce((max, s) => Math.max(max, s.score || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
              <Atom className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Cyclotron Physics — NEET Evaluation Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Intermediate Student Test Series • Proctoring & Marks Overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export All to CSV
            </button>

            <button
              onClick={handleCleanData}
              disabled={isCleaning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isCleaning ? 'Cleaning...' : 'Clean Test Data'}
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Candidates
              </p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tests Finalized
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">{completedCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Highest Score
              </p>
              <p className="text-2xl font-black text-blue-700 mt-0.5">
                {highestScore} <span className="text-xs font-semibold text-slate-400">/ 45</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Proctoring Warnings
              </p>
              <p className="text-2xl font-black text-amber-700 mt-0.5">{tabViolationCount}</p>
            </div>
          </div>
        </div>

        {/* Search Bar & Table Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-bold text-slate-900">Student NEET Submissions</h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, mobile, email..."
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">Student Details</th>
                  <th className="py-3 px-3 text-center">Attempted</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center">Tab Switches</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Submitted At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      {loading ? 'Loading submissions...' : 'No student submissions found.'}
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const student = sub.student || ({} as any);
                    const isTabFlagged = sub.tab_switch_count > 0;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        {/* Student */}
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-xs font-mono text-slate-600">{student.phone || student.roll_number}</p>
                          <p className="text-xs text-slate-400">{student.email}</p>
                        </td>

                        {/* Attempted */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-semibold text-slate-800">
                            {sub.answered_count}
                          </span>
                          <span className="text-xs text-slate-400"> / {sub.total_questions}</span>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            <Award className="w-3.5 h-3.5" />
                            {sub.score || 0} / {sub.total_marks || (sub.total_questions * 1)}
                          </span>
                        </td>

                        {/* Tab Switches */}
                        <td className="py-3.5 px-3 text-center">
                          {isTabFlagged ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              <ShieldAlert className="w-3 h-3" />
                              {sub.tab_switch_count} warnings
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              0 (Clean)
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              sub.status === 'submitted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'auto_submitted_time'
                                ? 'bg-amber-100 text-amber-800'
                                : sub.status === 'auto_submitted_tabs'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {sub.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Submitted At */}
                        <td className="py-3.5 px-3 text-xs text-slate-600 font-mono">
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'In Progress'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleViewDetail(sub.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Responses
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* DETAILED MCQ ANSWERS EVALUATION MODAL */}
      {selectedSubmissionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-3xl">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Student Response Sheet & NEET Score
                </h3>
                {submissionDetail && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {submissionDetail.student?.name} • Mobile: {submissionDetail.student?.phone || submissionDetail.student?.roll_number} •{' '}
                    {submissionDetail.student?.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedSubmissionId(null);
                  setSubmissionDetail(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
              {detailLoading || !submissionDetail ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading candidate responses and evaluation...
                </div>
              ) : (
                <>
                  {/* Score & Submission Overview Box */}
                  {(() => {
                    const evaluatedScore = submissionDetail.questions.reduce((acc, q) => {
                      const ans = submissionDetail.answers[q.id];
                      return acc + (isOptionMatch(ans, q.correct_option) ? (q.marks || 1) : 0);
                    }, 0);

                    const correctCount = submissionDetail.questions.filter((q) => {
                      const ans = submissionDetail.answers[q.id];
                      return isOptionMatch(ans, q.correct_option);
                    }).length;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">NEET Physics Score</span>
                          <p className="text-xl font-black text-indigo-700 mt-0.5">
                            {evaluatedScore} / {submissionDetail.total_marks || (submissionDetail.questions.length * 1) || 45}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Correct MCQs</span>
                          <p className="text-xl font-black text-emerald-700 mt-0.5">
                            {correctCount} <span className="text-xs font-semibold text-slate-400">/ {submissionDetail.questions.length}</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Status</span>
                          <p className="font-bold text-slate-900 uppercase mt-0.5">
                            {submissionDetail.submission.status.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Time Taken / Submitted</span>
                          <p className="font-mono text-slate-800 mt-0.5">
                            {submissionDetail.submission.submitted_at
                              ? new Date(submissionDetail.submission.submitted_at).toLocaleTimeString()
                              : 'In Progress'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Proctoring Timeline */}
                  {submissionDetail.tab_events && submissionDetail.tab_events.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Tab Violations Audit Log ({submissionDetail.tab_events.length} Events)
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs font-mono">
                        {submissionDetail.tab_events.map((ev, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1 px-2 bg-white/70 rounded border border-amber-200/50"
                          >
                            <span className="text-amber-900 font-semibold">{ev.event_type}</span>
                            <span className="text-slate-500">
                              {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candidate MCQ Answers List */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                      MCQ Evaluation & Option Key
                    </h4>

                    <div className="space-y-4">
                      {submissionDetail.questions.map((q) => {
                        const selected = submissionDetail.answers[q.id];
                        const correct = q.correct_option;
                        const isAttempted = Boolean(selected && selected.trim().length > 0);
                        const isCorrect = isAttempted && isOptionMatch(selected, correct);

                        return (
                          <div
                            key={q.id}
                            className={`p-5 border-2 rounded-2xl bg-white shadow-2xs space-y-3 ${
                              !isAttempted
                                ? 'border-slate-200'
                                : isCorrect
                                ? 'border-emerald-200 bg-emerald-50/20'
                                : 'border-red-200 bg-red-50/20'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-indigo-700 uppercase">
                                Question {q.question_order}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                  +{q.marks || 1} Mark
                                </span>
                                {isAttempted ? (
                                  isCorrect ? (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                                      +{q.marks || 1} Correct
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                                      0 Incorrect
                                    </span>
                                  )
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                    Unattempted
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-sm font-medium text-slate-900 leading-relaxed">
                              {q.text}
                            </p>

                            {/* Options with student pick highlighted */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              {(q.options || []).map((opt, optIdx) => {
                                const optKey = ['A', 'B', 'C', 'D'][optIdx];
                                const isUserChoice = isOptionMatch(selected, optKey);
                                const isCorrectChoice = isOptionMatch(correct, optKey);

                                let optBorder = 'border-slate-200 bg-slate-50 text-slate-700';
                                if (isCorrectChoice) {
                                  optBorder = 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900';
                                }
                                if (isUserChoice && !isCorrectChoice) {
                                  optBorder = 'border-red-500 bg-red-50 text-red-900';
                                }

                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optBorder}`}
                                  >
                                    <span>{opt}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isCorrectChoice && (
                                        <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                                          Correct Key
                                        </span>
                                      )}
                                      {isUserChoice && (
                                        <span className={`font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                                          isCorrectChoice ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                                        }`}>
                                          Student Choice
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex justify-end">
              <button
                onClick={() => {
                  setSelectedSubmissionId(null);
                  setSubmissionDetail(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
