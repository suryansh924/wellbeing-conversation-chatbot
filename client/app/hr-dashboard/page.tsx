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
  Is_Flagged: boolean;
  Report: string;
  Feature_Vector: string;
}

const HRDashboard: React.FC = () => {
  const server = "http://127.0.0.1:8000";

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const analyticsRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { fetchHRProfile, hrData , check_role } = useAuth();

  useEffect(() => {
      setLoading(true);
      try {
        console.log("Hi")
        if (!check_role("hr")) {
          localStorage.removeItem('access_token');
          router.push("/");
          return;
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false);
      }
  }, []);
  
  useEffect(() => {
    const fetchAllEmployees = async () => {
      console.log("Fetching All Selected Employees")
      try {
        setLoading(true);
        const response = await axios.get(
          `${server}/api/data/employees`
        );
        const selectedEmployees = response.data.employees.filter((employee:any)=> employee.Is_Selected === true);
        console.log("Selected Employee data:", response.data);
        setEmployees(selectedEmployees);
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
          <div id="analytics-section" ref={analyticsRef} className="space-y-6">
            <h2 className="text-2xl font-bold text-[#26890d] mb-4 flex items-center gap-2">
              <BarChartIcon size={24} className="text-[#26890d]" />
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
          <div id="reports-section" ref={reportsRef} className="space-y-6 pt-8">
            <h2 className="text-2xl font-bold text-[#26890d] mb-4 flex items-center gap-2">
              <FileText size={24} className="text-[#26890d]" />
              Employee Reports
            </h2>

            <div
              className={`${
                isLoaded ? "scale-in" : "opacity-0"
              } animation-delay-700`}
            >
              <div className="mb-4 flex items-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  <Input
                    className="pl-10 bg-hr-black border border-[#26890d]/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#26890d]/100 focus-visible:border text-gray-200 placeholder:text-gray-500 outline-none transition-all duration-200"
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
                <EmployeeReports searchQuery={searchQuery} employees = {employees}/>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HRDashboard;
