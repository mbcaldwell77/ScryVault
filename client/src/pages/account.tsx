import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Trash2, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import GlobalHeader from "@/components/global-header";
import { useLocation } from "wouter";

export default function Account() {
  const { getUser, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const user = getUser();

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile update state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || ""
  });

  // Password change mutation
  const passwordMutation = useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await apiRequest<void>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully."
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to update password.",
        variant: "destructive"
      });
    }
  });

  // Profile update mutation
  const profileMutation = useMutation<{ user: User }, Error, { firstName: string; lastName: string; email: string }>({
    mutationFn: async (data: { firstName: string; lastName: string; email: string }) => {
      const res = await apiRequest<{ user: User }>("/api/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify(data)
      });
      return res!;
    },
    onSuccess: (updatedUser) => {
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(updatedUser.user));
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Profile Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    }
  });

  // Account deletion mutation
  const deleteMutation = useMutation<void, Error>({
    mutationFn: async () => {
      await apiRequest<void>("/api/auth/delete-account", {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted."
      });
      logout();
    },
    onError: (error: Error) => {
      toast({
        title: "Account Deletion Failed",
        description: error.message || "Failed to delete account.",
        variant: "destructive"
      });
    }
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    passwordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all profile fields.",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    profileMutation.mutate(profileData);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
      <GlobalHeader title="Account Settings" showBackButton={true} />
      
      <div className="p-6 space-y-6">
        {/* Profile Information */}
        <Card style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--border-color)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-light)' }}>Profile Information</CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" style={{ color: 'var(--text-light)' }}>First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    style={{ 
                      backgroundColor: 'var(--dark-surface)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-light)'
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" style={{ color: 'var(--text-light)' }}>Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    style={{ 
                      backgroundColor: 'var(--dark-surface)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-light)'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" style={{ color: 'var(--text-light)' }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  style={{ 
                    backgroundColor: 'var(--dark-surface)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-light)'
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={profileMutation.isPending}
                style={{ backgroundColor: 'var(--emerald-primary)', color: 'white' }}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {profileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--border-color)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-light)' }}>Subscription</CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              Your current subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-light)' }} className="font-medium">
                  {user?.subscriptionTier?.charAt(0).toUpperCase() + user?.subscriptionTier?.slice(1)} Plan
                </p>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                  Subscription management coming soon
                </p>
              </div>
              <div 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: user?.subscriptionTier === 'free' ? 'var(--emerald-accent)' : 'var(--gold-accent)',
                  color: 'black'
                }}
              >
                {user?.subscriptionTier?.toUpperCase()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--border-color)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--text-light)' }}>Change Password</CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" style={{ color: 'var(--text-light)' }}>Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    style={{ 
                      backgroundColor: 'var(--dark-surface)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-light)'
                    }}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('current')}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" style={{ color: 'var(--text-light)' }}>New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    style={{ 
                      backgroundColor: 'var(--dark-surface)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-light)'
                    }}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('new')}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" style={{ color: 'var(--text-light)' }}>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    style={{ 
                      backgroundColor: 'var(--dark-surface)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-light)'
                    }}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('confirm')}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={passwordMutation.isPending}
                style={{ backgroundColor: 'var(--emerald-primary)', color: 'white' }}
                className="w-full"
              >
                {passwordMutation.isPending ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card style={{ backgroundColor: 'var(--dark-card)', borderColor: '#dc2626' }}>
          <CardHeader>
            <CardTitle style={{ color: '#dc2626' }}>Danger Zone</CardTitle>
            <CardDescription style={{ color: 'var(--text-secondary)' }}>
              Permanently delete your account and all data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--border-color)' }}>
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: 'var(--text-light)' }}>
                    Delete Account
                  </AlertDialogTitle>
                  <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
                    This action cannot be undone. This will permanently delete your account,
                    all your books, and remove all associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel style={{ color: 'var(--text-light)', borderColor: 'var(--border-color)' }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}