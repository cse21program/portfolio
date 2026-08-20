import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteLogo } from "@/components/brand/SiteLogo";

describe("SiteLogo", () => {
  it("renders the enterprise lockup with full name and title", () => {
    render(<SiteLogo />);
    expect(screen.getByText("Rezaul Karim")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  });

  it("can hide the title in compact layouts", () => {
    render(<SiteLogo compact />);
    expect(screen.getByText("Rezaul Karim")).toBeInTheDocument();
    expect(screen.queryByText("Software Engineer")).not.toBeInTheDocument();
  });
});
