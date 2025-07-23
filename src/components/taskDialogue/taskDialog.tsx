import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import TaskLabels from "./subComponents/taskLabel";
import TaskPriority from "./subComponents/taskPriority";
import TaskStatus from "./subComponents/taskStatus";
import TaskTitle from "./subComponents/taskTitle";
import TaskDueDate from "./subComponents/taskDueDate";
import { type taskFormData, taskFormSchema } from "./taskDialogSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useOpenDialogStore } from "@/hooks/useOpenDialogStore";
import { useEffect, useState } from "react";
import { useTasksDataStore } from "@/hooks/useTasksDataStore";
import { type Task } from "@/data/TasksData";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdaptationModes, CURRENT_ADAPTATION_MODE } from "@/lib/adaptionConfig";
import OpenAI from "openai";

// A more robust, nested rule-based logic
const getFieldsByRule = (title: string): Partial<taskFormData> => {
  const lowerCaseTitle = title.toLowerCase();
  const updates: Partial<taskFormData> = {};

  // --- Keyword Definitions ---
  const criticalKeywords = [
    "dringend",
    "kritisch",
    "absturz",
    "blockiert",
    "notfall",
    "sofort",
    "wichtig",
  ];
  // Keywords for critical bugs and high priority tasks
  const bugKeywords = [
    // German
    "bug",
    "fehler",
    "problem",
    "ausfall",
    "panne",
    "funktioniert nicht",
    "geht nicht",
    "kaputt",
    "fehlermeldung",
    // English / Denglish
    "fix",
    "urgent",
    "critical",
    "issue",
    "error",
    "failure",
    "hotfix",
    "crash",
  ];
  const docKeywords = [
    // German
    "doku",
    "dokumentation",
    "dokumentieren",
    "anleitung",
    "handbuch",
    "schreiben",
    "verfassen",
    "beschreibung",
    "leitfaden",
    "protokoll",
    "release notes",
    "aktualisieren",
    "bericht",
    // English / Denglish
    "documentation",
    "doc",
    "write",
    "guide",
    "manual",
    "update",
  ];

  // Check for the main topic first
  if (bugKeywords.some((keyword) => lowerCaseTitle.includes(keyword))) {
    // IT'S A BUG
    updates.label = "Bug";

    // Now, determine the priority within the context of it being a bug.
    // Is it a documentation bug?
    if (docKeywords.some((keyword) => lowerCaseTitle.includes(keyword))) {
      // It's a documentation bug, so it's not critical.
      updates.priority = "Niedrig";
    } else if (
      criticalKeywords.some((keyword) => lowerCaseTitle.includes(keyword))
    ) {
      // It's a general bug that is explicitly critical.
      updates.priority = "Kritisch";
      updates.status = "Zu Erledigen";
    } else {
      // It's a standard bug.
      updates.priority = "Hoch";
      updates.status = "Zu Erledigen";
    }
  } else if (docKeywords.some((keyword) => lowerCaseTitle.includes(keyword))) {
    // IT'S A DOCUMENTATION TASK (and not a bug)
    updates.label = "Dokumentation";
    updates.priority = "Niedrig"; // Documentation is rarely high priority.
    updates.status = "Start ausstehend";
  } else {
    // IT'S LIKELY A FEATURE
    updates.label = "Feature";
    if (criticalKeywords.some((keyword) => lowerCaseTitle.includes(keyword))) {
      updates.priority = "Hoch"; // A new feature can be high priority.
    } else {
      updates.priority = "Mittel";
    }
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (lowerCaseTitle.includes("heute")) {
    updates.dueDate = today;
  } else if (lowerCaseTitle.includes("morgen")) {
    updates.dueDate = tomorrow;
  }

  return updates;
};

// Strategy 2: AI Logic (Placeholder)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey,
  // 2. This flag is required to acknowledge you're running this in a browser
  dangerouslyAllowBrowser: true,
});

