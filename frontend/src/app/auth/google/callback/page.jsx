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
                
                console.log('Received callback with params:', { 
                    hasAccessToken: !!accessToken, 
                    hasRefreshToken: !!refreshToken 
                });

                if (!accessToken || !refreshToken) {
                    console.error('Missing tokens in callback');
                    router.push('/auth/sign-in?error=Missing authentication tokens');
                    return;
                }

                const redirectPath = await handleGoogleCallback(accessToken, refreshToken);
                console.log('Redirecting to:', redirectPath);
                router.push(redirectPath);
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

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Callback error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-center text-red-600">
                    <h2>Something went wrong</h2>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => window.location.href = '/auth/sign-in'}>
                        Return to Sign In
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Main page component with Suspense boundary
export default function GoogleCallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <ErrorBoundary>
                <Suspense fallback={
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Loading...</h2>
                        <p className="text-muted-foreground">Please wait...</p>
                    </div>
                }>
                    <CallbackHandler />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
} 