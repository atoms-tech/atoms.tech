export const COOKIE_NAMES = {
    PREFERRED_ORG_ID: 'preferred_org_id',
    USER_ID: 'user_id',
    AUTH_TOKEN: 'sb-access-token',
    REFRESH_TOKEN: 'sb-refresh-token',
    // Add any other cookies that need to be managed
} as const;

export const clearCookie = (name: string) => {
    // Set cookie expiry to past date to clear it and ensure it's cleared from all paths
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
};

export const clearAllAuthCookies = () => {
    Object.values(COOKIE_NAMES).forEach(clearCookie);
};
