"use client";

import { useEffect } from "react";

export default function SafeContainsPatch() {
  useEffect(() => {
    try {
      let proto = typeof Node !== "undefined" ? Node.prototype : null;
      if (!proto) return;

      let FLAG = "__safeContainsPatched__";
      if (proto[FLAG]) return; // already patched

      let original = proto.contains;
      if (typeof original !== "function") return;

      Object.defineProperty(proto, FLAG, {
        value: true,
        enumerable: false,
      });

      // Wrap contains to ignore non-Node inputs gracefully.
      Object.defineProperty(proto, "contains", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function safeContains(node) {
          // If argument is not a Node (or is null/undefined), return false.
          if (typeof Node === "undefined" || !(node instanceof Node)) {
            return false;
          }
          try {
            return original.call(this, node);
          } catch (_) {
            // In case the underlying call still throws for some edge case, fall back to false.
            return false;
          }
        },
      });
    } catch (_) {
      // No-op: if anything goes wrong, don't crash the app.
    }
  }, []);

  return null;
}
