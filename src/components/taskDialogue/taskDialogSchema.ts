import { z } from "zod";

export type Label = "Bug" | "Feature" | "Dokumentation";
export type Priority = "Niedrig" | "Mittel" | "Hoch" | "Kritisch";

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Tifel fehlt!" })
    .max(100, { message: "Titel darf maximal 100 Zeichen lang sein." }),

  status: z.enum(
    ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"],
    {
      required_error: "Status fehlt!",
    }
  ),

  priority: z.enum(["Niedrig", "Mittel", "Hoch", "Kritisch"], {
    required_error: "Priorität fehlt!",
  }),

  label: z.enum(["Bug", "Feature", "Dokumentation"], {
    required_error: "Label fehlt!",
  }),

  dueDate: z.date({
    required_error: "Fälligkeitsdatum fehlt!",
  }),
});

export type taskFormData = z.infer<typeof taskFormSchema>;