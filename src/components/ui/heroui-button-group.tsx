"use client";

import "@heroui/styles/css";
import "@/components/ui/heroui-button-group-utils/index.css";
import React from "react";
import {
  ButtonGroup as BaseButtonGroup,
  Button as BaseButton,
  type ButtonGroupProps as BaseButtonGroupProps,
  type ButtonProps as BaseButtonProps,
} from "@heroui/react";

export function Separator({ className = "" }: { className?: string }) {
  return <span className={`heroui-button-group-separator inline-block ${className}`} role="separator" />;
}

export type ButtonGroupProps = BaseButtonGroupProps;
export type ButtonProps = BaseButtonProps;

const ButtonGroupComponent = forwardRef<HTMLDivElement, BaseButtonGroupProps>(
  function ButtonGroup({ className = "", children, ...props }, ref) {
    return (
      <BaseButtonGroup
        ref={ref}
        className={`heroui-button-group-root ${className}`}
        {...props}
      >
        {children}
      </BaseButtonGroup>
    );
  }
);

import { forwardRef } from "react";

export const ButtonGroup = Object.assign(ButtonGroupComponent, {
  Separator,
});

export const Button = BaseButton;
export default ButtonGroup;
