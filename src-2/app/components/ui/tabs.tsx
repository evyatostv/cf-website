"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within Tabs");
  return context;
};

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue = "", value: controlledValue, onValueChange, orientation = "vertical", className, children, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const value = controlledValue ?? uncontrolledValue;

    const handleValueChange = React.useCallback((newValue: string) => {
      if (controlledValue === undefined) setUncontrolledValue(newValue);
      onValueChange?.(newValue);
    }, [controlledValue, onValueChange]);

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange, orientation }}>
        <div
          ref={ref}
          className={cn(orientation === "vertical" ? "flex gap-8" : "w-full", className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const { orientation } = useTabsContext();
    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          "relative flex",
          orientation === "vertical"
            ? "flex-col gap-1 border-l border-border"
            : "gap-2 border-b border-border",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, children, disabled = false, onClick, ...props }, ref) => {
    const { value: selectedValue, onValueChange, orientation } = useTabsContext();
    const isSelected = selectedValue === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isSelected}
        aria-controls={`panel-${value}`}
        disabled={disabled}
        onClick={(e) => {
          onValueChange(value);
          onClick?.(e);
        }}
        className={cn(
          "relative px-4 py-2.5 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          orientation === "vertical" ? "text-left w-full" : "text-center",
          isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      >
        {children}
        {isSelected && (
          <span
            className={cn(
              "absolute bg-primary transition-all",
              orientation === "vertical"
                ? "left-0 top-0 bottom-0 w-0.5"
                : "bottom-0 left-0 right-0 h-0.5"
            )}
          />
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    if (selectedValue !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`panel-${value}`}
        className={cn("flex-1 focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
