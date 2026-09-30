import * as React from "react";
import { useState, createContext, useContext } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

export const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...(props as React.ComponentProps<typeof motion.aside>)} />
      <MobileSidebar {...(props as unknown as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  width = "260px",
  collapsedWidth = "68px",
  ...props
}: React.ComponentProps<typeof motion.aside> & {
  width?: string;
  collapsedWidth?: string;
}) => {
  const sidebar = useSidebar();
  const open = sidebar?.open ?? true;
  const setOpen = sidebar?.setOpen ?? (() => {});
  const animate = sidebar?.animate ?? true;

  return (
    <motion.aside
      className={cn(
        "h-screen sticky top-0 hidden lg:flex lg:flex-col border-r border-sidebar-border bg-sidebar shrink-0 z-30 select-none overflow-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? width : collapsedWidth) : width,
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const sidebar = useSidebar();
  const open = sidebar?.open ?? false;
  const setOpen = sidebar?.setOpen ?? (() => {});

  return (
    <div
      className={cn(
        "h-14 px-4 flex flex-row lg:hidden items-center justify-between border-b border-sidebar-border bg-sidebar w-full",
        className
      )}
      {...props}
    >
      <div className="flex justify-end z-20 w-full">
        <Menu
          className="text-sidebar-foreground cursor-pointer size-6"
          onClick={() => setOpen(!open)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-72 inset-y-0 left-0 bg-sidebar border-r border-sidebar-border p-6 z-[100] flex flex-col justify-between shadow-2xl",
              className
            )}
          >
            <div
              className="absolute right-4 top-4 z-50 text-sidebar-foreground cursor-pointer p-1 rounded-lg hover:bg-muted"
              onClick={() => setOpen(!open)}
            >
              <X className="size-5" />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive = false,
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
  isActive?: boolean;
  props?: Omit<LinkProps, "to">;
}) => {
  const sidebar = useSidebar();
  const open = sidebar?.open ?? true;
  const animate = sidebar?.animate ?? true;
  const isExternal = link.href.startsWith("http");

  const commonClass = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer group/sidebar relative overflow-hidden",
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    className
  );

  const content = (
    <>
      <span className="shrink-0 flex items-center justify-center size-5">
        {link.icon}
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.2 }}
        className="text-sm whitespace-nowrap overflow-hidden text-ellipsis !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className={commonClass}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={link.href} className={commonClass} {...props}>
      {content}
    </Link>
  );
};
