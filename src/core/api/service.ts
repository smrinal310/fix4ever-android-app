import { getStoredToken } from '../storage';
import  { request, requestWithAuth } from './client';

export const getServiceRequests = async () => {
    const token: string | null = await getStoredToken();
    if (!token) {
        throw new Error('No token found');
    }
    return requestWithAuth('/service-requests/my-requests', token);
}