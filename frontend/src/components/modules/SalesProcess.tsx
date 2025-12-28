
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { SalesOrders } from '@/components/sales/SalesOrders';
import { SalesUsers } from '@/components/sales/SalesUsers';
import { SalesProducts } from '@/components/sales/SalesProducts';
import { SalesNotifications } from '@/components/sales/SalesNotifications';

export const SalesProcess = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Sales Process Management
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive sales management hub for orders, users, products, and notifications
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
          <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <SalesDashboard />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <SalesOrders />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <SalesUsers />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <SalesProducts />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <SalesNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
};
