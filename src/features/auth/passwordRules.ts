export const PASSWORD_RULES = [
  {
    key: "length",
    label: "8–128 characters",
    test: (value: string) => value.length >= 8 && value.length <= 128,
  },
  {
    key: "upper",
    label: "Uppercase",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    key: "lower",
    label: "Lowercase",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    key: "number",
    label: "Number",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    key: "symbol",
    label: "Symbol",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export const passwordMeetsRequirements = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));
