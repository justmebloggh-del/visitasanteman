/** Labels and rules for Jobs & Careers. Plain data, safe to import anywhere. */
export const employmentTypes = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", temporary: "Temporary", internship: "Internship",
  national_service: "National service", graduate_trainee: "Graduate trainee", apprenticeship: "Apprenticeship", remote: "Remote", hybrid: "Hybrid",
} as const;
export type EmploymentType = keyof typeof employmentTypes;
export const EMPLOYMENT_TYPES = Object.keys(employmentTypes) as [EmploymentType, ...EmploymentType[]];

export const employerStatusLabels = {
  verified: "Verified employer", pending: "Pending verification", unverified: "Unverified employer", suspended: "Suspended",
} as const;
export type EmployerStatus = keyof typeof employerStatusLabels;

export const applicationStatusLabels = {
  submitted: "Submitted", viewed: "Viewed", shortlisted: "Shortlisted", interview: "Interview", offered: "Offer made", rejected: "Not taken forward", withdrawn: "Withdrawn",
} as const;
export type ApplicationStatus = keyof typeof applicationStatusLabels;
/** Statuses an employer may set (withdrawn belongs to the applicant). */
export const EMPLOYER_SETTABLE = ["viewed", "shortlisted", "interview", "offered", "rejected"] as const;

export const reportReasons = {
  asks_for_payment: "Asks applicants to pay money", looks_fake: "Looks fake or a scam", discriminatory: "Discriminatory",
  misleading: "Misleading or inaccurate", other: "Something else",
} as const;
export type ReportReason = keyof typeof reportReasons;

export const salaryPeriods = { hour: "per hour", day: "per day", week: "per week", month: "per month", year: "per year" } as const;

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const antiFraudNotice = "Genuine employers never ask you to pay to apply, to be interviewed or to start work. Never send money, bank details or ID numbers to someone you have not met. If something looks wrong, report it.";
