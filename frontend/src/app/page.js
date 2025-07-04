"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Button onClick={() => router.push("/auth/sign-in")} className="mt-4" variant="outline">Get started</Button>
    </div>
  );
}
