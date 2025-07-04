"use client"
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { setTokens, getRedirectPath, initiateGoogleLogin } from "@/lib/auth";
import axios from "axios";
import { toast } from "sonner";

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/signin`, formData);

      const data = response.data;

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      setTokens(data.accessToken, data.refreshToken);
      router.push(getRedirectPath(data.user.role));
      toast.success('Signed in successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sign in';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const GoogleLoginButton = () => {
    return (
      <Button
        type="button"
        variant="default"
        className="w-full flex items-center justify-center gap-2"
        onClick={initiateGoogleLogin}
      >
        <FcGoogle className="w-5 h-5" />
      <span className="text-black">Sign in with Google</span>
      </Button>
    );
  };

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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-600">Please enter your details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                        placeholder="john@example.com"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    className={`w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium shadow-sm transition-all duration-200 transform hover:translate-y-[-2px] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                    size="default"
                >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="flex items-center my-4">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <p className="mx-4 text-sm text-gray-500">or</p>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <GoogleLoginButton />
            </form>

            <p className="text-center mt-8 text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/sign-up" className="text-black font-medium hover:underline">
                    Sign up
                </Link>
            </p>
        </div>
    </div>
</div>
  );
}