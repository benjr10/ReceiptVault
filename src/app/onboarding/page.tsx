"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const slides = [
  {
    image: "/icons/onboard-animation1.svg",
    title: "Track Your Expenses",
    subtitle: "Snap receipts, log expenses in seconds and stay organized.",
  },
  {
    image: "/icons/onboard-animation2.svg",
    title: "Log Expenses in Under 10 Seconds",
    subtitle: "Enter amount, pick a category, and you're done. No spreadsheets. No stress.",
  },
  {
    image: "/icons/onboard-animation3.svg",
    title: "Generate Tax Reports",
    subtitle: "All your expenses organized, categorized, and ready as a clean report anytime.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push("/login");
    }
  };

  const handleSkip = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-8">
        <div className="flex justify-end">
          <button
            onClick={handleSkip}
            className="text-primary font-medium text-sm py-2 px-4"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center mt-4">
          <div className="relative w-full max-w-[320px] h-[280px] mb-8">
            <Image
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-[28px] font-semibold text-primary text-center mb-3 leading-tight">
            {slides[currentSlide].title}
          </h1>

          <p className="text-surface-500 text-center text-sm leading-relaxed px-4 max-w-[280px]">
            {slides[currentSlide].subtitle}
          </p>
        </div>
      </div>

      <div className="px-6 pb-10">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                  ? "bg-primary w-6"
                  : "bg-surface-300"
                }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-primary text-white font-semibold py-4 rounded-xl transition-all hover:bg-primary-600 active:scale-[0.98]"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}