import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../router/routeConstants';
import type { OtpSendRequest, OtpVerifyRequest } from '../types/auth.types';

export default function OtpLoginPage() {
  const { sendOtp, verifyOtp, isLoading, error } = useAuth();
  const navigate   = useNavigate();
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [email, setEmail] = useState('');

  const sendForm   = useForm<OtpSendRequest>();
  const verifyForm = useForm<OtpVerifyRequest>();

  const onSend = async (data: OtpSendRequest) => {
    try {
      await sendOtp(data);
      setEmail(data.email);
      setStep('verify');
    } catch {
      // error shown via useAuth().error
    }
  };

  const onVerify = async (data: OtpVerifyRequest) => {
    try {
      await verifyOtp({ ...data, email });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      // error shown via useAuth().error
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">EduERP</h1>
        <p className="text-gray-500 mt-1">
          {step === 'send' ? 'Sign in with OTP' : 'Enter the code we sent to your email'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 'send' ? (
        <form onSubmit={sendForm.handleSubmit(onSend)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              autoComplete="email"
              {...sendForm.register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@school.edu"
            />
            {sendForm.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{sendForm.formState.errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Sending…' : 'Send OTP'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to={ROUTES.LOGIN} className="text-blue-600 hover:underline">Back to password login</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-5">
          <p className="text-sm text-gray-600">Code sent to <strong>{email}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">One-time code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              {...verifyForm.register('otp', { required: 'Code is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg"
              placeholder="••••••"
            />
            {verifyForm.formState.errors.otp && (
              <p className="text-red-500 text-xs mt-1">{verifyForm.formState.errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <button
            type="button"
            onClick={() => setStep('send')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Change email
          </button>
        </form>
      )}
    </div>
  );
}
