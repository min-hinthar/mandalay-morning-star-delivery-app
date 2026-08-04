/**
 * The deactivated-driver page told drivers to "contact the admin" and then
 * rendered no way to do it — in every reachable DB state.
 *
 * `app_settings.value` is `jsonb NOT NULL`, so PostgREST returns it already
 * parsed. The page declared `.returns<{ value: string }[]>()` and called
 * `JSON.parse(setting.value)`; passing an object to JSON.parse coerces it to
 * the literal "[object Object]", which throws, and the throw landed in an empty
 * catch. `contactInfo` was therefore always `{}`.
 *
 * The first case below is the bug: it is the shape the DB actually returns.
 */

import { describe, it, expect } from "vitest";
import { parseAdminContactInfo } from "../contact-info";

describe("parseAdminContactInfo", () => {
  it("reads the shape PostgREST actually returns — a parsed object", () => {
    // The old code did JSON.parse(<this object>) and threw.
    expect(parseAdminContactInfo({ email: "ops@example.com", phone: "+15551234567" })).toEqual({
      email: "ops@example.com",
      phone: "+15551234567",
    });
  });

  it("still reads a legacy double-encoded JSON string", () => {
    // business-rules.ts tolerates string-encoded settings (`row.value === "true"`),
    // and the stored value can't be inspected from here, so survive both.
    expect(parseAdminContactInfo('{"email":"ops@example.com"}')).toEqual({
      email: "ops@example.com",
    });
  });

  it("returns nothing rather than throwing on absent or unusable values", () => {
    // The key may simply not exist — the squashed baseline seeds no
    // app_settings rows — so `undefined` is a normal state, not an error.
    for (const value of [undefined, null, "", "not json", 42, true, [], ["a"]]) {
      expect(parseAdminContactInfo(value), `input: ${JSON.stringify(value)}`).toEqual({});
    }
  });

  it("omits fields that are not usable strings", () => {
    // `{contactInfo.email && <a href={`mailto:${email}`}>}` would otherwise
    // render an object or a number straight into an href.
    expect(parseAdminContactInfo({ email: 42, phone: { nested: true } })).toEqual({});
    expect(parseAdminContactInfo({ email: "  ", phone: "" })).toEqual({});
    expect(parseAdminContactInfo({ email: null, phone: "+15551234567" })).toEqual({
      phone: "+15551234567",
    });
  });

  it("trims surrounding whitespace so a padded value still links", () => {
    expect(parseAdminContactInfo({ email: "  ops@example.com  " })).toEqual({
      email: "ops@example.com",
    });
  });

  it("ignores unknown keys instead of passing them through", () => {
    expect(parseAdminContactInfo({ email: "a@b.co", slack: "#ops", __proto__: { x: 1 } })).toEqual({
      email: "a@b.co",
    });
  });
});
