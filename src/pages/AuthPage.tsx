import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { isAllowedCollegeEmail } from '../config/allowedDomains';
import { RentReuseLogo } from '../components/common/RentReuseLogo';
import {
  ShieldCheck,
  Leaf,
  IndianRupee,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

interface AuthPageProps {
  initialTab?: 'login' | 'signup' | 'admin';
  onSuccess?: () => void;
  setCurrentTab: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialTab = 'login',
  onSuccess,
  setCurrentTab,
}) => {
  const {
    currentUser,
    loginWithPassword,
    adminLoginWithPassword,
    signUpWithEmail,
    sendPasswordReset,
    confirmPasswordReset,
    loginWithSocialAccount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'admin'>(initialTab);

  // Admin Portal Login state
  const [adminEmail, setAdminEmail] = useState('admin@campus.edu');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Sign Up form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState<User['academicYear']>('Sophomore');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Social Auth Modal
  const [socialModalProvider, setSocialModalProvider] = useState<'google' | 'apple' | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [socialDept, setSocialDept] = useState('Computer Science');
  const [socialYear, setSocialYear] = useState<User['academicYear']>('Sophomore');
  const [socialError, setSocialError] = useState('');

  // Forgot & Reset Password 2-Step Modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedDemoCode, setGeneratedDemoCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'admin' && (currentUser.isAdmin || currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
        setCurrentTab('admin');
      } else if (onSuccess) {
        onSuccess();
      } else {
        setCurrentTab('browse');
      }
    }
  }, [currentUser, activeTab, onSuccess, setCurrentTab]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!adminEmail.trim() || !adminPassword) {
      setAdminError('Please enter your authorized administrator email and password.');
      return;
    }
    setAdminLoading(true);
    const result = await adminLoginWithPassword(adminEmail.trim(), adminPassword);
    setAdminLoading(false);
    if (result.success) {
      setAdminPassword('');
      setCurrentTab('admin');
    } else {
      setAdminError(result.error || 'Access denied. Invalid administrator credentials.');
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500 text-rose-600' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500 text-emerald-600' };
  };

  const passwordStrength = calculatePasswordStrength(signupPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const result = await loginWithPassword(loginEmail, loginPassword, rememberMe);
    setLoginLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      else setCurrentTab('browse');
    } else {
      setLoginError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickDemoLogin = async (email: string) => {
    setLoginEmail(email);
    setLoginPassword('Password123!');
    setLoginError('');
    setLoginLoading(true);
    const result = await loginWithPassword(email, 'Password123!', true);
    setLoginLoading(false);
    if (result.success) {
      if (onSuccess) onSuccess();
      else setCurrentTab('browse');
    } else {
      setLoginError(result.error || 'Quick login failed.');
    }
  };

  const validateSignupField = (field: string, value: string) => {
    const errs = { ...signupErrors };
    if (field === 'fullName') {
      if (!value.trim()) errs.fullName = 'Full name is required';
      else if (value.trim().length < 2) errs.fullName = 'Please enter at least 2 characters';
      else delete errs.fullName;
    }
    if (field === 'email') {
      if (!value.trim()) errs.email = 'Email address is required';
      else if (!isAllowedCollegeEmail(value)) errs.email = 'Please enter a valid email address';
      else delete errs.email;
    }
    if (field === 'password') {
      if (value.length < 6) errs.password = 'Password must be at least 6 characters';
      else delete errs.password;
      if (confirmPassword && value !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
      else if (confirmPassword && value === confirmPassword) delete errs.confirmPassword;
    }
    if (field === 'confirmPassword') {
      if (value !== signupPassword) errs.confirmPassword = 'Passwords do not match';
      else delete errs.confirmPassword;
    }
    setSignupErrors(errs);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = 'Full name is required';
    if (!signupEmail.trim()) errs.email = 'Email is required';
    else if (!isAllowedCollegeEmail(signupEmail)) errs.email = 'Please enter a valid email address';
    if (signupPassword.length < 6) errs.password = 'Must be at least 6 characters';
    if (signupPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errs.agreeTerms = 'Please agree to the Terms & Privacy Policy to register';

    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSignupLoading(true);
    const result = await signUpWithEmail({
      email: signupEmail,
      fullName,
      phone: signupPhone,
      department,
      academicYear,
      password: signupPassword,
    });
    setSignupLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      else setCurrentTab('browse');
    } else if (result.error) {
      setSignupErrors({ email: result.error });
    }
  };

  const handleSocialModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialModalProvider) return;
    setSocialError('');

    if (!socialEmail.trim() || !isAllowedCollegeEmail(socialEmail)) {
      setSocialError('Please enter a valid email address.');
      return;
    }
    if (!socialName.trim()) {
      setSocialError('Please enter your name.');
      return;
    }

    const res = loginWithSocialAccount({
      provider: socialModalProvider,
      email: socialEmail,
      fullName: socialName,
      department: socialDept,
      academicYear: socialYear,
    });

    if (res.success) {
      setSocialModalProvider(null);
      if (onSuccess) onSuccess();
      else setCurrentTab('browse');
    } else {
      setSocialError(res.error || 'Could not sign in.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    const res = await sendPasswordReset(forgotEmail);
    setForgotLoading(false);
    if (res.success) {
      if (res.demoResetCode) {
        setGeneratedDemoCode(res.demoResetCode);
        setResetCode(res.demoResetCode);
      }
      setForgotStep('reset');
    } else {
      setForgotError(res.error || 'No account found with that email address.');
    }
  };

  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (newResetPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    setForgotLoading(true);
    const res = await confirmPasswordReset(forgotEmail, resetCode, newResetPassword);
    setForgotLoading(false);
    if (res.success) {
      setLoginEmail(forgotEmail);
      setLoginPassword(newResetPassword);
      setForgotModalOpen(false);
      setForgotStep('request');
    } else {
      setForgotError(res.error || 'Invalid reset code.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        {/* LEFT COLUMN: Branded Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <button
              onClick={() => setCurrentTab('landing')}
              className="text-left cursor-pointer group hover:opacity-95 transition-opacity"
              aria-label="RentReuse Home"
            >
              <RentReuseLogo size="lg" invertOnDark showSubtitle subtitleText="Verified Multi-User Marketplace" />
            </button>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight text-balance">
                Borrow what you need. <br />
                <span className="text-emerald-400">Share what you don&apos;t.</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-sm">
                Complete multi-user peer-to-peer rental marketplace with isolated wishlists, carts, orders, and verified reviews.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    100% Isolated Per-User Accounts
                  </div>
                  <div className="text-[11px] text-emerald-200/70 leading-relaxed">
                    Your wishlist, cart, rental orders, and addresses are strictly bound to your unique user ID.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Daily, Weekly & Monthly Rates (₹ INR)
                  </div>
                  <div className="text-[11px] text-emerald-200/70 leading-relaxed">
                    Transparent Indian Rupee (₹) rental price calculations with refundable security deposits.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Circular Campus Economy
                  </div>
                  <div className="text-[11px] text-emerald-200/70 leading-relaxed">
                    Keep semester gear in active circulation across campus instead of dormitory dumpsters.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 relative z-10 flex items-center justify-between text-[11px] text-emerald-300/80">
            <span>Authenticated Sessions</span>
            <span>·</span>
            <span>Role-Based Security</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Auth Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                User Login
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminError('');
                  setActiveTab('admin');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            </div>

            {/* LOGIN TAB */}
            {activeTab === 'login' && (
              <div className="space-y-4 animate-in fade-in">
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setLoginError('');
                        }}
                        placeholder="Enter your email address"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setForgotStep('request');
                          setForgotError('');
                          setForgotModalOpen(true);
                        }}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setLoginError('');
                        }}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 dark:border-slate-700"
                      />
                      <span>Keep me signed in on this browser</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Log in to RentReuse</span>
                    )}
                  </button>
                </form>

                {/* Quick Multi-User Isolation Verification Accounts */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Quick Test Accounts (Password: Password123!)</span>
                    <span className="text-[10px] font-normal text-slate-500">Isolated DB State</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('aarav.sharma@campus.edu')}
                      className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-600 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Account A (Aarav)</div>
                      <div className="text-[10px] text-slate-500 truncate">aarav.sharma@campus.edu</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('maya.patel@campus.edu')}
                      className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-600 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Account B (Maya)</div>
                      <div className="text-[10px] text-slate-500 truncate">maya.patel@campus.edu</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminError('');
                        setActiveTab('admin');
                      }}
                      className="px-2.5 py-2 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 hover:border-rose-600 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Portal</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">Authorized Admin Login →</div>
                    </button>
                  </div>
                </div>

                <div className="text-center text-xs text-slate-500 pt-1">
                  Want to test with a brand new user account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Create a new account
                  </button>
                </div>
              </div>
            )}

            {/* ADMIN PORTAL LOGIN TAB */}
            {activeTab === 'admin' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950 text-white border border-rose-800/40 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0 text-rose-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold tracking-tight">
                        Rent & Reuse — Admin Portal
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/30">
                        Role-Protected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Restricted to authorized platform administrators. Credentials are verified on the backend with scrypt hashing and role-based access control.
                    </p>
                  </div>
                </div>

                {adminError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{adminError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Administrator Email / ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          setAdminError('');
                        }}
                        placeholder="admin@campus.edu"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Authorized Administrator Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setAdminError('');
                        }}
                        placeholder="Enter authorized administrator password"
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {adminLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Administrator Role...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign In to Admin Dashboard</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Not an administrator?</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    ← Return to Normal User Login
                  </button>
                </div>
              </div>
            )}

            {/* SIGN UP TAB */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          validateSignupField('fullName', e.target.value);
                        }}
                        placeholder="e.g. Alex Johnson"
                        className={`w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white ${
                          signupErrors.fullName ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                    </div>
                    {signupErrors.fullName && (
                      <p className="text-[11px] text-rose-600 mt-1">{signupErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        validateSignupField('email', e.target.value);
                      }}
                      placeholder="e.g. userA@campus.edu or yourname@gmail.com"
                      className={`w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white ${
                        signupErrors.email ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{signupErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department / Major *
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Year of Study *
                    </label>
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="Freshman">Freshman (1st Yr)</option>
                      <option value="Sophomore">Sophomore (2nd Yr)</option>
                      <option value="Junior">Junior (3rd Yr)</option>
                      <option value="Senior">Senior (4th Yr)</option>
                      <option value="Graduate">Graduate / Masters</option>
                      <option value="Faculty">Faculty / Lab Staff</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          validateSignupField('password', e.target.value);
                        }}
                        placeholder="Min 6 characters"
                        className={`w-full px-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white ${
                          signupErrors.password ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        validateSignupField('confirmPassword', e.target.value);
                      }}
                      placeholder="Re-enter password"
                      className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white ${
                        signupErrors.confirmPassword ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                {signupPassword && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Password strength:</span>
                      <span className={`font-semibold ${passwordStrength.color.split(' ')[1]}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color.split(' ')[0] : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}

                {signupErrors.password && <p className="text-[11px] text-rose-600">{signupErrors.password}</p>}
                {signupErrors.confirmPassword && <p className="text-[11px] text-rose-600">{signupErrors.confirmPassword}</p>}

                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-700"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-slate-800 dark:text-slate-200">RentReuse Terms of Service</span> and Deposit Protection Policy.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {signupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating isolated user account...</span>
                    </>
                  ) : (
                    <span>Create Account & Continue</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FORGOT & RESET PASSWORD 2-STEP MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>{forgotStep === 'request' ? 'Forgot Password' : 'Reset Your Password'}</span>
              </h3>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700">
                {forgotError}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter the email address registered with your account to generate a 6-digit password reset verification code.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="yourname@campus.edu"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    {forgotLoading ? 'Generating...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetSubmit} className="space-y-4">
                {generatedDemoCode && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Verification code generated for <strong>{forgotEmail}</strong>:{' '}
                      <code className="font-mono font-bold">{generatedDemoCode}</code>
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit Reset Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password (min 6 characters) *
                  </label>
                  <input
                    type="password"
                    required
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    {forgotLoading ? 'Updating...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
