import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProviders } from "@/features/auth/GoogleSignInButton";

describe("AuthProviders", () => {
  it("always shows Continue with Google on the login form", () => {
    render(<AuthProviders next="/admin" />);

    expect(screen.getByRole("link", { name: /Continue with Google/i })).toHaveAttribute(
      "href",
      "/api/v1/auth/google?next=%2Fadmin",
    );
    expect(screen.getByText("or")).toBeInTheDocument();
  });
});
