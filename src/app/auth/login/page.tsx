
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
import { signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User, PatientRecord } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin, isAuthenticated, userProfile, isLoading: authIsLoading } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && userProfile) {
      console.log('[LoginPage] useEffect: Authenticated, redirecting. Profile UID:', userProfile.uid, 'Type:', userProfile.userType);
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
    console.log('[LoginPage] handleSubmit: Attempting login with email:', email);

    // Attempt custom PatientRecord email/initialPassword login first
    try {
      console.log('[LoginPage] Attempting PatientRecord login for email:', email, 'and password:', password ? '******' : '(empty)');
      const patientRecordsRef = collection(db, "patientRecords");
      const qByEmail = query(patientRecordsRef, where("email", "==", email));
      console.log('[LoginPage] PatientRecord login Firestore query created for email:', email);
      const emailQuerySnapshot = await getDocs(qByEmail);
      console.log('[LoginPage] PatientRecord login query by email executed. Found documents:', emailQuerySnapshot.size);

      if (!emailQuerySnapshot.empty) {
        let patientRecordFoundAndMatched = false;
        for (const docSnap of emailQuerySnapshot.docs) {
          const record = docSnap.data() as PatientRecord;
          console.log('[LoginPage] Checking patient record by email:', docSnap.id, 'Data (email):', record.email);
          if (record.initialPassword === password) {
            console.log('[LoginPage] PatientRecord email and initialPassword match for record:', docSnap.id);
            patientRecordFoundAndMatched = true;
            
            const patientUserProfile: User = {
              uid: `patientrecord_${docSnap.id}`, 
              email: record.email || null,
              firstName: record.firstName,
              lastName: record.lastName,
              userType: 'patient', 
              createdAt: record.createdAt instanceof Timestamp ? record.createdAt.toDate().toISOString() : record.createdAt || new Date().toISOString(),
              patientRecordIdForAuth: docSnap.id, 
            };
            console.log('[LoginPage] Constructed patientUserProfile for PatientRecord email login:', patientUserProfile);
            authLogin(null, patientUserProfile); 
            toast({
              title: "Login Successful",
              description: `Welcome back, ${patientUserProfile.firstName}! Redirecting...`,
            });
            setIsSubmitting(false);
            return; 
          } else {
            console.log('[LoginPage] PatientRecord found for email (ID:', docSnap.id,'), but initialPassword did not match.');
          }
        }
        if (patientRecordFoundAndMatched) return; 
        console.log('[LoginPage] PatientRecord(s) found for email, but initialPassword did not match for any.');
      } else {
        console.log('[LoginPage] No patient record found for email:', email, 'in patientRecords collection.');
      }
    } catch (error: any) {
      console.error("[LoginPage] Error during PatientRecord email/password login attempt:", error);
    }

    // Attempt Firebase Email/Password login if PatientRecord login didn't succeed
    console.log('[LoginPage] Attempting Firebase email/password login for email:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('[LoginPage] Firebase auth successful for UID:', firebaseUser.uid);

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfileDataFromFirestore = userDocSnap.data() as User;
        console.log('[LoginPage] Firestore user profile found for Firebase auth:', userProfileDataFromFirestore);
        authLogin(firebaseUser, userProfileDataFromFirestore);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userProfileDataFromFirestore.firstName}! Redirecting...`,
        });
      } else {
        console.error("[LoginPage] Firebase auth successful, but Firestore user profile not found for UID:", firebaseUser.uid);
        await firebaseSignOut(auth);
        useAuthStore.getState().logout(); 
        throw new Error("User profile not found after Firebase login. Please contact support or try signing up again.");
      }
    } catch (error: any) {
      console.error("[LoginPage] Firebase Email/Password login error:", error); 
      toast({
        title: "Login Failed",
        description: (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') 
          ? "Invalid email or password. Please try again." 
          : error.message || "An unexpected error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authIsLoading) {
    return <div className="flex min-h-screen items-center justify-center"><p>Loading authentication state...</p></div>;
  }

  if (isAuthenticated && userProfile && !isSubmitting) {
    return <div className="flex min-h-screen items-center justify-center"><p>Redirecting to your dashboard...</p></div>;
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Login to SAAIP</CardTitle>
        <CardDescription>Enter your Email and Password.</CardDescription>
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
    
