"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleGoogleCallback } from "@/lib/auth";

// Separate the component that uses useSearchParams
function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const redirect = async () => {
            try {
                const accessToken = searchParams.get("accessToken");
                const refreshToken = searchParams.get("refreshToken");
                const error = searchParams.get("error");
                
                console.log('Received callback with params:', { 
                    hasAccessToken: !!accessToken, 
                    hasRefreshToken: !!refreshToken,
                    error: error
                });

                if (error) {
                    console.error('Error from OAuth:', error);
                    router.push(`/auth/sign-in?error=${encodeURIComponent(error)}`);
                    return;
                }

                if (!accessToken || !refreshToken) {
                    console.error('Missing tokens in callback');
                    router.push('/auth/sign-in?error=Missing authentication tokens');
                    return;
                }

                const redirectPath = await handleGoogleCallback(accessToken, refreshToken);
                console.log('Redirecting to:', redirectPath);
                
                // Add a small delay before redirect to ensure cookies are set
                setTimeout(() => {
                    router.push(redirectPath);
                }, 100);
            } catch (error) {
                console.error('Error in Google callback:', error);
                router.push('/auth/sign-in?error=' + encodeURIComponent(error.message));
            }
        };

        redirect();
    }, [router, searchParams]);

    return (
        <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
            <p className="text-muted-foreground">Please wait while we redirect you.</p>
        </div>
    );
}

// Main page component with Suspense boundary and error handling
export default function GoogleCallback() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Suspense fallback={
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Loading...</h2>
                    <p className="text-muted-foreground">Please wait...</p>
                </div>
            }>
                <CallbackHandler />
            </Suspense>
        </div>
    );
} 