import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

export async function expandFilters(user: UserEvent) {
  const toggle = screen.getByRole("button", { name: "Filters" });
  if (toggle.getAttribute("aria-expanded") !== "true") {
    await user.click(toggle);
  }
}
