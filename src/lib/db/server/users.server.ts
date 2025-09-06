import { atomsApiServer } from '@/lib/atoms-api/server';

export const getUserProfileServer = async (userId: string) => {
    const api = await atomsApiServer();
    return await api.auth.getProfile(userId);
};

export const getAuthUserServer = async () => {
    const api = await atomsApiServer();
    return await api.auth.getAuthUser();
};
