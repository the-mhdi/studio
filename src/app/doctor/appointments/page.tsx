
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import type { Appointment } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Mock appointments data
const MOCK_APPOINTMENTS: Appointment[] = [
  { appointment_id: 101, patient_id: 1, doctor_id: 1, patient_name: 'Alice Smith', appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Annual Checkup', notes: 'Routine examination.', created_at: '2023-01-10T10:00:00Z' },
  { appointment_id: 102, patient_id: 2, doctor_id: 1, patient_name: 'Bob Johnson', appointment_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Flu Symptoms', notes: 'Patient reports fever and cough.', created_at: '2023-01-12T11:00:00Z' },
  { appointment_id: 103, patient_id: 3, doctor_id: 1, patient_name: 'Carol Williams', appointment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Follow-up', notes: 'Check progress on medication.', created_at: '2023-01-05T14:00:00Z' },
  { appointment_id: 104, patient_id: 4, doctor_id: 1, patient_name: 'David Brown', appointment_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Consultation', notes: 'Discuss lab results.', created_at: '2023-01-14T09:00:00Z' },
   { appointment_id: 105, patient_id: 1, doctor_id: 1, patient_name: 'Alice Smith', appointment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), reason: 'Previous Consultation', notes: 'Discussed treatment options.', created_at: '2022-12-20T10:00:00Z' },
];

export default function DoctorAppointmentsPage() {
  const { user: doctorUser } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    // In a real app, fetch appointments for this doctor
    if (doctorUser) {
      // MOCK: Simulating fetching appointments for this doctor
      const doctorAppointments = MOCK_APPOINTMENTS.filter(apt => apt.doctor_id === doctorUser.user_id || apt.doctor_id === 1); // doctor_id === 1 for demo
      setAppointments(doctorAppointments.sort((a,b) => parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime()));
    }
  }, [doctorUser]);

  const upcomingAppointments = appointments.filter(apt => isFuture(parseISO(apt.appointment_date)));
  const pastAppointments = appointments.filter(apt => isPast(parseISO(apt.appointment_date)));

  const renderAppointmentRow = (apt: Appointment) => (
    <TableRow key={apt.appointment_id} className="hover:bg-muted/50">
      <TableCell>
        <Link href={`/doctor/patients/${apt.patient_id}`} className="font-medium text-primary hover:underline">
          {apt.patient_name || `Patient ID: ${apt.patient_id}`}
        </Link>
      </TableCell>
      <TableCell>{format(parseISO(apt.appointment_date), 'MMMM d, yyyy')}</TableCell>
      <TableCell>{format(parseISO(apt.appointment_date), 'h:mm a')}</TableCell>
      <TableCell>{apt.reason}</TableCell>
      <TableCell>
        {isFuture(parseISO(apt.appointment_date)) ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">Upcoming</Badge>
        ) : (
          <Badge variant="secondary">Completed</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {/* Add actions like 'Cancel' or 'Reschedule' if needed */}
        <Button variant="outline" size="sm" asChild>
            <Link href={`/doctor/patients/${apt.patient_id}?tab=diagnoses`}>View Details</Link>
        </Button>
      </TableCell>
    </TableRow>
  );

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
