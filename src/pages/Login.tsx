import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };
    
    checkUser();
  }, [navigate]);

  const checkSupabaseUsers = async () => {
    if (!supabase) {
      setDebugInfo({ error: 'Supabase client not available' });
      return;
    }

    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      // Try to get auth settings (this might fail due to permissions)
      let authSettings = null;
      try {
        const { data: settingsData } = await supabase.auth.getSession();
        authSettings = settingsData;
      } catch (e) {
        authSettings = { error: 'Cannot access auth settings' };
      }

      setDebugInfo({
        timestamp: new Date().toISOString(),
        session: {
          exists: !!sessionData.session,
          user: sessionData.session?.user ? {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            emailConfirmed: !!sessionData.session.user.email_confirmed_at,
            emailConfirmedAt: sessionData.session.user.email_confirmed_at,
            createdAt: sessionData.session.user.created_at,
            lastSignIn: sessionData.session.user.last_sign_in_at,
            role: sessionData.session.user.role,
            userMetadata: sessionData.session.user.user_metadata
          } : null,
          error: sessionError?.message
        },
        user: {
          exists: !!userData.user,
          data: userData.user ? {
            id: userData.user.id,
            email: userData.user.email,
            emailConfirmed: !!userData.user.email_confirmed_at,
            emailConfirmedAt: userData.user.email_confirmed_at,
            createdAt: userData.user.created_at,
            lastSignIn: userData.user.last_sign_in_at
          } : null,
          error: userError?.message
        },
        authSettings,
        testEmail: formData.email || 'No email entered'
      });
      
      setShowDebugInfo(true);
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      setShowDebugInfo(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication not available. Please check your configuration.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          setSuccess('Welcome back! Redirecting to your dashboard...');
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        if (data.user) {
          // Try to create user profile manually if the trigger didn't work
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert([{
                id: data.user.id,
                full_name: formData.fullName,
                email: formData.email,
                role: 'student'
              }]);
            
            if (profileError && !profileError.message.includes('duplicate key')) {
              console.error('Profile creation error:', profileError);
              // Don't throw error here - profile might be created by trigger
            }
          } catch (profileError) {
            console.error('Manual profile creation failed:', profileError);
            // Continue anyway - the trigger might have worked
          }
          
          if (data.user.email_confirmed_at) {
            setSuccess('Account created successfully! You can now sign in.');
            setIsLogin(true);
            setFormData({ email: formData.email, password: '', confirmPassword: '', fullName: '' });
          } else {
            setSuccess('Account created! Please check your email to verify your account before signing in.');
            setFormData({ email: formData.email, password: '', confirmPassword: '', fullName: '' });
          }
        }
      }
    } catch (error: any) {
      console.error('Signup error details:', error);
      
      // Handle specific database errors
      if (error.message?.includes('Database error') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        setError('Database setup incomplete. The user_profiles table may not exist yet. Please contact your administrator or check the database migration.');
      } else if (error.message?.includes('duplicate key') || error.message?.includes('already registered')) {
        setError('An account with this email already exists. Please try signing in instead.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. If you just signed up, please check your email to verify your account first.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the verification link before signing in.');
      } else if (error.message?.includes('User not found')) {
        setError('No account found with this email. Please sign up first.');
      } else {
        setError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const sassyMessages = {
    login: [
      "Welcome back, attendance wizard! ✨",
      "Ready to track some attendance like a boss? 💪",
      "Time to make attendance management look easy! 🎯",
      "Your students are waiting... let's do this! 🚀"
    ],
    signup: [
      "Join the attendance revolution! 🌟",
      "Ready to become an attendance superhero? 🦸‍♀️",
      "Let's make attendance tracking actually fun! 🎉",
      "Welcome to the future of attendance management! 🔮"
    ]
  };

  const currentMessage = isLogin 
    ? sassyMessages.login[Math.floor(Math.random() * sassyMessages.login.length)]
    : sassyMessages.signup[Math.floor(Math.random() * sassyMessages.signup.length)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/ACE Logo.jpeg" 
              alt="ACE Logo" 
              className="h-16 w-auto object-contain"
            />
            <Sparkles className="h-6 w-6 text-yellow-500 ml-2 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ACE Attendance
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            {currentMessage}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your awesome name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="your.email@school.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your secret password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-blue-500'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white focus:ring-purple-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : (
                <span>{isLogin ? 'Sign In & Start Tracking! 🚀' : 'Create My Account! ✨'}</span>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            {!isLogin && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-700">
                  📧 After signing up, you may need to verify your email address before you can sign in.
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              {isLogin ? "New to ACE Attendance?" : "Already have an account?"}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                  setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isLogin ? 'Create an account' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </div>

        {/* Debug Info Modal */}
        {showDebugInfo && debugInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Database className="h-6 w-6 mr-2 text-blue-600" />
                    Supabase User Verification Status
                  </h2>
                  <button
                    onClick={() => setShowDebugInfo(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {debugInfo.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-red-800">Error</span>
                      </div>
                      <p className="text-red-700 mt-1">{debugInfo.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Current Session */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                          {debugInfo.session?.exists ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          Current Session
                        </h3>
                        {debugInfo.session?.user ? (
                          <div className="text-sm text-blue-800 space-y-1">
                            <p><strong>Email:</strong> {debugInfo.session.user.email}</p>
                            <p><strong>Email Verified:</strong> 
                              {debugInfo.session.user.emailConfirmed ? (
                                <span className="text-green-600 ml-1">✅ Yes ({debugInfo.session.user.emailConfirmedAt})</span>
                              ) : (
                                <span className="text-red-600 ml-1">❌ No - Check your email for verification link</span>
                              )}
                            </p>
                            <p><strong>User ID:</strong> {debugInfo.session.user.id}</p>
                            <p><strong>Created:</strong> {new Date(debugInfo.session.user.createdAt).toLocaleString()}</p>
                            <p><strong>Last Sign In:</strong> {debugInfo.session.user.lastSignIn ? new Date(debugInfo.session.user.lastSignIn).toLocaleString() : 'Never'}</p>
                          </div>
                        ) : (
                          <p className="text-blue-800 text-sm">No active session</p>
                        )}
                        {debugInfo.session?.error && (
                          <p className="text-red-600 text-sm mt-2">Error: {debugInfo.session.error}</p>
                        )}
                      </div>

                      {/* Test Email Status */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Test Email</h3>
                        <p className="text-sm text-gray-700">{debugInfo.testEmail}</p>
                        {formData.email && (
                          <div className="mt-2">
                            {debugInfo.session?.user?.email === formData.email ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">This email matches your current session</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-orange-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">This email doesn't match your current session</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Troubleshooting */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-medium text-yellow-900 mb-2">🔧 Troubleshooting</h3>
                        <div className="text-sm text-yellow-800 space-y-2">
                          {!debugInfo.session?.exists && (
                            <p>• No active session - you need to sign in</p>
                          )}
                          {debugInfo.session?.user && !debugInfo.session.user.emailConfirmed && (
                            <p>• ⚠️ Email not verified - check your email for verification link</p>
                          )}
                          {debugInfo.session?.user?.emailConfirmed && (
                            <p>• ✅ Email is verified - login should work</p>
                          )}
                          <p>• If you can't find the verification email, check your spam folder</p>
                          <p>• You can also disable email confirmation in Supabase dashboard</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="text-xs text-gray-500 border-t pt-2">
                    Generated: {debugInfo.timestamp}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">✨ What you'll get with ACE Attendance:</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-500">
            <span>📱 QR Code Scanning</span>
            <span>📊 Smart Analytics</span>
            <span>📋 Easy Reports</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;