"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { handleGoogleCallback } from '@/lib/auth';
import { toast } from 'sonner';

// Separate component for handling the callback logic
const CallbackHandler = () => {
    const router = useRouter();
    const searchParams = new URLSearchParams(window.location.search);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const accessToken = searchParams.get('accessToken');
                const refreshToken = searchParams.get('refreshToken');
                const error = searchParams.get('error');

                if (error) {
                    toast.error('Authentication failed');
                    router.push('/auth/sign-in');
                    return;
                }

                console.log('Received callback with params:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    error: error || null
                });

                if (!accessToken || !refreshToken) {
                    toast.error('Authentication failed: Missing tokens');
                    router.push('/auth/sign-in');
                    return;
                }

                const redirectPath = await handleGoogleCallback(accessToken, refreshToken);
                router.push(redirectPath);
            } catch (error) {
                console.error('Error in Google callback:', error);
                toast.error('Authentication failed');
                router.push('/auth/sign-in');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-xl font-semibold mb-4">Processing authentication...</h1>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
};

// Loading component
const LoadingCallback = () => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-xl font-semibold mb-4">Loading...</h1>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
};

// Main page component
const GoogleCallbackPage = () => {
    return (
        <Suspense fallback={<LoadingCallback />}>
            <CallbackHandler />
        </Suspense>
    );
};

export default GoogleCallbackPage; 