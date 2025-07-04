"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleGoogleCallback } from "@/lib/auth";

export default function GoogleCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");

        const redirect = async () => {
            const redirectPath = await handleGoogleCallback(accessToken, refreshToken);
            router.push(redirectPath);
        };

        redirect();
    }, [router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
                <p className="text-muted-foreground">Please wait while we redirect you.</p>
            </div>
        </div>
    );
} 