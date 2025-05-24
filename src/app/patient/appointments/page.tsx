
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
import { CalendarDays, CalendarPlus, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientAppointmentsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [patientAvailability, setPatientAvailability] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState(''); // Added reason for appointment
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock existing appointments
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  // Simulate fetching appointments
  useEffect(() => {
    if (user) {
      // Mock data - in a real app, fetch from backend
      const mockAppointments: Appointment[] = [
        {
          appointment_id: 1,
          patient_id: user.user_id,
          doctor_id: 101, // Mock doctor ID
          doctor_name: "Dr. Emily Carter",
          patient_name: `${user.first_name} ${user.last_name}`,
          appointment_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          reason: "Annual Checkup",
          notes: "Patient feels generally well.",
          created_at: new Date().toISOString(),
        },
        {
          appointment_id: 2,
          patient_id: user.user_id,
          doctor_id: 102,
          doctor_name: "Dr. John Davis",
          patient_name: `${user.first_name} ${user.last_name}`,
          appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          reason: "Follow-up for blood pressure",
          created_at: new Date().toISOString(),
        },
      ];
      setExistingAppointments(mockAppointments);
    }
  }, [user]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.user_type !== 'patient') {
      toast({ title: 'Error', description: 'Unauthorized action.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    // Assuming a default doctor ID for simplicity. In a real app, patient might select a doctor.
    const MOCK_DOCTOR_ID = 101; 

    const inputData: AutoScheduleAppointmentsInput = {
      patientId: user.user_id,
      doctorId: MOCK_DOCTOR_ID, 
      patientAvailability,
      preferredTime,
      // The GenAI flow doesn't take 'reason', but we might store it with the appointment later
    };

    try {
      const result = await autoScheduleAppointments(inputData);
      const newAppointment: Appointment = {
        appointment_id: Date.now(), // Mock ID
        patient_id: user.user_id,
        doctor_id: result.appointmentDetails.doctorId,
        appointment_date: new Date(`${result.appointmentDetails.appointmentDate}T${result.appointmentDetails.appointmentTime}`).toISOString(),
        reason: reason, // Store the reason
        created_at: new Date().toISOString(),
        doctor_name: `Dr. ID ${result.appointmentDetails.doctorId}`, // Placeholder name
        patient_name: `${user.first_name} ${user.last_name}`,
      };
      setExistingAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()));

      toast({
        title: 'Appointment Scheduled!',
        description: result.confirmationMessage,
        action: (
          <Button variant="outline" size="sm" onClick={() => console.log('Undo action for appointment')}>
            Details
          </Button>
        ),
      });
      // Clear form
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
                <Label htmlFor="patientAvailability">Your Availability</Label>
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
                <Label htmlFor="reason">Reason for Visit</Label>
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
            {existingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">You have no upcoming appointments.</p>
            ) : (
              <ul className="space-y-4">
                {existingAppointments.map((apt) => (
                  <li key={apt.appointment_id} className="p-4 border rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{apt.reason}</h4>
                        <p className="text-sm text-muted-foreground">With: {apt.doctor_name || `Doctor ID ${apt.doctor_id}`}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="mt-2 flex items-center text-sm text-foreground">
                      <CalendarDays className="h-4 w-4 mr-2 text-accent" />
                      {format(new Date(apt.appointment_date), "EEEE, MMMM d, yyyy")}
                    </div>
                     <div className="mt-1 flex items-center text-sm text-foreground">
                      <Clock className="h-4 w-4 mr-2 text-accent" />
                      {format(new Date(apt.appointment_date), "h:mm a")}
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
