// 'use server';
/**
 * @fileOverview Automatically schedule appointments with a doctor based on patient availability and preferences.
 *
 * - autoScheduleAppointments - A function that handles the appointment scheduling process.
 * - AutoScheduleAppointmentsInput - The input type for the autoScheduleAppointments function.
 * - AutoScheduleAppointmentsOutput - The return type for the autoScheduleAppointments function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoScheduleAppointmentsInputSchema = z.object({
  patientAvailability: z
    .string()
    .describe(
      'The patient availability, including specific dates and times the patient is available.'
    ),
  preferredTime: z
    .string()
    .describe('The preferred time for the appointment.'),
  doctorId: z.number().describe('The ID of the doctor to schedule with.'),
  patientId: z.number().describe('The ID of the patient scheduling the appointment.'),
});

export type AutoScheduleAppointmentsInput = z.infer<
  typeof AutoScheduleAppointmentsInputSchema
>;

const AutoScheduleAppointmentsOutputSchema = z.object({
  appointmentDetails: z.object({
    appointmentDate: z.string().describe('The scheduled date of the appointment.'),
    appointmentTime: z.string().describe('The scheduled time of the appointment.'),
    doctorId: z.number().describe('The ID of the doctor for the appointment.'),
    patientId: z.number().describe('The ID of the patient for the appointment.'),
  }),
  confirmationMessage: z
    .string()
    .describe('A message confirming the appointment details.'),
});

export type AutoScheduleAppointmentsOutput = z.infer<
  typeof AutoScheduleAppointmentsOutputSchema
>;

export async function autoScheduleAppointments(
  input: AutoScheduleAppointmentsInput
): Promise<AutoScheduleAppointmentsOutput> {
  return autoScheduleAppointmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoScheduleAppointmentsPrompt',
  input: {schema: AutoScheduleAppointmentsInputSchema},
  output: {schema: AutoScheduleAppointmentsOutputSchema},
  prompt: `You are an AI assistant that automatically schedules appointments between patients and doctors.

  Given the patient's availability: {{{patientAvailability}}},
  and preferred time: {{{preferredTime}}},
  find a suitable appointment time with doctor ID: {{{doctorId}}},
  for patient ID: {{{patientId}}}.

  Return the appointment details, including the scheduled date and time, and a confirmation message.

  Ensure that the scheduled time is within the patient's availability and close to their preferred time.
  The output should be JSON formatted.
  {appointmentDetails: {appointmentDate, appointmentTime, doctorId, patientId}, confirmationMessage}`,
});

const autoScheduleAppointmentsFlow = ai.defineFlow(
  {
    name: 'autoScheduleAppointmentsFlow',
    inputSchema: AutoScheduleAppointmentsInputSchema,
    outputSchema: AutoScheduleAppointmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
