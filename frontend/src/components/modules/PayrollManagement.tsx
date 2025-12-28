import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, FileText, Calculator, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeForm } from "@/components/forms/EmployeeForm";

const employees = [
  {
    id: "EMP-001",
    name: "John Smith",
    department: "Sales",
    designation: "Sales Manager",
    basicSalary: 45000,
    grossSalary: 52000,
    netSalary: 41600,
    status: "active",
    joiningDate: "2023-01-15"
  },
  {
    id: "EMP-002", 
    name: "Sarah Johnson",
    department: "Accounts",
    designation: "Accountant",
    basicSalary: 35000,
    grossSalary: 40000,
    netSalary: 32000,
    status: "active",
    joiningDate: "2023-03-20"
  },
  {
    id: "EMP-003",
    name: "Mike Wilson", 
    department: "Warehouse",
    designation: "Warehouse Manager",
    basicSalary: 38000,
    grossSalary: 44000,
    netSalary: 35200,
    status: "active",
    joiningDate: "2022-11-10"
  }
];

const payrollPeriods = [
  {
    id: "PP-2024-06",
    periodName: "June 2024",
    startDate: "2024-06-01",
    endDate: "2024-06-30",
    payDate: "2024-07-01",
    status: "processed",
    totalGross: 136000,
    totalNet: 108800,
    employeeCount: 3
  },
  {
    id: "PP-2024-05",
    periodName: "May 2024", 
    startDate: "2024-05-01",
    endDate: "2024-05-31",
    payDate: "2024-06-01",
    status: "closed",
    totalGross: 132000,
    totalNet: 105600,
    employeeCount: 3
  }
];

export const PayrollManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  const departments = Array.from(new Set(employees.map(emp => emp.department)));
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>;
      case "terminated":
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPeriodStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800">Processed</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PayMaster Pro</h1>
          <p className="text-gray-500 mt-1">Comprehensive payroll management system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generate Reports
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowEmployeeForm(true)}
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Gross</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {payrollPeriods[0]?.totalGross.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Net</CardTitle>
            <Calculator className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {payrollPeriods[0]?.totalNet.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {((payrollPeriods[0]?.totalGross || 0) - (payrollPeriods[0]?.totalNet || 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Periods</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>Rs. {employee.basicSalary.toLocaleString()}</TableCell>
                      <TableCell>Rs. {employee.grossSalary.toLocaleString()}</TableCell>
                      <TableCell>Rs. {employee.netSalary.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Total Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{period.periodName}</div>
                          <div className="text-sm text-gray-500">{period.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {period.startDate} to {period.endDate}
                        </div>
                      </TableCell>
                      <TableCell>{period.payDate}</TableCell>
                      <TableCell>{period.employeeCount}</TableCell>
                      <TableCell>Rs. {period.totalGross.toLocaleString()}</TableCell>
                      <TableCell>Rs. {period.totalNet.toLocaleString()}</TableCell>
                      <TableCell>{getPeriodStatusBadge(period.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          {period.status === "draft" && (
                            <Button size="sm">Process</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payslips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a payroll period to view payslips</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeForm 
        isOpen={showEmployeeForm} 
        onClose={() => setShowEmployeeForm(false)} 
      />
    </div>
  );
};
