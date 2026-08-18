import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RelatedNamePicker } from "@/features/skills/RelatedNamePicker";
import type { RelatedOption } from "@/features/skills/relatedOptions";

const writing: RelatedOption[] = [
  { slug: "jwt-authentication", name: "JWT authentication", keywords: "jwt authentication spring" },
  { slug: "docker-networking", name: "Docker networking", keywords: "docker networking" },
  { slug: "modular-monolith", name: "Start with a modular monolith", keywords: "modular monolith node" },
];

const tutorials: RelatedOption[] = [
  { slug: "docker-complete", name: "Docker complete tutorial", keywords: "docker complete" },
  { slug: "express-modules", name: "Express modules", keywords: "express modules node" },
];

function DualPickers() {
  const [blogs, setBlogs] = useState<string[]>(["jwt-authentication"]);
  const [lessons, setLessons] = useState<string[]>([]);

  return (
    <>
      <RelatedNamePicker
        label="Related writing"
        name="writing"
        selected={blogs}
        options={writing}
        suggestFrom={["Java", "OOP"]}
        onChange={setBlogs}
      />
      <RelatedNamePicker
        label="Related tutorials"
        name="tutorials"
        selected={lessons}
        options={tutorials}
        suggestFrom={["Java", "OOP"]}
        onChange={setLessons}
      />
    </>
  );
}

describe("RelatedNamePicker", () => {
  it("adds a second related name from remaining suggestions", async () => {
    const user = userEvent.setup();
    render(<DualPickers />);

    expect(screen.getByText("JWT authentication")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Docker networking" }));
    expect(screen.getByText("Docker networking")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start with a modular monolith" }));
    expect(screen.getByLabelText("Remove Start with a modular monolith")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start with a modular monolith" })).not.toBeInTheDocument();
  });

  it("still shows suggestions on the second picker when names do not score", async () => {
    const user = userEvent.setup();
    render(<DualPickers />);

    await user.click(screen.getByRole("button", { name: "Docker complete tutorial" }));
    expect(screen.getByLabelText("Remove Docker complete tutorial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Express modules" })).toBeInTheDocument();
  });
});
