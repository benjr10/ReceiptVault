"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPhase(2);
    }, 2000);

    const timer2 = setTimeout(() => {
      localStorage.setItem("receiptvault_visited", "true");
      router.replace("/onboarding");
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {phase === 1 ? (
        <div className="min-h-screen w-full bg-primary flex flex-col items-center justify-center" />
      ) : (
        <div className="min-h-screen w-full bg-neutral-0 flex flex-col items-center justify-center">
          <div className="relative w-[320px] h-[200px]">
            <Image
              src="/icons/brand-identity.svg"
              alt="ReceiptVault"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}