"use client";

import Image from "next/image";
import {
  User,
  Bell,
  LogOut,
  Home as HomeIcon,
  CalendarClock,
   Search,   
} from "lucide-react";

export const SIDEBAR_WIDTH = 240;
const PANEL = "bg-[#2b2142b3] border border-[#3b2d5e]";

function LeftNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full flex items-center gap-3 pl-3 pr-4 py-2 rounded-lg md:text-xl font-semibold transition-colors
        ${active ? "text-[#FCCC22]" : "text-white/80 hover:text-[#FCCC22]"}`}
    >
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[5px] rounded-sm
          ${active ? "bg-[#FCCC22]" : "bg-transparent group-hover:bg-[#FCCC22]"}`}
      />
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}


export default function GamerSidebar({ active = "home", onChange, fixed = true }) {
  return (
    <aside
      className={`${PANEL} ${fixed ? "fixed left-0 top-0 bottom-0 z-20" : ""} w-[300px] px-3 py-6 rounded-r-2xl`}
    >
      {/* LOGO ONLY */}
      <div className="mb-6 mr-1">
        <Image
          src="/AC-glow.png"
          alt="AceCore"
          width={120}
          height={120}
          priority
          className="object-contain   "
        />
      </div>

      {/* NAV ITEMS */}
      <nav className="space-y-3">
        <LeftNavItem
          icon={HomeIcon}
          label="Home"
          active={active === "home"}
          onClick={() => onChange?.("home")}
        />
        <LeftNavItem
          icon={CalendarClock}
          label="Scrims Scheduling"
          active={active === "scrims"}
          onClick={() => onChange?.("scrims")}
        />
        <LeftNavItem
          icon={User}
          label="Profile"
          active={active === "profile"}
          onClick={() => onChange?.("profile")}
        />
         <LeftNavItem
          icon={Search}
          label="Search"
          active={active === "search"}
          onClick={() => onChange?.("search")}
        />
        <LeftNavItem
          icon={Bell}
          label="Notifications"
          active={active === "notifications"}
          onClick={() => onChange?.("notifications")}
        />
       
        <LeftNavItem
          icon={LogOut}
          label="SignOut"
          active={active === "logout"}
          onClick={() => onChange?.("logout")}
        />
      </nav>
    </aside>
  );
}
