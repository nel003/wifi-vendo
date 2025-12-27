import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.SECRET || 'default-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateAccessToken = (payload: any) => {
    // Remove sensitive data if present, though callers should ideally handle this
    const { password, ...safePayload } = payload;
    return jwt.sign(safePayload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: any) => {
    const { password, ...safePayload } = payload;
    return jwt.sign(safePayload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
};

export const setRefreshTokenCookie = async (token: string) => {
    const cookieStore = await cookies();
    cookieStore.set('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
    });
};

export const removeRefreshTokenCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');
};

export const getRefreshTokenFromCookie = async () => {
    const cookieStore = await cookies();
    return cookieStore.get('refreshToken')?.value;
}

export const setAccessTokenCookie = async (token: string) => {
    const cookieStore = await cookies();
    cookieStore.set('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
    });
};

export const removeAccessTokenCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
};

export const getAccessTokenFromCookie = async () => {
    const cookieStore = await cookies();
    return cookieStore.get('accessToken')?.value;
}
