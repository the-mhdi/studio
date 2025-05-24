
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
// import type { Patient } from '@/lib/types'; // For creating a new patient object
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { UserPlus } from 'lucide-react';

export default function AddNewPatientPage() {
  const router = useRouter();
  const { user } = useAuthStore(); // Doctor user
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState(''); // National ID
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.user_type !== 'doctor') {
      toast({ title: 'Error', description: 'Unauthorized action.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    // Mock creating new patient. In a real app, this would be an API call.
    // const newPatientData: Omit<Patient, 'user_id' | 'username' | 'user_type' | 'created_at'> = {
    //   first_name: firstName,
    //   last_name: lastName,
    //   email,
    //   id_number: idNumber,
    //   date_of_birth: dateOfBirth,
    //   address,
    //   phone_number: phoneNumber,
    // };

    // Simulate API call
    setTimeout(() => {
      console.log('New patient data submitted (mock):', { firstName, lastName, email, idNumber, dateOfBirth, address, phoneNumber });
      toast({
        title: 'Patient Profile Created',
        description: `Profile for ${firstName} ${lastName} has been successfully created.`,
      });
      // Redirect to patient list or the new patient's profile page
      router.push('/doctor/patients'); 
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div>
      <DashboardHeader
        title="Add New Patient Profile"
        description="Enter the details for the new patient."
      />

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary"/>Patient Information</CardTitle>
            <CardDescription>
              All fields marked with * are required. Ensure data accuracy.
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

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} placeholder="e.g., john.doe@example.com"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="idNumber">Identification Number *</Label>
                <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required disabled={isLoading} placeholder="e.g., National ID, Passport No."/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={isLoading} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading} placeholder="e.g., (555) 123-4567"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} disabled={isLoading} placeholder="e.g., 123 Main St, Anytown, USA"/>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? 'Creating Profile...' : 'Create Patient Profile'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
