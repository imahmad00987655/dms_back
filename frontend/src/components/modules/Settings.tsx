import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Users, 
  Key, 
  Mail, 
  Phone,
  Building,
  Globe,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff,
  UserPlus,
  Settings as SettingsIcon,
  Crown,
  Receipt,
  Loader2,
  ArrowLeft
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TaxTypesForm from "@/components/forms/TaxTypesForm";
import TaxRegimeForm from "@/components/forms/TaxRegimeForm";
import TaxRatesForm from "@/components/forms/TaxRatesForm";
import CompanySetup from "./CompanySetup";

// Use environment variable for API base URL, fallback based on environment
// Production backend URL
const PRODUCTION_BACKEND = 'https://skyblue-snake-491948.hostingersite.com';
const PRODUCTION_API_BASE = `${PRODUCTION_BACKEND}/api`;

// Determine if we're in production (Hostinger deployment)
const isProduction = import.meta.env.PROD || window.location.hostname.includes('hostingersite.com');

// Use env var if set, otherwise use production URL if in production, else localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction ? PRODUCTION_API_BASE : 'http://localhost:5000/api');

type SettingsTab = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
};

const settingsTabs: SettingsTab[] = [
  {
    value: "profile",
    label: "Profile",
    description: "Personal info & preferences",
    icon: User,
    iconClass: "bg-blue-100 text-blue-600 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white",
  },
  {
    value: "notifications",
    label: "Notifications",
    description: "Choose how you get alerts",
    icon: Bell,
    iconClass: "bg-amber-100 text-amber-600 group-data-[state=active]:bg-amber-500 group-data-[state=active]:text-white",
  },
  {
    value: "security",
    label: "Security",
    description: "Passwords & authentication",
    icon: Shield,
    iconClass: "bg-rose-100 text-rose-600 group-data-[state=active]:bg-rose-500 group-data-[state=active]:text-white",
  },
  {
    value: "system",
    label: "System",
    description: "Localization & data settings",
    icon: Database,
    iconClass: "bg-purple-100 text-purple-600 group-data-[state=active]:bg-purple-500 group-data-[state=active]:text-white",
  },
  {
    value: "company-setup",
    label: "Company Setup",
    description: "Manage entities & locations",
    icon: Building,
    iconClass: "bg-sky-100 text-sky-600 group-data-[state=active]:bg-sky-500 group-data-[state=active]:text-white",
  },
  {
    value: "tax-setup",
    label: "Tax Setup",
    description: "Configure tax rules",
    icon: Receipt,
    iconClass: "bg-emerald-100 text-emerald-600 group-data-[state=active]:bg-emerald-500 group-data-[state=active]:text-white",
  },
  {
    value: "users",
    label: "Users",
    description: "Control team access",
    icon: Users,
    iconClass: "bg-indigo-100 text-indigo-600 group-data-[state=active]:bg-indigo-500 group-data-[state=active]:text-white",
  },
];

