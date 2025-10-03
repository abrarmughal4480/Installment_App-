"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const headerAnimation = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize animation
    if (headerAnimation.current) {
      headerAnimation.current.style.transform = 'translateY(0)';
    }

    // Check if user is already logged in
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          // Redirect both admin and manager to the same dashboard page
          router.push('/dashboard');
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Call backend API for authentication - try admin first, then manager
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      // Try admin login first
      let response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          type: 'admin'
        }),
      });

      let data = await response.json();

      // If admin login fails, try manager login
      if (!data.success) {
        response = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            type: 'manager'
          }),
        });
        data = await response.json();
      }

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Also set token in cookies for middleware access
        document.cookie = `authToken=${data.token}; path=/; max-age=86400; secure; samesite=strict`;
        
        // Redirect both admin and manager to the same dashboard page
        router.push("/dashboard");
      } else {
        setError(data.message || "Invalid credentials. Please check your email and password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const colors = {
    background: '#F1F5F9',
    cardBackground: '#FFFFFF',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#1E40AF',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    text: '#0F172A',
    lightText: '#64748B',
    inputBackground: '#F8FAFC',
    border: '#E2E8F0',
    focusBorder: '#3B82F6',
    shadow: 'rgba(15, 23, 42, 0.08)',
    gradientStart: '#3B82F6',
    gradientEnd: '#1E40AF',
    glass: 'rgba(255, 255, 255, 0.95)'
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="w-full max-w-lg px-8">
        <div 
          className="w-full px-10 py-8 rounded-2xl shadow-lg"
          style={{ 
            backgroundColor: colors.cardBackground,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Header Section */}
          <div className="text-center mb-4">
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text, letterSpacing: '-0.3px' }}
            >
              Login
            </h2>
            <p 
              className="text-sm font-medium"
              style={{ color: colors.lightText, letterSpacing: '0.2px' }}
            >
              Access manager dashboard to manage the system
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
            {/* Email Input */}
            <div className="relative w-full max-w-sm">
              <div
                className={`w-full px-4 py-3 rounded-full flex items-center transition-all duration-200 ${
                  isEmailFocused ? 'shadow-lg' : 'shadow-md'
                }`}
                style={{
                  borderWidth: '2px',
                  borderColor: isEmailFocused ? colors.focusBorder : colors.border,
                  backgroundColor: colors.inputBackground,
                  minHeight: '48px',
                  height: '48px',
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  className="flex-1 text-base font-medium border-0 outline-none bg-transparent"
                  style={{ color: colors.text }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative w-full max-w-sm">
              <div
                className={`w-full px-4 py-3 rounded-full flex items-center transition-all duration-200 ${
                  isPasswordFocused ? 'shadow-lg' : 'shadow-md'
                }`}
                style={{
                  borderWidth: '2px',
                  borderColor: isPasswordFocused ? colors.focusBorder : colors.border,
                  backgroundColor: colors.inputBackground,
                  minHeight: '48px',
                  height: '48px',
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className="flex-1 text-base font-medium border-0 outline-none bg-transparent"
                  style={{ color: colors.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 ml-2"
                >
                  <svg 
                    className="w-5 h-5" 
                    style={{ color: colors.lightText }} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="w-full max-w-sm">
              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className={`w-full py-3 px-6 rounded-full font-semibold text-lg flex items-center justify-center transition-all duration-200 ${
                  isLoading || !email.trim() || !password.trim()
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  letterSpacing: '0.3px',
                  minHeight: '48px',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
