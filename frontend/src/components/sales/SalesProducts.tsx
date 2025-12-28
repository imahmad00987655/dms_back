
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Edit, Trash2, DollarSign, Hash } from 'lucide-react';

const productsData = [
  { id: 1, name: 'Premium Coffee Beans', unit: 'kg', price: 25.99, stock: 150, description: 'High-quality arabica coffee beans' },
  { id: 2, name: 'Organic Green Tea', unit: 'box', price: 12.50, stock: 200, description: '100% organic green tea leaves' },
  { id: 3, name: 'Chocolate Cookies', unit: 'pack', price: 8.99, stock: 75, description: 'Delicious chocolate chip cookies' },
  { id: 4, name: 'Fresh Bread Loaf', unit: 'piece', price: 3.25, stock: 45, description: 'Freshly baked whole grain bread' },
  { id: 5, name: 'Natural Honey', unit: 'jar', price: 15.75, stock: 88, description: 'Pure natural honey from local farms' },
];

export const SalesProducts = () => {
  const [products, setProducts] = useState(productsData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    stock: '',
    description: ''
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', unit: '', price: '', stock: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(products.filter(product => product.id !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    };

    if (editingProduct) {
      setProducts(products.map(product => 
        product.id === editingProduct.id 
          ? { ...product, ...productData }
          : product
      ));
    } else {
      const newProduct = {
        id: Math.max(...products.map(p => p.id)) + 1,
        ...productData
      };
      setProducts([...products, newProduct]);
    }
    setIsDialogOpen(false);
  };

  const getStockStatus = (stock: number) => {
    if (stock < 50) return <Badge className="bg-red-100 text-red-800">Low Stock</Badge>;
    if (stock < 100) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Product Catalog Management
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        placeholder="kg, piece, box, etc."
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-600">Product Name</th>
                  <th className="text-left p-4 font-medium text-gray-600">Unit & Price</th>
                  <th className="text-left p-4 font-medium text-gray-600">Stock</th>
                  <th className="text-left p-4 font-medium text-gray-600">Description</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">${product.price}</span>
                          <span className="text-gray-600">per {product.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{product.stock}</span>
                        </div>
                        {getStockStatus(product.stock)}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {product.description}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Product Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{products.length}</div>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {products.filter(p => p.stock < 50).length}
              </div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                ${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Avg. Product Price</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
