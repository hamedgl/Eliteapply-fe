// Static content for the marketing landing page. Kept out of LandingPage.tsx
// so the component file stays readable and the data can be code-split.

import { Link2, ListChecks, PenLine, ShieldCheck } from "lucide-react";

export const workflowStageDetails = [
  {
    title: "Add & capture",
    summary: "Opportunity details & initial setup",
    description:
      "Add the opportunity and capture the details that shape the application plan.",
    tasks: [
      {
        title: "Opportunity details",
        copy: "Title, organisation, deadline and location",
        done: true,
        doneAction: "Edit details",
        pendingAction: "Add details",
      },
      {
        title: "Programme information",
        copy: "Field of study, level, duration and mode",
        done: true,
        doneAction: "Edit",
        pendingAction: "Add programme info",
      },
      {
        title: "Requirements capture",
        copy: "Documents, eligibility and written materials",
        done: false,
        doneAction: "Review requirements",
        pendingAction: "Add requirements",
      },
      {
        title: "Funding & benefits",
        copy: "Stipend, tuition and other support",
        done: false,
        doneAction: "Review funding",
        pendingAction: "Add details",
      },
      {
        title: "Notes & links",
        copy: "Official sources and personal notes",
        done: false,
        doneAction: "Edit notes",
        pendingAction: "Add notes",
      },
    ],
  },
  {
    title: "Break down",
    summary: "Requirements & tasks breakdown",
    description:
      "Turn every requirement into a visible task with a clear owner and state.",
    tasks: [
      {
        title: "Eligibility criteria",
        copy: "Academic, residency and experience rules",
        done: true,
        doneAction: "Review",
        pendingAction: "Check eligibility",
      },
      {
        title: "Required documents",
        copy: "Transcripts, certificates and identification",
        done: true,
        doneAction: "Review",
        pendingAction: "Add documents",
      },
      {
        title: "Written responses",
        copy: "Prompts, word limits and evidence needs",
        done: true,
        doneAction: "Open plan",
        pendingAction: "Plan responses",
      },
      {
        title: "Reference requirements",
        copy: "Referees, due dates and supporting context",
        done: false,
        doneAction: "Review referees",
        pendingAction: "Add referees",
      },
      {
        title: "Submission instructions",
        copy: "Provider process and final deadline checks",
        done: false,
        doneAction: "Review instructions",
        pendingAction: "Add details",
      },
    ],
  },
  {
    title: "Prepare",
    summary: "Documents, drafts & materials",
    description:
      "Prepare the writing, documents and evidence required for a complete application.",
    tasks: [
      {
        title: "Personal statement",
        copy: "Draft connected to the application prompt",
        done: true,
        doneAction: "Open draft",
        pendingAction: "Start draft",
      },
      {
        title: "Academic CV",
        copy: "Current education, research and experience",
        done: true,
        doneAction: "Review",
        pendingAction: "Add CV",
      },
      {
        title: "Transcripts & certificates",
        copy: "Verified files connected to requirements",
        done: true,
        doneAction: "View files",
        pendingAction: "Upload files",
      },
      {
        title: "Evidence connections",
        copy: "Examples supporting each written claim",
        done: true,
        doneAction: "Review",
        pendingAction: "Connect evidence",
      },
      {
        title: "Referee brief",
        copy: "Relevant context for the outstanding request",
        done: false,
        doneAction: "Edit brief",
        pendingAction: "Prepare brief",
      },
    ],
  },
  {
    title: "Review & submit",
    summary: "Final check & submission",
    description:
      "Resolve the remaining gaps, complete final checks and record the submission.",
    tasks: [
      {
        title: "Requirements covered",
        copy: "Every requirement has a recorded state",
        done: true,
        doneAction: "Review",
        pendingAction: "Check coverage",
      },
      {
        title: "Documents verified",
        copy: "Current versions are linked and readable",
        done: true,
        doneAction: "Review",
        pendingAction: "Verify documents",
      },
      {
        title: "References confirmed",
        copy: "Requests and provider instructions checked",
        done: true,
        doneAction: "Review",
        pendingAction: "Confirm references",
      },
      {
        title: "Final declarations",
        copy: "Accuracy, consent and submission details",
        done: true,
        doneAction: "Open checks",
        pendingAction: "Complete checks",
      },
      {
        title: "Submission record",
        copy: "Record the provider confirmation and outcome",
        done: false,
        doneAction: "Edit record",
        pendingAction: "Record submission",
      },
    ],
  },
] as const;


