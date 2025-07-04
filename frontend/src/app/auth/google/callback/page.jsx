"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleGoogleCallback } from '@/lib/auth';
import { toast } from 'sonner';

const GoogleCallbackPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

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
                    error
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
    }, [router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-xl font-semibold mb-4">Processing authentication...</h1>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
};

export default GoogleCallbackPage; 