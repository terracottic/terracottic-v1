// Role constants with descriptions
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = [ROLES.USER, ROLES.ADMIN];

// Role descriptions for UI
export const ROLE_DESCRIPTIONS = {
  [ROLES.USER]: 'Regular user with basic permissions',
  [ROLES.ADMIN]: 'Full system access'
};

// Get role description
export const getRoleDescription = (role) => ROLE_DESCRIPTIONS[role] || 'No description available';
