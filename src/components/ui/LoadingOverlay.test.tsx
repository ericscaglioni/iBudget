import { LoadingProvider, useLoading } from "@/lib/hooks/useLoading";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LoadingOverlay } from "./LoadingOverlay";

const Toggle = () => {
  const { isLoading, startLoading, stopLoading } = useLoading();
  return (
    <button type="button" onClick={isLoading ? stopLoading : startLoading}>
      {isLoading ? "Stop" : "Start"}
    </button>
  );
};

describe("LoadingOverlay", () => {
  it("is hidden until loading starts", async () => {
    const { container } = render(
      <LoadingProvider>
        <Toggle />
        <LoadingOverlay />
      </LoadingProvider>
    );
    expect(container.querySelector(".fixed")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(container.querySelector(".fixed")).not.toBeNull();
  });
});
