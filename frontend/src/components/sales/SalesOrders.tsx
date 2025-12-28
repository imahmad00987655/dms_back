
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Filter, Search, Calendar } from 'lucide-react';

const ordersData = [
  { id: 'ORD-2024-001', customer: 'Metro Supermarket', salesperson: 'John Smith', total: 15750, status: 'pending', date: '2024-01-18' },
  { id: 'ORD-2024-002', customer: 'City Retail Chain', salesperson: 'Sarah Johnson', total: 12500, status: 'approved', date: '2024-01-18' },
  { id: 'ORD-2024-003', customer: 'Downtown Store', salesperson: 'Mike Wilson', total: 8900, status: 'pending', date: '2024-01-17' },
  { id: 'ORD-2024-004', customer: 'Corner Market', salesperson: 'Lisa Brown', total: 6750, status: 'approved', date: '2024-01-17' },
  { id: 'ORD-2024-005', customer: 'Fresh Foods Ltd', salesperson: 'David Lee', total: 11200, status: 'rejected', date: '2024-01-16' },
  { id: 'ORD-2024-006', customer: 'Quick Mart', salesperson: 'John Smith', total: 4500, status: 'pending', date: '2024-01-16' },
];

export const SalesOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState(ordersData);

  const handleApprove = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'approved' } : order
    ));
  };

  const handleReject = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'rejected' } : order
    ));
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.salesperson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Order Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by Order ID, Customer, or Salesperson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-600">Order ID</th>
                  <th className="text-left p-4 font-medium text-gray-600">Customer</th>
                  <th className="text-left p-4 font-medium text-gray-600">Salesperson</th>
                  <th className="text-left p-4 font-medium text-gray-600">Total</th>
                  <th className="text-left p-4 font-medium text-gray-600">Date</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-blue-600">{order.id}</td>
                    <td className="p-4 text-gray-900">{order.customer}</td>
                    <td className="p-4 text-gray-700">{order.salesperson}</td>
                    <td className="p-4 font-semibold text-gray-900">${order.total.toLocaleString()}</td>
                    <td className="p-4 text-gray-600">{order.date}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4">
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(order.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(order.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {order.status !== 'pending' && (
                        <span className="text-sm text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
              <p className="text-sm text-gray-600 mt-1">Pending Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'approved').length}</div>
              <p className="text-sm text-gray-600 mt-1">Approved Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Value</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
