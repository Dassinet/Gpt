"use client"
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CheckCircle, RotateCcw, Mail } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

// Client component that uses the search params
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Extract email from token if available (you might need to decode it)
    // For now, we'll use a placeholder
    setEmail("user@example.com");
  }, [token]);

  const handleVerify = async (otpValue) => {
    if (otpValue.length !== 6) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/verify-email/${otpValue}`, {
        verificationToken: token
      });

      if (response.data.success) {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        
        // Redirect to sign-in after 1 seconds
        setTimeout(() => {
          router.push('/auth/sign-in');
        }, 1000);
      } else {
        setError(response.data.message || "Invalid verification code");
        toast.error(response.data.message || "Invalid verification code");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Verification failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/resend-verification`, {
        verificationToken: token
      });

      if (response.data.success) {
        toast.success("Verification code sent successfully!");
        setOtp(""); // Clear current OTP
      } else {
        toast.error(response.data.message || "Failed to resend code");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to resend verification code";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    setError("");
    
    // Auto-verify when OTP is complete
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  if (isVerified) {
    return (
      <div className="flex h-screen w-full bg-white">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#02091A] to-[#031555] flex-col items-center relative overflow-hidden py-12">
          <div className="relative z-10 w-full flex justify-center mb-12 mt-8">
            {/* Logo placeholder */}
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center flex-grow px-12 text-center">
            <h1 className="text-5xl font-bold mb-8 text-white">Decision Intelligence Starts Here</h1>
            <p className="text-xl font-medium mb-6 text-white">Welcome to MyGpt-Intelligent AI Dashboards</p>
            <p className="text-lg opacity-90 mb-6 text-[#A1B0C5]">
              Access MyGpt-Intelligent AI Dashboards designed to analyse data, generate insights, and support your operational decisions in real time.
            </p>
            <p className="text-lg italic mb-8 text-[#FBFCFD]">
              From complexity to clarity—in just a few clicks.
            </p>
            <div className="h-1 w-32 bg-[#055FF7] mt-4"></div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-[#031555] to-[#083EA9] opacity-20"></div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-16 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600">Your email has been successfully verified.</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">Redirecting you to sign in...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#055FF7] h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>

            <Link 
              href="/auth/sign-in" 
              className="inline-block mt-6 text-[#055FF7] font-medium hover:underline"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#02091A] to-[#031555] flex-col items-center relative overflow-hidden py-12">
        <div className="relative z-10 w-full flex justify-center mb-12 mt-8">
          {/* Logo placeholder */}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center flex-grow px-12 text-center">
          <h1 className="text-5xl font-bold mb-8 text-white">Decision Intelligence Starts Here</h1>
          <p className="text-xl font-medium mb-6 text-white">Welcome to MyGpt-Intelligent AI Dashboards</p>
          <p className="text-lg opacity-90 mb-6 text-[#A1B0C5]">
            Access MyGpt-Intelligent AI Dashboards designed to analyse data, generate insights, and support your operational decisions in real time.
          </p>
          <p className="text-lg italic mb-8 text-[#FBFCFD]">
            From complexity to clarity—in just a few clicks.
          </p>
          <div className="h-1 w-32 bg-[#055FF7] mt-4"></div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-[#031555] to-[#083EA9] opacity-20"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-16 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-gray-900 font-medium">{email}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center">
                <InputOTP 
                  value={otp} 
                  onChange={handleOtpChange}
                  maxLength={6}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              onClick={() => handleVerify(otp)}
              className={`w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium shadow-sm transition-all duration-200 transform hover:translate-y-[-2px] ${
                isLoading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading || otp.length !== 6}
              size="default"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              
              <Button
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Resending...' : 'Resend Code'}
              </Button>
            </div>
          </div>

          <p className="text-center mt-8 text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/sign-in" className="text-black font-medium hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Add a loading state for Suspense
function LoadingState() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading verification page...</p>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
export default function VerifyEmail() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerifyEmailContent />
    </Suspense>
  );
}