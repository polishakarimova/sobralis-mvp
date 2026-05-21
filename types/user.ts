export type AuthMethod = "telegram" | "yandex" | "phone" | "guest";

export type AuthUser = {
  name: string;
  method: AuthMethod;
};
