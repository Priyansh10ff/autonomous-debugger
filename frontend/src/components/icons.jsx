import React from "react";
import {
  Play,
  Bug,
  CheckCircle2,
  XCircle,
  TerminalSquare,
  Cpu,
  Code2,
  RotateCcw,
  ArrowRightLeft,
  ChevronDown,
  FileCode,
  Settings,
  Github,
  PanelLeft,
  Triangle,
} from "lucide-react";

export const Icons = {
  play: Play,
  bug: Bug,
  check: CheckCircle2,
  cancel: XCircle,
  terminal: TerminalSquare,
  cpu: Cpu,
  code: Code2,
  spinner: RotateCcw,
  diff: ArrowRightLeft,
  chevronDown: ChevronDown,
  file: FileCode,
  settings: Settings,
  github: Github,
  sidebar: PanelLeft,
  logo: Triangle,
};

export const Icon = ({ name, className, ...props }) => {
  const LucideIcon = Icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon className={className} {...props} />;
};