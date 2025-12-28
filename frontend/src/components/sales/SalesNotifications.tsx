
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send, Users, User, Eye, EyeOff } from 'lucide-react';

const notificationsData = [
  { 
    id: 1, 
    title: 'New Product Launch', 
    message: 'We are excited to announce the launch of our new organic tea collection...', 
    recipient: 'All Salespeople', 
    date: '2024-01-18 10:30', 
    readCount: 18, 
    totalRecipients: 24 
  },
  { 
    id: 2, 
    title: 'Monthly Target Update', 
    message: 'Please review your monthly sales targets and plan accordingly...', 
    recipient: 'North Zone Team', 
    date: '2024-01-17 14:15', 
    readCount: 5, 
    totalRecipients: 8 
  },
  { 
    id: 3, 
    title: 'Price Update Notice', 
    message: 'Due to market changes, we have updated prices for selected items...', 
    recipient: 'All Salespeople', 
    date: '2024-01-16 09:00', 
    readCount: 22, 
    totalRecipients: 24 
  },
  { 
    id: 4, 
    title: 'Training Session Reminder', 
    message: 'Reminder about the upcoming sales training session on Friday...', 
    recipient: 'South Zone Team', 
    date: '2024-01-15 16:45', 
    readCount: 6, 
    totalRecipients: 6 
  },
];

export const SalesNotifications = () => {
  const [notifications, setNotifications] = useState(notificationsData);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient: 'all'
  });

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipientMapping: { [key: string]: { label: string; count: number } } = {
      all: { label: 'All Salespeople', count: 24 },
      north: { label: 'North Zone Team', count: 8 },
      south: { label: 'South Zone Team', count: 6 },
      east: { label: 'East Zone Team', count: 5 },
      west: { label: 'West Zone Team', count: 5 }
    };

    const newNotification = {
      id: Math.max(...notifications.map(n => n.id)) + 1,
      title: formData.title,
      message: formData.message,
      recipient: recipientMapping[formData.recipient].label,
      date: new Date().toLocaleString('en-US', { 
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      readCount: 0,
      totalRecipients: recipientMapping[formData.recipient].count
    };

    setNotifications([newNotification, ...notifications]);
    setFormData({ title: '', message: '', recipient: 'all' });
  };

  const getReadStatus = (readCount: number, total: number) => {
    const percentage = (readCount / total) * 100;
    if (percentage === 100) {
      return <Badge className="bg-green-100 text-green-800">All Read</Badge>;
    } else if (percentage > 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Mostly Read</Badge>;
    } else if (percentage > 0) {
      return <Badge className="bg-blue-100 text-blue-800">Partially Read</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Unread</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Send New Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter notification title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="recipient">Send To</Label>
                <Select value={formData.recipient} onValueChange={(value) => setFormData({...formData, recipient: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Salespeople (24)</SelectItem>
                    <SelectItem value="north">North Zone Team (8)</SelectItem>
                    <SelectItem value="south">South Zone Team (6)</SelectItem>
                    <SelectItem value="east">East Zone Team (5)</SelectItem>
                    <SelectItem value="west">West Zone Team (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message Body</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Enter your message here..."
                rows={4}
                required
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {getReadStatus(notification.readCount, notification.totalRecipients)}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {notification.message.length > 100 
                        ? notification.message.substring(0, 100) + '...'
                        : notification.message
                      }
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {notification.recipient.includes('All') ? (
                          <Users className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span>{notification.recipient}</span>
                      </div>
                      <span>•</span>
                      <span>{notification.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">{notification.readCount}</span>
                      </div>
                      <span className="text-gray-400">/</span>
                      <div className="flex items-center gap-1">
                        <EyeOff className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{notification.totalRecipients - notification.readCount}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((notification.readCount / notification.totalRecipients) * 100)}% read
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{notifications.length}</div>
              <p className="text-sm text-gray-600">Total Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {Math.round(
                  notifications.reduce((sum, n) => sum + n.readCount, 0) / 
                  notifications.reduce((sum, n) => sum + n.totalRecipients, 0) * 100
                )}%
              </div>
              <p className="text-sm text-gray-600">Avg. Read Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">24</div>
              <p className="text-sm text-gray-600">Active Recipients</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
