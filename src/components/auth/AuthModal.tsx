import React, { useState, useRef } from 'react';
import { X, Lock, Mail, User, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { validateSignUpFields } from '../../utils/authValidation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission guard to prevent duplicate concurrent auth requests
  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const firebaseReady = isFirebaseConfigured();

  const handleToggleMode = (newMode: 'signin' | 'signup') => {
    setError(null);
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Google Auth error:", err?.code || err?.message || err);
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setError(null);

    const form = e.currentTarget as HTMLFormElement;
    const nameInput = form.elements.namedItem('name') as HTMLInputElement | null;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;
    const confirmPasswordInput = form.elements.namedItem('confirmPassword') as HTMLInputElement | null;

    const actualName = (nameInput?.value && nameInput.value.trim() ? nameInput.value : name) || name;
    const actualEmail = (emailInput?.value && emailInput.value.trim() ? emailInput.value : email) || email;
    const actualPassword = (passwordInput?.value && passwordInput.value.length > 0 ? passwordInput.value : password);
    const actualConfirmPassword = (confirmPasswordInput?.value && confirmPasswordInput.value.length > 0 ? confirmPasswordInput.value : confirmPassword);

    const normalizedEmail = actualEmail.trim().toLowerCase();

    if (mode === 'signup') {
      const validation = validateSignUpFields(actualName, normalizedEmail, actualPassword, actualConfirmPassword);
      if (!validation.isValid) {
        setError(validation.error);
        isSubmittingRef.current = false;
        return;
      }
    } else {
      if (!normalizedEmail) {
        setError('Please enter your email address.');
        isSubmittingRef.current = false;
        return;
      }
      if (!actualPassword) {
        setError('Please enter your password.');
        isSubmittingRef.current = false;
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(actualName.trim(), normalizedEmail, actualPassword);
      } else {
        await signIn(normalizedEmail, actualPassword);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Modal auth error:", err?.code || err?.message || err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233128]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#fdfcf8] rounded-3xl max-w-md w-full p-7 shadow-2xl border border-warm relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-[#2c3333] hover:bg-clay rounded-full transition-colors border border-warm cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-clay text-olive border border-warm">
            <ShieldCheck className="w-3.5 h-3.5 text-olive" /> Firebase Auth Connected
          </div>
          <h3 className="serif text-xl font-bold text-[#2c3333] tracking-tight">
            {mode === 'signin' ? 'Sign In to Nutri Guide' : 'Create Personal Account'}
          </h3>
          <p className="text-xs text-slate-500">
            Access your authenticated dashboard and saved nutrition profile securely.
          </p>
        </div>

        {/* Firebase Config Status Indicator */}
        <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2 border ${
          firebaseReady 
            ? 'bg-clay border-warm text-olive'
            : 'bg-[#faf6f0] border-warm text-[#2c3333]'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-olive shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">
              Firebase Project Connected
            </strong>
            <span>
              Your credentials are saved securely in Firestore and Firebase Authentication.
            </span>
          </div>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#faf6f0] border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#2c3333] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  id="modal-name"
                  autoComplete="name"
                  required
                  placeholder="e.g. Anisur Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-clay border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#2c3333] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                id="modal-email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-clay border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2c3333] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="modal-password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-clay border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#2c3333] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="modal-confirm-password"
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-clay border border-warm rounded-full focus:ring-2 focus:ring-[#5a7d66]/20 focus:border-olive outline-none text-[#2c3333]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 p-0.5 rounded-full transition-colors cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-olive hover:bg-[#4a6854] disabled:opacity-60 rounded-full shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warm"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#fdfcf8] px-2 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 text-sm font-semibold text-[#2c3333] bg-clay hover:bg-white border border-warm rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-olive rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Toggle Mode */}
        <div className="text-center text-xs text-slate-500 pt-1 border-t border-warm">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('signup')}
                className="text-olive font-bold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('signin')}
                className="text-olive font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

