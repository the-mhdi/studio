
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/authStore";
import type { MockUser } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// Simple mock patient store (in a real app, this would be a database)
const mockPatientCredentials: Record<string, string> = {
  "P001": "password123",
  "P002": "testpass",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Mock authentication logic
    setTimeout(() => {
      let userRole: 'doctor' | 'patient' | null = null;
      let mockUser: MockUser | null = null;
      let loginSuccessful = false;

      // Check if it's a patient ID login (e.g., "P001")
      // A more robust check might involve a regex like /^[Pp]\d+$/
      if (emailOrId.toUpperCase().startsWith('P') && !emailOrId.includes('@')) {
        // For simplicity, assume any password is correct for a known mock patient ID
        // Or, check against mockPatientCredentials if populated
        if (mockPatientCredentials[emailOrId.toUpperCase()] === password) {
            userRole = 'patient';
            mockUser = {
                user_id: Date.now(), // Mock ID, could be derived from patient ID
                username: emailOrId.toUpperCase(),
                email: `${emailOrId.toLowerCase()}@example.com`, // Mock email
                first_name: 'Patient',
                last_name: emailOrId.toUpperCase(), // Use ID as last name for mock
                user_type: 'patient',
                created_at: new Date().toISOString(),
            };
            loginSuccessful = true;
        } else if (Object.keys(mockPatientCredentials).includes(emailOrId.toUpperCase())) {
            // ID exists, but password wrong
             toast({
                title: "Login Failed",
                description: "Incorrect password for Patient ID.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
         // If ID not in mock store, it will fall through to general error
      } else if (emailOrId.startsWith('doctor@')) {
        userRole = 'doctor';
        // Simulate password check for doctor
        loginSuccessful = true; // Assume any password is fine for mock doctor
      } else if (emailOrId.startsWith('patient@')) {
        userRole = 'patient';
        // Simulate password check for patient email
        loginSuccessful = true; // Assume any password is fine for mock patient email
      }

      if (loginSuccessful && userRole) {
        if (!mockUser) { // Create mockUser if not already created (for email logins)
            mockUser = {
                user_id: Date.now(),
                username: emailOrId.split('@')[0],
                email: emailOrId,
                first_name: userRole === 'doctor' ? 'Doctor' : 'Patient',
                last_name: 'User',
                user_type: userRole,
                created_at: new Date().toISOString(),
            };
        }
        login(mockUser);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${mockUser.first_name}! Redirecting...`,
        });

        if (mockUser.user_type === 'doctor') {
          router.push('/doctor/dashboard');
        } else {
          router.push('/patient/dashboard');
        }
      } else {
         toast({
          title: "Login Failed",
          description: "Invalid credentials. Use 'doctor@', 'patient@', or a valid Patient ID and password.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Login to MediMind</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailOrId">Email or Patient ID</Label>
            <Input 
              id="emailOrId" 
              type="text" 
              placeholder="e.g., doctor@example.com or P001" 
              required 
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="********"
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
