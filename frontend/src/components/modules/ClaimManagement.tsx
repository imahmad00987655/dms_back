import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, CheckCircle, XCircle, Plus, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClaimForm } from "@/components/forms/ClaimForm";

const claims = [
  {
    id: "CLM-001",
    claimNumber: "CLM-2024-001",
    customerName: "ABC Electronics Store",
    claimType: "Damaged Product",
    priority: "high",
    status: "under_review",
    claimAmount: 15000,
    approvedAmount: 0,
    claimDate: "2024-06-15",
    expectedResolution: "2024-06-22",
    description: "Smartphone screens damaged during transit",
    assignedTo: "Sarah Johnson",
    productItems: ["iPhone 14", "Samsung Galaxy S23"]
  },
  {
    id: "CLM-002",
    claimNumber: "CLM-2024-002", 
    customerName: "XYZ Retail Chain",
    claimType: "Missing Items",
    priority: "medium",
    status: "approved",
    claimAmount: 8500,
    approvedAmount: 8500,
    claimDate: "2024-06-12",
    expectedResolution: "2024-06-19",
    description: "5 units of wireless headphones missing from delivery",
    assignedTo: "Mike Wilson",
    productItems: ["Wireless Headphones"]
  },
  {
    id: "CLM-003",
    claimNumber: "CLM-2024-003",
    customerName: "Tech Solutions Ltd",
    claimType: "Defective Product", 
    priority: "low",
    status: "resolved",
    claimAmount: 12000,
    approvedAmount: 10000,
    claimDate: "2024-06-08",
    expectedResolution: "2024-06-15",
    description: "Laptop charging issues reported by customer",
    assignedTo: "John Smith",
    productItems: ["Dell Inspiron Laptop"]
  },
  {
    id: "CLM-004",
    claimNumber: "CLM-2024-004",
    customerName: "Office Supplies Co",
    claimType: "Wrong Item Delivered",
    priority: "urgent",
    status: "submitted",
    claimAmount: 3500,
    approvedAmount: 0,
    claimDate: "2024-06-18",
    expectedResolution: "2024-06-20",
    description: "Office chairs instead of desk lamps delivered",
    assignedTo: "Lisa Chen",
    productItems: ["Office Chair", "Desk Lamp"]
  }
];

const claimTypes = ["All Types", "Damaged Product", "Defective Product", "Missing Items", "Wrong Item Delivered", "Expired Products"];
const priorities = ["All Priorities", "low", "medium", "high", "urgent"];
const statuses = ["All Status", "submitted", "under_review", "approved", "resolved", "rejected"];

export const ClaimManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [showClaimForm, setShowClaimForm] = useState(false);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All Types" || claim.claimType === selectedType;
    const matchesPriority = selectedPriority === "All Priorities" || claim.priority === selectedPriority;
    const matchesStatus = selectedStatus === "All Status" || claim.status === selectedStatus;
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case "under_review":
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "resolved":
        return <Badge className="bg-gray-100 text-gray-800">Resolved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-500 text-white">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
      case "under_review":
        return <Clock className="w-4 h-4" />;
      case "approved":
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => ["submitted", "under_review"].includes(c.status)).length;
  const resolvedClaims = claims.filter(c => c.status === "resolved").length;
  const totalClaimValue = claims.reduce((sum, c) => sum + c.claimAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ClaimTracker</h1>
          <p className="text-gray-500 mt-1">Manage inventory claims and resolution workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowClaimForm(true)}
          >
            <Plus className="w-4 h-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <AlertTriangle className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingClaims}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Claims</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedClaims}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalClaimValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="claims" className="space-y-6">
        <TabsList>
          <TabsTrigger value="claims">All Claims</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {claimTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Details</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type & Priority</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.claimNumber}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{claim.description}</div>
                          <div className="text-xs text-gray-400">{claim.claimDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{claim.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{claim.claimType}</div>
                          {getPriorityBadge(claim.priority)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">₹{claim.claimAmount.toLocaleString()}</div>
                          {claim.approvedAmount > 0 && (
                            <div className="text-sm text-green-600">
                              Approved: ₹{claim.approvedAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {claim.productItems.slice(0, 2).map(item => (
                            <Badge key={item} variant="outline" className="text-xs mr-1">
                              {item}
                            </Badge>
                          ))}
                          {claim.productItems.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{claim.productItems.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{claim.assignedTo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(claim.status)}
                          {getStatusBadge(claim.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{claim.expectedResolution}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">View</Button>
                          {claim.status === "submitted" && (
                            <Button size="sm" variant="outline">Review</Button>
                          )}
                          {claim.status === "approved" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">Resolve</Button>
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

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claims Requiring Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claims.filter(c => ["submitted", "under_review"].includes(c.status)).map((claim) => (
                  <Card key={claim.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{claim.claimNumber}</h3>
                            {getPriorityBadge(claim.priority)}
                            {getStatusBadge(claim.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{claim.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Customer: {claim.customerName}</span>
                            <span>Amount: ₹{claim.claimAmount.toLocaleString()}</span>
                            <span>Due: {claim.expectedResolution}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View Details</Button>
                          <Button size="sm">Take Action</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claim Processing Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Workflow visualization and management tools will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claim Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Analytics dashboard with claim trends and insights will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClaimForm 
        isOpen={showClaimForm} 
        onClose={() => setShowClaimForm(false)} 
      />
    </div>
  );
};