const Settings = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [companySetupActiveModule, setCompanySetupActiveModule] = useState<'companies' | 'chart-of-account' | 'ledger' | null>(null);
  const [chartOfAccountActiveSection, setChartOfAccountActiveSection] = useState<
    'structure-definition' | 'instances-assignments' | 'header-assignments' | null
  >(null);
  const companySetupRef = React.useRef<{ activeModule: 'companies' | 'chart-of-account' | 'ledger' | null; setActiveModule: (module: 'companies' | 'chart-of-account' | 'ledger' | null) => void; chartOfAccountSetupRef?: React.MutableRefObject<{ activeSection: 'structure-definition' | 'instances-assignments' | 'header-assignments' | null; setActiveSection: (section: 'structure-definition' | 'instances-assignments' | 'header-assignments' | null) => void } | null> } | null>(null);
  const [settings, setSettings] = useState({
    // Profile settings
    firstName: "",
    lastName: "", 
    email: "",
    phone: "",
    company: "",
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    
    // Security settings
    twoFactorAuth: false,
    sessionTimeout: "30",
    
    // System settings
    darkMode: false,
    language: "English",
    timezone: "UTC-5",
    dateFormat: "MM/DD/YYYY",
    currency: "USD"
  });

  const [users] = useState([
    { id: 1, name: "John Doe", email: "john.doe@company.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane.smith@company.com", role: "Manager", status: "Active" },
    { id: 3, name: "Mike Johnson", email: "mike.johnson@company.com", role: "User", status: "Inactive" },
    { id: 4, name: "Sarah Wilson", email: "sarah.wilson@company.com", role: "User", status: "Active" },
  ]);

  const getHeaderTitle = () => {
    if (!activeTab) {
      return "Settings";
    }

    // Special handling for nested Company Setup modules
    if (activeTab === "company-setup") {
      if (companySetupActiveModule === "companies") return "Companies";

      if (companySetupActiveModule === "chart-of-account") {
        const activeSection = chartOfAccountActiveSection;

        if (activeSection === "structure-definition") return "Structure Definition";
        if (activeSection === "instances-assignments") return "Instances & Assignments";
        if (activeSection === "header-assignments") return "Header Assignments";

        // Default Chart of Account heading when no inner section is active
        return "Chart of Account";
      }

      if (companySetupActiveModule === "ledger") return "Ledger Configurations";

      // Company Setup overview (no inner module active)
      return "Company Setup";
    }

    return settingsTabs.find((tab) => tab.value === activeTab)?.label || "Settings";
  };

  const getHeaderDescription = () => {
    if (!activeTab) {
      return "Manage your account and application preferences";
    }

    // Special handling for nested Company Setup modules
    if (activeTab === "company-setup") {
      if (companySetupActiveModule === "companies") {
        return "Manage distributor companies and their information";
      }

      if (companySetupActiveModule === "chart-of-account") {
        const activeSection = chartOfAccountActiveSection;

        if (activeSection === "structure-definition") {
          return "Configure Chart of Accounts structures and segments";
        }

        if (activeSection === "instances-assignments") {
          return "Create CoA instances and manage ledger assignments";
        }

        if (activeSection === "header-assignments") {
          return "Assign Chart of Accounts headers to ledgers and modules";
        }

        // Default Chart of Account description when no inner section is active
        return "Configure chart of accounts and segments";
      }

      if (companySetupActiveModule === "ledger") {
        return "Manage accounting ledgers and flows";
      }

      // Company Setup overview (no inner module active)
      return "Manage entities & locations";
    }

    return (
      settingsTabs.find((tab) => tab.value === activeTab)?.description ||
      "Manage your account and application preferences"
    );
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to view your profile",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      console.log('Profile fetch response:', result); // Debug log
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to fetch profile');
      }

      if (result.success && result.data) {
        const user = result.data;
        console.log('User data received:', user); // Debug log
        
        setSettings(prev => ({
          ...prev,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
          company: user.company || ""
        }));
        
        // If profile_image exists, use it directly (it's already a base64 data URL)
        if (user.profile_image) {
          // Check if it's already a data URL, if not, it might be an old file path
          if (user.profile_image.startsWith('data:')) {
            setProfileImage(user.profile_image);
          } else {
            // Legacy: if it's a file path, try to load it (for backward compatibility)
            // Handle profile image - if it's already a full URL, use it; otherwise construct it
            const imageUrl = user.profile_image?.startsWith('http') 
              ? user.profile_image 
              : `${API_BASE_URL.replace('/api', '')}${user.profile_image}`;
            setProfileImage(imageUrl);
          }
        } else {
          setProfileImage(null);
        }
      } else {
        throw new Error(result.error || 'No user data received');
      }
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to load profile data';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset nested Company Setup state when switching away
  useEffect(() => {
    if (activeTab !== 'company-setup') {
      setCompanySetupActiveModule(null);
      setChartOfAccountActiveSection(null);
      return;
    }

    // If we're in Company Setup but not within Chart of Account, clear the inner section
    if (companySetupActiveModule !== 'chart-of-account') {
      setChartOfAccountActiveSection(null);
    }
  }, [activeTab, companySetupActiveModule]);

  const handleSave = async (section: string) => {
    if (section === 'Profile') {
      try {
        setSaving(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/profile/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            first_name: settings.firstName,
            last_name: settings.lastName,
            email: settings.email,
            phone: settings.phone,
            company: settings.company
          })
        });

        const result = await response.json();
        if (result.success) {
          toast({
            title: "Settings Saved",
            description: `${section} settings have been updated successfully.`,
          });
          await fetchProfile(); // Refresh profile data
        } else {
          throw new Error(result.error || 'Failed to save');
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile settings",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    } else {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated successfully.`,
    });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 2MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`${API_BASE_URL}/profile/me/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success && result.data) {
        // Profile image is now a base64 data URL, use it directly
        setProfileImage(result.data.profile_image);
        toast({
          title: "Success",
          description: "Profile image uploaded successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profile/me/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setProfileImage(null);
        toast({
          title: "Success",
          description: "Profile image deleted successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete profile image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 p-4 md:p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {activeTab && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // If we're in company-setup and CompanySetup has an activeModule
                  if (activeTab === 'company-setup' && companySetupActiveModule) {
                    // If ChartOfAccountSetup has an activeSection, go back to ChartOfAccountSetup overview first
                    if (companySetupActiveModule === 'chart-of-account' && 
                        companySetupRef.current?.chartOfAccountSetupRef?.current?.activeSection) {
                      companySetupRef.current.chartOfAccountSetupRef.current.setActiveSection(null);
                    } else {
                      // Otherwise, go back to CompanySetup overview
                      if (companySetupRef.current) {
                        companySetupRef.current.setActiveModule(null);
                      }
                      setCompanySetupActiveModule(null);
                    }
                  } else {
                    // Otherwise, go back to Settings overview
                    setActiveTab(null);
                  }
                }}
                className="h-12 w-12 mt-1 hover:bg-gray-100"
              >
                <ArrowLeft className="h-6 w-6 text-gray-700" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {getHeaderTitle()}
              </h1>
              <p className="text-gray-600 mt-1">
                {getHeaderDescription()}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit">
            Last updated: Today
          </Badge>
        </div>

        {/* Overview or Active Tab */}
        {!activeTab ? (
          <div className="space-y-6">
            <div className="grid h-auto w-full gap-4 text-gray-900 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className="group relative flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-transparent bg-white/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${tab.iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{tab.label}</p>
                      <p className="text-xs text-gray-500">{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} className="space-y-6">
            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                <div className="flex items-center gap-6">
                  <Avatar 
                    className="w-20 h-20 cursor-pointer"
                    onClick={() => profileImage && setIsImagePreviewOpen(true)}
                  >
                        <AvatarImage src={profileImage || ""} />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {settings.firstName[0] || ''}{settings.lastName[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                        <input
                          type="file"
                          id="profile-image-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('profile-image-upload')?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                              </>
                            )}
                          </Button>
                          {profileImage && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleDeleteImage}
                              disabled={uploadingImage}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                    </Button>
                          )}
                        </div>
                    <p className="text-sm text-gray-500">JPG, PNG up to 2MB</p>
                  </div>
                </div>
                {/* Image preview dialog */}
                <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
                  <DialogContent className="max-w-md p-0 overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile preview"
                        className="w-full h-auto max-h-[60vh] object-contain"
                      />
                    ) : null}
                  </DialogContent>
                </Dialog>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={settings.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={settings.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={settings.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        className="pl-10"
                        value={settings.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="company"
                        className="pl-10"
                        value={settings.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSave('Profile')} 
                  className="w-full md:w-auto"
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-600" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-500">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => handleInputChange('weeklyReports', checked)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('Notification')} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => handleSave('Security')} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Update Security
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Key className="w-4 h-4 mr-2" />
                    Generate API Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  System Preferences
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select 
                      id="language"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={settings.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                    >
                      <option value="UTC-5">UTC-5 (Eastern)</option>
                      <option value="UTC-6">UTC-6 (Central)</option>
                      <option value="UTC-7">UTC-7 (Mountain)</option>
                      <option value="UTC-8">UTC-8 (Pacific)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select 
                      id="dateFormat"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={settings.dateFormat}
                      onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select 
                      id="currency"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Data Management</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button variant="outline" className="flex items-center justify-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="destructive" className="flex items-center justify-center">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                </div>

                <Button onClick={() => handleSave('System')} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save System Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Setup Settings */}
          <TabsContent value="tax-setup" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-600" />
                  Tax Configuration
                </CardTitle>
                <CardDescription>
                  Manage tax types, regimes, and rates for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tax-types" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tax-types">Tax Types</TabsTrigger>
                    <TabsTrigger value="tax-regimes">Tax Regimes</TabsTrigger>
                    <TabsTrigger value="tax-rates">Tax Rates</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tax-types" className="space-y-6">
                    <TaxTypesForm />
                  </TabsContent>

                  <TabsContent value="tax-regimes" className="space-y-6">
                    <TaxRegimeForm />
                  </TabsContent>

                  <TabsContent value="tax-rates" className="space-y-6">
                    <TaxRatesForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Setup */}
          <TabsContent value="company-setup" className="space-y-6">
            <CompanySetup 
              onBackRef={companySetupRef} 
              onActiveModuleChange={setCompanySetupActiveModule}
              onChartOfAccountSectionChange={setChartOfAccountActiveSection}
            />
          </TabsContent>

          {/* Users & Privileges Settings */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Team Members</h4>
                    <p className="text-sm text-gray-500">Manage access and permissions for your team</p>
                  </div>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2">User</th>
                        <th className="text-left py-2 px-2">Role</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'} className="text-xs">
                              {user.role === 'Admin' && <Crown className="w-3 h-3 mr-1" />}
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <SettingsIcon className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3" />
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

            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Role Permissions
                </CardTitle>
                <CardDescription>
                  Configure permissions for different user roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Admin
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Full System Access</span>
                        <Switch checked={true} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>User Management</span>
                        <Switch checked={true} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Financial Data</span>
                        <Switch checked={true} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reports</span>
                        <Switch checked={true} disabled />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      Manager
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Dashboard Access</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Team Management</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Financial Data</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reports</span>
                        <Switch checked={false} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      User
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Dashboard Access</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Basic Operations</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Financial Data</span>
                        <Switch checked={false} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reports</span>
                        <Switch checked={false} />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSave('Users & Privileges')} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Permissions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
};

export default Settings;