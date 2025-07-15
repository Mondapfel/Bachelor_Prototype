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
const getFieldsByAI = async (
  title: string
): Promise<Partial<taskFormData> | null> => {
  /*
      In the future, this function will:
      1. Get the current date: const today = new Date().toISOString().split('T')[0];
      2. Create a detailed prompt for the LLM API.
      3. Send the prompt and get a JSON response like:
          { "priority": "Kritisch", "label": "Bug", "dueDate": "2025-07-16" }
      4. Parse the response and return the updates object.
      5. Handle date strings by converting them back to Date objects.
    */
  console.log("AI prediction would run for:", title);
  return null;
};

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

export default function TaskDialog() {
  const { addTask, selectedTask, setSelectedTask, updateTasks, tasks } =
    useTasksDataStore();

  const methods = useForm<taskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      priority: "Mittel",
      label: "Feature",
      status: "Start ausstehend",
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
        toast[result ? "success" : "error"](
          result
            ? `Die Aufgabe [${newTask.taskId}] wurde erfolgreich hinzugefügt!`
            : `Aufgabe hinzufügen fehlgeschlagen`
        );

        reset();
        setIsOpen(false);
      } catch (error) {
        console.log(error);
        toast.error("Aufgabe hinzufügen fehlgeschlagen");
      } finally {
        setIsLoading(false);
      }
    } else {
      const updateTasksArray = tasks?.map((t) => {
        if (t.taskId === selectedTask.taskId) {
          return {
            ...t,
            title: data.title,
            label: data.label,
            priority: data.priority,
            status: data.status,
            dueDate: data.dueDate,
          };
        }
        return t;
      });

      if (updateTasksArray) {
        const result = await updateTasks(updateTasksArray, "copy");
        toast[result ? "success" : "error"](
          result
            ? `Die Aufgabe [${selectedTask.taskId}] wurde erfolgreich aktualisiert!`
            : `Aufgabe aktualisieren fehlgeschlagen`
        );
      }

      setIsLoading(false);
      setIsOpen(false);
    }
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
        <Button className="bg-blue-400 dark:bg-blue-800 dark:text-white rounded dark:hover:bg-gray-400">
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
