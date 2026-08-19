export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export type ValidationIssue = {
  path: string;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,20}$/;

export function collectErrors<K extends string>(
  fields: Partial<Record<K, string | undefined>>,
): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const key of Object.keys(fields) as K[]) {
    const message = fields[key];
    if (message) {
      errors[key] = message;
    }
  }
  return errors;
}

export function hasErrors<K extends string>(errors: FieldErrors<K>) {
  return Object.keys(errors).length > 0;
}

export function validateName(value: string, label = "Name") {
  const name = value.trim();
  if (!name) {
    return `${label} is required`;
  }
  if (name.length < 2) {
    return `${label} must be at least 2 characters`;
  }
  if (name.length > 80) {
    return `${label} must be 80 characters or fewer`;
  }
}

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) {
    return "Email is required";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address";
  }
}

export function validateRequired(value: string, label: string) {
  if (!value.trim()) {
    return `${label} is required`;
  }
}

export function validatePassword(value: string, label = "Password") {
  if (!value) {
    return `${label} is required`;
  }
  if (value.length < 8) {
    return `${label} must be at least 8 characters`;
  }
  if (value.length > 72) {
    return `${label} must be 72 characters or fewer`;
  }
}

export function validatePasswordMatch(password: string, confirm: string) {
  if (!confirm) {
    return "Confirm your password";
  }
  if (confirm !== password) {
    return "Passwords do not match";
  }
}

export function validateNewPassword(currentPassword: string, newPassword: string) {
  const passwordError = validatePassword(newPassword, "New password");
  if (passwordError) {
    return passwordError;
  }
  if (currentPassword && newPassword === currentPassword) {
    return "New password must be different from the current password";
  }
}

export function validateSubject(value: string) {
  const subject = value.trim();
  if (!subject) {
    return "Subject is required";
  }
  if (subject.length < 3) {
    return "Subject must be at least 3 characters";
  }
  if (subject.length > 120) {
    return "Subject must be 120 characters or fewer";
  }
}

export function validatePhone(value: string) {
  const phone = value.trim();
  if (!phone) {
    return;
  }
  if (!PHONE_PATTERN.test(phone)) {
    return "Enter a valid phone number";
  }
}

export function validateCountry(value: string) {
  if (value.trim().length > 80) {
    return "Country must be 80 characters or fewer";
  }
}

export function validateMessage(value: string, min = 20) {
  const message = value.trim();
  if (!message) {
    return "Message is required";
  }
  if (message.length < min) {
    return `Message must be at least ${min} characters`;
  }
  if (message.length > 2000) {
    return "Message must be 2000 characters or fewer";
  }
}

export function isValidationIssueList(value: unknown): value is ValidationIssue[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        "path" in item &&
        "message" in item &&
        typeof (item as ValidationIssue).path === "string" &&
        typeof (item as ValidationIssue).message === "string",
    )
  );
}

export function fieldErrorsFromApi<K extends string>(details: unknown): FieldErrors<K> {
  if (!isValidationIssueList(details)) {
    return {};
  }

  const errors: FieldErrors<K> = {};
  for (const issue of details) {
    if (issue.path) {
      errors[issue.path as K] = issue.message;
    }
  }
  return errors;
}
