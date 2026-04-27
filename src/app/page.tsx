"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const visited = localStorage.getItem("receiptvault_visited");
    if (!visited) {
      setIsFirstVisit(true);
      router.replace("/splash");
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
