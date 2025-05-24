
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/authStore';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { UserPlus } from 'lucide-react';
import { db, fbConfigForDebug } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { PatientRecord } from '@/lib/types';

export default function AddNewPatientPage() {
  const router = useRouter();
  const { userProfile: doctorUserProfile } = useAuthStore();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientSpecificPrompts, setPatientSpecificPrompts] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Log the Firebase config being used by the client SDK when the component mounts
    // Ensure fbConfigForDebug is serializable if it contains non-serializable parts (like functions)
    // For simple config objects, JSON.stringify is fine.
    if (fbConfigForDebug) {
      try {
          console.log('[AddNewPatientPage] Firebase Config being used by client SDK:', JSON.stringify(fbConfigForDebug, null, 2));
      } catch (e) {
          console.error('[AddNewPatientPage] Could not stringify fbConfigForDebug. Logging directly:', fbConfigForDebug);
      }
    } else {
        console.warn('[AddNewPatientPage] fbConfigForDebug is not available from firebase.ts');
    }
  }, []);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('[AddNewPatientPage] handleSubmit triggered.');

    if (!doctorUserProfile || doctorUserProfile.userType !== 'doctor') {
      toast({ title: 'Error', description: 'Unauthorized action. You must be logged in as a doctor.', variant: 'destructive' });
      console.error('[AddNewPatientPage] Unauthorized: doctorUserProfile missing or not a doctor.', doctorUserProfile);
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !idNumber.trim()) {
      toast({ title: 'Missing Required Fields', description: 'First Name, Last Name, and Patient ID are required.', variant: 'destructive' });
      return;
    }

    if (initialPassword.trim().length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Initial Password must be at least 6 characters long.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    console.warn("[AddNewPatientPage] SECURITY NOTE: Storing an 'initialPassword'. This should ideally be temporary and part of a secure patient onboarding flow (e.g., force change on first login), not for direct, long-term login if patients use this record directly to authenticate.");

    const patientDataToSave: Partial<PatientRecord> = {
      doctorId: doctorUserProfile.uid,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idNumber: idNumber.trim(),
      initialPassword: initialPassword.trim(),
      createdAt: serverTimestamp(),
    };

    if (email.trim()) patientDataToSave.email = email.trim();
    if (dateOfBirth.trim()) patientDataToSave.dateOfBirth = dateOfBirth.trim();
    if (address.trim()) patientDataToSave.address = address.trim();
    if (phoneNumber.trim()) patientDataToSave.phoneNumber = phoneNumber.trim();
    if (patientSpecificPrompts.trim()) patientDataToSave.patientSpecificPrompts = patientSpecificPrompts.trim();


    console.log('[AddNewPatientPage] Current doctor userProfile:', JSON.stringify(doctorUserProfile, null, 2));
    console.log('[AddNewPatientPage] Attempting to save patient data:', JSON.stringify(patientDataToSave, null, 2));

    try {
      const docRef = await addDoc(collection(db, "patientRecords"), patientDataToSave as PatientRecord); // Cast to PatientRecord

      toast({
        title: 'Patient Record Created',
        description: `Record for ${firstName} ${lastName} (Patient ID: ${idNumber}) has been successfully created. Record ID: ${docRef.id}`,
      });
      console.log('[AddNewPatientPage] Patient record created successfully. Doc ID:', docRef.id);
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setIdNumber('');
      setInitialPassword('');
      setDateOfBirth('');
      setAddress('');
      setPhoneNumber('');
      setPatientSpecificPrompts('');
    } catch (error: any) {
      console.error("[AddNewPatientPage] Error adding patient record: ", error);
      toast({
        title: 'Error Creating Record',
        description: error.message || 'Could not save patient record to the database. Please check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Add New Patient Record"
        description="Enter the details for the new patient, including an ID and an initial password for their record."
      />
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary"/>Patient Information</CardTitle>
            <CardDescription>
              Fields marked with * are required. Initial Password must be at least 6 characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} placeholder="e.g., John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} placeholder="e.g., Doe" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="idNumber">Patient ID *</Label>
                <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required disabled={isLoading} placeholder="e.g., P001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialPassword">Initial Password * (min 6 chars)</Label>
                <Input
                  id="initialPassword"
                  type="password"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  placeholder="Set an initial password"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="e.g., john.doe@example.com" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading} placeholder="e.g., (555) 123-4567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} disabled={isLoading} placeholder="e.g., 123 Main St, Anytown, USA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientSpecificPrompts">Dedicated Patient Prompts (Optional)</Label>
              <Textarea
                id="patientSpecificPrompts"
                value={patientSpecificPrompts}
                onChange={(e) => setPatientSpecificPrompts(e.target.value)}
                rows={4}
                disabled={isLoading}
                placeholder="e.g., Patient prefers concise information. Avoid medical jargon."
              />
              <p className="text-xs text-muted-foreground">
                These prompts can help guide the AI's interaction specifically for this patient.
              </p>
            </div>
            
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? 'Creating Record...' : 'Create Patient Record'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
