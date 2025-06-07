import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, BookOpen, UserPlus } from "lucide-react";
import { registerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { AuthResponse } from "@/types";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema.extend({
      confirmPassword: registerSchema.shape.password,
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const registerMutation = useMutation<AuthResponse, Error, RegisterForm>({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });
      return response!;
    },
    onSuccess: (data) => {
      // Store both access and refresh tokens
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to home
      setLocation('/');
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="relative">
              <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <UserPlus className="absolute -top-1 -right-1 h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              ScryVault
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Secure Book Inventory Management
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Start managing your book inventory securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    {...form.register("firstName")}
                    className="bg-white dark:bg-slate-800"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    {...form.register("lastName")}
                    className="bg-white dark:bg-slate-800"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...form.register("email")}
                  className="bg-white dark:bg-slate-800"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...form.register("password")}
                    className="bg-white dark:bg-slate-800 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...form.register("confirmPassword")}
                    className="bg-white dark:bg-slate-800 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {registerMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {registerMutation.error instanceof Error
                      ? registerMutation.error.message
                      : "Registration failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="text-sm text-slate-600 dark:text-slate-400"
                onClick={() => setLocation('/login')}
              >
                Already have an account? Sign in here
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your data will be encrypted and secured with enterprise-grade protection
          </p>
        </div>
      </div>
    </div>
  );
}