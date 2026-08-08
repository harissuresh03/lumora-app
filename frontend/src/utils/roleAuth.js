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

// ✅ Check if current user is parent
export const isParent = () => {
  const role = localStorage.getItem("user_role");
  return role === 'parent';
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

// Get dashboard path based on role
export const getDashboardPath = () => {
  const role = getUserRole();
  if (role === 'admin') return '/admin';
  if (role === 'counsellor') return '/counsellor';
  if (role === 'parent') return '/parent/dashboard';
  return '/dashboard';
};

// Redirect to appropriate dashboard based on role
export const redirectToDashboard = (navigate) => {
  const path = getDashboardPath();
  navigate(path);
};

// Require admin access - redirects to their respective dashboard if not admin
export const requireAdmin = (navigate) => {
  if (!isAdmin()) {
    if (isCounsellor()) {
      navigate("/counsellor");
    } else if (isParent()) {
      navigate("/parent/dashboard");
    } else {
      navigate("/dashboard");
    }
    return false;
  }
  return true;
};

// Require counsellor access - redirects to their respective dashboard if not counsellor
export const requireCounsellor = (navigate) => {
  if (!isCounsellor() && !isAdmin()) {
    if (isAdmin()) {
      navigate("/admin");
    } else if (isParent()) {
      navigate("/parent/dashboard");
    } else {
      navigate("/dashboard");
    }
    return false;
  }
  return true;
};

// Require student access - redirects based on role
export const requireStudent = (navigate) => {
  if (isAdmin()) {
    navigate("/admin");
    return false;
  }
  if (isCounsellor()) {
    navigate("/counsellor");
    return false;
  }
  if (isParent()) {
    navigate("/parent/dashboard");
    return false;
  }
  return true;
};

// ✅ Require parent access - redirects based on role
export const requireParent = (navigate) => {
  if (!isParent()) {
    if (isAdmin()) {
      navigate("/admin");
    } else if (isCounsellor()) {
      navigate("/counsellor");
    } else {
      navigate("/dashboard");
    }
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

// ✅ Check if user has permission to view parent panel
export const hasParentAccess = () => {
  return isParent();
};

// ✅ Get user role display name
export const getRoleDisplayName = () => {
  const role = getUserRole();
  const roleNames = {
    'admin': 'Administrator',
    'counsellor': 'Counsellor',
    'parent': 'Parent/Guardian',
    'student': 'Student'
  };
  return roleNames[role] || 'Student';
};

// ✅ Get role icon (emoji)
export const getRoleIcon = () => {
  const role = getUserRole();
  const icons = {
    'admin': '🛡️',
    'counsellor': '🧑‍🏫',
    'parent': '👨‍👩‍👦',
    'student': '👤'
  };
  return icons[role] || '👤';
};

// ✅ Check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

// ✅ Get user name
export const getUserName = () => {
  return localStorage.getItem("user_name") || localStorage.getItem("user_nickname") || 'User';
};

// ✅ Get user ID
export const getUserId = () => {
  return localStorage.getItem("user_id");
};