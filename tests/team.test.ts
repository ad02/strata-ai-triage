import { describe, it, expect } from "vitest";
import { team, getTeamMember } from "@/lib/team";

describe("team directory", () => {
  it("has an entry for every route_to role", () => {
    const expected = ["intake", "senior_broker", "valuation", "principal", "partner_referral"];
    for (const role of expected) {
      expect(team[role as keyof typeof team]).toBeDefined();
      expect(team[role as keyof typeof team].name).toBeTruthy();
      expect(team[role as keyof typeof team].title).toBeTruthy();
    }
  });

  it("getTeamMember returns the correct member for a known role", () => {
    expect(getTeamMember("principal").name).toBe("David Lin");
    expect(getTeamMember("intake").name).toBe("Ross Competente");
  });

  it("getTeamMember falls back to intake for an unknown role", () => {
    const m = getTeamMember("non_existent_role");
    expect(m.name).toBe("Ross Competente");
    expect(m.title).toBe("Assistant Business Broker");
  });

  it("uses placeholder example.com emails (no real PII leaked)", () => {
    for (const member of Object.values(team)) {
      expect(member.email).toContain("@example.com");
    }
  });
});
