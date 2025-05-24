
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuthStore } from "@/lib/authStore";
import type { User, UserRole } from "@/lib/types"; // Changed from MockUser
import { useRouter } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupPage() {
  const router = useRouter();
  const { login: authLogin, isAuthenticated, userProfile, isLoading: authIsLoading } = useAuthStore();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && userProfile) {
      console.log('[SignupPage] useEffect: Authenticated and profile exists, redirecting.', userProfile);
      if (userProfile.userType === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    } else {
      console.log('[SignupPage] useEffect: Conditions not met for redirect.', { authIsLoading, isAuthenticated, userProfile });
    }
  }, [isAuthenticated, userProfile, router, authIsLoading]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    console.log('[SignupPage] handleSubmit: Attempting signup with role:', role);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('[SignupPage] handleSubmit: Firebase user created:', firebaseUser.uid);

      const userProfileData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName,
        lastName,
        userType: role,
        createdAt: new Date().toISOString(), // Will be replaced by serverTimestamp if possible, or use as fallback
      };
      console.log('[SignupPage] handleSubmit: Constructed userProfileData:', userProfileData);


      // Store user profile in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, {
        ...userProfileData,
        createdAt: serverTimestamp(), // Use Firestore server timestamp for reliability
      });
      console.log('[SignupPage] handleSubmit: User profile stored in Firestore for UID:', firebaseUser.uid);
      
      // Update auth store
      // It's important that userProfileData here is complete and valid
      if (!userProfileData || !userProfileData.uid || !userProfileData.userType) {
        console.error("[SignupPage] handleSubmit: FATAL - userProfileData is invalid before calling authLogin.", userProfileData);
        throw new Error("Profile data construction failed.");
      }
      authLogin(firebaseUser, userProfileData); 
      console.log('[SignupPage] handleSubmit: authLogin called in authStore.');

      toast({
        title: "Signup Successful!",
        description: `Welcome, ${firstName}! Your account as a ${role} has been created. Redirecting...`,
      });
      
      // Redirection is now handled by useEffect
      
    } catch (error: any) {
      console.error("[SignupPage] handleSubmit: Signup error:", error);
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authIsLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading authentication state...</p></div>;
  }

  if (isAuthenticated && userProfile) {
    // Already logged in and profile exists, useEffect will redirect
    return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to your dashboard...</p></div>;
  }
  
  // If authenticated but no profile yet (e.g. right after signup before onAuthStateChanged fully updates profile in store)
  // this can also show a loading or a specific message. For now, this means form is shown if profile is not yet loaded with auth.
  // This might lead to a flicker if redirection is slightly delayed.

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create your MediMind Account</CardTitle>
        <CardDescription>Join us as a Doctor or Patient.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSubmitting} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john.doe@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="********" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} minLength={6} />
          </div>
          <div className="space-y-2">
            <Label>I am a:</Label>
            <RadioGroup
              defaultValue="patient"
              onValueChange={(value: string) => setRole(value as UserRole)}
              className="flex space-x-4"
              // disabled={isSubmitting} // RadioGroup doesn't have a direct disabled prop like this
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patient" id="role-patient" disabled={isSubmitting} />
                <Label htmlFor="role-patient">Patient</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="doctor" id="role-doctor" disabled={isSubmitting} />
                <Label htmlFor="role-doctor">Doctor</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
