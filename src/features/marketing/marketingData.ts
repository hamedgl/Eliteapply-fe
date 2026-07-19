export type ProductProof =
  | "tracker"
  | "writing"
  | "documents"
  | "references"
  | "readiness"
  | "organiser"
  | "deadlines"
  | "checklist";

export type FeaturePageConfig = {
  path: string;
  name: string;
  title: string;
  description: string;
  intent: string;
  proof: ProductProof;
  capabilities: readonly string[];
  workflow: readonly (readonly [string, string])[];
  does: readonly string[];
  doesNot: readonly string[];
  guidePaths: readonly string[];
};

export const featurePages: readonly FeaturePageConfig[] = [
  {
    path: "/features/scholarship-application-tracker",
    name: "Scholarship application tracker",
    title: "Keep every scholarship application moving.",
    description:
      "See status, deadlines, priority, progress, missing requirements, recent activity and the next responsible action without rebuilding your plan in multiple tools.",
    intent: "Track active scholarship applications",
    proof: "tracker",
    capabilities: [
      "Track status and priority without hiding the underlying requirements",
      "Keep real provider deadlines visible beside preparation progress",
      "Surface missing work before it becomes a submission-day problem",
      "Record the last meaningful activity for each application",
      "Move from an overview into the next responsible action",
    ],
    workflow: [
      ["Capture", "Add the opportunity, source link, deadline and essential context."],
      ["Prioritise", "Break requirements into work and decide what deserves attention first."],
      ["Prepare", "Connect writing, evidence, documents and reference activity."],
      ["Review", "Resolve gaps and complete a deliberate final check."],
    ],
    does: [
      "Shows honest status and deadlines",
      "Surfaces next actions and missing items",
      "Tracks progress across requirements",
      "Keeps each application in its own workspace",
    ],
    doesNot: [
      "Find scholarships on your behalf",
      "Make provider decisions for you",
      "Guarantee a scholarship outcome",
      "Replace your judgement or authentic voice",
    ],
    guidePaths: [
      "/resources/organise-multiple-scholarship-applications",
      "/resources/scholarship-deadline-planning",
      "/resources/scholarship-application-checklist",
    ],
  },
  {
    path: "/features/personal-statement-workspace",
    name: "Personal statement workspace",
    title: "Build each statement from evidence—not from a blank page.",
    description:
      "Break down the prompt, map relevant evidence, shape a draft and review clarity while keeping ownership of every sentence.",
    intent: "Plan scholarship personal statements",
    proof: "writing",
    capabilities: [
      "Keep the provider prompt and requirements beside the draft",
      "Map experiences and outcomes to the claims they support",
      "Create and revisit draft versions without losing context",
      "Use word-count guidance when a real limit exists",
      "Review organisation and clarity without replacing your voice",
    ],
    workflow: [
      ["Interpret the prompt", "Identify the question, criteria, limits and evidence the response needs."],
      ["Choose evidence", "Select specific experiences that demonstrate the qualities you plan to discuss."],
      ["Draft", "Write in your own language with the prompt and evidence in view."],
      ["Review", "Check clarity, coverage, word count and authenticity before export."],
    ],
    does: [
      "Keeps prompts, notes and evidence connected",
      "Supports editable drafting and revision",
      "Shows real word or character limits",
      "Helps review clarity and requirement coverage",
    ],
    doesNot: [
      "Promise a winning personal statement",
      "Know what a selection panel will decide",
      "Invent experiences or evidence",
      "Submit writing without your review",
    ],
    guidePaths: [
      "/resources/plan-scholarship-personal-statement",
      "/resources/connect-claims-to-evidence",
      "/resources/authentic-voice-ai-assistance",
    ],
  },
  {
    path: "/features/document-organiser",
    name: "Scholarship document organiser",
    title: "Keep every document connected to the requirement it supports.",
    description:
      "Organise transcripts, certificates and supporting evidence once, then see where each item is used and what is still missing.",
    intent: "Organise scholarship documents and evidence",
    proof: "documents",
    capabilities: [
      "Group documents by useful academic and application categories",
      "Connect a file to the applications and requirements that use it",
      "Reuse the same source document without duplicating the work",
      "Keep titles and version context clear",
      "Download or delete documents from the authenticated workspace",
    ],
    workflow: [
      ["Collect", "Bring the source documents you already control into one workspace."],
      ["Label", "Use clear names and categories that will still make sense near the deadline."],
      ["Connect", "Map each document to the requirement or application it supports."],
      ["Check", "Resolve missing, outdated or ambiguous items before final review."],
    ],
    does: [
      "Organises uploaded application documents",
      "Connects documents to requirements",
      "Makes missing-item state visible",
      "Provides download and deletion controls",
    ],
    doesNot: [
      "Certify or authenticate a document",
      "Translate documents automatically",
      "Decide whether a provider will accept a file",
      "Replace the provider's current document instructions",
    ],
    guidePaths: [
      "/resources/international-scholarship-document-checklist",
      "/resources/translations-certified-documents",
      "/resources/scholarship-application-checklist",
    ],
  },
  {
    path: "/features/reference-tracking",
    name: "Scholarship reference tracker",
    title: "Track reference requirements before they become urgent.",
    description:
      "Keep the referee, requirement, request status, due date, follow-up state and supporting context visible for each application.",
    intent: "Track scholarship references",
    proof: "references",
    capabilities: [
      "Record who is providing each reference and for which application",
      "Keep request and confirmation status visible",
      "Share relevant context without exposing unrelated application work",
      "Plan respectful follow-up around the real due date",
      "Preserve confidentiality boundaries when a reference is private",
    ],
    workflow: [
      ["Confirm the requirement", "Check the required referee type, format and submission route."],
      ["Ask early", "Make a clear request with enough context and a realistic response window."],
      ["Track", "Record the request, due date and follow-up state without guessing completion."],
      ["Confirm", "Use the provider's process to verify that the requirement is satisfied."],
    ],
    does: [
      "Tracks reference requests and status",
      "Stores supporting context for the request",
      "Keeps due dates and follow-up visible",
      "Supports confidential reference workflows",
    ],
    doesNot: [
      "Verify the truth of a reference",
      "Guarantee a referee will respond",
      "Reveal confidential final content",
      "Replace the scholarship provider's submission system",
    ],
    guidePaths: [
      "/resources/request-scholarship-reference",
      "/resources/reference-request-email-template",
      "/resources/scholarship-deadline-planning",
    ],
  },
  {
    path: "/features/submission-readiness",
    name: "Submission readiness review",
    title: "Know what is ready, what is missing and what needs one final review.",
    description:
      "Review requirement, evidence, writing, reference and declaration state beside the real deadline before you submit.",
    intent: "Review scholarship application readiness",
    proof: "readiness",
    capabilities: [
      "Review coverage by application area rather than one vague score",
      "See missing requirements and incomplete evidence explicitly",
      "Check writing, reference and declaration state",
      "Keep the provider deadline in the review context",
      "Move directly to the item that still needs attention",
    ],
    workflow: [
      ["Review coverage", "Compare the application's requirements with the work currently recorded."],
      ["Resolve gaps", "Open missing or incomplete items and decide the next responsible action."],
      ["Check declarations", "Confirm the acknowledgements and final confirmations required by the provider."],
      ["Submit deliberately", "Complete the provider's submission process and record the outcome."],
    ],
    does: [
      "Shows complete, incomplete and missing work",
      "Keeps deadline context visible",
      "Provides a final review checklist",
      "Links readiness state to the underlying item",
    ],
    doesNot: [
      "Predict a scholarship decision",
      "Guarantee that an application is competitive",
      "Submit to every external provider automatically",
      "Replace a provider's own final confirmation page",
    ],
    guidePaths: [
      "/resources/scholarship-application-checklist",
      "/resources/connect-claims-to-evidence",
      "/resources/international-scholarship-document-checklist",
    ],
  },
] as const;

