import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Only Admins and Project Managers can view billing totals and generate invoices */
export function canViewBilling(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().replace(/\s+/g, '_');
  return r === 'admin' || r === 'project_manager';
}

/** Only Admins and Project Managers can add, edit, delete projects and manage team members */
export function canManageProjects(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().replace(/\s+/g, '_');
  return r === 'admin' || r === 'project_manager';
}

/** True when user is member (not admin or project_manager) - sees only personal time/reports */
export function isMemberOnly(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().replace(/\s+/g, '_');
  return r === 'member' || r === 'team_member';
}
