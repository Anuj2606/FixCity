export const getInitials = (fullName?: string): string => {
  if (!fullName) return 'U';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
};

export const getCleanName = (displayName: string | null | undefined, email: string | null | undefined): string => {
  if (displayName && displayName.trim() !== '' && !['Civic User', 'User', 'Citizen', 'Unknown User', 'U'].includes(displayName.trim())) {
    return displayName.trim();
  }
  if (!email) return 'Civic User';
  
  const namePart = email.split('@')[0];
  // Split on digits, dots, hyphens, underscores to get word components
  const parts = namePart.split(/[^a-zA-Z]/).filter(Boolean);
  if (parts.length > 0) {
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  }
  return 'Civic User';
};

