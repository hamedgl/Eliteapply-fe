import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

type LegalPageKind =
  | "security"
  | "privacy"
  | "terms"
  | "accessibility"
  | "ai"
  | "contact";

type LegalSection = {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  source?: {
    href: string;
    label: string;
  };
};

type LegalPageConfig = {
  title: string;
  intro: string;
  dateLabel: "Effective" | "Last reviewed";
  date: string;
  summaryTitle: string;
  summary: string;
  sections: readonly LegalSection[];
  related: readonly {
    path: string;
    label: string;
  }[];
};

const LAST_REVIEWED = "19 July 2026";
const AI_NOTICE_REVIEWED = "4 August 2026";
const SUPPORT_EMAIL = "support@eliteapply.net";

const legalPages: Record<LegalPageKind, LegalPageConfig> = {
  security: {
    title: "Security at EliteApply",
    intro:
      "How the current product protects account access, application content and document workflows—and what users can do to keep their workspace safer.",
    dateLabel: "Last reviewed",
    date: LAST_REVIEWED,
    summaryTitle: "Security without inflated claims",
    summary:
      "This overview describes controls supported by the current product and API contract. It is not a certification, penetration-test report or guarantee that incidents can never occur.",
    sections: [
      {
        id: "account-access",
        title: "Account access and sessions",
        paragraphs: [
          "Application workspaces require an authenticated account. Email confirmation, password reset and password-change flows are available for email-and-password accounts.",
          "The browser client keeps active access and ID tokens in memory instead of localStorage or sessionStorage. Session restoration uses the server-issued HttpOnly refresh cookie, and signing out asks the service to invalidate the session.",
        ],
        bullets: [
          "Use a unique password and keep email access secure.",
          "Do not share passwords, confirmation codes, deletion codes or private access links.",
          "Sign out on shared devices and report unexpected account activity promptly.",
        ],
      },
      {
        id: "documents",
        title: "Documents and downloads",
        paragraphs: [
          "Uploaded documents expose a security-scan status. Downloading and linking a document to protected workflows remain disabled until the API marks that file as usable.",
          "Downloads are requested on demand. The client validates returned download locations and only opens supported HTTP or HTTPS destinations.",
        ],
        bullets: [
          "Document owners can download or delete files from the authenticated workspace.",
          "A rejected or failed file stays blocked from protected workflows.",
          "File names and content can still be sensitive; share them only with intended recipients.",
        ],
      },
      {
        id: "private-links",
        title: "Invitations, references and private links",
        paragraphs: [
          "Some collaboration and referee workflows use private invitation or access links. Possession of one of these links may provide access to a limited workflow, so treat it like a secret.",
          "The frontend keeps sensitive invitation values out of product analytics properties. A temporary collaboration token may be held in session storage while an invitation is being accepted, then removed.",
        ],
      },
      {
        id: "data-controls",
        title: "Data controls",
        paragraphs: [
          "Authenticated privacy settings provide a JSON data-export control and an account-deletion flow protected by a code sent to the account email address.",
          "Individual document areas also provide deletion controls. These tools reduce reliance on support for routine access and deletion requests.",
        ],
      },
      {
        id: "monitoring",
        title: "Operational signals",
        paragraphs: [
          "API requests include a correlation identifier to support troubleshooting. First-party product events are sent through EliteApply's API with a client-side filter that rejects sensitive-looking property names such as password, token, code, essay, reference and profile.",
          "No analytics filter can make it safe to place secrets in ordinary form fields, URLs or support messages. Use the dedicated product controls for confidential content.",
        ],
      },
      {
        id: "assurance",
        title: "Assurance scope",
        paragraphs: [
          "EliteApply does not claim SOC 2, ISO 27001 or another external security certification on this page. We also do not describe encryption-at-rest, infrastructure isolation or recovery objectives without verified production evidence.",
          "Security controls reduce risk; they do not remove it. Keep independent copies of time-critical application material and verify provider deadlines outside EliteApply.",
        ],
      },
      {
        id: "report-security",
        title: "Report a security concern",
        paragraphs: [
          `Email ${SUPPORT_EMAIL} with the subject “Security report”. Include the affected page or feature, a clear description, reproduction steps and the time you noticed the issue.`,
          "Do not send passwords, access tokens, deletion codes, confidential references or unnecessary personal data. Please allow us to investigate before publicly disclosing a vulnerability.",
        ],
      },
    ],
    related: [
      { path: "/privacy", label: "Privacy Policy" },
      { path: "/terms", label: "Terms of Service" },
      { path: "/contact", label: "Contact" },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains what personal information EliteApply handles, why it is used, when it may be shared and the controls available to you.",
    dateLabel: "Effective",
    date: LAST_REVIEWED,
    summaryTitle: "Your application data stays yours",
    summary:
      "EliteApply uses account and application information to provide the workspace, keep it secure and support the features you choose. We do not sell personal information or use it for cross-context behavioural advertising.",
    sections: [
      {
        id: "scope",
        title: "Who and what this policy covers",
        paragraphs: [
          `EliteApply is the online service available at eliteapply.net. This policy covers the public website, authenticated workspace and messages sent to ${SUPPORT_EMAIL}.`,
          "Scholarship providers, universities and third-party sites have their own privacy practices. Their policies apply when you leave EliteApply, submit an application to them or use their services.",
        ],
      },
      {
        id: "information",
        title: "Information we handle",
        paragraphs: [
          "The information processed depends on the features you use. You can browse public pages without creating an account; an account is required for the private workspace.",
        ],
        bullets: [
          "Account and profile data, such as name, email, authentication state, avatar, timezone, consent choices and academic-profile details.",
          "Application data, such as opportunities, deadlines, requirements, tasks, reminders, status, notes and submission records.",
          "Content you provide, including drafts, stories, interview answers, documents, evidence and information about references.",
          "Collaboration and referee data, including invitation state, contact details you enter and material submitted through authorised workflows.",
          "Support correspondence and feedback you choose to send.",
          "Technical and security data needed to deliver requests, diagnose failures and protect the service, such as correlation identifiers and request metadata processed by the API or hosting systems.",
        ],
      },
      {
        id: "uses",
        title: "How we use information",
        paragraphs: [
          "We use personal information only for purposes connected to operating EliteApply, meeting our obligations to users, protecting the service and complying with law.",
        ],
        bullets: [
          "Create and secure accounts, restore sessions and provide requested workspace features.",
          "Store, organise, export and delete application content at your direction.",
          "Send transactional messages such as email confirmation, password-reset and account-deletion codes.",
          "Provide support, investigate errors, prevent misuse and maintain service integrity.",
          "Record limited first-party product events to understand whether features work, without intentionally sending essays, references, passwords, tokens or codes as event properties.",
          "Send optional product updates only when you opt in; you can change that preference in privacy settings.",
        ],
      },
      {
        id: "assistance",
        title: "AI-assisted features",
        paragraphs: [
          "When you deliberately request an AI-assisted feature, EliteApply may process the prompt, selected application context and returned output needed to complete that request. Do not include information you are not entitled to use or confidential third-party material that is unnecessary for the task.",
          "Generated suggestions are assistance, not decisions. You remain responsible for reviewing accuracy, protecting third-party privacy and deciding what becomes part of an application.",
          "The AI Transparency Notice lists every AI-assisted feature, how AI-assisted content is labelled and what these features are not allowed to do.",
        ],
      },
      {
        id: "browser",
        title: "Cookies and browser storage",
        paragraphs: [
          "The authenticated session uses an essential server-issued HttpOnly refresh cookie. Active access and ID tokens are kept in browser memory and are not written to localStorage or sessionStorage by the client.",
          "The client may store a sidebar display preference in localStorage. During a collaboration invitation, it may temporarily store the invitation value in sessionStorage until the flow completes or the browser session ends.",
          "The current frontend does not include advertising pixels or cross-site behavioural advertising code. Essential browser storage cannot be disabled without affecting the associated feature.",
        ],
      },
      {
        id: "sharing",
        title: "When information may be shared",
        paragraphs: [
          "We may use service providers to host the application, store files, deliver email, secure and monitor the service, process requested AI features, or handle payments if paid plans are offered. They may process information only to provide their contracted service to EliteApply, subject to appropriate restrictions.",
          "We may also disclose information when required by law, to protect users or the service, in connection with a business reorganisation, or when you direct a collaboration or referee workflow. We do not sell personal information or share it for cross-context behavioural advertising.",
        ],
      },
      {
        id: "transfers",
        title: "International processing",
        paragraphs: [
          "EliteApply and its service providers may process information in countries other than the one where you live. Where data-protection law requires a transfer mechanism or additional safeguards, we use legally recognised measures appropriate to the transfer.",
        ],
      },
      {
        id: "retention",
        title: "Retention and deletion",
        paragraphs: [
          "We keep account and application information while your account is active and for as long as needed to provide the service. Specific records may be retained longer where needed for security, fraud prevention, dispute handling, legal obligations or limited backup recovery.",
          "You can delete individual documents in the workspace. Privacy settings also let you request a JSON export and permanently delete the account after confirming a code sent by email. Deletion removes the account and application data from active systems, subject to limited legal, security and backup retention.",
        ],
      },
      {
        id: "choices",
        title: "Your choices and privacy rights",
        paragraphs: [
          "Depending on where you live, you may have rights to access, correct, export, delete, restrict or object to processing, withdraw consent, or complain to a data-protection authority. These rights can have lawful exceptions.",
        ],
        bullets: [
          "Update profile information from account settings.",
          "Download a JSON export from Privacy & data settings.",
          "Turn optional product updates on or off.",
          "Delete documents individually or request permanent account deletion.",
          `Email ${SUPPORT_EMAIL} for a request you cannot complete in the product. We may need to verify that the account belongs to you.`,
        ],
      },
      {
        id: "children",
        title: "Children and younger users",
        paragraphs: [
          "EliteApply is not directed to children under 13, and they may not create an account. If you are under the age at which you can enter a binding agreement where you live, a parent or legal guardian must review and authorise your use.",
          `If you believe a child under 13 has provided personal information, contact ${SUPPORT_EMAIL} so we can investigate and take appropriate action.`,
        ],
      },
      {
        id: "changes-contact",
        title: "Changes and contact",
        paragraphs: [
          "We may update this policy when the product, providers or legal requirements change. Material changes will be identified by a new effective date and, where appropriate, an in-product or account notice.",
          `For privacy questions or requests, email ${SUPPORT_EMAIL} with the subject “Privacy request”. EliteApply is the service identified at eliteapply.net and the point of contact for this policy.`,
        ],
      },
    ],
    related: [
      { path: "/security", label: "Security" },
      { path: "/terms", label: "Terms of Service" },
      { path: "/ai-transparency", label: "AI Transparency Notice" },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro:
      "These terms govern access to EliteApply's public website and account workspace. Please read them before creating an account or using the service.",
    dateLabel: "Effective",
    date: LAST_REVIEWED,
    summaryTitle: "You remain the author and decision-maker",
    summary:
      "EliteApply organises application work and offers editable assistance. Scholarship providers remain responsible for their rules and decisions, and no award, admission or result is guaranteed.",
    sections: [
      {
        id: "agreement",
        title: "Agreement and service provider",
        paragraphs: [
          "By creating an account, clicking to accept these terms or using the private workspace, you agree to these Terms of Service and the Privacy Policy. If you do not agree, do not create an account or use the workspace.",
          `EliteApply is the service identified at eliteapply.net. Legal notices about these terms can be sent to ${SUPPORT_EMAIL}. The version recorded at registration or when you later update consent identifies the terms you accepted.`,
        ],
      },
      {
        id: "eligibility",
        title: "Eligibility and accounts",
        paragraphs: [
          "You must be at least 13 to create an account. If you have not reached the age at which you can enter a binding contract where you live, you may use EliteApply only with permission and supervision from a parent or legal guardian.",
          "Provide accurate account information, protect your credentials and keep your email address available for security messages. You are responsible for activity performed through your account unless you promptly report unauthorised access.",
        ],
      },
      {
        id: "service",
        title: "What EliteApply provides",
        paragraphs: [
          "EliteApply is a planning and preparation workspace for scholarship and related applications. Available features may include opportunity tracking, requirements, deadlines, drafts, documents, evidence, references, interviews, reminders and readiness views.",
          "Features may change, be limited by account entitlements or become temporarily unavailable. We may improve, replace or discontinue features, but will avoid materially reducing paid functionality during a prepaid period without an appropriate remedy where required by law.",
        ],
      },
      {
        id: "responsibility",
        title: "Your application remains your responsibility",
        paragraphs: [
          "You are responsible for checking provider eligibility rules, official deadlines, document formats, authorship policies and submission requirements. Provider instructions take priority over information recorded or generated in EliteApply.",
          "EliteApply does not submit applications for you, act as a scholarship provider, make admissions decisions or guarantee an interview, award, admission or other outcome.",
        ],
      },
      {
        id: "content",
        title: "Your content and permission to operate the service",
        paragraphs: [
          "You retain ownership of the application content and files you submit. You give EliteApply a limited, non-exclusive permission to host, copy, transmit, format and process that content only as needed to operate, secure, support and improve the features you request.",
          "You confirm that you have the rights and permissions needed for content you upload or share. Do not upload confidential references, identity documents or third-party personal information unless the workflow permits it and you are authorised to do so.",
        ],
      },
      {
        id: "ai",
        title: "AI-assisted output",
        paragraphs: [
          "AI-assisted suggestions may be incomplete, inaccurate, generic or unsuitable for a provider's rules. Review, edit and verify all output before using it.",
          "You remain responsible for authorship, academic integrity, factual accuracy and disclosure required by a scholarship provider or institution. Do not use EliteApply to misrepresent experience, fabricate evidence or conceal prohibited assistance.",
          "The AI Transparency Notice describes which features use AI, how AI-assisted versions are labelled in your workspace and the limits these features operate under.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        paragraphs: [
          "Use EliteApply lawfully and in a way that does not harm other people, the service or its providers.",
        ],
        bullets: [
          "Do not access another person's account, private link, document or reference without permission.",
          "Do not probe, bypass or interfere with authentication, rate limits, file scanning or other security controls.",
          "Do not upload malware, unlawful material or content that infringes another person's rights.",
          "Do not automate abusive traffic, scrape private areas, resell access or use the service to send spam.",
          "Do not impersonate another person, falsify application evidence or use confidential referee content improperly.",
        ],
      },
      {
        id: "collaboration",
        title: "Collaboration and confidential workflows",
        paragraphs: [
          "Invitation and referee links may grant limited access without exposing the full account. Send them only to the intended recipient and revoke or report them if they are disclosed.",
          "Some reference workflows are designed to keep final referee content outside the applicant's view. You may not attempt to defeat that confidentiality boundary.",
        ],
      },
      {
        id: "third-parties",
        title: "Scholarship providers and third-party services",
        paragraphs: [
          "EliteApply may link to provider websites or use third-party infrastructure and processing services. We do not control a scholarship provider's content, availability, privacy practices, rules or decisions.",
          "Your dealings with a provider or third party are governed by its terms. You should verify links, requirements and payment requests independently before acting.",
        ],
      },
      {
        id: "fees",
        title: "Free and paid access",
        paragraphs: [
          "Registration currently starts without payment details. If paid plans are offered, the current price, currency, billing interval, included usage and cancellation information will be shown before purchase.",
          "Charges, renewals, refunds and taxes will follow the checkout terms presented at purchase and any mandatory consumer rights. A paid feature is not active merely because it appears in frontend code.",
        ],
      },
      {
        id: "suspension",
        title: "Suspension, cancellation and deletion",
        paragraphs: [
          "You may stop using EliteApply at any time and can request permanent account deletion from Privacy & data settings. Export information you need before deletion.",
          "We may restrict or suspend access where reasonably necessary to protect users or the service, investigate misuse, comply with law, address non-payment, or enforce these terms. Where practical and lawful, we will provide notice and an opportunity to resolve the issue.",
        ],
      },
      {
        id: "intellectual-property",
        title: "EliteApply materials",
        paragraphs: [
          "The service, software, interface, branding and materials supplied by EliteApply are protected by intellectual-property laws. These terms give you a personal, limited, revocable right to use the service; they do not transfer ownership of EliteApply's technology or brand.",
          "Feedback may be used to improve the service without restriction or payment, provided we do not identify you publicly without permission.",
        ],
      },
      {
        id: "warranty",
        title: "Disclaimers",
        paragraphs: [
          "EliteApply is provided on an “as available” basis. To the fullest extent permitted by law, we do not promise uninterrupted or error-free operation, permanent storage, or that any suggestion, deadline or readiness state is complete or accurate.",
          "Nothing in these terms excludes warranties or consumer rights that cannot lawfully be excluded. Keep independent copies of important work and verify time-sensitive information with the relevant provider.",
        ],
      },
      {
        id: "liability",
        title: "Limits of liability",
        paragraphs: [
          "To the fullest extent permitted by law, EliteApply is not liable for indirect, incidental, special, consequential or punitive loss, or for lost opportunities, decisions made by scholarship providers, or content lost outside our reasonable control.",
          "Where liability may lawfully be limited, EliteApply's total liability relating to the service will not exceed the amount you paid for the service during the 12 months before the event giving rise to the claim. This limit does not apply to liability that cannot legally be limited.",
        ],
      },
      {
        id: "changes-disputes",
        title: "Changes, disputes and contact",
        paragraphs: [
          "We may update these terms to reflect product, legal or security changes. If a change materially affects existing users, we will provide reasonable notice and request renewed acceptance where required.",
          "Before starting formal proceedings, contact us so we can try to resolve the issue. The laws and courts that apply are determined by mandatory consumer-protection and conflict-of-law rules. You keep any rights that cannot be waived where you live.",
          `Questions and legal notices can be sent to ${SUPPORT_EMAIL} with the subject “Terms enquiry”. If part of these terms is unenforceable, the remaining terms continue to apply. A delay in enforcing a term is not a waiver of it.`,
        ],
      },
    ],
    related: [
      { path: "/privacy", label: "Privacy Policy" },
      { path: "/ai-transparency", label: "AI Transparency Notice" },
      { path: "/contact", label: "Contact" },
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    intro:
      "EliteApply is intended to support students using different devices, input methods and assistive technologies throughout demanding application work.",
    dateLabel: "Last reviewed",
    date: LAST_REVIEWED,
    summaryTitle: "Accessibility is an ongoing product requirement",
    summary:
      "We use WCAG 2.2 Level AA as our target. That is a direction for design, engineering and testing—not a claim that every page is fully conformant at all times.",
    sections: [
      {
        id: "standard",
        title: "Our accessibility target",
        paragraphs: [
          "EliteApply targets the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA across public pages and core account workflows. WCAG addresses perceivable content, operable controls, understandable interaction and robust compatibility.",
          "Conformance is assessed for complete pages and responsive variations, so we treat mobile layouts and application states as part of the same accessibility responsibility.",
        ],
        source: {
          href: "https://www.w3.org/TR/WCAG22/",
          label: "Read WCAG 2.2 at W3C",
        },
      },
      {
        id: "measures",
        title: "Measures built into the interface",
        paragraphs: [
          "The interface uses semantic headings and landmarks, labelled controls, visible focus treatment and text descriptions for status. Public navigation is designed for keyboard use, including a skip link and dismissible mobile menu.",
        ],
        bullets: [
          "Keyboard access and logical focus order for interactive controls.",
          "Text and icon cues so status does not rely on colour alone.",
          "Responsive reflow for narrow screens and zoomed content.",
          "Reduced-motion support for people who request it at operating-system level.",
          "Programmatic labels, status messages and error feedback for forms and workflows.",
        ],
      },
      {
        id: "compatibility",
        title: "Compatibility and limitations",
        paragraphs: [
          "EliteApply is designed for current versions of major browsers and common screen readers. Older browsers, browser extensions, third-party content and newly released features may behave differently.",
          "The product changes frequently, and we do not claim that every route or state fully conforms at all times. Automated checks help find some issues, but keyboard, screen-reader, zoom and responsive testing remain necessary.",
        ],
      },
      {
        id: "feedback",
        title: "Report an accessibility barrier",
        paragraphs: [
          `Email ${SUPPORT_EMAIL} with the subject “Accessibility feedback”. Tell us the page or workflow, what you were trying to do and what happened.`,
          "If you are comfortable doing so, include your browser, device and assistive technology. Do not include medical information or other sensitive details that are not needed to understand the barrier.",
        ],
      },
      {
        id: "response",
        title: "How we handle feedback",
        paragraphs: [
          "We review accessibility reports alongside product defects, assess their effect on completing the task and prioritise barriers that block access or create serious difficulty.",
          "Where a quick product fix is not available, we will try to provide an accessible alternative or practical support when feasible. Response and resolution time depends on the issue's complexity and the information available.",
        ],
      },
    ],
    related: [
      { path: "/contact", label: "Contact" },
      { path: "/security", label: "Security" },
      { path: "/privacy", label: "Privacy Policy" },
    ],
  },
  ai: {
    title: "AI Transparency Notice",
    intro:
      "Where EliteApply uses artificial intelligence, what those features do and do not do, how AI-assisted content is labelled, and the control you keep over every suggestion.",
    dateLabel: "Last reviewed",
    date: AI_NOTICE_REVIEWED,
    summaryTitle: "Assistance you can inspect, not a decision-maker",
    summary:
      "EliteApply's AI features draft, rewrite, extract and score text you ask them to work on. They do not decide admissions, do not score you as a person and never submit anything on your behalf.",
    sections: [
      {
        id: "scope",
        title: "What this notice covers",
        paragraphs: [
          "This notice explains the AI-assisted features of EliteApply for the people who use them. It is written to meet the transparency duties in Regulation (EU) 2024/1689 (the EU AI Act), in particular Article 50, which requires that people are told when they interact with an AI system and when content has been generated or manipulated by one.",
          "EliteApply builds its features on general-purpose AI models supplied by third-party providers. For those features EliteApply acts as the provider of the AI system towards you, and the model supplier acts as our processor and upstream model provider. This notice sits alongside the Privacy Policy, which explains the legal bases and data handling, and the Terms of Service, which govern authorship and acceptable use.",
        ],
        source: {
          href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
          label: "Read Regulation (EU) 2024/1689 on EUR-Lex",
        },
      },
      {
        id: "features",
        title: "Where AI is used in EliteApply",
        paragraphs: [
          "AI never runs in the background on your workspace. Each of the features below runs only when you start it, on the content you point it at.",
        ],
        bullets: [
          "Writing studio generation — drafts an outline, drafts or improves a section, or turns experience into academic CV bullets from the instruction you write.",
          "Quality analysis — returns indicative scores, findings and claim warnings for a draft you ask it to analyse.",
          "Story assist — rewrites one field of a story you select for clarity, length or interview delivery, and shows the original beside the suggestion.",
          "Opportunity import — extracts programme facts from a page, PDF or pasted text into fields with per-field confidence for you to check and confirm.",
          "Interview practice — generates practice questions and written coaching feedback on the answers you record or type.",
        ],
      },
      {
        id: "interaction-disclosure",
        title: "You are told when you are interacting with AI",
        paragraphs: [
          "Every screen that starts an AI feature carries a visible notice, and interview practice states before and during the session that the questions and coaching come from an AI system rather than a human interviewer or an admissions officer.",
          "If an AI feature is unavailable, out of tokens or has failed, the interface says so instead of silently returning a weaker result.",
        ],
      },
      {
        id: "content-labelling",
        title: "AI-assisted content is labelled and traceable",
        paragraphs: [
          "When a generation run changes your document, the resulting version is saved to version history and marked as AI-assisted, so you can see which versions came from a model and restore an earlier one at any time.",
          "Generation runs record the model and prompt version used, and interview reports record the rubric and prompt version. Those identifiers are shown in the interface so a specific output can be traced to the run that produced it.",
          "Labelling inside EliteApply does not travel with text you copy elsewhere. If a scholarship provider, university or funder requires a declaration of AI assistance, that declaration remains yours to make.",
        ],
      },
      {
        id: "human-control",
        title: "You stay in control of every output",
        paragraphs: [
          "AI output is a suggestion until you accept it. Story suggestions must be applied deliberately, imported fields must be confirmed field by field, and generation runs can be cancelled while they are running or retried as a new run.",
          "EliteApply does not submit applications, contact providers, message referees or make any decision about you on the basis of a model output.",
        ],
        bullets: [
          "Review AI output against the provider's current rules before using it.",
          "Verify every date, name, figure and claim yourself — a model can state something false confidently.",
          "Keep the final language recognisably yours; you must be able to defend it in an interview.",
          "Do not paste confidential third-party material into a prompt when the task does not need it.",
        ],
      },
      {
        id: "not-done",
        title: "What EliteApply's AI features do not do",
        paragraphs: [
          "These limits are product design decisions and are reflected in what the API returns to the interface.",
        ],
        bullets: [
          "No admissions, eligibility or funding decision is made or automated — providers decide, and readiness or quality scores are indicative guidance about a draft, not a prediction of an outcome.",
          "No emotion recognition or inference of emotional state from your voice, face or writing. Interview audio is used for transcription and content-based coaching only.",
          "No biometric identification or categorisation, and no inference of protected characteristics such as ethnicity, religion, health, political opinion or sexual orientation.",
          "No social scoring, profiling for risk, or ranking of users against one another.",
          "No untargeted scraping of faces or personal data to build a database; opportunity import reads only the source you supply.",
        ],
      },
      {
        id: "classification",
        title: "How we classify these features under the AI Act",
        paragraphs: [
          "EliteApply's AI features are assessed as limited-risk AI systems subject to the Article 50 transparency obligations, not high-risk systems under Annex III. The education entries in Annex III cover systems used to determine admission or assignment to an educational institution, to evaluate learning outcomes, to assess the level of education a person will receive, or to monitor and detect prohibited behaviour during tests. EliteApply is used by applicants to prepare their own material and is not used by an institution to admit, grade, place or invigilate anyone.",
          "We also screen the features against the prohibited practices in Article 5, which is why the limits in the previous section are enforced in the product rather than left to policy. If a future feature would change this assessment, we will complete the applicable conformity work before releasing it and update this notice.",
        ],
      },
      {
        id: "models-and-data",
        title: "Models, processors and your content",
        paragraphs: [
          "AI features send the prompt you write, the selected document or field, and the context needed for the task to a third-party model provider under a processing contract, and return the output to your workspace. We do not publish a model name here that we cannot keep accurate; the model version actually used is recorded per run and shown with the result.",
          "How long prompts, outputs and runs are retained, where processing takes place and which rights you can exercise are described in the Privacy Policy. Account deletion and JSON export in Privacy & data settings cover AI-assisted content in your workspace like any other content.",
        ],
      },
      {
        id: "limitations",
        title: "Known limitations",
        paragraphs: [
          "Being explicit about weaknesses is part of using these features safely.",
        ],
        bullets: [
          "Models can invent facts, citations, deadlines and eligibility rules that look plausible.",
          "Extraction confidence is an estimate from the model, not a verification of the source page.",
          "Scores and coaching feedback are generated from a rubric; they are indicative and cannot predict a provider's judgement.",
          "Output tends towards generic academic register and can flatten a distinctive voice if accepted unedited.",
          "Quality is weaker for languages, disciplines, regions and application formats that are less represented in training data.",
        ],
      },
      {
        id: "report",
        title: "Report a problem with an AI output",
        paragraphs: [
          `Email ${SUPPORT_EMAIL} with the subject “AI feedback”. Tell us the feature, roughly when it happened and what the output got wrong or did that it should not do. Include the model, prompt or rubric version shown with the result if you still have it.`,
          "Do not paste passwords, access codes or confidential referee content into a report. We use these reports to correct prompts, tighten limits and, where needed, withdraw a feature.",
        ],
      },
      {
        id: "changes",
        title: "Changes to this notice",
        paragraphs: [
          "We will update this notice when an AI feature is added, materially changed or removed, and when obligations under the EU AI Act come into application on their published dates. The date at the top of this page shows the last review.",
          `Questions about this notice can be sent to ${SUPPORT_EMAIL} with the subject “AI transparency”.`,
        ],
      },
    ],
    related: [
      { path: "/privacy", label: "Privacy Policy" },
      { path: "/terms", label: "Terms of Service" },
      { path: "/resources/authentic-voice-ai-assistance", label: "Using AI without losing your voice" },
    ],
  },
  contact: {
    title: "Contact EliteApply",
    intro:
      "Get help with the product, privacy and account controls, accessibility barriers, security concerns or general questions.",
    dateLabel: "Last reviewed",
    date: LAST_REVIEWED,
    summaryTitle: "One monitored support address",
    summary: `Email ${SUPPORT_EMAIL}. A clear subject line and the relevant page or feature help route your message to the right review.`,
    sections: [
      {
        id: "support",
        title: "Product support",
        paragraphs: [
          `Send product questions to ${SUPPORT_EMAIL} with the subject “Product support”. Describe the page, what you were trying to do, what happened and what you expected.`,
          "Include the approximate time and any visible correlation identifier or error message. Screenshots are helpful when they do not reveal application content or other personal information.",
        ],
      },
      {
        id: "privacy-accessibility",
        title: "Privacy and accessibility",
        paragraphs: [
          "Use the subject “Privacy request” for access, correction, export, deletion or consent questions. We may need to verify account ownership before acting on a request.",
          "Use the subject “Accessibility feedback” for a barrier. Include the affected task and, when comfortable, the browser and assistive technology involved.",
        ],
      },
      {
        id: "security",
        title: "Security reports",
        paragraphs: [
          "Use the subject “Security report” for suspected vulnerabilities or unexpected account activity. Include concise reproduction details and the affected URL or feature.",
          "Do not send passwords, tokens, private invitation links, deletion codes or confidential documents. Please allow time for investigation before public disclosure.",
        ],
      },
      {
        id: "response",
        title: "Response expectations",
        paragraphs: [
          "Messages are reviewed and prioritised by urgency and impact. Accessibility blockers, security concerns and account-access problems receive priority, but EliteApply does not promise a fixed response or resolution time.",
          "Sending repeated messages can slow review. If you add information, reply to the same email thread so the context stays together.",
        ],
      },
      {
        id: "safe-contact",
        title: "Keep support messages safe",
        paragraphs: [
          "Send only the information needed to explain the issue. Never email your password, one-time code, access token, full confidential reference or unnecessary identity documents.",
          "EliteApply support will not ask you to reveal a password or send a payment outside the checkout flow shown in the authenticated product.",
        ],
      },
    ],
    related: [
      { path: "/security", label: "Security" },
      { path: "/privacy", label: "Privacy Policy" },
      { path: "/accessibility", label: "Accessibility Statement" },
    ],
  },
};

const legalPageIcons = {
  security: ShieldCheck,
  privacy: LockKeyhole,
  terms: FileText,
  accessibility: CheckCircle2,
  ai: Sparkles,
  contact: Mail,
} as const;

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const page = legalPages[kind];
  const Icon = legalPageIcons[kind];

  return (
    <article className="legal-page">
      <header className="legal-hero">
        <div className="legal-hero-copy">
          <nav className="mkt2-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight aria-hidden="true" />
            <span aria-current="page">{page.title}</span>
          </nav>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <dl className="legal-meta">
            <div>
              <dt>{page.dateLabel}</dt>
              <dd>{page.date}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </dd>
            </div>
          </dl>
        </div>
        <aside className="legal-summary" aria-label="Policy summary">
          <Icon aria-hidden="true" />
          <h2>{page.summaryTitle}</h2>
          <p>{page.summary}</p>
        </aside>
      </header>

      <div className="legal-layout">
        <aside className="legal-toc">
          <strong>On this page</strong>
          <nav aria-label={`${page.title} sections`}>
            {page.sections.map((section, index) => (
              <a href={`#${section.id}`} key={section.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
          </nav>
          <a className="legal-email-link" href={`mailto:${SUPPORT_EMAIL}`}>
            <Mail aria-hidden="true" />
            Email support
          </a>
        </aside>

        <div className="legal-body">
          {page.sections.map((section, index) => (
            <section id={section.id} key={section.id}>
              <div className="legal-section-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>
                        <Check aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.source ? (
                  <a
                    className="legal-source-link"
                    href={section.source.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {section.source.label}
                    <ArrowRight aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </section>
          ))}

          <footer className="legal-page-footer">
            <div>
              <Mail aria-hidden="true" />
              <div>
                <h2>Need a direct answer?</h2>
                <p>
                  Contact EliteApply without sending passwords, access codes or
                  unnecessary confidential material.
                </p>
              </div>
            </div>
            <a className="landing-button" href={`mailto:${SUPPORT_EMAIL}`}>
              Email support
              <ArrowRight aria-hidden="true" />
            </a>
          </footer>
        </div>
      </div>

      <section className="legal-related">
        <h2>Related trust and legal pages</h2>
        <nav aria-label="Related trust and legal pages">
          {page.related.map((item) => (
            <Link to={item.path} key={item.path}>
              {item.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>
    </article>
  );
}
