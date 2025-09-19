"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";

type ResponsiveModalProps = React.ComponentProps<typeof Dialog>;

const ResponsiveModalContext = React.createContext(false);

export function ResponsiveModal({ open, onOpenChange, children, ...rest }: ResponsiveModalProps) {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const isMobile = useIsMobile();

  if (!hydrated) {
    return null;
  }

  const content = (
    <ResponsiveModalContext.Provider value={isMobile}>{children}</ResponsiveModalContext.Provider>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} {...(rest as any)}>
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...rest}>
      {content}
    </Dialog>
  );
}

export const ResponsiveModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(ResponsiveModalContext);
  if (isMobile) {
    return (
      <DrawerContent
        ref={ref}
        className={cn("max-h-[80vh] overflow-y-auto", className)}
        {...props}
      />
    );
  }
  return <DialogContent ref={ref} className={className} {...props} />;
});
ResponsiveModalContent.displayName = "ResponsiveModalContent";

export function ResponsiveModalHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = React.useContext(ResponsiveModalContext);
  return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />;
}

export function ResponsiveModalFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = React.useContext(ResponsiveModalContext);
  return isMobile ? <DrawerFooter {...props} /> : <DialogFooter {...props} />;
}

export const ResponsiveModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(ResponsiveModalContext);
  if (isMobile) {
    return <DrawerTitle ref={ref as any} className={className} {...(props as any)} />;
  }
  return <DialogTitle ref={ref} className={className} {...props} />;
});
ResponsiveModalTitle.displayName = "ResponsiveModalTitle";

export const ResponsiveModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(ResponsiveModalContext);
  if (isMobile) {
    return <DrawerDescription ref={ref as any} className={className} {...(props as any)} />;
  }
  return <DialogDescription ref={ref} className={className} {...props} />;
});
ResponsiveModalDescription.displayName = "ResponsiveModalDescription";

export const ResponsiveModalClose = React.forwardRef<
  React.ElementRef<typeof DialogClose>,
  React.ComponentPropsWithoutRef<typeof DialogClose>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(ResponsiveModalContext);
  if (isMobile) {
    return <DrawerClose ref={ref as any} className={className} {...(props as any)} />;
  }
  return <DialogClose ref={ref} className={className} {...props} />;
});
ResponsiveModalClose.displayName = "ResponsiveModalClose";
