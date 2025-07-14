import {z} from "zod";

export type Label = "Bug" | "Feature" | "Dokumentation";
export type Priority = "Niedrig" | "Mittel" | "Hoch" | "Kritisch";

export const taskFormSchema = z.object({
    title: z.string().min(1, "Titel fehlt!").max(100, "Titel zu lang!"),
    status: z.enum(["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"]),
    priority: z.enum(["Niedrig", "Mittel", "Hoch", "Kritisch"]),
    label: z.enum(["Bug", "Feature", "Dokumentation"]),
    dueDate: z.date(),
});

export type taskFormData = z.infer<typeof taskFormSchema>;