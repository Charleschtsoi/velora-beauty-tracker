/** Local-only mode: products stay on device until the user signs in. */
export const GUEST_USER_ID = 'local-user';

export function isGuestUserId(userId: string): boolean {
  return userId === GUEST_USER_ID;
}
