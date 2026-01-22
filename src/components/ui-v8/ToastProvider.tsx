"use client";

/**
 * ToastProvider Component
 * Wrapper that enables toast notifications globally
 *
 * Add to app layout to enable toasts throughout the application.
 *
 * @example
 * // In app/layout.tsx
 * import { ToastProvider } from "@/components/ui-v8";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ToastProvider>{children}</ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */

import type { ReactNode } from "react";
import { ToastContainer } from "./Toast";

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider - Wraps app and renders ToastContainer
 */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
