

export const guideSteps = [
  {
    number: "01",
    label: "Add & capture",
    description:
      "Add a scholarship, programme or application. Capture its deadline, source link and core details.",
    demo: {
      title: "Opportunity details",
      status: "Deadline captured",
    },
  },
  {
    number: "02",
    label: "Break down the requirements",
    description:
      "Turn eligibility rules, essays, evidence and references into a clear, actionable plan.",
    demo: {
      title: "Requirements plan",
      status: "8 tasks organised",
    },
  },
  {
    number: "03",
    label: "Prepare the application",
    description:
      "Draft written materials, organise documents and connect the evidence that supports your story.",
    demo: {
      title: "Personal Statement Draft",
      status: "Saved just now",
    },
  },
  {
    number: "04",
    label: "Review and submit",
    description:
      "Resolve missing items, complete final checks and record the outcome without losing context.",
    demo: {
      title: "Submission Review",
      status: "Ready for final review",
    },
  },
] as const;
export type GuideStep = (typeof guideSteps)[number];

export function PreviewFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="capability-preview">
      <header>
        <span>{title}</span>
        <small>Sample workspace</small>
      </header>
      {children}
    </div>
  );
}


export function PercentageGauge({ value, label }: { value: number; label: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  const angle = Math.PI * (1 - safeValue / 100);
  const needleX = 60 + 36 * Math.cos(angle);
  const needleY = 66 - 36 * Math.sin(angle);

  return (
    <div className="percentage-gauge">
      <svg viewBox="0 0 120 82" aria-hidden="true">
        <path
          className="gauge-track"
          d="M 10 62 A 50 50 0 0 1 110 62"
          pathLength="100"
        />
        <path
          className="gauge-value"
          d="M 10 62 A 50 50 0 0 1 110 62"
          pathLength="100"
          strokeDasharray={`${safeValue} ${100 - safeValue}`}
        />
        <line
          className="gauge-needle"
          x1="60"
          y1="66"
          x2={needleX}
          y2={needleY}
        />
        <circle className="gauge-hub" cx="60" cy="66" r="4" />
      </svg>
      <span className="gauge-copy">
        <strong>{safeValue}%</strong>
        <small>{label}</small>
      </span>
      <span className="gauge-range" aria-hidden="true">
        <small>0</small>
        <small>100</small>
      </span>
    </div>
  );
}


