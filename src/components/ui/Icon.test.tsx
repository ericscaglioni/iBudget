import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders a known icon and forwards clicks", () => {
    const onClick = vi.fn();
    const { container } = render(<Icon name="close" onClick={onClick} />);
    container.firstElementChild?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders nothing for an unknown name", () => {
    const { container } = render(<Icon name={"nope" as "close"} />);
    expect(container.firstChild).toBeNull();
  });
});
