import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreCard } from "./ScoreCard";
import { makeRun } from "./testFixtures";

describe("ScoreCard", () => {
  it("shows the score and the deterministic arithmetic behind it", () => {
    render(<ScoreCard run={makeRun()} />);

    expect(screen.getByText("75")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Readiness score 75 out of 100" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deterministic arithmetic: 100 minus 25/),
    ).toBeInTheDocument();
  });

  it("explains a missing score instead of rendering it as zero", () => {
    render(<ScoreCard run={makeRun({ readiness_score: null })} />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("/ 100")).not.toBeInTheDocument();
    expect(screen.getByText(/has no score/)).toBeInTheDocument();
  });

  it("warns that the score is stale after an edit", () => {
    render(<ScoreCard run={makeRun()} stale />);

    expect(screen.getByText(/A field was edited after this run/)).toBeInTheDocument();
  });

  it("never presents the score as legal readiness", () => {
    render(<ScoreCard run={makeRun()} />);

    expect(
      screen.getByText(/review priority for synthetic documents, not legal readiness/),
    ).toBeInTheDocument();
  });
});
