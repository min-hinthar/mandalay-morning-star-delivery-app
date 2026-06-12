import { Section, Text } from "@react-email/components";
import { BODY_FONT, C } from "./theme";

type OrderStep = "received" | "confirmed" | "preparing" | "out_for_delivery" | "delivered";

interface OrderStatusTrackerProps {
  currentStep: OrderStep;
}

const CONFIRMED_STEPS: { key: OrderStep; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const COD_PENDING_STEPS: { key: OrderStep; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

function getStepState(stepIndex: number, currentIndex: number): "completed" | "active" | "future" {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "future";
}

/** Completed = quiet sage; active = clay with a soft halo; future = paper ghosts. */
const STEP_STYLES = {
  completed: {
    circle: {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: C.sage,
      border: `1px solid ${C.sage}`,
      color: C.white,
      fontSize: "14px",
      fontWeight: 700 as const,
      lineHeight: "28px",
      textAlign: "center" as const,
      margin: "0 auto",
    },
    label: { color: C.sageDeep, fontWeight: 600 as const },
  },
  active: {
    circle: {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: C.clay,
      border: `1px solid ${C.clayDeep}`,
      color: C.white,
      fontSize: "14px",
      fontWeight: 700 as const,
      lineHeight: "28px",
      textAlign: "center" as const,
      margin: "0 auto",
      boxShadow: `0 0 0 4px ${C.clayTint}`,
    },
    label: { color: C.accent, fontWeight: 700 as const },
  },
  future: {
    circle: {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: C.paper,
      border: `1px solid ${C.lineStrong}`,
      color: C.inkFaint,
      fontSize: "13px",
      fontWeight: 600 as const,
      lineHeight: "28px",
      textAlign: "center" as const,
      margin: "0 auto",
    },
    label: { color: C.inkFaint, fontWeight: 400 as const },
  },
};

export function OrderStatusTracker({ currentStep }: OrderStatusTrackerProps) {
  const steps = currentStep === "received" ? COD_PENDING_STEPS : CONFIRMED_STEPS;
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <Section style={{ padding: "22px 24px", backgroundColor: C.vellum }}>
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: "100%", tableLayout: "fixed" as const }}
      >
        <tbody>
          {/* Step circles + connectors */}
          <tr>
            {steps.map((step, i) => {
              const state = getStepState(i, currentIndex);
              const styles = STEP_STYLES[state];
              const isCompleted = state === "completed";

              return (
                <td
                  key={step.key}
                  style={{
                    textAlign: "center" as const,
                    position: "relative" as const,
                    verticalAlign: "top",
                    width: `${100 / steps.length}%`,
                    padding: "0",
                  }}
                >
                  {/* Connector line (before circle, except first) */}
                  {i > 0 && (
                    <div
                      style={{
                        position: "absolute" as const,
                        top: "14px",
                        left: "0",
                        right: "50%",
                        height: "2px",
                        backgroundColor: i <= currentIndex ? C.sage : C.lineStrong,
                        borderStyle: i <= currentIndex ? "solid" : "dashed",
                      }}
                    />
                  )}
                  {/* Connector line (after circle, except last) */}
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        position: "absolute" as const,
                        top: "14px",
                        left: "50%",
                        right: "0",
                        height: "2px",
                        backgroundColor: i < currentIndex ? C.sage : C.lineStrong,
                        borderStyle: i < currentIndex ? "solid" : "dashed",
                      }}
                    />
                  )}
                  {/* Circle */}
                  <div
                    style={{
                      ...styles.circle,
                      position: "relative" as const,
                      zIndex: 1,
                    }}
                  >
                    {isCompleted ? "✓" : i + 1}
                  </div>
                </td>
              );
            })}
          </tr>
          {/* Step labels */}
          <tr>
            {steps.map((step, i) => {
              const state = getStepState(i, currentIndex);
              const styles = STEP_STYLES[state];

              return (
                <td
                  key={`label-${step.key}`}
                  style={{
                    textAlign: "center" as const,
                    paddingTop: "8px",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      margin: "0",
                      lineHeight: "1.3",
                      fontFamily: BODY_FONT,
                      ...styles.label,
                    }}
                  >
                    {step.label}
                  </Text>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
