
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Mock authentication logic
    // In a real app, you'd call an API endpoint
    setTimeout(() => {
      let userRole = 'patient'; // Default role
      if (email.startsWith('doctor@')) {
        userRole = 'doctor';
      } else if (email.startsWith('patient@')) {
        userRole = 'patient';
      } else {
         toast({
          title: "Login Failed",
          description: "Invalid email prefix. Use 'doctor@' or 'patient@'.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const mockUser: MockUser = {
        user_id: Date.now(),
        username: email.split('@')[0],
        email: email,
        first_name: userRole === 'doctor' ? 'Doctor' : 'Patient',
        last_name: 'User',
        user_type: userRole as 'doctor' | 'patient',
        created_at: new Date().toISOString(),
      };
      
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
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="doctor@example.com or patient@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
