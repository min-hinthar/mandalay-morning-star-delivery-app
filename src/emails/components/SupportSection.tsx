import { Hr, Link, Section, Text } from '@react-email/components';

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export function SupportSection() {
  return (
    <Section style={{ padding: '24px' }}>
      <Hr style={{ borderColor: '#E5E7EB', margin: '0 0 20px 0' }} />
      <Text
        style={{
          fontSize: '14px',
          fontFamily: SANS,
          color: '#374151',
          margin: '0 0 8px 0',
          textAlign: 'center' as const,
          fontWeight: 600,
        }}
      >
        Need help?
      </Text>
      <Text
        style={{
          fontSize: '13px',
          fontFamily: SANS,
          color: '#6B7280',
          margin: '0',
          textAlign: 'center' as const,
          lineHeight: '1.6',
        }}
      >
        Simply reply to this email or contact us at{' '}
        <Link
          href="mailto:support@mandalaymorningstar.com"
          style={{ color: '#D4A017', textDecoration: 'underline' }}
        >
          support@mandalaymorningstar.com
        </Link>
      </Text>
    </Section>
  );
}
