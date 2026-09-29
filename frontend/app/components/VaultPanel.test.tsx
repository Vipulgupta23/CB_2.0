import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VaultPanel } from "./VaultPanel";
import { makeDocument, makeField } from "./testFixtures";

function renderPanel(
  documents = [makeDocument()],
  overrides: {
    onSave?: (fieldId: number, namedPerson: string) => Promise<void>;
    onUndo?: (fieldId: number) => Promise<void>;
    busy?: boolean;
  } = {},
) {
  const onSave = overrides.onSave ?? vi.fn().mockResolvedValue(undefined);
  const onUndo = overrides.onUndo ?? vi.fn().mockResolvedValue(undefined);
  const onRerun = vi.fn().mockResolvedValue(undefined);
  render(
    <VaultPanel
      documents={documents}
      onSave={onSave}
      onUndo={onUndo}
      onRerun={onRerun}
      busy={overrides.busy ?? false}
    />,
  );
  return { onSave, onUndo, onRerun };
}

describe("VaultPanel", () => {
  it("states that edits touch only the synthetic extracted record", () => {
    renderPanel();

    expect(
      screen.getByText(/No uploaded document\s+and no real institution record is modified/),
    ).toBeInTheDocument();
  });

  it("sends a simulated fix with the edited value", async () => {
    const user = userEvent.setup();
    const { onSave } = renderPanel();

    await user.click(screen.getByRole("button", { name: "Simulate a fix" }));
    const input = screen.getByLabelText("Named person");
    await user.clear(input);
    await user.type(input, "Anika Demo-Mehta");
    await user.click(screen.getByRole("button", { name: "Save fix" }));

    expect(onSave).toHaveBeenCalledWith(1, "Anika Demo-Mehta");
  });

  it("hides undo for a field that was never edited", () => {
    renderPanel();

    expect(screen.queryByRole("button", { name: "Undo last fix" })).not.toBeInTheDocument();
  });

  it("reverts an edited field through the undo handler", async () => {
    const user = userEvent.setup();
    const { onUndo } = renderPanel([
      makeDocument({ fields: [makeField({ is_user_edited: true })] }),
    ]);

    await user.click(screen.getByRole("button", { name: "Undo last fix" }));

    expect(onUndo).toHaveBeenCalledWith(1);
  });

  it("keeps showing the originally extracted quote next to an edited value", () => {
    renderPanel([makeDocument({ fields: [makeField({ is_user_edited: true })] })]);

    expect(screen.getByText("edited")).toBeInTheDocument();
    expect(
      screen.getByText(/Original extracted text: “Nominee: Kavya Demo-Mehta \(daughter\)”/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use “Undo last fix” to restore it/)).toBeInTheDocument();
  });

  it("labels fallback seed data as not a live extraction", () => {
    renderPanel([makeDocument({ extraction_source: "manual_fallback", model_name: null })]);

    expect(
      screen.getByText(/Pre-verified fallback data, not a live AI extraction/),
    ).toBeInTheDocument();
  });

  it("names the model when the extraction was live", () => {
    renderPanel();

    expect(screen.getByText(/Extracted live by gemini-3.1-flash-lite/)).toBeInTheDocument();
  });

  it("flags a joint holding as outside the documented rule scope", () => {
    renderPanel([makeDocument({ fields: [makeField({ holding_pattern: "joint" })] })]);

    expect(screen.getByText("joint holding · out of rule scope")).toBeInTheDocument();
    expect(
      screen.getByText(/documented rules cover single-holder assets only/),
    ).toBeInTheDocument();
  });

  it("does not flag scope for a single or unknown holding pattern", () => {
    renderPanel([makeDocument({ fields: [makeField({ holding_pattern: "unknown" })] })]);

    expect(
      screen.queryByText("joint holding · out of rule scope"),
    ).not.toBeInTheDocument();
  });

  it("disables the actions while a request is in flight", () => {
    renderPanel([makeDocument({ fields: [makeField({ is_user_edited: true })] })], {
      busy: true,
    });

    expect(screen.getByRole("button", { name: "Working…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Undo last fix" })).toBeDisabled();
  });
});
