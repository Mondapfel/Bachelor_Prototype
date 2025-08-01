import { z } from "zod";

// These arrays are the single source of truth for the dropdown values.
export const labels = ["Bug", "Feature", "Dokumentation"] as const;
export const priorities = ["Niedrig", "Mittel", "Hoch", "Kritisch"] as const;
export const statuses = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"] as const;

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Titel fehlt!" })
    .max(100, { message: "Titel darf maximal 100 Zeichen lang sein." }),

  // Allows an empty string for the placeholder, but requires a valid status on submit.
  status: z.enum(statuses, { required_error: "Status fehlt!" }).or(z.literal("")),

  // Allows an empty string for the placeholder, but requires a valid priority on submit.
  priority: z.enum(priorities, { required_error: "Priorität fehlt!" }).or(z.literal("")),
    
  // Allows an empty string for the placeholder, but requires a valid label on submit.
  label: z.enum(labels, { required_error: "Label fehlt!" }).or(z.literal("")),

  // Allows the date to be null initially, but requires a valid date on submit.
  dueDate: z.date({ required_error: "Fälligkeitsdatum fehlt!" }).nullable(),
})
// This check runs on the whole form after individual fields are validated.
.refine(data => data.status, {
    message: "Status fehlt!",
    path: ["status"], // Points the error message to the correct field.
})
.refine(data => data.priority, {
    message: "Priorität fehlt!",
    path: ["priority"],
})
.refine(data => data.label, {
    message: "Label fehlt!",
    path: ["label"],
})
.refine(data => data.dueDate !== null, {
    message: "Fälligkeitsdatum fehlt!",
    path: ["dueDate"],
});

export type taskFormData = z.infer<typeof taskFormSchema>;