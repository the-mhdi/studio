
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { PillReminder } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Pill, PlusCircle, Trash2, BellRing, Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/authStore';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';

export default function PillReminderPage() {
  const { userProfile } = useAuthStore();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<PillReminder[]>([]);
  
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [times, setTimes] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'patient') {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    setFetchError(null);

    const remindersRef = collection(db, "pillReminders");
    const q = query(
      remindersRef,
      where("patientAuthUid", "==", userProfile.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReminders: PillReminder[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReminders.push({
          reminderId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
        } as PillReminder);
      });
      setReminders(fetchedReminders);
      setIsFetching(false);
    }, (error) => {
      console.error("Error fetching pill reminders: ", error);
      setFetchError("Could not load reminders.");
      setIsFetching(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, [userProfile]);

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const addTimeField = () => {
    if (times.length < 5) { // Limit number of time fields
      setTimes([...times, '']);
    }
  };
  
  const removeTimeField = (index: number) => {
    if (times.length > 1) {
      const newTimes = times.filter((_, i) => i !== index);
      setTimes(newTimes);
    }
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userProfile || userProfile.userType !== 'patient') {
      toast({ title: 'Error', description: 'Unauthorized action.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);

    const reminderData: Omit<PillReminder, 'reminderId' | 'createdAt'> = {
      patientAuthUid: userProfile.uid,
      medicationName,
      dosage,
      frequency,
      times: times.filter(t => t.trim() !== ''), // Only add times that are set
      notes,
    };

    try {
      await addDoc(collection(db, "pillReminders"), {
        ...reminderData,
        createdAt: serverTimestamp()
      });
      toast({
        title: 'Reminder Set!',
        description: `Reminder for ${medicationName} has been added.`,
      });
      // Reset form
      setMedicationName('');
      setDosage('');
      setFrequency('');
      setTimes(['']);
      setNotes('');
    } catch (error) {
      console.error("Error saving pill reminder:", error);
      toast({ title: 'Error', description: 'Could not save reminder.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteDoc(doc(db, "pillReminders", reminderId));
      toast({
        title: 'Reminder Deleted',
        description: 'The medication reminder has been removed.',
        variant: 'destructive'
      });
    } catch (error) {
      console.error("Error deleting pill reminder:", error);
      toast({ title: 'Error', description: 'Could not delete reminder.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <DashboardHeader
        title="Pill Reminders"
        description="Manage your medication schedule and never miss a dose."
      />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              Add New Reminder
            </CardTitle>
            <CardDescription>Fill in the details for your new medication reminder.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicationName">Medication Name *</Label>
                <Input id="medicationName" placeholder="e.g., Amoxicillin" value={medicationName} onChange={e => setMedicationName(e.target.value)} required disabled={isSaving} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input id="dosage" placeholder="e.g., 500mg, 1 tablet" value={dosage} onChange={e => setDosage(e.target.value)} required disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select value={frequency} onValueChange={setFrequency} required disabled={isSaving}>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once a day">Once a day</SelectItem>
                      <SelectItem value="Twice a day">Twice a day</SelectItem>
                      <SelectItem value="Thrice a day">Thrice a day</SelectItem>
                      <SelectItem value="Every X hours">Every X hours</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Times *</Label>
                {times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input type="time" value={time} onChange={e => handleTimeChange(index, e.target.value)} required={index === 0} disabled={isSaving} />
                    {index === times.length - 1 && times.length < 5 && (
                      <Button type="button" variant="outline" size="icon" onClick={addTimeField} disabled={isSaving}><PlusCircle className="h-4 w-4"/></Button>
                    )}
                    {times.length > 1 && (
                       <Button type="button" variant="ghost" size="icon" onClick={() => removeTimeField(index)} disabled={isSaving} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></Button>
                    )}
                  </div>
                ))}
                 <p className="text-xs text-muted-foreground">Specify all times you need to take this medication.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" placeholder="e.g., Take with food, Before bedtime" value={notes} onChange={e => setNotes(e.target.value)} rows={2} disabled={isSaving} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isSaving ? 'Adding Reminder...' : 'Add Reminder'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-6 w-6 text-primary" />
              Your Active Reminders
            </CardTitle>
            <CardDescription>Current list of your medication reminders.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetching ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading reminders...</p>
                </div>
            ): fetchError ? (
                 <div className="text-center py-10 text-destructive">
                    <AlertTriangle size={48} className="mx-auto mb-4" />
                    <p>Error: {fetchError}</p>
                </div>
            ) : reminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active reminders set.</p>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto p-1">
                {reminders.map(reminder => (
                  <li key={reminder.reminderId} className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{reminder.medicationName}</h4>
                        <p className="text-sm text-muted-foreground">Dosage: {reminder.dosage}</p>
                        <p className="text-sm text-muted-foreground">Frequency: {reminder.frequency}</p>
                        <p className="text-sm text-muted-foreground">Times: {reminder.times.join(', ')}</p>
                        {reminder.notes && <p className="text-xs italic text-muted-foreground mt-1">Notes: {reminder.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteReminder(reminder.reminderId!)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Delete reminder</span>
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-green-600">
                        <BellRing className="h-4 w-4 mr-1" />
                        Active
                    </div>
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
