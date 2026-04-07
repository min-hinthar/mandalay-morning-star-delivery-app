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
    it("menu.search('pizza') returns ['menu', 'search', 'pizza']", () => {
      expect(queryKeys.menu.search("pizza")).toEqual(["menu", "search", "pizza"]);
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
      expect(queryKeys.addresses.detail("abc-123")).toEqual([
        "addresses",
        "detail",
        "abc-123",
      ]);
    });
  });

  describe("orders", () => {
    it("orders.all returns ['orders']", () => {
      expect(queryKeys.orders.all).toEqual(["orders"]);
    });
    it("orders.history() returns ['orders', 'history']", () => {
      expect(queryKeys.orders.history()).toEqual(["orders", "history"]);
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
  });
});
