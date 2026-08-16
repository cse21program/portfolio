import { useCallback, useState } from "react";
import { ApiRequestError } from "@/lib/api";
import {
  fieldErrorsFromApi,
  hasErrors,
  type FieldErrors,
} from "@/lib/validation";

export function useFormErrors<K extends string>() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<K>>({});
  const [formError, setFormError] = useState("");

  const setFieldError = useCallback((field: K, message: string | undefined) => {
    setFieldErrors((current) => {
      if (!message) {
        if (!current[field]) {
          return current;
        }
        const next = { ...current };
        delete next[field];
        return next;
      }
      return { ...current, [field]: message };
    });
  }, []);

  const clearField = useCallback((field: K) => {
    setFieldError(field, undefined);
  }, [setFieldError]);

  const resetErrors = useCallback(() => {
    setFieldErrors({});
    setFormError("");
  }, []);

  const applyFieldErrors = useCallback((errors: FieldErrors<K>) => {
    setFieldErrors(errors);
    return hasErrors(errors);
  }, []);

  const applyCaughtError = useCallback((caught: unknown, fallback: string) => {
    if (caught instanceof ApiRequestError) {
      const mapped = fieldErrorsFromApi<K>(caught.details);
      if (hasErrors(mapped)) {
        setFieldErrors(mapped);
        setFormError("");
        return;
      }
      setFormError(caught.message);
      return;
    }

    setFormError(fallback);
  }, []);

  return {
    fieldErrors,
    formError,
    setFormError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  };
}
