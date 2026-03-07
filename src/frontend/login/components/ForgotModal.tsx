'use client';
// Component: ForgotModal
// Filename: ForgotModal.tsx
// Purpose: Multi-step reset password modal (email -> simulate sent -> change password)
import React, { useState } from 'react';
import { Mail, Lock } from '../../assets/icons';

type Props = { visible: boolean; onClose: () => void };

export default function ForgotModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<'email' | 'sent' | 'old' | 'new'>('email');
  const [email, setEmail] = useState('');

  function sendReset() {
    if (!email) return;
    setStep('sent');
  }

  return (
    <div className={`${visible ? 'flex' : 'hidden'} fixed inset-0 items-center justify-center bg-black/40 z-50`} aria-hidden={!visible}>
      <div className="relative bg-white p-6 rounded-lg w-full max-w-lg border-2 border-blue-600 shadow-lg">
        <button className="absolute right-2 top-2 text-xl" id="forgotClose" onClick={onClose}>
          &times;
        </button>
        <h3 className="text-center text-lg font-semibold">Reset Password</h3>

        {step === 'email' && (
          <div id="forgotStepEmail" className="mt-3">
            <label className="block">Enter your account email</label>
            <div className="flex items-center gap-3 mt-2">
              <Mail className="text-blue-600" size={18} />
              <input id="forgotEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-3 py-2 border rounded-md" />
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button id="sendReset" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={sendReset}>
                Send reset email
              </button>
              <button id="cancelForgot" className="px-4 py-2 border rounded-md" onClick={onClose}>
                Cancel
              </button>
            </div>
            <div id="forgotMsg" className="text-red-600 text-sm mt-2" />
          </div>
        )}

        {step === 'sent' && (
          <div id="forgotStepSent" className="mt-3">
            <p className="text-gray-500">If an account matched that email, a reset link was sent. (Test mode)</p>
            <div className="text-center mt-3">
              <button id="openResetLink" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => setStep('old')}>
                Open reset link
              </button>
              <button id="cancelForgot2" className="px-4 py-2 border rounded-md ml-2" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'old' && (
          <div id="forgotStep1" className="mt-3">
            <label className="block">Old password</label>
            <div className="flex items-center gap-3 mt-2">
              <Lock className="text-blue-600" size={18} />
              <input id="oldPassword" type="password" className="flex-1 px-3 py-2 border rounded-md" />
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button id="verifyOld" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => setStep('new')}>
                Verify
              </button>
              <button id="cancelForgot3" className="px-4 py-2 border rounded-md" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'new' && (
          <div id="forgotStep2" className="mt-3">
            <label className="block">New password</label>
            <div className="flex items-center gap-3 mt-2">
              <Lock className="text-blue-600" size={18} />
              <input id="newPassword" type="password" className="flex-1 px-3 py-2 border rounded-md" />
            </div>
            <label className="block mt-2">Confirm new password</label>
            <div className="flex items-center gap-3 mt-2">
              <Lock className="text-blue-600" size={18} />
              <input id="confirmPassword" type="password" className="flex-1 px-3 py-2 border rounded-md" />
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button id="saveNew" className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={onClose}>
                Save
              </button>
              <button id="backToOld" className="px-4 py-2 border rounded-md" onClick={() => setStep('old')}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
