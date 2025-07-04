"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken, getRedirectPath } from '@/lib/auth';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

export default function SocialCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(error || 'Failed to sign in with Google.');
      router.push('/auth/sign-in');
      return;
    }

    if (token) {
      setToken(token);
      try {
        const decoded = jwtDecode(token);
        const redirectPath = getRedirectPath(decoded.role);
        window.location.href = redirectPath; // Use hard navigation
      } catch (e) {
        toast.error('Invalid token received. Please try again.');
        router.push('/auth/sign-in');
      }
    } else {
        toast.error('No token found. Please try logging in again.');
        router.push('/auth/sign-in');
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Please wait, we are signing you in...</p>
    </div>
  );
} 