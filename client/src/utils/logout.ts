// Development logout utility
export const developmentLogout = () => {
  if (import.meta.env.DEV) {
    // Clear any testUser parameters and redirect to login
    const url = new URL(window.location.origin);
    url.pathname = '/login';
    window.location.href = url.toString();
  } else {
    // Production logout
    window.location.href = '/api/logout';
  }
};