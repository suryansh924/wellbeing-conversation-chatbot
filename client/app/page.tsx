"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import HrAuthModal from "@/components/HrAuthModal";
import Loader from "@/components/ui/Loader"; // Update the path to the correct location of the Loader component
// import ContentLoader from "@/components/ui/ContentLoader";
const Index: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const { signInModalVisible, setSignInModalVisible } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // State to control loader visibility

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Simulate loading time and then hide the loader
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Calculate opacity and transform values based on scroll position
  const gradientOpacity = Math.max(0, Math.min(1, 1 - scrollY / 600));
  const transformValue = `translateY(${Math.min(scrollY * 0.2, 100)}px)`;

  // Show full-screen loader while loading
  if (isLoading) {
    return <Loader fullScreen size="large" />;
  }

  return (
    <div className="w-full min-h-screen bg-black relative overflow-hidden">
      {/* Background image with scroll behavior */}
      <div
        className="w-full h-[800px] absolute left-0 top-0 pointer-events-none z-10 transition-all duration-300 ease-out"
        style={{
          backgroundImage: "url('/assets/Gradient.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: gradientOpacity,
          transform: transformValue,
        }}
      />

      {/* Content container */}
      <div className="max-w-[1440px] relative mx-auto px-6">
        <nav className="flex justify-between items-center py-6 z-10">
          <div className="flex items-center gap-2 w-full max-w-[1170px] mx-auto justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#00805A] to-[#86BC25]"></div>
              </div>
              <span className="text-white text-xl font-semibold">
                MoodPulse
              </span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              <a
                href="#features"
                className="text-white/90 hover:text-white text-base font-medium"
              >
                Features
              </a>
              <a
                href="#usecases"
                className="text-white/90 hover:text-white text-base font-medium"
              >
                Usecases
              </a>
              <a
                href="#pricing"
                className="text-white/90 hover:text-white text-base font-medium"
              >
                Pricing
              </a>
              <a
                href="#changelog"
                className="text-white/90 hover:text-white text-base font-medium"
              >
                Changelog
              </a>
              <a
                href="#customers"
                className="text-white/90 hover:text-white text-base font-medium"
              >
                Customers
              </a>
            </div>

            <Button
              variant="outline"
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 cursor-pointer"
              onClick={() => setSignInModalVisible(true)}
            >
              Sign up
            </Button>
          </div>
        </nav>

        <main className="flex flex-col min-h-screen vertical-align-middle gap-16 max-md:flex-col ml-20">
          <div className="flex justify-between items-center gap-16 pt-0 pb-10 max-md:flex-col min-h-[80vh]">
            <div className="flex flex-col items-start gap-8 max-w-[497px] z-10">
              <h1 className="text-[88px] font-normal leading-[88px] tracking-[-5.28px] text-white max-md:text-[64px] max-sm:text-5xl">
                Professional
                <br />
                <span className="text-gradient-white">Gradients</span>
              </h1>
              <p className="text-white/95 text-xl leading-[30px] font-medium max-md:text-lg max-sm:text-base">
                Elevate your HR team with MoodPulse – an intelligent chatbot
                designed to monitor employee wellbeing, track mental health, and
                foster a positive workplace culture.
              </p>
              <div className="flex gap-10">
                <AuthModal />
                <HrAuthModal />
              </div>
            </div>

            {/* dashboard preview */}
            <div className="flex-1 max-w-[650px] relative z-0">
              <div className="flex w-full h-[650px] flex-col justify-between items-center border bg-[rgba(0,0,0,0.8)] p-4 rounded-3xl border-[rgba(255,255,255,0.12)] overflow-hidden shadow-2xl">
                <div className="flex w-full h-full items-start bg-[rgba(30,30,30,0.9)] rounded-2xl overflow-hidden">
                  {/* You can add an inline loader here if content is loading */}
                  {/* {contentLoading && <div className="p-4"><Loader size="small" /></div>} */}
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-16 border-t border-white/10">
          <div className="max-w-[1170px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#00805A] to-[#86BC25]"></div>
                  </div>
                  <span className="text-white text-xl font-semibold">
                    MoodPulse
                  </span>
                </div>
                <p className="text-white/70 max-w-[340px]">
                  Empowering HR teams to build healthier workplaces through
                  AI-driven employee wellness monitoring.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-10"></div>
            </div>

            <div className="mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-white/50 text-sm">
                © 2023 MoodPulse. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {/* Social media icon */}
                </a>
                {/* More social media icons */}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;