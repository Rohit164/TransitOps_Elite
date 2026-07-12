import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Truck,
  Users,
  Compass,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck
} from "lucide-react";

export default function Sidebar() {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // RBAC permissions configurations for sidebar items
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]
    },
    {
      name: "Fleet Registry",
      path: "/fleet",
      icon: Truck,
      roles: ["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"] // Blocked for SAFETY_OFFICER
    },
    {
      name: "Drivers Registry",
      path: "/drivers",
      icon: Users,
      roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER"] // Blocked for FINANCIAL_ANALYST
    },
    {
      name: "Trip Dispatcher",
      path: "/trips",
      icon: Compass,
      roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER"] // Blocked for FINANCIAL_ANALYST
    },
    {
      name: "Maintenance",
      path: "/maintenance",
      icon: Wrench,
      roles: ["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"] // Blocked for SAFETY_OFFICER
    },
    {
      name: "Fuel & Expenses",
      path: "/expenses",
      icon: Receipt,
      roles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"] // Blocked for DRIVER, SAFETY_OFFICER
    },
    {
      name: "Analytics & Reports",
      path: "/analytics",
      icon: BarChart3,
      roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["FLEET_MANAGER"] // Blocked for all except Fleet Manager
    }
  ];

  // Filter items visible to current user role
  const visibleItems = menuItems.filter(item => hasRole(item.roles));

  return (
    <aside className="w-64 glass-panel border-r border-dark-border h-screen flex flex-col shrink-0 sticky top-0">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-dark-border">
        <div className="p-1.5 bg-brand-primary/10 border border-brand-primary/30 rounded-lg text-brand-primary">
          <ShieldCheck size={22} />
        </div>
        <span className="font-bold text-xl tracking-wide text-white">
          Transit<span className="text-brand-primary">Ops</span>
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                  : "text-slate-400 hover:bg-dark-surface-hover hover:text-white"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User role details */}
      <div className="p-4 border-t border-dark-border bg-dark-bg/40 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Access Scope</span>
          <span className="text-brand-primary font-bold">{user.role.replace("_", " ")}</span>
        </div>
      </div>
    </aside>
  );
}
