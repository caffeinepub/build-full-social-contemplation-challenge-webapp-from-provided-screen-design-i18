/**
 * Generates a random invitation code for challenge invitations.
 * 
 * @param length - The length of the code (default: 8)
 * @returns A random alphanumeric code in uppercase
 */
export function generateInvitationCode(length: number = 8): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (I, O, 0, 1)
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    code += charset[randomIndex];
  }
  
  return code;
}
