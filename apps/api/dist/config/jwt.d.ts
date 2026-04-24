export interface IJwtPayload {
    userId: string;
    role: 'merchant' | 'client' | 'admin';
    shopId?: string;
}
export declare function signToken(payload: IJwtPayload): string;
export declare function signRefreshToken(payload: IJwtPayload): string;
export declare function verifyToken(token: string): IJwtPayload;
export declare function verifyRefreshToken(token: string): IJwtPayload;
//# sourceMappingURL=jwt.d.ts.map