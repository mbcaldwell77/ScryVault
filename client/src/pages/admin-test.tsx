import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function AdminTest() {
  const { getUser, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const user = getUser();

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--dark-background)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Test Page</h1>
        
        <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Authentication Status</h2>
          <p><strong>Is Authenticated:</strong> {isAuthenticated().toString()}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'No user'}</p>
          <p><strong>User Role:</strong> {user?.role || 'No role'}</p>
          <p><strong>Is Admin:</strong> {(user?.role === 'admin').toString()}</p>
          
          <div className="space-x-4 mt-6">
            <Button onClick={() => setLocation('/')}>Home</Button>
            <Button onClick={() => setLocation('/admin')}>Admin Dashboard</Button>
          </div>
        </div>
      </div>
    </div>
  );
}