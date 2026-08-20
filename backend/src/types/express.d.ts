declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "CUSTOMER" | "ADMIN";
      };
      rawBody?: string;
    }
  }
}

export {};
