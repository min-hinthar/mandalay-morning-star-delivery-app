import { describe, it, expect } from "vitest";
import { queryKeys } from "./queryKeys";

describe("queryKeys factory", () => {
  describe("menu", () => {
    it("menu.all returns ['menu']", () => {
      expect(queryKeys.menu.all).toEqual(["menu"]);
    });
    it("menu.list() returns ['menu', 'list']", () => {
      expect(queryKeys.menu.list()).toEqual(["menu", "list"]);
    });
    it("menu.search('pizza') defaults page to 1", () => {
      expect(queryKeys.menu.search("pizza")).toEqual(["menu", "search", "pizza", 1]);
    });
    it("menu.search('pizza', 3) includes page number", () => {
      expect(queryKeys.menu.search("pizza", 3)).toEqual(["menu", "search", "pizza", 3]);
    });
  });

  describe("addresses", () => {
    it("addresses.all returns ['addresses']", () => {
      expect(queryKeys.addresses.all).toEqual(["addresses"]);
    });
    it("addresses.list() returns ['addresses', 'list']", () => {
      expect(queryKeys.addresses.list()).toEqual(["addresses", "list"]);
    });
    it("addresses.detail('abc-123') returns ['addresses', 'detail', 'abc-123']", () => {
      expect(queryKeys.addresses.detail("abc-123")).toEqual(["addresses", "detail", "abc-123"]);
    });
  });

  describe("orders", () => {
    it("orders.all returns ['orders']", () => {
      expect(queryKeys.orders.all).toEqual(["orders"]);
    });
    it("orders.history() returns ['orders', 'history']", () => {
      expect(queryKeys.orders.history()).toEqual(["orders", "history"]);
    });
    it("orders.list() defaults cursor to 'initial'", () => {
      expect(queryKeys.orders.list()).toEqual(["orders", "list", "initial"]);
    });
    it("orders.list('abc') includes cursor", () => {
      expect(queryKeys.orders.list("abc")).toEqual(["orders", "list", "abc"]);
    });
    it("orders.itemsForSearch('user-1') returns ['orders', 'items-for-search', 'user-1']", () => {
      expect(queryKeys.orders.itemsForSearch("user-1")).toEqual([
        "orders",
        "items-for-search",
        "user-1",
      ]);
    });
  });

  it("repeated calls produce value-equal tuples", () => {
    expect(queryKeys.menu.search("pizza")).toEqual(queryKeys.menu.search("pizza"));
    expect(queryKeys.orders.list("cur1")).toEqual(queryKeys.orders.list("cur1"));
  });
});
