export declare const env: {
    MONGODB_URI: string;
    REDIS_URL: string;
    NODE_ENV: "test" | "development" | "production";
    PORT: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    SMTP_PORT: string;
    ADMIN_EMAIL: string;
    FRONTEND_URL: string;
    CLOUDINARY_CLOUD_NAME?: string | undefined;
    CLOUDINARY_API_KEY?: string | undefined;
    CLOUDINARY_API_SECRET?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    ANTHROPIC_API_KEY?: string | undefined;
    AFRICAS_TALKING_API_KEY?: string | undefined;
    AFRICAS_TALKING_USERNAME?: string | undefined;
};
export type Env = typeof env;
//# sourceMappingURL=env.d.ts.map