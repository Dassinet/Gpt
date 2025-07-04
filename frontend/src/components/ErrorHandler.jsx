"use client";

import { Button } from "@/components/ui/button";

export function ErrorHandler({ error, resetError }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-red-600">Something went wrong</h2>
                <p className="text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
                <div className="space-x-4">
                    <Button 
                        onClick={() => window.location.href = '/auth/sign-in'}
                        variant="outline"
                    >
                        Return to Sign In
                    </Button>
                    {resetError && (
                        <Button 
                            onClick={resetError}
                            variant="default"
                        >
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
} 