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
/** Keep in sync with `productConfig.legal.currentTermsVersion`, which is the
    version recorded against an account at registration. */
const TERMS_EFFECTIVE = "8 August 2026";
const PRIVACY_EFFECTIVE = "4 August 2026";
const OPERATOR = "Executive Precision Era";
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
    date: PRIVACY_EFFECTIVE,
    summaryTitle: "Your application data stays yours",
    summary:
      "EliteApply uses account and application information to provide the workspace, keep it secure and support the features you choose. We do not sell personal information or use it for cross-context behavioural advertising.",
    sections: [
      {
        id: "scope",
        title: "Who is responsible and what this policy covers",
        paragraphs: [
          `EliteApply is the online service available at eliteapply.net, operated by ${OPERATOR}, established in the European Union. ${OPERATOR} is the controller of the personal data described here and can be reached at ${SUPPORT_EMAIL}.`,
          "This policy covers the public website, the authenticated workspace, billing, and messages you send to our support address. We have not appointed a data protection officer because we are not required to; privacy questions go to the address above and are handled by the operating team.",
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
          "Billing data if you buy a paid plan or tokens: plan, subscription and trial status, token purchases, amounts, currency and refund state. Card details are entered with our payment provider and are never received or stored by EliteApply.",
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
          "Record your product-update preference so that if we start sending them, we only send them to accounts that opted in; you can change that preference in privacy settings.",
        ],
      },
      {
        id: "legal-bases",
        title: "Legal bases for processing",
        paragraphs: [
          "Under the GDPR and equivalent laws we must have a legal basis for each purpose. If you are in the EU, EEA or UK, these are the bases we rely on.",
        ],
        bullets: [
          "Performance of a contract (Art. 6(1)(b)): creating and running your account, storing and organising your application content, running the features you request including AI-assisted ones, handling collaboration and referee workflows, and providing paid plans and token purchases.",
          "Legitimate interests (Art. 6(1)(f)): keeping the service secure and available, preventing abuse and fraud, diagnosing failures, and measuring with limited first-party product events whether features work. You can object to processing based on legitimate interests at any time.",
          "Consent (Art. 6(1)(a)): optional product-update emails, and any feature we describe as optional at the point you switch it on. You can withdraw consent at any time without affecting processing already carried out.",
          "Legal obligation (Art. 6(1)(c)): keeping billing, tax and accounting records, and responding to lawful requests.",
          "Vital or public interests are not bases we rely on for this service.",
        ],
      },
      {
        id: "special-categories",
        title: "Sensitive information in your documents",
        paragraphs: [
          "EliteApply does not ask for special-category data. Application material can still contain it — a disability statement in a personal essay, a medical circumstance in an extenuating-circumstances note, religious or political activity in a story, or ethnicity in a diversity-scholarship form.",
          "Where you choose to upload or write such material, we process it to store and handle the content you asked us to handle, on the basis of your explicit consent (Art. 9(2)(a)), which you give by adding it and can withdraw by deleting it. We do not use it to profile you, target you or train models on your behalf.",
          "Only include sensitive detail a provider actually requires, and remove it from drafts and uploads when it is no longer needed.",
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
          "Everything else the client stores is strictly necessary for a feature you started, or a display preference you set. This is the complete list:",
        ],
        bullets: [
          "Refresh cookie (HttpOnly, server-issued) — keeps you signed in and lets a session be restored.",
          "ea_has_session (localStorage) — a flag telling the app a session may exist, so it knows whether to attempt a restore.",
          "eliteapply-sidebar-collapsed (localStorage) — your sidebar display preference.",
          "eliteapply-recent-searches (localStorage) — your recent searches in the workspace search, cleared from the search panel.",
          "eliteapply-reviewer-name (localStorage) — the display name you typed when commenting on a shared document, so you do not retype it.",
          "eliteapply.collaborator-invitation (sessionStorage) — an invitation value held only while you accept an invitation, removed when the flow completes or the browser session ends.",
        ],
      },
      {
        id: "no-tracking",
        title: "No advertising or cross-site tracking",
        paragraphs: [
          "There are no advertising pixels, no third-party analytics scripts and no cross-site behavioural advertising code in the frontend. Product events are first-party: they are sent to EliteApply's own API, are not stored in your browser, and pass a client-side filter that rejects sensitive-looking property names such as password, token, code, essay, reference, story and profile.",
          "Because we set no non-essential tracking storage, there is no consent banner to click through. If that changes, we will ask for consent before setting anything new and update this policy first.",
        ],
      },
      {
        id: "sharing",
        title: "When information may be shared",
        paragraphs: [
          "We use service providers, acting as our processors under written contracts, in these categories: cloud hosting and file storage, email delivery, security and monitoring, AI model providers for the features you request, and a payment provider for subscriptions and token purchases. They may process information only to provide their contracted service to EliteApply and may not use it for their own purposes.",
          "We may also disclose information when required by law, to protect users or the service, in connection with a business reorganisation, or when you direct a collaboration or referee workflow. We do not sell personal information, do not share it for cross-context behavioural advertising, and do not disclose it to data brokers.",
        ],
      },
      {
        id: "transfers",
        title: "International transfers",
        paragraphs: [
          "EliteApply and its service providers may process information outside your country, including outside the EEA. Where that happens we rely on a European Commission adequacy decision for the destination country, or on the Commission's Standard Contractual Clauses together with an assessment of the transfer and additional technical and organisational measures where they are needed. For UK transfers we use the UK Addendum to those clauses.",
          `You can ask us for information about the safeguards used for a particular transfer by emailing ${SUPPORT_EMAIL} with the subject “Privacy request”.`,
        ],
      },
      {
        id: "retention",
        title: "Retention and deletion",
        paragraphs: [
          "We keep account and application information while your account is active, because that is the service you asked for. When you delete the account, account and application data is removed from active systems.",
          "Some records are kept longer for a specific reason: billing, tax and accounting records for the period required by law — our payment provider Stripe, as the merchant of record for these transactions, retains this record after account deletion under its own retention obligations, while our own local copy of your billing history is deleted with the account; security and abuse-related records for as long as needed to investigate and prevent recurrence; support correspondence while a matter is open and for a reasonable period afterwards; and copies inside encrypted backups until the backup rotates out of its retention window.",
          "You can delete individual documents in the workspace. Privacy settings also let you request a JSON export and permanently delete the account after confirming a code sent by email. Export what you need before deleting — deletion is not reversible.",
        ],
      },
      {
        id: "security-breach",
        title: "Security and data breaches",
        paragraphs: [
          "Access to the workspace requires authentication, uploaded documents stay blocked from protected workflows until they pass a security scan, and sensitive-looking values are kept out of product analytics. The Security page describes the controls the current product actually provides, without certification claims we cannot support.",
          "If a personal data breach occurs, we assess it without delay. Where the law requires it we notify the competent supervisory authority within 72 hours of becoming aware, and where the breach is likely to result in a high risk to you we tell you directly and explain what happened and what to do. US state breach-notification laws are followed where they apply.",
        ],
      },
      {
        id: "choices",
        title: "Your rights and how to use them",
        paragraphs: [
          "If you are in the EU, EEA or UK you have the rights below. Similar rights exist in many other countries. They can have lawful exceptions — for example we may keep data we need for a legal obligation or to defend a legal claim.",
        ],
        bullets: [
          "Access a copy of your personal data, and information about how it is processed.",
          "Correct inaccurate data — most profile fields are editable in account settings.",
          "Delete your data, including permanent account deletion from Privacy & data settings.",
          "Portability: download a structured JSON export from Privacy & data settings.",
          "Restrict processing, or object to processing based on legitimate interests, including product analytics.",
          "Withdraw consent at any time, such as turning off optional product updates, without affecting processing already carried out.",
          "Complain to your national data-protection supervisory authority, or in the UK to the Information Commissioner's Office. You can complain in the country where you live, where you work, or where the issue arose.",
        ],
      },
      {
        id: "requests",
        title: "Making a privacy request",
        paragraphs: [
          `Most requests can be completed in the product. For anything else, email ${SUPPORT_EMAIL} with the subject “Privacy request”. We may need to verify that the account belongs to you before acting, and we will not ask for more identifying information than the verification needs.`,
          "We answer within one month. If a request is complex or you have made several, we may extend that by up to two further months and will tell you why within the first month. Requests are free unless they are manifestly unfounded or excessive.",
        ],
      },
      {
        id: "automated-decisions",
        title: "No automated decisions about you",
        paragraphs: [
          "EliteApply does not make decisions about you that produce legal effects or similarly significant effects and are based solely on automated processing, and it does not profile you for that purpose. Readiness, quality and interview scores describe a draft or a practice answer; they do not decide anything about you and are not shared with providers.",
          "Admission, eligibility and funding decisions are made by scholarship providers and institutions under their own processes. The AI Transparency Notice explains what the AI features do and the limits they operate under.",
        ],
      },
      {
        id: "us-privacy",
        title: "United States privacy rights",
        paragraphs: [
          "This section applies if you live in a US state with a consumer privacy law, including California (CCPA/CPRA), Virginia, Colorado, Connecticut, Utah, Texas and other states with equivalent laws.",
          "The categories of personal information we collect, the purposes and the disclosures are described in the sections above. We disclose personal information only to service providers and contractors that process it on our behalf under contract. In the last 12 months we have not sold personal information, have not shared it for cross-context behavioural advertising, and have not disclosed it to third parties for their own purposes.",
          "Application content can include sensitive personal information as California defines it. We use it only to provide the service you asked for and for the permitted purposes the law allows, never to infer characteristics about you — so there is nothing to limit under the “limit the use of my sensitive personal information” right, and we honour such a request as a restriction anyway.",
          `Depending on your state you can ask to know, access, correct, delete or port your information, opt out of sale, sharing or targeted advertising, and appeal a refused request. Use the controls in Privacy & data settings, or email ${SUPPORT_EMAIL} with the subject “Privacy request”. An authorised agent may act for you with proof of authorisation. We will not discriminate against you for exercising these rights.`,
          "We treat a Global Privacy Control signal as an opt-out request, although we do not sell or share information in the first place. If we refuse a request, you can appeal by replying to our decision; we respond to appeals within the period your state's law requires and tell you how to contact your attorney general if you remain unsatisfied.",
        ],
      },
      {
        id: "children",
        title: "Children and younger users",
        paragraphs: [
          "EliteApply is not directed to children under 13 and they may not create an account. We do not knowingly collect personal information from them. Where the law of an EU or EEA country sets a higher age for consenting to online services — 14, 15 or 16 depending on the country — that higher age applies, and below it a parent or guardian must authorise the account.",
          "If you are under the age at which you can enter a binding agreement where you live, a parent or legal guardian must review and authorise your use.",
          `If you believe a child under 13 has provided personal information, contact ${SUPPORT_EMAIL} so we can investigate, delete the data and close the account. A parent or guardian can make that request directly.`,
        ],
      },
      {
        id: "changes-contact",
        title: "Changes and contact",
        paragraphs: [
          "We may update this policy when the product, providers or legal requirements change. Material changes will be identified by a new effective date and, where appropriate, an in-product or account notice before they take effect.",
          `For privacy questions or requests, email ${SUPPORT_EMAIL} with the subject “Privacy request”. ${OPERATOR}, operating EliteApply at eliteapply.net, is the controller and the point of contact for this policy.`,
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
    date: TERMS_EFFECTIVE,
    summaryTitle: "You remain the author and decision-maker",
    summary:
      "EliteApply organises application work and offers editable assistance. Scholarship providers remain responsible for their rules and decisions, and no award, admission or result is guaranteed.",
    sections: [
      {
        id: "agreement",
        title: "Agreement and who you contract with",
        paragraphs: [
          `EliteApply is an online service operated by ${OPERATOR}, established in the European Union and reachable at ${SUPPORT_EMAIL}. These terms are a contract between you and ${OPERATOR} — referred to here as “EliteApply”, “we” or “us”.`,
          "By creating an account, clicking to accept these terms or using the private workspace, you agree to these Terms of Service and the Privacy Policy. If you do not agree, do not create an account or use the workspace.",
          `Legal notices, complaints and enquiries can be sent to ${SUPPORT_EMAIL}. The terms version recorded when you registered, or when you last accepted an update, identifies the version that applies to you.`,
        ],
      },
      {
        id: "eligibility",
        title: "Eligibility and accounts",
        paragraphs: [
          "You must be at least 13 to create an account. Where the law of your country sets a higher minimum age for using online services without parental consent — in parts of the EU and EEA this is 14, 15 or 16 — that higher age applies to you.",
          "If you have not reached the age at which you can enter a binding contract where you live, you may use EliteApply only with the permission and supervision of a parent or legal guardian, who accepts these terms with you.",
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
        id: "reports",
        title: "Reporting illegal content or a rights infringement",
        paragraphs: [
          `If you believe content stored, shared or made accessible through EliteApply is illegal or infringes your rights, email ${SUPPORT_EMAIL} with the subject “Content report”. Anyone can send a report — you do not need an EliteApply account.`,
          "For a copyright or trade-mark complaint, also confirm that you are the rights holder or authorised to act for them, identify the protected work, and confirm that the information in your report is accurate.",
          "We assess reports and may remove content, disable a shared link, or restrict or terminate an account. Where the law allows, we tell the person who provided the content what we did and why, and both of you can ask us to reconsider by replying to that message. Accounts responsible for repeated infringements or repeated illegal content are terminated.",
        ],
        bullets: [
          "Tell us where the content is: the shared link, referee link or page you saw it on.",
          "Explain what is unlawful or infringing about it, in enough detail for us to assess it.",
          "Give an email address we can reply to, and tell us if you act for someone else.",
          "Do not include passwords, access codes or material you are not entitled to share.",
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
        title: "Paid plans, tokens and automatic renewal",
        paragraphs: [
          "Registration starts on a free tier without payment details. Paid subscriptions raise your monthly AI token allowance and unlock entitled features; they are billed monthly or yearly, and some plans include a free trial. You can also buy one-off token top-ups that supplement the plan allowance.",
          "The price, currency, applicable taxes and billing interval are shown in checkout before you pay. Payment is handled by our payment provider — we do not receive or store your card details. Plan availability is controlled by the server-side catalogue, so a plan is not on sale merely because it appears in the interface.",
          "Subscriptions renew automatically at the end of each billing period, at the then-current price, until you cancel. A free trial becomes a paid subscription when the trial ends unless you cancel before then.",
          "Cancel at any time in Billing & usage → Manage subscription. Cancellation takes effect at the end of the period you have already paid for: access continues until then and no further payment is taken. We give at least 30 days' notice by email before a price change affects your renewals, so you can cancel first.",
          "Apart from the statutory rights set out below, payments are not refundable. A monthly token allowance resets each period and unused allowance does not carry over; separately purchased tokens stay on your balance. If a payment fails we may retry it, restrict paid features or move the account to the free tier — your content stays in your account.",
        ],
      },
      {
        id: "withdrawal",
        title: "Right of withdrawal (EU, EEA and UK consumers)",
        paragraphs: [
          "If you are a consumer in the EU, EEA or UK, you normally have 14 days from the day the contract is concluded to withdraw from a distance purchase without giving a reason.",
          "Paid features and tokens are made available immediately, so at checkout we ask you to confirm that you want supply to start at once and that you understand what that means for this right. For a subscription, if you withdraw within the 14 days after asking for immediate access, we may keep a proportionate amount for the period you had access. For a token top-up, the right of withdrawal ends once the tokens are delivered to your balance with your express prior consent and acknowledgement.",
          `To withdraw, email ${SUPPORT_EMAIL} with the subject “Withdrawal”, stating your name, account email, what you bought and the purchase date. Any clear statement is enough — you may use the model withdrawal form provided under your national law, but you do not have to. We refund using the same payment method you used, within 14 days of being informed.`,
        ],
      },
      {
        id: "consumer-rights",
        title: "Your statutory consumer rights",
        paragraphs: [
          "Nothing in these terms removes or limits rights you have as a consumer that cannot be limited by contract. Where a term in these terms conflicts with such a right, that right prevails.",
          "For consumers in the EU, EEA and UK, digital content and digital services must match their description and be fit for their purpose. If they are not, you can require us to bring the service into conformity and, where that fails, is impossible or would be disproportionate, ask for a proportionate price reduction or end the contract, as provided by law.",
          `If you are unhappy with how we handled a complaint, write to ${SUPPORT_EMAIL} first so we can try to resolve it. The European Commission's online dispute resolution platform closed on 20 July 2025, so there is no EU ODR form to use; we are not currently committed to resolving disputes through a particular alternative dispute resolution body. You can still contact a consumer body in your country or bring the matter to the courts where you live.`,
        ],
      },
      {
        id: "us-consumers",
        title: "Information for customers in the United States",
        paragraphs: [
          "Automatic renewal: paid subscriptions continue and are charged each billing period until you cancel. You can cancel online at any time in Billing & usage → Manage subscription, without contacting support, and cancellation takes effect at the end of the period you have paid for. Renewal terms are shown again in checkout before you pay.",
          "We do not require arbitration and do not ask you to waive class actions or jury trial. Disputes are handled by the courts, and nothing in these terms limits rights you have under the consumer-protection law of your state.",
          "By creating an account you agree to receive contract, billing, security and service notices electronically at the email address on your account, instead of on paper. Keep that address current; you can end this agreement by closing your account.",
          "You confirm that you are not located in, or ordinarily resident in, a country or region subject to comprehensive US or EU sanctions, and that you are not on a restricted-party list. How we handle personal information, including for California residents, is described in the Privacy Policy.",
          "California residents may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, CA 95834, or by telephone at (800) 952-5210.",
        ],
      },
      {
        id: "suspension",
        title: "Suspension, cancellation and deletion",
        paragraphs: [
          "You may stop using EliteApply at any time and can request permanent account deletion from Privacy & data settings. Export information you need before deletion.",
          "We may restrict or suspend access where reasonably necessary to protect users or the service, investigate misuse, comply with law, address non-payment, or enforce these terms. Where practical and lawful, we will provide notice and an opportunity to resolve the issue.",
          "If we restrict, suspend or terminate your access, we explain the reason by email where the law allows, and you can ask us to reconsider by replying to that message. Except where the law or an investigation prevents it, we will give you a reasonable opportunity to export your content first.",
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
          "Nothing in these terms excludes warranties or consumer rights that cannot lawfully be excluded, including the statutory conformity rights described above. Keep independent copies of important work and verify time-sensitive information with the relevant provider.",
        ],
      },
      {
        id: "liability",
        title: "Limits of liability",
        paragraphs: [
          "Liability we never limit. We do not exclude or limit liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, for damage caused intentionally or by gross negligence, or for anything else that the law does not allow us to limit. If you are a consumer, this section does not affect the statutory rights described in “Your statutory consumer rights”, and where any part of this section conflicts with a right you have that cannot be limited by contract, that right prevails and the rest of this section continues to apply.",
          "Losses we exclude. To the fullest extent permitted by law, and except for the liability described in the paragraph above, EliteApply is not liable for indirect, incidental, special, consequential or punitive loss, or for loss of profit, revenue, business, opportunity, goodwill or anticipated savings, for decisions taken by scholarship providers, institutions, funders or employers, or for content lost outside our reasonable control, in each case whether or not the possibility of that loss was foreseeable or notified to us.",
          `Aggregate cap. To the fullest extent permitted by law, the total aggregate liability of ${OPERATOR} and its affiliates for all claims arising out of or in connection with these terms or the service — whether in contract, tort (including negligence), breach of statutory duty, misrepresentation, restitution or otherwise — is limited, taken together, to the total fees you paid or that became payable by you for the service in the 12 months immediately before the event giving rise to the first such claim.`,
          "The cap is aggregate, not per claim. It is a single maximum for the period described above and is not increased by the number of claims, the number of events giving rise to them, the legal grounds relied on, or the number of people bringing them. Where claims relate to more than one event, the 12-month period is counted back from the earliest of those events.",
          "How the cap is calculated. “Fees” means amounts paid or payable by you to EliteApply for the service under these terms during that period, excluding taxes, payment-provider charges and any amounts refunded or credited to you. If you paid no fees in that period, including where you used a free plan or a trial, our total aggregate liability for that period is limited to EUR 100.",
          "This limit reflects the price of the service and the allocation of risk between us. It applies even if a limited remedy fails of its essential purpose, and it survives suspension, cancellation, termination or expiry of these terms.",
        ],
      },
      {
        id: "changes-disputes",
        title: "Changes, governing law and disputes",
        paragraphs: [
          "We may update these terms to reflect product, legal or security changes. For a change that materially affects existing users we give at least 30 days' notice by email or in the product before it takes effect, and ask you to accept the new version where the law requires it. If you do not want to accept a change, you can stop using EliteApply and close your account before it takes effect.",
          `These terms are governed by the law of the European Union member state in which ${OPERATOR} is established. That choice does not deprive you of the protection of mandatory rules of the country where you live.`,
          "If you are a consumer, you may bring proceedings in the courts of the country where you live or where we are established, and we will bring proceedings against you only in the courts of the country where you live. If you use EliteApply for business purposes, the courts where we are established have exclusive jurisdiction.",
          `Before starting formal proceedings, contact us at ${SUPPORT_EMAIL} with the subject “Terms enquiry” so we can try to resolve the matter. Neither of us is responsible for failing to perform because of an event outside our reasonable control, for as long as that event lasts.`,
          "You may not transfer your account or these terms to someone else. We may transfer them to a successor as part of a reorganisation, merger or sale, provided your rights under them are not reduced. These terms, the Privacy Policy and the AI Transparency Notice are the whole agreement between us about the service.",
          "If part of these terms is unenforceable, the remaining terms continue to apply. A delay in enforcing a term is not a waiver of it. These terms are written in English; any translation is provided for information only.",
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
        id: "legal-basis",
        title: "Why this statement exists",
        paragraphs: [
          "EliteApply sells access online to consumers in the EU, so it falls within the scope of the European Accessibility Act (Directive (EU) 2019/882), which has applied to e-commerce services since 28 June 2025. The Act's accessibility requirements are met in practice by following the harmonised standard EN 301 549, which adopts WCAG 2.1 Level AA; we target the newer WCAG 2.2 Level AA.",
          "This statement describes the accessibility of the service, the measures we take, the limitations we know about and how to reach us. It is not a certification and not a conformity assessment carried out by a third party.",
        ],
        source: {
          href: "https://eur-lex.europa.eu/eli/dir/2019/882/oj",
          label: "Read Directive (EU) 2019/882 on EUR-Lex",
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
          "If our answer does not resolve the barrier, you can escalate. In the EU each member state has an authority that enforces the European Accessibility Act and accepts complaints from consumers; in the United Kingdom you can contact the Equality Advisory and Support Service. Tell us if you take that step so we can supply the details you need.",
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
