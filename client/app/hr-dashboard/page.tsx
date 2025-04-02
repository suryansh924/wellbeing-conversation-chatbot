"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // Import useRouter to redirect
import { HRBarChart } from "@/components/hr/BarChart";
import { HRPieChart } from "@/components/hr/PieChart";
import { Sidebar } from "@/components/hr/Sidebar";
import { EmployeeReports } from "@/components/hr/EmployeeReports";
import { BarChart as BarChartIcon, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext"; // Assuming you have an AuthContext

const hrDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const analyticsRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { isLogged, fetchHRProfile, hrData } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLogged) {
        // If the user is not logged in, redirect to login page
        router.push("/"); // Update this path based on your actual login page path
      } else {
        // If logged in, attempt to fetch HR profile
        try {
          await fetchHRProfile();
        } catch (error) {
          console.error("Failed to fetch HR profile:", error);
        }
      }
    };

    checkAuth();
  }, [isLogged, router, fetchHRProfile]);

  useEffect(() => {
    // Simulate loading delay for animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-hr-black overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out overflow-y-auto hr-custom-scrollbar`}
      >
        <div className="p-6 space-y-8">
          {/* Analytics Section */}
          <div id="analytics-section" ref={analyticsRef} className="space-y-6">
            <h2 className="text-2xl font-bold text-hr-green mb-4 flex items-center gap-2">
              <BarChartIcon size={24} className="text-hr-green" />
              ANALYTICS DASHBOARD
            </h2>

            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${
                isLoaded ? "scale-in" : "opacity-0"
              }`}
            >
              <HRPieChart />
              <HRBarChart />
            </div>
          </div>

          {/* Reports Section */}
          <div id="reports-section" ref={reportsRef} className="space-y-6 pt-8">
            <h2 className="text-2xl font-bold text-hr-green mb-4 flex items-center gap-2">
              <FileText size={24} className="text-hr-green" />
              Employee Reports
            </h2>

            <div
              className={`${isLoaded ? "scale-in" : "opacity-0"}`}
              style={{ animationDelay: "0.7s" }}
            >
              <div className="mb-4 flex items-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  <Input
                    className="pl-10 bg-hr-black border border-hr-green/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-hr-green/70 text-gray-200 placeholder:text-gray-500 outline-none"
                    placeholder="Search by employee ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    style={{ boxShadow: "none" }}
                  />
                </div>
              </div>

              <EmployeeReports searchQuery={searchQuery} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default hrDashboard;