const getFieldsByAI = async (
  title: string
): Promise<Partial<taskFormData> | null> => {
  if (title.length < 10) return null; // Don't run for very short titles

  // Define the structure and constraints for the AI
  const availableLabels = ["Bug", "Feature", "Dokumentation"];
  const availablePriorities = ["Kritisch", "Hoch", "Mittel", "Niedrig"];
  const availableStatuses = [
    "Start ausstehend",
    "Zu Erledigen",
    "In Bearbeitung",
    "Blockiert",
    "Erledigt",
  ];
  const currentDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format

  // Construct a detailed prompt for reliable JSON output
  const prompt = `
    You are an expert German project management assistant. Analyze the user's task title and provide structured suggestions in JSON format.
    The user is German, so interpret terms like "morgen" (tomorrow) or "dringend" (urgent) accordingly.

    Current Date: ${currentDate}
    Task Title: "${title}"

    Instructions:
    1.  **label**: Choose the most appropriate label from this list: ${JSON.stringify(
      availableLabels
    )}.
    2.  **priority**: Choose the most appropriate priority from this list: ${JSON.stringify(
      availablePriorities
    )}.
    3.  **status**: Choose a logical starting status from this list: ${JSON.stringify(
      availableStatuses
    )}.
    4.  **dueDate**: If a date is mentioned (e.g., "heute", "morgen", "nächsten Freitag"), calculate the date in YYYY-MM-DD format. If no date is mentioned, return null.

    Output:
    Return ONLY a valid JSON object with the keys "label", "priority", "status", and "dueDate".
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, // Enforce JSON output
    });

    const responseContent = completion.choices[0].message.content;

    if (responseContent) {
      const suggestions = JSON.parse(responseContent);
      const updates: Partial<taskFormData> = {};

      if (suggestions.label) updates.label = suggestions.label;
      if (suggestions.priority) updates.priority = suggestions.priority;
      if (suggestions.status) updates.status = suggestions.status;

      // Convert date string back to a Date object if it exists
      if (suggestions.dueDate) {
        updates.dueDate = new Date(suggestions.dueDate);
      }

      return updates;
    }
  } catch (error) {
    console.error("Error fetching OpenAI suggestions:", error);
    toast.error("AI-Vorschlag fehlgeschlagen.");
  }

  return null; // Return null if anything fails
};

// --- Adaptation Controller Component ---
function AdaptationController({ isEditing }: { isEditing: boolean }) {
  const { control, setValue, getValues } = useFormContext<taskFormData>();
  const title = useWatch({ control, name: "title" });

  useEffect(() => {
    const applyAdaptation = async () => {
      if (isEditing || title.length < 5) return;

      let predictedFields: Partial<taskFormData> | null = null;
      if (CURRENT_ADAPTATION_MODE === AdaptationModes.RULE_BASED) {
        predictedFields = getFieldsByRule(title);
      } else if (CURRENT_ADAPTATION_MODE === AdaptationModes.AI) {
        predictedFields = await getFieldsByAI(title);
      }

      if (predictedFields) {
        Object.entries(predictedFields).forEach(([fieldName, value]) => {
          const key = fieldName as keyof taskFormData;
          if (value && value !== getValues(key)) {
            setValue(key, value, { shouldValidate: true });
          }
        });
      }
    };

    const debounceTimer = setTimeout(() => {
      applyAdaptation();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [title, setValue, getValues, isEditing]);

  return null;
}

// --- Main Task Dialog Component ---
export default function TaskDialog() {
  // Destructure the new `updateSingleTask` function
  const { addTask, selectedTask, setSelectedTask, updateSingleTask } =
    useTasksDataStore();

  const methods = useForm<taskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      priority: "Mittel",
      label: "Feature",
      status: "Zu Erledigen",
    },
  });

  const { handleSubmit, reset, setValue } = methods;
  const { isOpen, setIsOpen } = useOpenDialogStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedTask) {
      setValue("title", selectedTask.title);
      setValue("status", selectedTask.status);
      setValue("priority", selectedTask.priority);
      setValue("label", selectedTask.label);
      setValue("dueDate", selectedTask.dueDate);
    }
  }, [isOpen, selectedTask, setValue]);

  const onSubmit = async (data: taskFormData) => {
    setIsLoading(true);

    // --- ADDING a new task ---
    if (!selectedTask) {
      const newTask: Task = {
        taskId: `Task-${generateRandomThreeDigitNumber()}`,
        title: data.title,
        status: data.status,
        priority: data.priority,
        label: data.label,
        dueDate: data.dueDate,
        isFavorite: false,
        createdAt: new Date(),
      };

      try {
        const result = await addTask(newTask);
        // Use the custom toast message but with the correct success check
        toast[result.success ? "success" : "error"](
          result.success
            ? `Die Aufgabe [${newTask.taskId}] wurde erfolgreich hinzugefügt!`
            : `Aufgabe hinzufügen fehlgeschlagen`
        );
      } catch (error) {
        console.log(error);
        toast.error("Aufgabe hinzufügen fehlgeschlagen");
      }

      // --- EDITING an existing task ---
    } else {
      try {
        // Use the new, cleaner updateSingleTask function
        const result = await updateSingleTask(selectedTask.taskId, {
          title: data.title,
          status: data.status,
          priority: data.priority,
          label: data.label,
          dueDate: data.dueDate,
        });

        // Keep the existing toast message logic for consistency
        toast[result.success ? "success" : "error"](
          result.success
            ? `Die Aufgabe [${selectedTask.taskId}] wurde erfolgreich aktualisiert!`
            : `Aufgabe aktualisieren fehlgeschlagen`
        );
      } catch (error) {
        console.log(error);
        toast.error("Aufgabe aktualisieren fehlgeschlagen");
      }
    }

    // Reset and close the dialog
    setIsLoading(false);
    setIsOpen(false);
    setSelectedTask(null);
    reset();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setSelectedTask(null);
          reset();
        }
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-400 dark:bg-blue-800 dark:text-white rounded dark:hover:bg-gray-400 rounded-md">
          Neue Aufgabe hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {selectedTask ? "Aufgabe bearbeiten" : "Aufgabe hinzufügen"}
          </DialogTitle>
          <DialogDescription>
            Füllen Sie alle Felder aus, um die Aufgabe hinzuzufügen.
          </DialogDescription>
          <div className="mt-4">
            <Separator className="mt-3" />
          </div>
        </DialogHeader>

        <FormProvider {...methods}>
          <AdaptationController isEditing={!!selectedTask} />
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="my-8">
              <div className="grid grid-cols-2 gap-5">
                <TaskTitle />
                <TaskLabels />
              </div>
              <div className="grid grid-cols-2 gap-5 mt-6">
                <TaskStatus />
                <TaskPriority />
              </div>
              <div className="grid grid-cols-2 gap-5 mt-6">
                <TaskDueDate />
              </div>
            </div>
            <DialogFooter className="mb-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="px-9">
                  Abbrechen
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedTask
                      ? "Aufgabe wird aktualisiert..."
                      : "Aufgabe wird hinzugefügt..."}
                  </>
                ) : selectedTask ? (
                  "Aufgabe aktualisieren"
                ) : (
                  "Aufgabe hinzufügen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function generateRandomThreeDigitNumber(): string {
  const randomNumber = Math.floor(Math.random() * 900) + 100;
  return randomNumber.toString();
}
