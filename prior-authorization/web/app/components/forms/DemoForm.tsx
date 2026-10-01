import { CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "~/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { INTEREST_OPTIONS } from "~/content/contact";

type FieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "practice"
  | "phone"
  | "interest"
  | "message";

type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

const EMPTY: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  practice: "",
  phone: "",
  interest: "",
  message: "",
};

// Deliberately permissive: enough to catch typos without rejecting valid
// addresses that a stricter pattern would refuse.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "Please enter your first name.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Please enter your last name.";
  }
  if (!values.email.trim()) {
    errors.email = "Please enter your work email.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "That does not look like a valid email address.";
  }
  if (!values.interest) {
    errors.interest = "Let us know what this is about.";
  }
  if (values.message.trim().length < 10) {
    errors.message = "A sentence or two helps us point you to the right person.";
  }

  return errors;
}

export function DemoForm() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const update = (field: FieldName) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear a field's error as soon as the person starts fixing it.
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // Move focus to the summary so keyboard and screen reader users are told
      // what went wrong rather than being left at the submit button.
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    // No backend: this is where a real deployment would POST the enquiry.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center rounded-3xl bg-accent-50 p-10 text-center ring-1 ring-accent-200"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-600 text-white">
          <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
        </span>
        <h3 className="mt-6 text-2xl font-semibold">Message received</h3>
        <p className="mt-3 max-w-md leading-relaxed text-content-secondary">
          Thanks, {values.firstName.trim()}. Someone on our team will read this and
          reply within one business day — usually sooner.
        </p>
        <Button
          variant="secondary"
          className="mt-7"
          onClick={() => {
            setValues(EMPTY);
            setSubmitted(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div
        ref={errorSummaryRef}
        tabIndex={-1}
        role={errorCount > 0 ? "alert" : undefined}
        hidden={errorCount === 0}
        className="rounded-2xl bg-signal-50 px-5 py-4 text-sm font-medium text-content-danger ring-1 ring-signal-100"
      >
        {errorCount === 1
          ? "One field needs your attention before we can send this."
          : `${errorCount} fields need your attention before we can send this.`}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          value={values.firstName}
          error={errors.firstName}
          onChange={(event) => update("firstName")(event.target.value)}
        />
        <TextField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          required
          value={values.lastName}
          error={errors.lastName}
          onChange={(event) => update("lastName")(event.target.value)}
        />
      </div>

      <TextField
        label="Work email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={values.email}
        error={errors.email}
        onChange={(event) => update("email")(event.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Practice or organisation"
          name="practice"
          autoComplete="organization"
          value={values.practice}
          error={errors.practice}
          onChange={(event) => update("practice")(event.target.value)}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(event) => update("phone")(event.target.value)}
        />
      </div>

      <SelectField
        label="What can we help with?"
        name="interest"
        required
        options={INTEREST_OPTIONS}
        value={values.interest}
        error={errors.interest}
        onChange={(event) => update("interest")(event.target.value)}
      />

      <TextAreaField
        label="Message"
        name="message"
        required
        placeholder="Tell us about your authorization volume, your EHR, or what you are trying to fix."
        hint="Please do not include any patient health information in this form."
        value={values.message}
        error={errors.message}
        onChange={(event) => update("message")(event.target.value)}
      />

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" className="shrink-0 whitespace-nowrap">
          Send message
        </Button>
        <p className="text-xs leading-relaxed text-content-muted">
          By submitting you agree to be contacted about Nexauth AI. We never sell your
          details.
        </p>
      </div>
    </form>
  );
}
