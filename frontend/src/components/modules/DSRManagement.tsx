
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Users, Truck, MapPin, Eye, Menu } from "lucide-react";
import { DSRForm } from "@/components/forms/DSRForm";
import { LoadFormGeneration } from "@/components/forms/LoadFormGeneration";

const dsrData = [
  {
    id: "DSR-001",
    name: "John Smith",
    phone: "+1-555-0123",
    email: "john.smith@company.com",
    area: "North District",
    vehicle: "VH-001 (Toyota Hiace)",
    status: "active",
    ordersThisMonth: 25,
    totalSales: 125000,
    currentOrders: [
      { orderId: "ORD-001", status: "loaded", customer: "ABC Store", value: 5000 },
      { orderId: "ORD-002", status: "dispatched", customer: "XYZ Mart", value: 3500 }
    ]
  },
  {
    id: "DSR-002",
    name: "Sarah Johnson",
    phone: "+1-555-0124",
    email: "sarah.johnson@company.com",
    area: "South District",
    vehicle: "VH-002 (Ford Transit)",
    status: "active",
    ordersThisMonth: 18,
    totalSales: 98000,
    currentOrders: [
      { orderId: "ORD-003", status: "approved", customer: "DEF Shop", value: 2800 }
    ]
  }
];

export const DSRManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDSRForm, setShowDSRForm] = useState(false);
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [selectedDSR, setSelectedDSR] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      created: "bg-gray-100 text-gray-800",
      approved: "bg-blue-100 text-blue-800",
      loaded: "bg-yellow-100 text-yellow-800",
      dispatched: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800"
    };
    return <Badge className={statusColors[status as keyof typeof statusColors]}>{status}</Badge>;
  };

  if (showDSRForm) {
    return <DSRForm onClose={() => setShowDSRForm(false)} />;
  }

  if (showLoadForm) {
    return <LoadFormGeneration onClose={() => setShowLoadForm(false)} selectedDSR={selectedDSR} />;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">DSR Management</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage sales representatives and track orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setShowLoadForm(true)} 
            variant="outline" 
            className="flex items-center gap-2 text-xs sm:text-sm"
            size="sm"
          >
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Load Form</span>
            <span className="sm:hidden">Load Form</span>
          </Button>
          <Button 
            onClick={() => setShowDSRForm(true)} 
            className="flex items-center gap-2 text-xs sm:text-sm"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add DSR</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 lg:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">DSR Overview</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs sm:text-sm">Order Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active DSRs</CardTitle>
                <Users className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dsrData.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Truck className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dsrData.reduce((sum, dsr) => sum + dsr.ordersThisMonth, 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <MapPin className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${dsrData.reduce((sum, dsr) => sum + dsr.totalSales, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DSR Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search DSRs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {dsrData.map((dsr) => (
                  <div key={dsr.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{dsr.name}</h3>
                        <p className="text-xs text-gray-500">{dsr.id}</p>
                        <p className="text-xs text-gray-500">{dsr.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{dsr.ordersThisMonth} orders</p>
                        <p className="text-xs text-green-600">${dsr.totalSales.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">{dsr.area}</p>
                      <p className="text-xs text-gray-500">{dsr.vehicle}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Current Orders:</p>
                      {dsr.currentOrders.map((order) => (
                        <div key={order.orderId} className="flex items-center justify-between text-xs">
                          <span>{order.orderId} - {order.customer}</span>
                          <div className="flex items-center gap-2">
                            <span>${order.value.toLocaleString()}</span>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedDSR(dsr);
                          setShowLoadForm(true);
                        }}
                      >
                        Load Form
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">DSR Details</th>
                      <th className="text-left py-3 px-4 font-semibold">Area & Vehicle</th>
                      <th className="text-left py-3 px-4 font-semibold">Performance</th>
                      <th className="text-left py-3 px-4 font-semibold">Current Orders</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dsrData.map((dsr) => (
                      <tr key={dsr.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{dsr.name}</div>
                            <div className="text-sm text-gray-500">{dsr.id}</div>
                            <div className="text-sm text-gray-500">{dsr.phone}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{dsr.area}</div>
                            <div className="text-sm text-gray-500">{dsr.vehicle}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{dsr.ordersThisMonth} orders</div>
                            <div className="text-sm text-green-600">${dsr.totalSales.toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {dsr.currentOrders.map((order) => (
                              <div key={order.orderId} className="flex items-center gap-2">
                                <span className="text-sm">{order.orderId}</span>
                                {getStatusBadge(order.status)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedDSR(dsr);
                                setShowLoadForm(true);
                              }}
                            >
                              Load Form
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dsrData.map((dsr) => (
                  <div key={dsr.id} className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-medium mb-3 text-sm sm:text-base">{dsr.name} - {dsr.area}</h3>
                    <div className="space-y-2">
                      {dsr.currentOrders.map((order) => (
                        <div key={order.orderId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-medium text-sm">{order.orderId}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{order.customer}</span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-sm font-medium">${order.value.toLocaleString()}</span>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
