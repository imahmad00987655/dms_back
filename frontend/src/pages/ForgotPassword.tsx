import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, ArrowLeft, CheckCircle, Lock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forgotPassword, resetPassword } = useAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 FORGOT PASSWORD: Sending request...');
      console.log('  Email:', email);
      console.log('═══════════════════════════════════════════════════════════');
      
      const response = await forgotPassword(email);
      
      console.log('✅ FORGOT PASSWORD: API Response received');
      console.log('  Response:', response);
      console.log('  Response type:', typeof response);
      console.log('  Response keys:', response ? Object.keys(response) : 'null');
      console.log('  emailSent:', response?.emailSent);
      console.log('  emailError:', response?.emailError);
      
      // Check email status from response
      if (response && typeof response === 'object') {
        if ('emailSent' in response) {
          if (response.emailSent === false) {
            console.error('❌ FORGOT PASSWORD: Email NOT sent!');
            console.error('  Email Error:', response.emailError || 'Unknown error');
            console.error('  Full Response:', JSON.stringify(response, null, 2));
          } else if (response.emailSent === true) {
            console.log('✅ FORGOT PASSWORD: Email sent successfully!');
          }
        } else {
          console.warn('⚠️ FORGOT PASSWORD: emailSent field missing in response!');
          console.warn('  This means backend might not be updated. Check backend deployment.');
          console.warn('  Available fields:', Object.keys(response));
          console.warn('  Full Response:', JSON.stringify(response, null, 2));
        }
      } else {
        console.error('❌ FORGOT PASSWORD: Invalid response format');
        console.error('  Response:', response);
      }
      console.log('═══════════════════════════════════════════════════════════');
      
      toast({
        title: "Reset Code Sent",
        description: response?.emailSent === false 
          ? `Code generated but email failed: ${response.emailError || 'Email service unavailable'}`
          : "If the email exists, a reset code has been sent.",
      });
      setStep('otp');
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ FORGOT PASSWORD: Error occurred');
      console.error('  Error:', error);
      console.error('  Error message:', error.message);
      console.error('═══════════════════════════════════════════════════════════');
      
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send reset code. Please try again.",
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
      // For now, we'll just validate the OTP and move to reset step
      // In a real implementation, you might want to verify the OTP first
      setStep('reset');
    } catch (error: any) {
      console.error("OTP verification error:", error);
      
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateResetForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResetForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(email, otp, newPassword);
      
      setStep('success');
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully!",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Password Reset</CardTitle>
              <CardDescription>
                Your password has been reset successfully. You can now log in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleBackToLogin} className="w-full">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
                onClick={() => {
                  if (step === 'otp') setStep('email');
                  else if (step === 'reset') setStep('otp');
                  else navigate('/login');
                }}
                className="p-0 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-2xl font-bold">
                {step === 'email' && 'Forgot Password'}
                {step === 'otp' && 'Verify Code'}
                {step === 'reset' && 'Reset Password'}
              </CardTitle>
            </div>
            <CardDescription>
              {step === 'email' && 'Enter your email address to receive a verification code'}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'reset' && 'Enter your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Remember your password? </span>
                  <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                    Sign in
                  </Link>
                </div>
              </form>
            )}

            {step === 'otp' && (
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
                    Code sent to {email}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                        <Eye className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                        <Eye className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
