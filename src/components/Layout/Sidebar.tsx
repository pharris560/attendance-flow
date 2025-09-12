import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import React from "react";

type Props = { open: boolean; onClose: () => void };

const LinkItem: React.FC<React.PropsWithChildren<{ to: string; onClick?: () => void }>> = ({ to, onClick, children }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `block px-3 py-2 rounded hover:bg-gray-100 ${isActive ? "bg-gray-100 font-medium" : ""}`
    }
  >
    {children}
  </NavLink>
);

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Desktop sidebar (md and up) */}
      <aside className="hidden md:flex w-64 h-dvh bg-white border-r flex-col">
        <div className="h-16 px-4 flex items-center border-b">
          <div className="text-base font-semibold">ACE Attendance</div>
          <span className="ml-2 text-xs text-gray-500">Smart Tracking</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <LinkItem to="/">Dashboard</LinkItem>
          <LinkItem to="/students">Students</LinkItem>
          <LinkItem to="/staff">Staff</LinkItem>
          <LinkItem to="/staff-attendance">Staff Attendance</LinkItem>
          <LinkItem to="/classes">Classes</LinkItem>
          <LinkItem to="/qr-scanner">QR Scanner</LinkItem>
          <LinkItem to="/qr-codes">QR Codes</LinkItem>
          <LinkItem to="/reports">Reports</LinkItem>
          <LinkItem to="/settings">Settings</LinkItem>
        </nav>
      </aside>

      {/* Mobile drawer (below md) */}
      <div className={`md:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Drawer */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-white border-r shadow transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="h-16 px-4 flex items-center justify-between border-b">
            <div className="text-base font-semibold">ACE Attendance</div>
            <button aria-label="Close menu" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-2 overflow-y-auto h-[calc(100%-4rem)] space-y-1">
            <LinkItem to="/" onClick={onClose}>Dashboard</LinkItem>
            <LinkItem to="/students" onClick={onClose}>Students</LinkItem>
            <LinkItem to="/staff" onClick={onClose}>Staff</LinkItem>
            <LinkItem to="/staff-attendance" onClick={onClose}>Staff Attendance</LinkItem>
            <LinkItem to="/classes" onClick={onClose}>Classes</LinkItem>
            <LinkItem to="/qr-scanner" onClick={onClose}>QR Scanner</LinkItem>
            <LinkItem to="/qr-codes" onClick={onClose}>QR Codes</LinkItem>
            <LinkItem to="/reports" onClick={onClose}>Reports</LinkItem>
            <LinkItem to="/settings" onClick={onClose}>Settings</LinkItem>
          </nav>
        </aside>
      </div>
    </>
  );
}
