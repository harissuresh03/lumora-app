// frontend/src/utils/roleAuth.js
// This is for FRONTEND use only - checking roles in components

// Check if current user is admin
export const isAdmin = () => {
  const role = localStorage.getItem("user_role");
  return role === 'admin';
};

// Check if current user is counsellor
export const isCounsellor = () => {
  const role = localStorage.getItem("user_role");
  return role === 'counsellor';
};

// Check if current user is student
export const isStudent = () => {
  const role = localStorage.getItem("user_role");
  return role === 'student' || !role;
};

// Check if current user has staff access (admin or counsellor)
export const isStaff = () => {
  const role = localStorage.getItem("user_role");
  return role === 'admin' || role === 'counsellor';
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem("user_role") || 'student';
};

// Redirect to appropriate dashboard based on role
export const redirectToDashboard = (navigate) => {
  const role = getUserRole();
  if (role === 'admin') {
    navigate("/admin");
  } else if (role === 'counsellor') {
    navigate("/counsellor");
  } else {
    navigate("/dashboard");
  }
};

// Require admin access - redirects to their respective dashboard if not admin
export const requireAdmin = (navigate) => {
  if (!isAdmin()) {
    if (isCounsellor()) {
      navigate("/counsellor");
    } else {
      navigate("/dashboard");
    }
    return false;
  }
  return true;
};

// Require counsellor access - redirects to their respective dashboard if not counsellor
export const requireCounsellor = (navigate) => {
  if (!isCounsellor()) {
    if (isAdmin()) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
    return false;
  }
  return true;
};

// Require student access - redirects to admin if admin, counsellor if counsellor
export const requireStudent = (navigate) => {
  if (isAdmin()) {
    navigate("/admin");
    return false;
  }
  if (isCounsellor()) {
    navigate("/counsellor");
    return false;
  }
  return true;
};

// Check if user has permission to view admin panel
export const hasAdminAccess = () => {
  return isAdmin();
};

// Check if user has permission to view counsellor panel
export const hasCounsellorAccess = () => {
  return isAdmin() || isCounsellor();
};

// Get dashboard path based on role
export const getDashboardPath = () => {
  const role = getUserRole();
  if (role === 'admin') return '/admin';
  if (role === 'counsellor') return '/counsellor';
  return '/dashboard';
};