export type IntentPageConfig = {
  path: string;
  name: string;
  title: string;
  description: string;
  proof: ProductProof;
  definition: string;
  differentiator: string;
  systemParts: readonly (readonly [string, string])[];
  steps: readonly string[];
  relatedPaths: readonly string[];
};

export const intentPages: readonly IntentPageConfig[] = [
  {
    path: "/scholarship-application-tracker",
    name: "Scholarship application tracker",
    title: "Track scholarship applications from first shortlist to final decision.",
    description:
      "A focused tracker for applicants who need to see every active application, deadline, stage and next action together.",
    proof: "tracker",
    definition:
      "A scholarship application tracker answers a progress question: which applications are active, where does each one stand and what needs attention next?",
    differentiator:
      "Use the tracker when your main challenge is monitoring several live applications. Use the organiser when you need the complete materials and evidence system behind each one.",
    systemParts: [
      ["Application overview", "Programme, provider, stage and priority."],
      ["Deadline context", "The real date alongside remaining preparation work."],
      ["Progress", "Completed and missing requirements, not an invented success score."],
      ["Next action", "One concrete step that moves the application forward."],
    ],
    steps: ["Add each active opportunity", "Record the provider deadline", "Break down requirements", "Update status from real work", "Review the next action weekly"],
    relatedPaths: ["/scholarship-application-organiser", "/scholarship-deadline-tracker", "/pricing"],
  },
  {
    path: "/scholarship-application-organiser",
    name: "Scholarship application organiser",
    title: "Organise every scholarship application without losing the details.",
    description:
      "Bring opportunities, requirements, deadlines, drafts, documents, evidence and references into one connected application system.",
    proof: "organiser",
    definition:
      "A scholarship application organiser is the complete working system behind an application—not only a list of dates or statuses.",
    differentiator:
      "Use an organiser when scattered materials are the problem. The tracker is the overview, the deadline tracker concentrates on time, and the checklist provides a repeatable preparation sequence.",
    systemParts: [
      ["Opportunities", "The applications you are considering or preparing."],
      ["Requirements", "Eligibility, essays, evidence, references and declarations."],
      ["Working materials", "Drafts, notes, source evidence and supporting documents."],
      ["Application state", "Deadline, progress, missing work and next action."],
    ],
    steps: ["Create one home for each application", "Capture the source and deadline", "Translate instructions into requirements", "Connect documents and evidence", "Request references early", "Plan writing", "Review and record submission"],
    relatedPaths: ["/features", "/scholarship-application-checklist", "/resources/organise-multiple-scholarship-applications"],
  },
  {
    path: "/scholarship-deadline-tracker",
    name: "Scholarship deadline tracker",
    title: "Turn scholarship deadlines into a preparation plan.",
    description:
      "See application deadlines in context, then work backwards through writing, documents, references and review milestones.",
    proof: "deadlines",
    definition:
      "A scholarship deadline tracker should do more than store a date. It should connect the provider deadline to the work that must happen before it.",
    differentiator:
      "Use this view when timing is the main challenge. The application tracker monitors overall status; the organiser keeps every working material connected.",
    systemParts: [
      ["Provider deadline", "The current date from the official opportunity source."],
      ["Internal milestones", "Earlier dates for references, documents, drafting and review."],
      ["Dependencies", "Work that cannot start until another item is ready."],
      ["Time-zone note", "The deadline time and zone exactly as the provider states it."],
    ],
    steps: ["Verify the official deadline", "Record the time zone", "Set a personal submission buffer", "Place reference and document milestones", "Review the plan after material changes"],
    relatedPaths: ["/features/scholarship-application-tracker", "/resources/scholarship-deadline-planning", "/scholarship-application-checklist"],
  },
  {
    path: "/scholarship-application-checklist",
    name: "Scholarship application checklist",
    title: "Build a scholarship application checklist around the real requirements.",
    description:
      "Create a complete preparation sequence for eligibility, writing, evidence, documents, references, declarations and final review.",
    proof: "checklist",
    definition:
      "A useful scholarship application checklist begins with the current provider instructions. It is a working review tool, not a universal promise that every scholarship asks for the same items.",
    differentiator:
      "Use the checklist to prepare and review one application thoroughly. Use the tracker to monitor several applications and the organiser to keep all supporting material connected.",
    systemParts: [
      ["Eligibility", "Conditions you must satisfy before investing in the application."],
      ["Written responses", "Prompts, limits, draft state and final checks."],
      ["Evidence and documents", "The proof required for each claim or criterion."],
      ["References and declarations", "People, permissions and final confirmations."],
    ],
    steps: ["Read the complete instructions", "List every required item", "Mark ownership and due date", "Connect supporting evidence", "Review missing and ambiguous items", "Complete the provider's final checks"],
    relatedPaths: ["/features/submission-readiness", "/resources/scholarship-application-checklist", "/pricing"],
  },
] as const;

