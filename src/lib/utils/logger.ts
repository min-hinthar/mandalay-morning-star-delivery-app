import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  flowId?: string;
  orderId?: string;
  sessionId?: string;
  api?: string;
  [key: string]: unknown;
}

/**
 * Structured logger that integrates with Sentry.
 * Use this instead of console.log/error/warn in production code.
 *
 * @example
 * logger.error("Failed to update order", { orderId, userId, flowId: "checkout" });
 * logger.info("Order confirmed", { orderId, api: "stripe-webhook" });
 */
export const logger = {
  debug(message: string, context?: LogContext) {
    log("debug", message, context);
  },

  info(message: string, context?: LogContext) {
    log("info", message, context);
  },

  warn(message: string, context?: LogContext) {
    log("warn", message, context);
  },

  error(message: string, context?: LogContext) {
    log("error", message, context);
  },

  /**
   * Capture an exception with context.
   * Use this for caught errors that need Sentry tracking.
   */
  exception(error: unknown, context?: LogContext) {
    const { userId, flowId, ...extra } = context || {};

    Sentry.captureException(error, {
      tags: {
        ...(flowId && { flowId }),
        ...(context?.api && { api: context.api }),
      },
      user: userId ? { id: userId } : undefined,
      extra,
    });

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[EXCEPTION]", error, context);
    }
  },
};

function log(level: LogLevel, message: string, context?: LogContext) {
  const { userId, flowId, ...extra } = context || {};

  // Add breadcrumb for all log levels
  Sentry.addBreadcrumb({
    category: flowId || "app",
    message,
    level: mapLevel(level),
    data: extra,
  });

  // For warnings and errors, also capture as message
  if (level === "warn" || level === "error") {
    Sentry.captureMessage(message, {
      level: mapLevel(level),
      tags: {
        ...(flowId && { flowId }),
        ...(context?.api && { api: context.api }),
      },
      user: userId ? { id: userId } : undefined,
      extra,
    });
  }

  // Console output for development
  if (process.env.NODE_ENV === "development") {
    const prefix = `[${level.toUpperCase()}]`;
    const args = context ? [prefix, message, context] : [prefix, message];

    switch (level) {
      case "debug":
        console.debug(...args);
        break;
      case "info":
        console.info(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
  }
}

function mapLevel(level: LogLevel): Sentry.SeverityLevel {
  switch (level) {
    case "debug":
      return "debug";
    case "info":
      return "info";
    case "warn":
      return "warning";
    case "error":
      return "error";
  }
}
