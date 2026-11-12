import { describe, expect, it } from "vitest";
import {
  BUILTIN_IDS,
  defaultFieldDrafts,
  draftsToInputs,
  emptyQuestionDraft,
  fieldsToDrafts,
  formSignature,
  missingBuiltinIds,
  moveDraft,
  normalizeRegistrationLink,
  restoreDefaultFields,
  stripErrorCode,
  validateDrafts,
  withType,
} from "./eventRegistrationForm";
import {
  answerText,
  buildCsv,
  csvCell,
  neutraliseCell,
  parseFormResponses,
} from "./eventRegistrationCsv";

describe("default fields", () => {
  it("starts with the four defaults using reserved ids", () => {
    const d = defaultFieldDrafts();
    expect(d.map((x) => x.id)).toEqual(["full_name", "email", "phone", "job_title"]);
    expect(d.map((x) => x.required)).toEqual([true, true, false, false]);
    expect(d.map((x) => x.type)).toEqual(["text", "email", "phone", "text"]);
  });

  it("restores only the missing defaults, keeping the rest untouched", () => {
    const d = defaultFieldDrafts().filter((x) => x.id !== "phone");
    d[0] = { ...d[0], required: false };
    expect(missingBuiltinIds(d)).toEqual(["phone"]);
    const restored = restoreDefaultFields(d);
    expect(restored).toHaveLength(4);
    expect(restored.filter((x) => x.id === "phone")).toHaveLength(1);
    expect(restored.find((x) => x.id === "full_name")?.required).toBe(false);
  });

  it("restoring on a full form is a no-op and on an empty form adds all four", () => {
    const full = defaultFieldDrafts();
    expect(restoreDefaultFields(full)).toBe(full);
    expect(restoreDefaultFields([]).map((x) => x.id)).toEqual([...BUILTIN_IDS]);
  });
});

describe("payload shape", () => {
  it("sends reserved ids and canonical labels for defaults, ids only for saved questions", () => {
    const drafts = [
      { ...defaultFieldDrafts()[0], label: "Translated name" },
      { ...emptyQuestionDraft(), label: "  Diet  ", type: "select" as const, options: [" Veg ", "", "Vegan"] },
      { ...emptyQuestionDraft(), id: "q_saved", label: "Notes", type: "textarea" as const, required: true, options: ["x"] },
    ];
    expect(draftsToInputs(drafts)).toEqual([
      { id: "full_name", label: "Full name", type: "text", required: true },
      { label: "Diet", type: "select", required: false, options: ["Veg", "Vegan"] },
      { id: "q_saved", label: "Notes", type: "textarea", required: true },
    ]);
  });

  it("round-trips server fields and keeps a stable signature", () => {
    const drafts = fieldsToDrafts([
      { id: "email", label: "Email address", type: "email", required: true, builtin: "email" },
      { id: "q1", label: "Size", type: "multiselect", required: false, options: ["S", "M"], builtin: null },
    ]);
    expect(formSignature(drafts)).toBe(formSignature(fieldsToDrafts([
      { id: "email", label: "Email address", type: "email", required: true, builtin: "email" },
      { id: "q1", label: "Size", type: "multiselect", required: false, options: ["S", "M"] },
    ])));
    expect(formSignature(moveDraft(drafts, 0, 1))).not.toBe(formSignature(drafts));
  });

  it("reorders with bounds checks", () => {
    const d = defaultFieldDrafts();
    expect(moveDraft(d, 0, -1)).toBe(d);
    expect(moveDraft(d, 3, 1)).toBe(d);
    expect(moveDraft(d, 1, -1).map((x) => x.id)[0]).toBe("email");
  });

  it("changing type seeds options for choices and clears them otherwise; defaults keep their type", () => {
    const q = withType(emptyQuestionDraft(), "select");
    expect(q.options).toEqual([""]);
    expect(withType(q, "text").options).toEqual([]);
    const email = defaultFieldDrafts()[1];
    expect(withType(email, "select")).toBe(email);
  });
});