export const workflowProgress = [
  [100, 15, 0, 0],
  [100, 68, 12, 0],
  [100, 100, 72, 15],
  [100, 100, 100, 84],
] as const;


export type HeroWorkspaceTask = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
};


export const heroAiActions = [
  {
    id: "write",
    label: "Write with AI",
    Icon: PenLine,
    status: "AI draft ready — opening paragraph rewritten",
  },
  {
    id: "match",
    label: "Match evidence",
    Icon: Link2,
    status: "Evidence matched to your strongest examples",
  },
  {
    id: "extract",
    label: "Extract requirements",
    Icon: ListChecks,
    status: "6 requirements extracted from the prompt",
  },
  {
    id: "review",
    label: "Run AI review",
    Icon: ShieldCheck,
    status: "AI review complete — 3 improvements suggested",
  },
] as const;
export type HeroAiActionId = (typeof heroAiActions)[number]["id"];


export const heroWorkspaceApplications = [
  {
    id: "rhodes",
    programme: "Rhodes Scholarship",
    status: "In progress",
    nextAction: "Connect leadership evidence",
    actionDetail: "Personal statement · Evidence map",
    deadlineDays: 18,
    deadlineDate: "15 September",
    readiness: 72,
    requirementsCovered: 9,
    tasks: [
      {
        id: "leadership",
        label: "Connect leadership evidence",
        detail: "Link one verified outcome to your personal statement.",
        done: false,
      },
      {
        id: "opening",
        label: "Shape the opening narrative",
        detail: "Draft reviewed and connected to your motivation notes.",
        done: true,
      },
      {
        id: "referee",
        label: "Confirm referee availability",
        detail: "Send the final briefing note to your academic referee.",
        done: false,
      },
      {
        id: "transcript",
        label: "Verify academic transcript",
        detail: "Official PDF checked against the application requirements.",
        done: true,
      },
      {
        id: "eligibility",
        label: "Review eligibility declaration",
        detail: "Complete the final residency and age criteria check.",
        done: false,
      },
    ],
  },
  {
    id: "knight-hennessy",
    programme: "Knight-Hennessy Scholars",
    status: "Drafting",
    nextAction: "Strengthen the personal statement",
    actionDetail: "Personal statement · Motivation",
    deadlineDays: 34,
    deadlineDate: "1 October",
    readiness: 61,
    requirementsCovered: 7,
    tasks: [
      {
        id: "statement",
        label: "Strengthen the personal statement",
        detail: "Connect your long-term goal to a specific Stanford resource.",
        done: false,
      },
      {
        id: "video",
        label: "Outline the video statement",
        detail: "Three story beats are ready for a first recording.",
        done: true,
      },
      {
        id: "resume",
        label: "Condense the leadership résumé",
        detail: "Reduce two older entries and quantify current impact.",
        done: false,
      },
      {
        id: "references",
        label: "Brief both recommenders",
        detail: "Background notes and submission dates have been shared.",
        done: true,
      },
    ],
  },
  {
    id: "eth",
    programme: "ETH Excellence Scholarship",
    status: "Planning",
    nextAction: "Confirm programme requirements",
    actionDetail: "Eligibility · Document checklist",
    deadlineDays: 79,
    deadlineDate: "15 November",
    readiness: 48,
    requirementsCovered: 5,
    tasks: [
      {
        id: "requirements",
        label: "Confirm programme requirements",
        detail: "Compare the department checklist with the scholarship call.",
        done: false,
      },
      {
        id: "proposal",
        label: "Draft the pre-proposal outline",
        detail: "Research question and methodology still need review.",
        done: false,
      },
      {
        id: "grades",
        label: "Convert the grade summary",
        detail: "Institutional grading scale is attached and verified.",
        done: true,
      },
      {
        id: "supervisor",
        label: "Shortlist potential supervisors",
        detail: "Add one more faculty fit before requesting feedback.",
        done: false,
      },
    ],
  },
] as const;


export function createInitialHeroTaskState() {
  return Object.fromEntries(
    heroWorkspaceApplications.map((application) => [
      application.id,
      Object.fromEntries(application.tasks.map((task) => [task.id, task.done])),
    ]),
  ) as Record<string, Record<string, boolean>>;
}
