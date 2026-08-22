import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteLogo } from "@/components/brand/SiteLogo";

describe("SiteLogo", () => {
  it("renders the name with a quiet professional lockup line", () => {
    render(<SiteLogo />);
    expect(screen.getByText("Rezaul Karim")).toBeInTheDocument();
    expect(screen.getByText("Software engineer")).toBeInTheDocument();
    expect(screen.queryByText("SOFTWARE ENGINEER")).not.toBeInTheDocument();
  });

  it("keeps the lockup line in compact chrome", () => {
    render(<SiteLogo compact />);
    expect(screen.getByText("Rezaul Karim")).toBeInTheDocument();
    expect(screen.getByText("Software engineer")).toBeInTheDocument();
  });
});
