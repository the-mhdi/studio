
'use server';
/**
 * @fileOverview Handles AI chat interactions for patients.
 * It attempts to fetch doctor-specific and patient-specific instructions
 * to provide a personalized AI response.
 *
 * - patientChatFlow - The main flow function.
 * - PatientChatFlowInput - Input type for the flow.
 * - PatientChatFlowOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase'; // Using client SDK for Firestore access
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { PatientRecord, AiInstruction } from '@/lib/types';

export const PatientChatFlowInputSchema = z.object({
  userMessage: z.string().describe('The message sent by the patient.'),
  patientAuthUid: z.string().describe("The authenticated UID of the patient."),
});
export type PatientChatFlowInput = z.infer<typeof PatientChatFlowInputSchema>;

export const PatientChatFlowOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the patient."),
});
export type PatientChatFlowOutput = z.infer<typeof PatientChatFlowOutputSchema>;

// Define the prompt structure
const patientChatPrompt = ai.definePrompt({
  name: 'patientChatPrompt',
  input: { schema: z.object({ userMessage: z.string(), systemInstructions: z.string() }) },
  output: { schema: PatientChatFlowOutputSchema },
  prompt: `{{{systemInstructions}}}

  Patient message: {{{userMessage}}}

  AI response:`,
});


export async function patientChat(input: PatientChatFlowInput): Promise<PatientChatFlowOutput> {
  return patientChatFlow(input);
}

export const patientChatFlow = ai.defineFlow(
  {
    name: 'patientChatFlow',
    inputSchema: PatientChatFlowInputSchema,
    outputSchema: PatientChatFlowOutputSchema,
  },
  async (input) => {
    let systemInstructions = "You are MediMind, a helpful AI assistant for patients. Provide general health information and assist with non-urgent queries. Do not provide medical diagnoses. Always encourage users to consult their doctor for specific medical advice or serious issues.";
    let patientSpecificPrompts = "";
    let doctorId: string | null = null;

    try {
      // 1. Fetch PatientRecord using patientAuthUid to find doctorId and patientSpecificPrompts
      const patientRecordsRef = collection(db, "patientRecords");
      const qPatient = query(patientRecordsRef, where("linkedAuthUid", "==", input.patientAuthUid));
      const patientSnapshot = await getDocs(qPatient);

      if (!patientSnapshot.empty) {
        const patientRecordDoc = patientSnapshot.docs[0];
        const patientRecordData = patientRecordDoc.data() as PatientRecord;
        doctorId = patientRecordData.doctorId;
        if (patientRecordData.patientSpecificPrompts) {
          patientSpecificPrompts = patientRecordData.patientSpecificPrompts;
        }
        console.log('[patientChatFlow] Found PatientRecord, DoctorID:', doctorId, "Patient Prompts:", patientSpecificPrompts || "None");
      } else {
        // Fallback: check if patientAuthUid is a patientRecordId itself (for Patient ID logins)
        const patientDocRefById = doc(db, "patientRecords", input.patientAuthUid);
        const patientDocByIdSnap = await getDoc(patientDocRefById);
        if (patientDocByIdSnap.exists()) {
            const patientRecordData = patientDocByIdSnap.data() as PatientRecord;
            doctorId = patientRecordData.doctorId;
            if (patientRecordData.patientSpecificPrompts) {
                patientSpecificPrompts = patientRecordData.patientSpecificPrompts;
            }
            console.log('[patientChatFlow] Found PatientRecord by ID, DoctorID:', doctorId, "Patient Prompts:", patientSpecificPrompts || "None");
        } else {
             console.log('[patientChatFlow] No PatientRecord found for patientAuthUid:', input.patientAuthUid);
        }
      }

      // 2. If doctorId found, fetch AiInstruction for that doctor
      if (doctorId) {
        const instructionRef = doc(db, "aiInstructions", doctorId);
        const instructionSnap = await getDoc(instructionRef);
        if (instructionSnap.exists()) {
          const instructionData = instructionSnap.data() as AiInstruction;
          systemInstructions = instructionData.instructionText; // Prioritize doctor's main instruction
          if (instructionData.promptText) { // Append doctor's custom prompts
            systemInstructions += `\n\nAdditionally, consider these specific guidelines or Q&A examples from the doctor:\n${instructionData.promptText}`;
          }
           console.log('[patientChatFlow] Fetched AI Instructions for Doctor ID:', doctorId);
        } else {
          console.log('[patientChatFlow] No specific AI Instructions found for Doctor ID:', doctorId, 'Using default.');
        }
      }

      // 3. Append patient-specific prompts if available
      if (patientSpecificPrompts) {
        systemInstructions += `\n\nFor this specific patient, please also consider: ${patientSpecificPrompts}`;
      }

    } catch (error) {
      console.error('[patientChatFlow] Error fetching patient/doctor context:', error);
      // Fallback to default instructions if any error occurs
    }

    console.log('[patientChatFlow] Final System Instructions:', systemInstructions);
    console.log('[patientChatFlow] User Message to AI:', input.userMessage);

    const { output } = await patientChatPrompt({
      userMessage: input.userMessage,
      systemInstructions: systemInstructions,
    });

    if (!output) {
      console.error('[patientChatFlow] AI did not return an output.');
      return { aiResponse: "I'm sorry, I couldn't generate a response at this moment. Please try again later." };
    }
    console.log('[patientChatFlow] AI Response:', output.aiResponse);
    return output;
  }
);