export type GuideSection = {
  heading: string;
  body: string;
  bullets: readonly string[];
};

export type ResourceGuide = {
  path: string;
  cluster: "Organisation" | "Writing" | "Evidence and references" | "International applicants";
  title: string;
  description: string;
  introduction: string;
  sections: readonly GuideSection[];
  relatedFeature: string;
  relatedGuides: readonly string[];
};

export const resourceGuides: readonly ResourceGuide[] = [
  {
    path: "/resources/organise-multiple-scholarship-applications",
    cluster: "Organisation",
    title: "How to organise multiple scholarship applications",
    description: "Build one reliable system for opportunities, requirements, deadlines and next actions.",
    introduction: "The aim is not to create more administration. It is to make each application easy to resume after a busy day, a delayed document or a change in priorities.",
    sections: [
      { heading: "Give every application one home", body: "Create a single application record before writing begins. Keep the official link, provider, programme, deadline and current stage together.", bullets: ["Use the provider's current page as the source of truth", "Record the deadline time and time zone when provided", "Keep one clear next action rather than a long undifferentiated task list"] },
      { heading: "Translate instructions into work", body: "Read the full application guidance once, then turn each requirement into a visible item you can complete or review.", bullets: ["Separate eligibility checks from preparation tasks", "Connect each written response to its prompt and limit", "Name the evidence, document or referee needed for each requirement"] },
      { heading: "Review the system weekly", body: "A short, regular review is more useful than rebuilding the plan near every deadline.", bullets: ["Confirm dates against official sources", "Close completed work and identify blockers", "Choose the next responsible action for each active application"] },
    ],
    relatedFeature: "/scholarship-application-organiser",
    relatedGuides: ["/resources/scholarship-deadline-planning", "/resources/scholarship-application-checklist"],
  },
  {
    path: "/resources/scholarship-application-checklist",
    cluster: "Organisation",
    title: "Scholarship application checklist",
    description: "A provider-led checklist for eligibility, writing, evidence, references and final review.",
    introduction: "No universal checklist can replace the scholarship's current instructions. Use this structure to capture those instructions completely and review them deliberately.",
    sections: [
      { heading: "Before you start", body: "Confirm that the opportunity is current and that you understand the eligibility rules before investing significant time.", bullets: ["Official opportunity page saved", "Eligibility conditions checked", "Deadline, time and time zone recorded", "Submission route and account requirements understood"] },
      { heading: "Prepare the application", body: "Turn every requested item into a named piece of work with a visible owner and state.", bullets: ["Written prompts and limits captured", "Evidence connected to each criterion", "Documents named and current", "References requested with enough context and time"] },
      { heading: "Final review", body: "Review the provider's own submission screen as well as your preparation workspace.", bullets: ["All required fields complete", "Names, dates and document versions consistent", "Declarations read and confirmed", "Submission confirmation saved"] },
    ],
    relatedFeature: "/features/submission-readiness",
    relatedGuides: ["/resources/organise-multiple-scholarship-applications", "/resources/international-scholarship-document-checklist"],
  },
  {
    path: "/resources/scholarship-deadline-planning",
    cluster: "Organisation",
    title: "Scholarship deadline planning guide",
    description: "Work backwards from the official deadline through references, documents, writing and review.",
    introduction: "A deadline plan should protect time for dependencies and recovery. It should not create false urgency or assume every part of the application takes the same amount of time.",
    sections: [
      { heading: "Start with the exact deadline", body: "Copy the date, time and time zone from the provider's current instructions and retain the source link.", bullets: ["Do not assume midnight in your own time zone", "Note whether references have a separate deadline", "Recheck the source after programme updates"] },
      { heading: "Place dependency milestones", body: "Schedule work that depends on other people or organisations earlier than work you control directly.", bullets: ["Reference request and respectful follow-up", "Transcript or certificate request", "Translation or certification where explicitly required", "Internal review by a trusted reader"] },
      { heading: "Keep a submission buffer", body: "Choose a personal target earlier than the official deadline when practical, then keep the official date visible.", bullets: ["Use the buffer for technical or document issues", "Do not mark the application submitted until the provider confirms it", "Save the confirmation and final submitted version"] },
    ],
    relatedFeature: "/scholarship-deadline-tracker",
    relatedGuides: ["/resources/organise-multiple-scholarship-applications", "/resources/request-scholarship-reference"],
  },
  {
    path: "/resources/plan-scholarship-personal-statement",
    cluster: "Writing",
    title: "How to plan a scholarship personal statement",
    description: "Turn the prompt and selection criteria into a focused evidence-led writing plan.",
    introduction: "A strong planning process begins with the actual question. It helps you decide what evidence belongs in the statement before you spend time polishing sentences.",
    sections: [
      { heading: "Read for the real task", body: "Identify the subject, criteria, length and any explicit questions in the provider prompt.", bullets: ["Underline the action words in the prompt", "Separate required topics from optional context", "Record the word or character limit exactly"] },
      { heading: "Choose evidence before themes", body: "Select specific experiences that demonstrate the qualities you plan to discuss, then decide what connects them.", bullets: ["Name your action, not only the situation", "Record an observable outcome where one exists", "Include reflection on what changed or what you learned"] },
      { heading: "Draft and review in passes", body: "Use separate passes for coverage, structure, clarity and correctness rather than trying to perfect every sentence immediately.", bullets: ["Check every paragraph against the prompt", "Remove claims that lack supporting detail", "Read aloud for rhythm and language that sounds like you"] },
    ],
    relatedFeature: "/features/personal-statement-workspace",
    relatedGuides: ["/resources/connect-claims-to-evidence", "/resources/authentic-voice-ai-assistance"],
  },
  {
    path: "/resources/connect-claims-to-evidence",
    cluster: "Writing",
    title: "How to connect claims to evidence",
    description: "Make application claims credible by showing the action, context, outcome and reflection behind them.",
    introduction: "Evidence does not have to be a dramatic award. It can be a specific action, responsibility, change, result or piece of learning that supports what you are saying.",
    sections: [
      { heading: "Test every important claim", body: "When you describe yourself as committed, collaborative or resilient, ask what a reader can observe in the application.", bullets: ["What did you do?", "What constraint or responsibility mattered?", "What changed, improved or became clearer?", "What did you learn or do next?"] },
      { heading: "Use the most relevant evidence", body: "The best example is the one that answers the prompt and selection criterion, not necessarily the most prestigious experience.", bullets: ["Prefer specific responsibility over broad participation", "Explain your contribution without taking credit for a group", "Use numbers only when they are accurate and meaningful"] },
      { heading: "Keep a reusable evidence bank", body: "Store factual source notes separately from polished application prose so you can adapt honestly for different prompts.", bullets: ["Situation and dates", "Your role and actions", "Outcome or feedback", "Relevant documents or people who can verify context"] },
    ],
    relatedFeature: "/features/personal-statement-workspace",
    relatedGuides: ["/resources/plan-scholarship-personal-statement", "/resources/authentic-voice-ai-assistance"],
  },
  {
    path: "/resources/authentic-voice-ai-assistance",
    cluster: "Writing",
    title: "How to preserve your authentic voice when using AI assistance",
    description: "Use assistance for structure and review while keeping facts, judgement and final language under your control.",
    introduction: "Before using any assistance, check the scholarship provider's current rules. Some programmes restrict or require disclosure of AI use.",
    sections: [
      { heading: "Use assistance for questions, not identity", body: "Useful support can help you notice missing context, compare a draft with the prompt or generate questions for revision.", bullets: ["Keep your factual evidence outside generated text", "Treat suggestions as material to review, not approved copy", "Never add an experience, result or emotion that is not yours"] },
      { heading: "Protect your source material", body: "Understand what information a tool stores and how it is used before sharing personal, academic or referee information.", bullets: ["Remove unnecessary identifiers", "Do not upload confidential reference content", "Use the provider's own policy as the final authority"] },
      { heading: "Run an authenticity check", body: "The final response should be accurate, defensible and recognisably yours.", bullets: ["Can you explain every claim in an interview?", "Does the language match how you communicate?", "Did you verify every date, name and fact?", "Did you follow disclosure requirements?"] },
    ],
    relatedFeature: "/features/personal-statement-workspace",
    relatedGuides: ["/resources/plan-scholarship-personal-statement", "/resources/connect-claims-to-evidence"],
  },
  {
    path: "/resources/request-scholarship-reference",
    cluster: "Evidence and references",
    title: "How to request a scholarship reference",
    description: "Ask clearly, share useful context and give your referee a realistic opportunity to respond.",
    introduction: "A thoughtful request helps a potential referee decide whether they can provide the relevant support. It should make the requirement and timing clear without putting pressure on them.",
    sections: [
      { heading: "Choose for relevance", body: "Start with the scholarship's referee requirements, then choose someone who can speak credibly about the relevant work or qualities.", bullets: ["Check role or relationship restrictions", "Consider how recently they observed your work", "Ask whether they can provide a strong, relevant reference"] },
      { heading: "Make a complete request", body: "Provide the scholarship, purpose, due date, submission method and a concise reminder of relevant work.", bullets: ["Official opportunity link", "Reference instructions and deadline", "Your current CV or factual context", "Enough time to decline or ask questions"] },
      { heading: "Follow up respectfully", body: "Use one clear follow-up schedule based on the actual deadline and the person's response.", bullets: ["Confirm receipt without assuming agreement", "Send material updates in one message", "Thank them and confirm when the provider records submission"] },
    ],
    relatedFeature: "/features/reference-tracking",
    relatedGuides: ["/resources/reference-request-email-template", "/resources/scholarship-deadline-planning"],
  },
  {
    path: "/resources/reference-request-email-template",
    cluster: "Evidence and references",
    title: "Scholarship reference request email template",
    description: "A direct, adaptable request that gives the referee the decision, context and timing they need.",
    introduction: "Adapt the template to your real relationship. A short, specific message is more useful than generic praise or pressure.",
    sections: [
      { heading: "Subject and opening", body: "Subject: Reference request — [scholarship name] — [deadline]. Open with why you are asking this person specifically.", bullets: ["Name the opportunity", "State the official deadline", "Ask whether they are comfortable providing the reference"] },
      { heading: "Context to include", body: "Explain what the scholarship is asking for and attach only information that helps the referee respond.", bullets: ["Official link and instructions", "How and when you worked together", "Relevant work, outcomes or responsibilities", "Submission route and any confidentiality note"] },
      { heading: "Close without pressure", body: "Give them a clear way to decline and invite questions. If they agree, confirm the next practical step.", bullets: ["Acknowledge their time", "Avoid drafting praise for them to copy unless requested and allowed", "Do not send confidential access codes in an insecure channel"] },
    ],
    relatedFeature: "/features/reference-tracking",
    relatedGuides: ["/resources/request-scholarship-reference", "/resources/scholarship-deadline-planning"],
  },
  {
    path: "/resources/international-scholarship-document-checklist",
    cluster: "International applicants",
    title: "Document checklist for international scholarship applications",
    description: "Plan identity, academic and supporting documents across countries without assuming every provider asks for the same proof.",
    introduction: "Document requirements vary by scholarship and destination. Build your checklist from the current provider instructions and note whether copies, translations or certifications are required.",
    sections: [
      { heading: "Identity and academic records", body: "Record the exact format, date validity and naming requirements for each item.", bullets: ["Passport or accepted identity document", "Transcript and degree certificate", "Current enrolment or expected graduation evidence", "Language test or other programme-specific result"] },
      { heading: "Supporting application material", body: "Connect each supporting file to the requirement it satisfies so missing work remains visible.", bullets: ["CV or academic résumé", "Personal statement and written responses", "Research proposal or study plan when requested", "References and provider-specific forms"] },
      { heading: "Format and submission review", body: "Check file type, size, legibility and whether the provider requires an original, copy, translation or certification.", bullets: ["Use consistent names and dates", "Keep the unmodified source file", "Review every uploaded file after conversion", "Save the provider's submission confirmation"] },
    ],
    relatedFeature: "/features/document-organiser",
    relatedGuides: ["/resources/translations-certified-documents", "/resources/scholarship-application-checklist"],
  },
  {
    path: "/resources/translations-certified-documents",
    cluster: "International applicants",
    title: "How to manage translations and certified documents",
    description: "Track source documents, translated versions and provider-specific certification requirements without mixing them up.",
    introduction: "Translation and certification rules vary. Follow the scholarship provider and receiving institution's current instructions rather than assuming one process works everywhere.",
    sections: [
      { heading: "Record the exact requirement", body: "Note which document needs translation, the accepted language, who may translate it and whether certification is required.", bullets: ["Keep the official instruction link", "Record validity or issue-date limits", "Do not label a document certified unless it meets the stated process"] },
      { heading: "Keep versions connected", body: "Preserve the original source and link each translation or certified copy to it with a clear name.", bullets: ["Original-language source", "Translation with provider or translator details", "Certification or verification record where required", "Application and requirement using the file"] },
      { heading: "Review before upload", body: "Check names, dates, page order, stamps and legibility after scanning or conversion.", bullets: ["Do not crop seals or annotations", "Confirm all pages are present", "Check the final file type and size", "Retain copies of what you submitted"] },
    ],
    relatedFeature: "/features/document-organiser",
    relatedGuides: ["/resources/international-scholarship-document-checklist", "/resources/scholarship-deadline-planning"],
  },
] as const;

export const findPageName = (path: string) =>
  featurePages.find((page) => page.path === path)?.name ??
  intentPages.find((page) => page.path === path)?.name ??
  resourceGuides.find((guide) => guide.path === path)?.title ??
  ({
    "/features": "All product features",
    "/how-it-works": "How EliteApply works",
    "/for-students": "EliteApply for students",
    "/pricing": "Early-access pricing",
    "/security": "Security at EliteApply",
    "/about": "About EliteApply",
    "/contact": "Contact EliteApply",
    "/resources": "Scholarship application resources",
    "/privacy": "Privacy Policy",
    "/terms": "Terms of Service",
    "/accessibility": "Accessibility Statement",
  } as Record<string, string>)[path] ??
  "EliteApply";
