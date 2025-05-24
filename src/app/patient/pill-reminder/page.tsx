
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { PillReminder } from '@/lib/types';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Pill, PlusCircle, Trash2, BellRing } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PillReminderPage() {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<PillReminder[]>([]);
  
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [time1, setTime1] = useState('');
  const [time2, setTime2] = useState(''); // For twice a day, etc.
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const newReminder: PillReminder = {
      id: Date.now().toString(), // Simple unique ID
      medicationName,
      dosage,
      frequency,
      times: [time1, time2].filter(t => t), // Only add times that are set
      notes,
    };

    // Simulate saving
    setTimeout(() => {
      setReminders(prev => [...prev, newReminder].sort((a,b) => a.medicationName.localeCompare(b.medicationName)));
      toast({
        title: 'Reminder Set!',
        description: `Reminder for ${medicationName} has been added.`,
      });
      // Reset form
      setMedicationName('');
      setDosage('');
      setFrequency('');
      setTime1('');
      setTime2('');
      setNotes('');
      setIsLoading(false);
    }, 500);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast({
      title: 'Reminder Deleted',
      description: 'The medication reminder has been removed.',
      variant: 'destructive'
    });
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
                <Label htmlFor="medicationName">Medication Name</Label>
                <Input id="medicationName" placeholder="e.g., Amoxicillin" value={medicationName} onChange={e => setMedicationName(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input id="dosage" placeholder="e.g., 500mg, 1 tablet" value={dosage} onChange={e => setDosage(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency} required disabled={isLoading}>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once a day">Once a day</SelectItem>
                      <SelectItem value="Twice a day">Twice a day</SelectItem>
                      <SelectItem value="Thrice a day">Thrice a day</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time1">Time 1</Label>
                  <Input id="time1" type="time" value={time1} onChange={e => setTime1(e.target.value)} required disabled={isLoading || !frequency} />
                </div>
                 {(frequency === 'Twice a day' || frequency === 'Thrice a day') && (
                  <div className="space-y-2">
                    <Label htmlFor="time2">Time 2</Label>
                    <Input id="time2" type="time" value={time2} onChange={e => setTime2(e.target.value)} disabled={isLoading} />
                  </div>
                 )}
                 {/* Add Time 3 for Thrice a day if needed */}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" placeholder="e.g., Take with food" value={notes} onChange={e => setNotes(e.target.value)} rows={2} disabled={isLoading} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding Reminder...' : 'Add Reminder'}
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
            {reminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active reminders set.</p>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {reminders.map(reminder => (
                  <li key={reminder.id} className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{reminder.medicationName}</h4>
                        <p className="text-sm text-muted-foreground">Dosage: {reminder.dosage}</p>
                        <p className="text-sm text-muted-foreground">Frequency: {reminder.frequency}</p>
                        <p className="text-sm text-muted-foreground">Times: {reminder.times.join(', ')}</p>
                        {reminder.notes && <p className="text-xs italic text-muted-foreground mt-1">Notes: {reminder.notes}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteReminder(reminder.id)} className="text-destructive hover:bg-destructive/10">
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
