import "server-only";
import { authenticated } from "./session";

export type PortalData = {
  unread_count: number;
  notifications: {
    id: number;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
  }[];
  emails: {
    id: number;
    subject: string;
    body: string;
    status: "pending" | "sending" | "accepted" | "failed";
    created_at: string;
  }[];
  inquiries: { id: number; user_message: string; created_at: string }[];
  services: {
    id: number;
    title: string;
    description: string;
    status: "available" | "coming_soon";
  }[];
};
export function clientPortal() {
  return authenticated<PortalData>("/api/auth/portal/");
}
