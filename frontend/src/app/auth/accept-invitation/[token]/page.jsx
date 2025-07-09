"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function AcceptInvitation({ params }) {
  const router = useRouter();
  const { token } = params;
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate-invitation/${token}`
        );
        
        if (response.data.success) {
          setTokenValid(true);
          setEmail(response.data.email);
        } else {
          toast.error("Invalid or expired invitation link");
          setTokenValid(false);
        }
      } catch (error) {
        console.error("Error validating invitation:", error);
        toast.error(error.response?.data?.message || "Invalid or expired invitation link");
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/accept-invitation/${token}`,
        {
          name: formData.name,
          password: formData.password,
        }
      );
      
      if (response.data.success) {
        toast.success("Account setup successful. You can now log in.");
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 1500);
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error(error.response?.data?.message || "Failed to setup account");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-lg animate-pulse">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl h-8 bg-gray-200 dark:bg-gray-700 rounded"></CardTitle>
            <CardDescription className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
          <CardFooter>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle size={50} className="text-red-500" />
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/auth/sign-in")}>
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Complete Your Account</CardTitle>
          <CardDescription>
            You've been invited to join EMSA. Set up your account to get started.
          </CardDescription>
          {email && (
            <div className="mt-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Invited Email: <span className="font-medium text-gray-800 dark:text-gray-200">{email}</span>
              </p>
            </div>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading ? "Processing..." : "Complete Setup"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 