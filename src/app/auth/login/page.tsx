
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin, isAuthenticated, userProfile, isLoading: authIsLoading } = useAuthStore();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && userProfile) {
      if (userProfile.userType === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    }
  }, [isAuthenticated, userProfile, router, authIsLoading]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfileData = userDocSnap.data() as User;
        authLogin(firebaseUser, userProfileData); // Update auth store

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userProfileData.firstName}! Redirecting...`,
        });

        // Redirect based on user type is now handled by useEffect
      } else {
        // This case should ideally not happen if profile is created on signup
        throw new Error("User profile not found.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authIsLoading) {
     return <div className="flex min-h-screen items-center justify-center"><p>Loading authentication state...</p></div>;
  }
  
  if (isAuthenticated) {
    // Already logged in, useEffect will redirect
    return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to your dashboard...</p></div>;
  }

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
              placeholder="your.email@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
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
