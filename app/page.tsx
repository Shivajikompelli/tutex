'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Atom, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, User, Phone, Mail } from 'lucide-react';

export default function RegistrationPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [alreadySubmittedInfo, setAlreadySubmittedInfo] = useState<{
    submissionId: string;
    examTitle: string;
    status: string;
  } | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Candidate full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    const phonePattern = /^[0-9+\-\s()]{7,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!phonePattern.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid mobile number (min 7 digits)';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailPattern.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/exam/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          mobile_number: formData.phone.trim(),
          email: formData.email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      if (data.alreadySubmitted) {
        setAlreadySubmittedInfo({
          submissionId: data.submissionId,
          examTitle: data.examTitle,
          status: data.status,
        });
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_submission_id', data.submissionId);
        localStorage.setItem('active_exam_id', data.examId);
      }

      if (data.isResuming) {
        router.push(`/exam?submission_id=${encodeURIComponent(data.submissionId)}`);
      } else {
        router.push(`/instructions?submission_id=${encodeURIComponent(data.submissionId)}`);
      }
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg">
        {/* Header Badge & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Atom className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            Cyclotron Physics • NEET Preparation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            NEET Physics Mock Test
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Intermediate Student Assessment Series conducted by <strong>Cyclotron Physics</strong>.
          </p>
        </div>

        {/* Already Submitted Warning Modal / Box */}
        {alreadySubmittedInfo && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-900">
                  Attempt Already Registered
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  A submission record for <span className="font-semibold">{formData.email}</span> (
                  <span className="font-semibold">{formData.phone}</span>) has already been finalized
                  for <span className="font-semibold">{alreadySubmittedInfo.examTitle}</span>.
                </p>
                <p className="mt-2 text-xs font-medium text-amber-700">
                  Status: {alreadySubmittedInfo.status.toUpperCase()}
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/thank-you?submission_id=${alreadySubmittedInfo.submissionId}`)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                  >
                    View Test Receipt
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Server Error Message */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="font-medium">{serverError}</p>
          </div>
        )}

        {/* Registration Form Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* 1. Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className={`w-full px-3.5 py-2.5 text-base rounded-lg border ${
                  errors.name ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
            </div>

            {/* 2. Mobile Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-500" />
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className={`w-full px-3.5 py-2.5 text-base rounded-lg border ${
                  errors.phone ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone}</p>}
            </div>

            {/* 3. Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. rahul@gmail.com"
                className={`w-full px-3.5 py-2.5 text-base rounded-lg border ${
                  errors.email ? 'border-red-400 bg-red-50/50' : 'border-slate-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Notice */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Single attempt policy strictly enforced. Each student can take this test once with their registered mobile number.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-base font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Preparing Question Paper...
                </>
              ) : (
                <>
                  Proceed to Instructions
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Admin Link */}
        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-xs text-slate-500 hover:text-slate-800 underline transition"
          >
            Academy Faculty / Admin Login
          </a>
        </div>
      </div>
    </main>
  );
}
