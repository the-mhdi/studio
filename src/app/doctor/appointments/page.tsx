
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import type { Appointment } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export default function DoctorAppointmentsPage() {
  const { userProfile: doctorUserProfile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorUserProfile || doctorUserProfile.userType !== 'doctor') {
        setIsLoading(false);
        setError("Doctor profile not available.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const appointmentsRef = collection(db, "appointments");
        const q = query(
          appointmentsRef,
          where("doctorId", "==", doctorUserProfile.uid),
          orderBy("appointmentDate", "desc") // Fetch all and sort, then filter client-side
        );
        const querySnapshot = await getDocs(q);
        const fetchedAppointments: Appointment[] = querySnapshot.docs.map(doc => ({
          appointmentId: doc.id,
          ...doc.data(),
          // Ensure appointmentDate is string for parseISO; Firestore might store as Timestamp
          appointmentDate: (doc.data().appointmentDate instanceof Timestamp ? doc.data().appointmentDate.toDate().toISOString() : doc.data().appointmentDate) as string,
        } as Appointment));
        
        setAppointments(fetchedAppointments);
      } catch (err: any) {
        console.error("Error fetching appointments:", err);
        setError(err.message || "Failed to fetch appointments.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [doctorUserProfile]);

  const upcomingAppointments = appointments.filter(apt => apt.appointmentDate && isFuture(parseISO(apt.appointmentDate)));
  const pastAppointments = appointments.filter(apt => apt.appointmentDate && isPast(parseISO(apt.appointmentDate)));

  const renderAppointmentRow = (apt: Appointment) => (
    <TableRow key={apt.appointmentId} className="hover:bg-muted/50">
      <TableCell>
        <Link href={`/doctor/patients/${apt.patientRecordId || apt.patientAuthUid}`} className="font-medium text-primary hover:underline">
          {apt.patientName || `Patient ID: ${apt.patientAuthUid}`}
        </Link>
      </TableCell>
      <TableCell>{apt.appointmentDate ? format(parseISO(apt.appointmentDate), 'MMMM d, yyyy') : 'N/A'}</TableCell>
      <TableCell>{apt.appointmentDate ? format(parseISO(apt.appointmentDate), 'h:mm a') : 'N/A'}</TableCell>
      <TableCell>{apt.reason || 'N/A'}</TableCell>
      <TableCell>
        {apt.appointmentDate && isFuture(parseISO(apt.appointmentDate)) ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">Upcoming</Badge>
        ) : (
          <Badge variant="secondary">Completed</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" asChild>
            <Link href={`/doctor/patients/${apt.patientRecordId || apt.patientAuthUid}?tab=diagnoses`}>View Details</Link>
        </Button>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="Your Appointments" description="Loading appointments..." />
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div>
        <DashboardHeader title="Your Appointments" />
        <div className="text-center py-10 text-destructive">
            <AlertTriangle size={48} className="mx-auto mb-4" />
            <p>Error loading appointments: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
        </div>
      </div>
     );
  }


  return (
    <div>
      <DashboardHeader
        title="Your Appointments"
        description="Manage and view your scheduled patient appointments."
      />

      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-6 w-6 text-primary" />Upcoming Appointments</CardTitle>
            <CardDescription>Appointments scheduled for the future.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
                No upcoming appointments.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map(renderAppointmentRow)}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-gray-500" />Past Appointments</CardTitle>
            <CardDescription>History of completed appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <XCircle size={48} className="mx-auto mb-4 opacity-50" />
                No past appointments recorded.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAppointments.map(renderAppointmentRow)}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
