
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
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User, PatientRecord } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin, isAuthenticated, userProfile, isLoading: authIsLoading } = useAuthStore();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState(''); // Can be email or Patient ID
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && userProfile) {
      console.log('[LoginPage] useEffect: Authenticated, redirecting. Profile:', userProfile);
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
    console.log('[LoginPage] handleSubmit: Attempting login with identifier:', identifier);

    // Attempt Patient ID login first
    // For this example, let's assume Patient IDs might have a common prefix or structure, or we just try it.
    // A more robust way would be to clearly distinguish or have separate fields.
    try {
      console.log('[LoginPage] Attempting Patient ID login for:', identifier);
      const patientRecordsRef = collection(db, "patientRecords");
      const q = query(patientRecordsRef, where("idNumber", "==", identifier));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let patientRecordFound = false;
        for (const docSnap of querySnapshot.docs) {
          const record = docSnap.data() as PatientRecord;
          if (record.initialPassword === password) {
            console.log('[LoginPage] Patient ID and initialPassword match for record:', record);
            patientRecordFound = true;
            const patientUserProfile: User = {
              uid: `patientrecord_${docSnap.id}`, // Create a unique-ish ID for this session
              email: record.email || null,
              firstName: record.firstName,
              lastName: record.lastName,
              userType: 'patient',
              createdAt: record.createdAt || new Date().toISOString(), // Fallback
              patientRecordIdForAuth: docSnap.id,
            };
            authLogin(null, patientUserProfile); // authUser is null for this type of login
            toast({
              title: "Login Successful",
              description: `Welcome back, ${patientUserProfile.firstName}! Redirecting...`,
            });
            // Redirection handled by useEffect
            setIsSubmitting(false);
            return; // Exit after successful patient ID login
          }
        }
        if (patientRecordFound) return; // Should have returned inside loop
        console.log('[LoginPage] Patient ID found, but initialPassword did not match.');
        // Don't toast error yet, fall through to email login attempt
      } else {
        console.log('[LoginPage] No patient record found for ID:', identifier);
        // Fall through to email login attempt
      }
    } catch (error: any) {
      console.error("[LoginPage] Error during Patient ID login attempt:", error);
      // Fall through to email login attempt, don't toast yet
    }

    // Attempt Firebase Email/Password login
    try {
      console.log('[LoginPage] Attempting Firebase email/password login for:', identifier);
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      const firebaseUser = userCredential.user;
      console.log('[LoginPage] Firebase auth successful for UID:', firebaseUser.uid);

      // Fetch user profile from Firestore 'users' collection
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfileData = userDocSnap.data() as User;
        console.log('[LoginPage] Firestore user profile found for Firebase auth:', userProfileData);
        authLogin(firebaseUser, userProfileData); // Update auth store
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userProfileData.firstName}! Redirecting...`,
        });
        // Redirection is now handled by useEffect
      } else {
        console.error("[LoginPage] Firebase auth successful, but Firestore user profile not found for UID:", firebaseUser.uid);
        // This case should ideally not happen if profile is created on signup
        throw new Error("User profile not found after Firebase login. Please contact support.");
      }
    } catch (error: any) {
      console.error("[LoginPage] Firebase Email/Password login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or Patient ID/Password combination. Please try again.",
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
    // Already logged in, useEffect will redirect
    return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to your dashboard...</p></div>;
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Login to MediMind</CardTitle>
        <CardDescription>Enter your Email/Patient ID and Password.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Patient ID</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="your.email@example.com or P001"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
