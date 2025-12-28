import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { UserPlus, Eye, EyeOff, Building, User, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";

const Signup = () => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: ""
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup, verifyOTP } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/[a-zA-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one letter";
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const signupData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        password: formData.password
      };

      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 SIGNUP: Sending request...');
      console.log('  Email:', formData.email);
      console.log('═══════════════════════════════════════════════════════════');

      const response = await signup(signupData);
      
      console.log('✅ SIGNUP: API Response received');
      console.log('  Response:', response);
      console.log('  Response type:', typeof response);
      console.log('  Response keys:', response ? Object.keys(response) : 'null');
      console.log('  emailSent:', response?.emailSent);
      console.log('  emailError:', response?.emailError);
      
      // Check email status from response
      if (response && typeof response === 'object') {
        if ('emailSent' in response) {
          if (response.emailSent === false) {
            console.error('❌ SIGNUP: Email NOT sent!');
            console.error('  Email Error:', response.emailError || 'Unknown error');
            console.error('  Full Response:', JSON.stringify(response, null, 2));
          } else if (response.emailSent === true) {
            console.log('✅ SIGNUP: Email sent successfully!');
          }
        } else {
          console.warn('⚠️ SIGNUP: emailSent field missing in response!');
          console.warn('  This means backend might not be updated. Check backend deployment.');
          console.warn('  Available fields:', Object.keys(response));
          console.warn('  Full Response:', JSON.stringify(response, null, 2));
        }
      } else {
        console.error('❌ SIGNUP: Invalid response format');
        console.error('  Response:', response);
      }
      console.log('═══════════════════════════════════════════════════════════');
      
      toast({
        title: "Registration Successful",
        description: response?.emailSent === false 
          ? `Account created but email failed: ${response.emailError || 'Email service unavailable'}`
          : "Please check your email for verification code.",
      });
      setStep('otp');
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ SIGNUP: Error occurred');
      console.error('  Error:', error);
      console.error('  Error message:', error.message);
      console.error('═══════════════════════════════════════════════════════════');
      
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 VERIFY OTP: Sending request...');
      console.log('  Email:', formData.email);
      console.log('  OTP:', otp);
      console.log('═══════════════════════════════════════════════════════════');

      const response = await verifyOTP(formData.email, otp);
      
      console.log('✅ VERIFY OTP: API Response received');
      console.log('  Response:', response);
      
      // Check welcome email status from response
      if (response && typeof response === 'object') {
        if (response.welcomeEmailSent === false) {
          console.warn('⚠️ VERIFY OTP: Welcome email NOT sent!');
          console.warn('  Email Error:', response.welcomeEmailError || 'Unknown error');
        } else if (response.welcomeEmailSent === true) {
          console.log('✅ VERIFY OTP: Welcome email sent successfully!');
        }
      }
      console.log('═══════════════════════════════════════════════════════════');
      
      setStep('success');
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ VERIFY OTP: Error occurred');
      console.error('  Error:', error);
      console.error('  Error message:', error.message);
      console.error('═══════════════════════════════════════════════════════════');
      
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome to AccuFlow!</CardTitle>
              <CardDescription>
                Your account has been created successfully. You can now log in and start using the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBackToLogin} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AccuFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise Accounting System</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => step === 'otp' ? setStep('form') : navigate('/login')}
                className="p-0 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">
                {step === 'form' ? 'Create Account' : 'Verify Email'}
              </CardTitle>
            </div>
            <CardDescription>
              {step === 'form' 
                ? 'Fill in your details to get started'
                : 'Enter the 6-digit code sent to your email'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'form' ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.company && (
                    <p className="text-sm text-red-500">{errors.company}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Creating account..."
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Code sent to {formData.email}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
