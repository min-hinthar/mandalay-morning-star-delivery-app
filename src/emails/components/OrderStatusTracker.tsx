import { Section, Text } from '@react-email/components';

type OrderStep = 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';

interface OrderStatusTrackerProps {
  currentStep: OrderStep;
}

const STEPS: { key: OrderStep; label: string }[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function getStepState(
  stepIndex: number,
  currentIndex: number
): 'completed' | 'active' | 'future' {
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'active';
  return 'future';
}

const STEP_STYLES = {
  completed: {
    circle: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: '#3D8B22',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 700 as const,
      lineHeight: '28px',
      textAlign: 'center' as const,
      margin: '0 auto',
    },
    label: { color: '#3D8B22', fontWeight: 600 as const },
  },
  active: {
    circle: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: '#3D8B22',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 700 as const,
      lineHeight: '28px',
      textAlign: 'center' as const,
      margin: '0 auto',
      boxShadow: '0 0 0 4px rgba(61, 139, 34, 0.2)',
    },
    label: { color: '#3D8B22', fontWeight: 700 as const },
  },
  future: {
    circle: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: '#E5E7EB',
      color: '#9CA3AF',
      fontSize: '14px',
      fontWeight: 600 as const,
      lineHeight: '28px',
      textAlign: 'center' as const,
      margin: '0 auto',
    },
    label: { color: '#9CA3AF', fontWeight: 400 as const },
  },
};

export function OrderStatusTracker({ currentStep }: OrderStatusTrackerProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <Section style={{ padding: '24px', backgroundColor: '#FAFAFA' }}>
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: '100%', tableLayout: 'fixed' as const }}
      >
        <tbody>
          {/* Step circles + connectors */}
          <tr>
            {STEPS.map((step, i) => {
              const state = getStepState(i, currentIndex);
              const styles = STEP_STYLES[state];
              const isCompleted = state === 'completed';

              return (
                <td
                  key={step.key}
                  style={{
                    textAlign: 'center' as const,
                    position: 'relative' as const,
                    verticalAlign: 'top',
                    width: '25%',
                    padding: '0',
                  }}
                >
                  {/* Connector line (before circle, except first) */}
                  {i > 0 && (
                    <div
                      style={{
                        position: 'absolute' as const,
                        top: '14px',
                        left: '0',
                        right: '50%',
                        height: '2px',
                        backgroundColor:
                          i <= currentIndex ? '#3D8B22' : '#E5E7EB',
                        borderStyle:
                          i <= currentIndex ? 'solid' : 'dashed',
                      }}
                    />
                  )}
                  {/* Connector line (after circle, except last) */}
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        position: 'absolute' as const,
                        top: '14px',
                        left: '50%',
                        right: '0',
                        height: '2px',
                        backgroundColor:
                          i < currentIndex ? '#3D8B22' : '#E5E7EB',
                        borderStyle:
                          i < currentIndex ? 'solid' : 'dashed',
                      }}
                    />
                  )}
                  {/* Circle */}
                  <div
                    style={{
                      ...styles.circle,
                      position: 'relative' as const,
                      zIndex: 1,
                    }}
                  >
                    {isCompleted ? '\u2713' : i + 1}
                  </div>
                </td>
              );
            })}
          </tr>
          {/* Step labels */}
          <tr>
            {STEPS.map((step, i) => {
              const state = getStepState(i, currentIndex);
              const styles = STEP_STYLES[state];

              return (
                <td
                  key={`label-${step.key}`}
                  style={{
                    textAlign: 'center' as const,
                    paddingTop: '8px',
                  }}
                >
                  <Text
                    style={{
                      fontSize: '11px',
                      margin: '0',
                      lineHeight: '1.3',
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
