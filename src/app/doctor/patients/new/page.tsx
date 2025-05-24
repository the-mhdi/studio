
'use client';

import { useState, type FormEvent } from 'react';
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
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { PatientRecord } from '@/lib/types';

export default function AddNewPatientPage() {
  const router = useRouter();
  const { userProfile } = useAuthStore(); 
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [patientSpecificPrompts, setPatientSpecificPrompts] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('[AddNewPatientPage] handleSubmit triggered.');

    if (!userProfile || userProfile.userType !== 'doctor') {
      toast({ title: 'Error', description: 'Unauthorized action. You must be logged in as a doctor.', variant: 'destructive' });
      console.error('[AddNewPatientPage] Unauthorized: userProfile missing or not a doctor.', userProfile);
      return;
    }
    setIsLoading(true);

    if (!firstName.trim() || !lastName.trim() || !idNumber.trim()) {
        toast({ title: 'Missing Required Fields', description: 'First Name, Last Name, and Patient ID are required.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    const patientDataToSave: Partial<PatientRecord> = {
      doctorId: userProfile.uid,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idNumber: idNumber.trim(),
      createdAt: serverTimestamp() as any, // Firestore handles this conversion
    };

    if (email.trim()) patientDataToSave.email = email.trim();
    if (dateOfBirth.trim()) patientDataToSave.dateOfBirth = dateOfBirth.trim();
    if (address.trim()) patientDataToSave.address = address.trim();
    if (phoneNumber.trim()) patientDataToSave.phoneNumber = phoneNumber.trim();
    if (patientSpecificPrompts.trim()) patientDataToSave.patientSpecificPrompts = patientSpecificPrompts.trim();

    console.log('[AddNewPatientPage] Current doctor userProfile:', JSON.stringify(userProfile, null, 2));
    console.log('[AddNewPatientPage] Attempting to save patient data:', JSON.stringify(patientDataToSave, null, 2));

    try {
      const docRef = await addDoc(collection(db, "patientRecords"), patientDataToSave);

      toast({
        title: 'Patient Profile Created',
        description: `Profile for ${firstName} ${lastName} (ID: ${idNumber}) has been successfully created. Record ID: ${docRef.id}`,
      });
      console.log('[AddNewPatientPage] Patient record created successfully. Doc ID:', docRef.id);
      router.push('/doctor/patients'); 
    } catch (error: any) {
      console.error("[AddNewPatientPage] Error adding patient record: ", error);
      toast({
        title: 'Error Creating Profile',
        description: error.message || 'Could not save patient profile to the database. Please check console for details.',
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
        description="Enter the details for the new patient."
      />

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary"/>Patient Information</CardTitle>
            <CardDescription>
              Fields marked with * are required. This creates a patient record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} placeholder="e.g., John"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} placeholder="e.g., Doe"/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="idNumber">Patient ID *</Label>
                    <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required disabled={isLoading} placeholder="e.g., P001"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} placeholder="e.g., john.doe@example.com"/>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading} placeholder="e.g., (555) 123-4567"/>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} disabled={isLoading} placeholder="e.g., 123 Main St, Anytown, USA"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientSpecificPrompts">Dedicated Patient Prompts (Optional)</Label>
              <Textarea 
                id="patientSpecificPrompts" 
                value={patientSpecificPrompts} 
                onChange={(e) => setPatientSpecificPrompts(e.target.value)} 
                rows={4} 
                disabled={isLoading} 
                placeholder="e.g., Patient prefers concise information. Avoid medical jargon. Focus on positive reinforcement."
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

    