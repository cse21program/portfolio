import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "@/components/ui/FormField";

describe("FormField", () => {
  it("associates the label with the input", () => {
    render(<FormField label="Email" name="email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
  });

  it("surfaces a field error to assistive tech", () => {
    render(<FormField label="Email" name="email" error="Enter a valid email address" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
  });
});
