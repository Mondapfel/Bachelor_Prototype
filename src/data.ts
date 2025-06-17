export interface Status {
  id: number;
  name: string;
  color: string;
}

export interface TaskItem {
  task: string;
  status: Status | null;
  due: Date | null;
  notes: string;
}

export const STATUSES: Status[] = [
  { id: 1, name: "On Deck", color: "blue.300" },
  { id: 2, name: "In Progress", color: "yellow.400" },
  { id: 3, name: "Testing", color: "pink.300" },
  { id: 4, name: "Deployed", color: "green.300" },
];

const DATA: TaskItem[] = [
  {
    task: "Add a New Feature",
    status: STATUSES[0],
    due: new Date("2023-10-15"),
    notes: "This is a note",
  },
  {
    task: "Write Integration Tests",
    status: STATUSES[1],
    due: null,
    notes: "Use Jest",
  },
  {
    task: "Add Instagram Integration",
    status: STATUSES[4],
    due: null,
    notes: "",
  },
  {
    task: "Cleanup Database",
    status: null,
    due: new Date("2023/02/15"),
    notes: "Remove old data",
  },
  {
    task: "Refactor API Endpoints",
    status: STATUSES[3],
    due: null,
    notes: "",
  },
  {
    task: "Add Documentation to API",
    status: null,
    due: new Date("2023/09/12"),
    notes: "Add JS Docs to all endpoints",
  },
  {
    task: "Update NPM Packages",
    status: STATUSES[1],
    due: null,
    notes: "Upgrade React & Chakra UI",
  },
];

export default DATA;