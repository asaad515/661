declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      role: "admin" | "staff";
      permissions: string[];
      createdAt?: Date;
    }
  }
}

export {};