describe("validation", () => {
  it("flags blank labels, missing/duplicate/long options and too many fields", () => {
    const blank = emptyQuestionDraft();
    const noOpts = { ...emptyQuestionDraft(), label: "A", type: "select" as const, options: ["", " "] };
    const dup = { ...emptyQuestionDraft(), label: "B", type: "multiselect" as const, options: ["x", "x"] };
    const long = { ...emptyQuestionDraft(), label: "C", type: "select" as const, options: ["y".repeat(81)] };
    const res = validateDrafts([blank, noOpts, dup, long]);
    expect(res.ok).toBe(false);
    expect(res.errors.map((e) => e.code)).toEqual([
      "label_required",
      "options_required",
      "options_duplicate",
      "option_too_long",
    ]);
    const many = Array.from({ length: 26 }, () => ({ ...emptyQuestionDraft(), label: "Q" }));
    expect(validateDrafts(many).tooMany).toBe(true);
    expect(validateDrafts(defaultFieldDrafts()).ok).toBe(true);
  });
});

describe("registration link", () => {
  it("prefixes https and accepts only http(s)", () => {
    expect(normalizeRegistrationLink("example.com/reg")).toBe("https://example.com/reg");
    expect(normalizeRegistrationLink("http://example.com")).toBe("http://example.com/");
    expect(normalizeRegistrationLink("localhost:3000/x")).toBe("https://localhost:3000/x");
    expect(normalizeRegistrationLink("javascript:alert(1)")).toBeNull();
    expect(normalizeRegistrationLink("ftp://example.com")).toBeNull();
    expect(normalizeRegistrationLink("mailto:a@b.co")).toBeNull();
    expect(normalizeRegistrationLink("two words.com")).toBeNull();
    expect(normalizeRegistrationLink("")).toBeNull();
  });

  it("strips the stable error code prefix", () => {
    expect(stripErrorCode('EVENT_REGISTRATION_FORM_INCOMPLETE: Please answer "Full name"')).toBe('Please answer "Full name"');
    expect(stripErrorCode("UpdateEvent: EVENT_INVALID_REGISTRATION_LINK: Use an http(s) link")).toBe("Use an http(s) link");
    expect(stripErrorCode("plain message")).toBe("plain message");
    expect(stripErrorCode("Note: keep this")).toBe("Note: keep this");
  });
});

describe("CSV helper", () => {
  it("neutralises formula starters and quotes per RFC 4180", () => {
    for (const bad of ["=1+1", "+233", "-5", "@cmd", "\tx", "\rx"]) {
      expect(neutraliseCell(bad)).toBe(`'${bad}`);
    }
    expect(neutraliseCell("safe =x")).toBe("safe =x");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell(null)).toBe("");
  });

  it("builds BOM + CRLF output, neutralising headers too", () => {
    const csv = buildCsv(["Name", "=Q"], [["Ama", "a,b"], ["Kofi", "line\nbreak"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual(["Name,'=Q", "Ama,\"a,b\"", "Kofi,\"line\nbreak\""]);
  });

  it("parses answers defensively and renders them without ids", () => {
    expect(parseFormResponses(null)).toEqual({});
    expect(parseFormResponses("not json")).toEqual({});
    expect(parseFormResponses("[1]")).toEqual({});
    const r = parseFormResponses('{"a":"x","b":["S","M"],"c":true,"d":3}');
    const words = { yes: "Yes", no: "No" };
    expect(answerText(r.a, { type: "text" }, words)).toBe("x");
    expect(answerText(r.b, { type: "multiselect" }, words)).toBe("S, M");
    expect(answerText(r.c, { type: "checkbox" }, words)).toBe("Yes");
    expect(answerText(undefined, { type: "checkbox" }, words)).toBe("No");
    expect(answerText(r.d, { type: "number" }, words)).toBe("3");
    expect(answerText(undefined, { type: "text" }, words)).toBe("");
  });
});
