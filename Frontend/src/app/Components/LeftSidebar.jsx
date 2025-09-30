"use client";

import Image from "next/image";
import Link from "next/link";
import {
  User,
  Bell,
  LogOut,
  Home as HomeIcon,
  CalendarClock,
  Search,
} from "lucide-react";

export const SIDEBAR_WIDTH = 300; 
const PANEL = "bg-[#2b2142b3] border border-[#3b2d5e]";

/* ---------------- Gamer: ID at the end ---------------- */
const GAMER_ROUTES = {
  home: ({ userId }) => `/gamer/HomePage/${userId}`,
  scrims: "/gamer/scrims", // change to a function later /gamer/scrims/[id]
  profile: ({ userId }) => `/gamer/profile/${userId}`,
  search: ({ userId }) => `/gamer/Search/${userId}`,
  notifications: "/gamer/notifications", 
  logout: "/Logout",
};

/* --------- Club: static now, -------- */
const CLUB_ROUTES_STATIC = {
  home: "/club/HomePage",
  scrims: "/club/scrims",
  profile: "/club/profile",
  search: "/club/Search",
  notifications: "/club/notifications",
  logout: "/Home",
};

const CLUB_ROUTES_DYNAMIC = {
  home: ({ userId }) => `/club/HomePage/${userId}`,
  scrims: ({ userId }) => `/club/scrims/${userId}`,
  profile: ({ userId }) => `/club/profile/${userId}`,
  search: ({ userId }) => `/club/Search/${userId}`,
  notifications: ({ userId }) => `/club/notifications/${userId}`,
  logout: "/logout",
};

function resolveRoute(entry, params) {
  if (typeof entry === "function") {
    return params?.userId ? entry(params) : null;
  }
  return entry;
}

function LeftNavItem({ icon: Icon, label, active, href, disabled = false }) {
  const classes = `group relative w-full flex items-center gap-3 pl-3 pr-4 py-2 rounded-lg md:text-xl font-semibold transition-colors
    ${active ? "text-[#FCCC22]" : "text-white/80 hover:text-[#FCCC22]"}
    ${disabled ? "opacity-50 pointer-events-none" : ""}`;

  return (
    <Link href={href || "#"} aria-disabled={disabled} className={classes}>
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[5px] rounded-sm
          ${active ? "bg-[#FCCC22]" : "bg-transparent group-hover:bg-[#FCCC22]"}`}
      />
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export default function LeftSidebar({
  role = "gamer",           
  active = "home",        
  fixed = true,
  userId,                
  clubDynamic = false,       
}) {
  const routes =
    role === "gamer"
      ? GAMER_ROUTES
      : clubDynamic
        ? CLUB_ROUTES_DYNAMIC
        : CLUB_ROUTES_STATIC;

  const homeHref = resolveRoute(routes.home, { userId });
  const scrimsHref = resolveRoute(routes.scrims, { userId });
  const profileHref = resolveRoute(routes.profile, { userId });
  const searchHref = resolveRoute(routes.search, { userId });
  const notifHref = resolveRoute(routes.notifications, { userId });
  const logoutHref = resolveRoute(routes.logout, { userId });

  return (
    <aside
      className={`${PANEL} ${fixed ? "fixed left-0 top-0 bottom-0 z-20" : ""} px-3 py-6 rounded-r-2xl`}
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* LOGO */}
      <div className="mb-6 mr-1">
        <Image
          src="/AC-glow.png"
          alt="AceCore"
          width={120}
          height={120}
          priority
          className="object-contain"
        />
      </div>

      {/* NAV */}
      <nav className="space-y-3">
        <LeftNavItem
          icon={HomeIcon}
          label="Home"
          active={active === "home"}
          href={homeHref}
          disabled={!homeHref}  
        />
        <LeftNavItem
          icon={CalendarClock}
          label="Scrims Scheduling"
          active={active === "scrims"}
          href={scrimsHref}
          disabled={!scrimsHref}
        />
        <LeftNavItem
          icon={User}
          label="Profile"
          active={active === "profile"}
          href={profileHref}
          disabled={!profileHref}
        />
        <LeftNavItem
          icon={Search}
          label="Search"
          active={active === "search"}
          href={searchHref}
          disabled={!searchHref}
        />
        <LeftNavItem
          icon={Bell}
          label="Notifications"
          active={active === "notifications"}
          href={notifHref}
          disabled={!notifHref}
        />
        <LeftNavItem
          icon={LogOut}
          label="SignOut"
          active={active === "logout"}
          href={logoutHref}
          disabled={!logoutHref}
        />
      </nav>
    </aside>
  );
}
