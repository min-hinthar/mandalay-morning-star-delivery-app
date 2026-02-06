export interface PendingInvite {
  id: string;
  email: string;
  invitedBy: { id: string; name: string };
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}
