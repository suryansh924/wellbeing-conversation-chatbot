import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface EmployeeReport {
  id: string;
  name: string;
  position: string;
  flagged: boolean;
}

const employeeReports: EmployeeReport[] = [
  {
    id: "EMP001",
    name: "Alex Dwayne Johnson",
    position: "Senior Developer",
    flagged: false,
  },
  {
    id: "EMP002",
    name: "Sarah Williams",
    position: "Product Manager",
    flagged: true,
  },
  {
    id: "EMP003",
    name: "Michael Jordan Chen",
    position: "UI/UX Designer",
    flagged: false,
  },
  {
    id: "EMP004",
    name: "Emily Davis",
    position: "Marketing Specialist",
    flagged: false,
  },
  {
    id: "EMP005",
    name: "Robert Louis Taylor",
    position: "System Analyst",
    flagged: true,
  },
  {
    id: "EMP006",
    name: "Jennifer Bruce Lee",
    position: "Data Scientist",
    flagged: false,
  },
  {
    id: "EMP007",
    name: "David Harvey Wilson",
    position: "Project Manager",
    flagged: true,
  },
];

interface EmployeeReportsProps {
  searchQuery?: string;
}

export function EmployeeReports({ searchQuery = "" }: EmployeeReportsProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const handleDownload = (employeeId: string) => {
    // Replace this with actual PDF download functionality
    console.log(`Downloading report for employee ${employeeId}`);
    alert(`Downloading report for employee ${employeeId}`);
  };

  // Filter reports based on search query
  const filteredBySearch = searchQuery
    ? employeeReports.filter(
        (report) =>
          report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employeeReports;

  // Filter the reports based on the active tab
  const filteredReports =
    activeTab === "all"
      ? filteredBySearch
      : filteredBySearch.filter((report) =>
          activeTab === "flagged" ? report.flagged : !report.flagged
        );

  return (
    <Card className="shadow-card bg-card border border-hr-green/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium text-hr-green flex items-center gap-2">
          <FileText size={20} className="text-hr-green" />
          Employee Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full mb-4 grid grid-cols-3 gap-1 sm:gap-2 md:gap-3 bg-transparent border-0 shadow-none p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-hr-green data-[state=active]:text-black hover:bg-hr-green/20 transition-colors duration-200 border border-hr-green/60 px-1 sm:px-2 md:px-4 py-1 text-xs sm:text-sm md:text-base"
            >
              All<span className="hidden sm:inline">&nbsp;Reports</span>
            </TabsTrigger>
            <TabsTrigger
              value="unflagged"
              className="data-[state=active]:bg-hr-green data-[state=active]:text-black hover:bg-hr-green/20 transition-colors duration-200 border border-hr-green/60 px-1 sm:px-2 md:px-4 py-1 text-xs sm:text-sm md:text-base"
            >
              Unflagged<span className="hidden sm:inline">&nbsp;Reports</span>
            </TabsTrigger>
            <TabsTrigger
              value="flagged"
              className="data-[state=active]:bg-hr-green data-[state=active]:text-black hover:bg-hr-green/20 transition-colors duration-200 border border-hr-green/60 px-1 sm:px-2 md:px-4 py-1 text-xs sm:text-sm md:text-base"
            >
              Flagged<span className="hidden sm:inline">&nbsp;Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* All Reports Tab */}
          <TabsContent value="all" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-hr-green/20">
                    <TableHead className="text-hr-green w-[130px]">
                      Employee ID
                    </TableHead>
                    <TableHead className="text-hr-green w-[150px] md:w-[170px]">
                      Name
                    </TableHead>
                    <TableHead className="text-hr-green w-[150px] md:w-[180px]">
                      Position
                    </TableHead>
                    <TableHead className="text-hr-green w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="text-center text-hr-green w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="transition-colors duration-200 border-hr-green/10"
                        onMouseEnter={() => setHoveredRow(report.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          backgroundColor:
                            hoveredRow === report.id
                              ? "rgba(134, 188, 37, 0.1)"
                              : "transparent",
                        }}
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {report.id}
                        </TableCell>
                        <TableCell className="text-white">
                          {report.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {report.position}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={report.flagged ? "destructive" : "outline"}
                            className={`transition-all duration-200 pointer-events-none ${
                              report.flagged
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : "bg-hr-green/20 text-hr-green border-hr-green/30"
                            }`}
                          >
                            {report.flagged ? "Flagged" : "Unflagged"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id)}
                            className="px-2 text-hr-green hover:bg-transparent hover:text-hr-green border border-hr-green/30"
                          >
                            <Download size={14} className="mr-1" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No reports found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Unflagged Reports Tab */}
          <TabsContent value="unflagged" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-hr-green/20">
                    <TableHead className="text-hr-green w-[130px]">
                      Employee ID
                    </TableHead>
                    <TableHead className="text-hr-green w-[150px] md:w-[170px]">
                      Name
                    </TableHead>
                    <TableHead className="text-hr-green w-[150px] md:w-[180px]">
                      Position
                    </TableHead>
                    <TableHead className="text-hr-green w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="text-center text-hr-green w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="transition-colors duration-200 border-hr-green/10"
                        onMouseEnter={() => setHoveredRow(report.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          backgroundColor:
                            hoveredRow === report.id
                              ? "rgba(134, 188, 37, 0.1)"
                              : "transparent",
                        }}
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {report.id}
                        </TableCell>
                        <TableCell className="text-white">
                          {report.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {report.position}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-hr-green/20 text-hr-green border-hr-green/30 pointer-events-none"
                          >
                            Unflagged
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id)}
                            className="px-2 text-hr-green hover:bg-transparent hover:text-hr-green border border-hr-green/30"
                          >
                            <Download size={14} className="mr-1" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No unflagged reports found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Flagged Reports Tab */}
          <TabsContent value="flagged" className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-hr-green/20">
                    <TableHead className="text-hr-green w-[130px]">
                      Employee ID
                    </TableHead>
                    <TableHead className="text-hr-green w-[150px] md:w-[170px]">
                      Name
                    </TableHead>
                    <TableHead className="text-hr-green w-[150px] md:w-[180px]">
                      Position
                    </TableHead>
                    <TableHead className="text-hr-green w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="text-center text-hr-green w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="transition-colors duration-200 border-hr-green/10"
                        onMouseEnter={() => setHoveredRow(report.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          backgroundColor:
                            hoveredRow === report.id
                              ? "rgba(134, 188, 37, 0.1)"
                              : "transparent",
                        }}
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {report.id}
                        </TableCell>
                        <TableCell className="text-white">
                          {report.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {report.position}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="destructive"
                            className="bg-destructive/20 text-destructive border-destructive/30 pointer-events-none"
                          >
                            Flagged
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report.id)}
                            className="px-2 text-hr-green hover:bg-transparent hover:text-hr-green border border-hr-green/30"
                          >
                            <Download size={14} className="mr-1" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No flagged reports found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
