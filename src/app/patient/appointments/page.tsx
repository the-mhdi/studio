
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { autoScheduleAppointments, type AutoScheduleAppointmentsInput } from '@/ai/flows/auto-schedule-appointments';
import { useAuthStore } from '@/lib/authStore';
import type { Appointment } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { CalendarDays, CalendarPlus, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';

export default function PatientAppointmentsPage() {
  const { userProfile } = useAuthStore();
  const { toast } = useToast();

  const [patientAvailability, setPatientAvailability] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAppointments, setIsFetchingAppointments] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userProfile || userProfile.userType !== 'patient') {
        setIsFetchingAppointments(false);
        return;
      }
      setIsFetchingAppointments(true);
      setFetchError(null);
      try {
        const appointmentsRef = collection(db, "appointments");
        const q = query(
          appointmentsRef,
          where("patientAuthUid", "==", userProfile.uid),
          orderBy("appointmentDate", "asc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedAppointments: Appointment[] = querySnapshot.docs.map(doc => ({
          appointmentId: doc.id,
          ...doc.data(),
          appointmentDate: (doc.data().appointmentDate instanceof Timestamp ? doc.data().appointmentDate.toDate().toISOString() : doc.data().appointmentDate) as string,
        } as Appointment));
        setExistingAppointments(fetchedAppointments.filter(apt => isFuture(parseISO(apt.appointmentDate))));
      } catch (err: any) {
        console.error("Error fetching patient appointments:", err);
        setFetchError(err.message || "Failed to fetch appointments.");
      } finally {
        setIsFetchingAppointments(false);
      }
    };

    fetchAppointments();
  }, [userProfile]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile || userProfile.userType !== 'patient') {
      toast({ title: 'Error', description: 'Unauthorized action.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    // For Genkit flow which might expect numbers; Firestore uses string UIDs.
    // This part needs reconciliation or the Genkit flow needs to accept string UIDs.
    // For now, using a placeholder doctorId for Genkit.
    const GENKIT_PATIENT_ID_PLACEHOLDER = 1; // Replace with actual mapping if available
    const GENKIT_DOCTOR_ID_PLACEHOLDER = 101; 

    const inputData: AutoScheduleAppointmentsInput = {
      patientId: GENKIT_PATIENT_ID_PLACEHOLDER, // This ID needs careful consideration.
      doctorId: GENKIT_DOCTOR_ID_PLACEHOLDER, 
      patientAvailability,
      preferredTime,
    };

    try {
      const result = await autoScheduleAppointments(inputData);
      
      const appointmentDateTime = new Date(`${result.appointmentDetails.appointmentDate}T${result.appointmentDetails.appointmentTime}`);

      const newAppointmentData: Omit<Appointment, 'appointmentId' | 'createdAt'> = {
        patientAuthUid: userProfile.uid,
        doctorId: result.appointmentDetails.doctorId.toString(), // Assuming Genkit returns doctorId as number
        appointmentDate: appointmentDateTime.toISOString(),
        reason: reason,
        patientName: `${userProfile.firstName} ${userProfile.lastName}`,
        doctorName: `Dr. ID ${result.appointmentDetails.doctorId}`, // Placeholder, ideally fetch doctor details
        status: 'upcoming',
      };

      const docRef = await addDoc(collection(db, "appointments"), {
        ...newAppointmentData,
        createdAt: serverTimestamp()
      });

      const newAppointmentForState: Appointment = {
        ...newAppointmentData,
        appointmentId: docRef.id,
        createdAt: new Date().toISOString() // client-side placeholder
      };
      
      setExistingAppointments(prev => [...prev, newAppointmentForState].sort((a,b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()));

      toast({
        title: 'Appointment Scheduled!',
        description: result.confirmationMessage,
      });
      setPatientAvailability('');
      setPreferredTime('');
      setReason('');
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Could not schedule appointment. The AI assistant might be unavailable or inputs are invalid. Please try describing availability like "Next Monday afternoon, or any weekday after 5 PM".',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Manage Your Appointments"
        description="Schedule new appointments with our AI assistant or view your upcoming visits."
      />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-6 w-6 text-primary" />
              Schedule New Appointment
            </CardTitle>
            <CardDescription>
              Let our AI find the best time for you. Describe your availability and preferences.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientAvailability">Your Availability *</Label>
                <Textarea
                  id="patientAvailability"
                  placeholder="e.g., 'Any weekday next week after 3 PM', 'Mondays or Wednesdays all day', 'This Friday morning'"
                  value={patientAvailability}
                  onChange={(e) => setPatientAvailability(e.target.value)}
                  rows={3}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Time Slot (if any)</Label>
                <Input
                  id="preferredTime"
                  type="text"
                  placeholder="e.g., 'Around 10 AM', 'Late afternoon', 'Evening'"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit *</Label>
                <Input
                  id="reason"
                  type="text"
                  placeholder="e.g., 'Annual checkup', 'Flu symptoms', 'Follow-up'"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? 'Finding Slot...' : 'Schedule with AI'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Your Upcoming Appointments
            </CardTitle>
             <CardDescription>
              A list of your scheduled visits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingAppointments ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading appointments...</p>
                </div>
            ) : fetchError ? (
                 <div className="text-center py-10 text-destructive">
                    <AlertTriangle size={48} className="mx-auto mb-4" />
                    <p>Error: {fetchError}</p>
                </div>
            ) : existingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">You have no upcoming appointments.</p>
            ) : (
              <ul className="space-y-4">
                {existingAppointments.map((apt) => (
                  <li key={apt.appointmentId} className="p-4 border rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{apt.reason}</h4>
                        <p className="text-sm text-muted-foreground">With: {apt.doctorName || `Doctor ID ${apt.doctorId}`}</p>
                      </div>
                      {apt.status === 'upcoming' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-foreground">
                      <CalendarDays className="h-4 w-4 mr-2 text-accent" />
                      {format(parseISO(apt.appointmentDate), "EEEE, MMMM d, yyyy")}
                    </div>
                     <div className="mt-1 flex items-center text-sm text-foreground">
                      <Clock className="h-4 w-4 mr-2 text-accent" />
                      {format(parseISO(apt.appointmentDate), "h:mm a")}
                    </div>
                    {apt.notes && <p className="mt-1 text-xs text-muted-foreground italic">Notes: {apt.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
