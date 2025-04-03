"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HRBarChart } from "@/components/hr/BarChart";
import { HRPieChart } from "@/components/hr/PieChart";
import { Sidebar } from "@/components/hr/Sidebar";
import { EmployeeReports } from "@/components/hr/EmployeeReports";
import { BarChart as BarChartIcon, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

interface Employee {
  Employee_ID: string;
  Employee_Name: string;
  Employee_Email: string;
  Employee_Role: string;
  Is_Selected: boolean;
  Sentimental_Score: number;
  Is_Resolved: boolean;
  Report: string;
  Feature_Vector: string;
}

const hrDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { fetchHRProfile, hrData } = useAuth();

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const profile = await fetchHRProfile();
  //       if (!profile) {
  //         router.push("/");
  //       }
  //     } catch (error) {
  //       console.error("Error fetching profile", error);
  //       router.push("/");
  //     }
  //   };
  //   checkAuth();
  // }, [router, hrData]);

  useEffect(() => {
    const fetchAllEmployees = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://127.0.0.1:8000/api/data/employees"
        );
        setEmployees(response.data.employees);
        setError(null);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employee data");
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    };

    fetchAllEmployees();
  }, []);

  // Calculate flagged vs unflagged counts for the pie chart
  const selectedStats = employees.reduce(
    (acc, employee) => {
      if (employee.Is_Selected) {
        acc.selected++;
      } else {
        acc.notSelected++;
      }
      return acc;
    },
    { selected: 0, notSelected: 0 }
  );

  return (
    <div className="flex h-screen bg-hr-black overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 transition-all duration-300 ease-in-out overflow-y-auto hr-custom-scrollbar">
        <div className="p-6 space-y-8">
          {/* Analytics Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-hr-green mb-4 flex items-center gap-2">
              <BarChartIcon size={24} className="text-hr-green" />
              ANALYTICS DASHBOARD
            </h2>

            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${
                isLoaded ? "scale-in" : "opacity-0"
              }`}
            >
              {loading ? (
                <div className="col-span-2 flex items-center justify-center h-64">
                  <p className="text-hr-green">Loading data...</p>
                </div>
              ) : error ? (
                <div className="col-span-2 flex items-center justify-center h-64">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <>
                  <HRPieChart
                    flaggedCount={selectedStats.selected}
                    unflaggedCount={selectedStats.notSelected}
                  />
                  <HRBarChart
                  // employees={employees}
                  />
                </>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div className="space-y-6 pt-8">
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

              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-hr-green">Loading reports...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <EmployeeReports
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default hrDashboard;
