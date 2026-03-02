import React from 'react';
import type { IconType } from 'react-icons';
import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiCpu,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiInfo,
  FiMenu,
  FiMoon,
  FiMessageSquare,
  FiSun,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiXCircle,
  FiZap
} from 'react-icons/fi';
import { TbPin } from 'react-icons/tb';

type Props = {
  size?: number;
  className?: string;
  title?: string;
};

function WrapIcon(props: Props & { Icon: IconType }) {
  const { Icon, size, className, title } = props;
  if (title) {
    return <Icon size={size ?? 16} className={className} role="img" aria-label={title} focusable="false" />;
  }
  return <Icon size={size ?? 16} className={className} aria-hidden="true" focusable="false" />;
}

export function IconPin(props: Props) {
  // Use a "thumbtack" style pin (more familiar than map-pin for "pinned").
  return <WrapIcon Icon={TbPin as unknown as IconType} {...props} />;
}

export function IconInfo(props: Props) {
  return <WrapIcon Icon={FiInfo} {...props} />;
}

export function IconZap(props: Props) {
  return <WrapIcon Icon={FiZap} {...props} />;
}

export function IconAlertTriangle(props: Props) {
  return <WrapIcon Icon={FiAlertTriangle} {...props} />;
}

export function IconCheckCircle(props: Props) {
  return <WrapIcon Icon={FiCheckCircle} {...props} />;
}

export function IconXCircle(props: Props) {
  return <WrapIcon Icon={FiXCircle} {...props} />;
}

export function IconFileText(props: Props) {
  return <WrapIcon Icon={FiFileText} {...props} />;
}

export function IconMessageSquare(props: Props) {
  return <WrapIcon Icon={FiMessageSquare} {...props} />;
}

export function IconCpu(props: Props) {
  return <WrapIcon Icon={FiCpu} {...props} />;
}

export function IconSun(props: Props) {
  return <WrapIcon Icon={FiSun} {...props} />;
}

export function IconMoon(props: Props) {
  return <WrapIcon Icon={FiMoon} {...props} />;
}

export function IconMenu(props: Props) {
  return <WrapIcon Icon={FiMenu} {...props} />;
}

export function IconChevronDown(props: Props) {
  return <WrapIcon Icon={FiChevronDown} {...props} />;
}

export function IconChevronLeft(props: Props) {
  return <WrapIcon Icon={FiChevronLeft} {...props} />;
}

export function IconChevronRight(props: Props) {
  return <WrapIcon Icon={FiChevronRight} {...props} />;
}

export function IconX(props: Props) {
  return <WrapIcon Icon={FiX} {...props} />;
}

export function IconDownload(props: Props) {
  return <WrapIcon Icon={FiDownload} {...props} />;
}

export function IconEdit(props: Props) {
  return <WrapIcon Icon={FiEdit2} {...props} />;
}

export function IconTrash(props: Props) {
  return <WrapIcon Icon={FiTrash2} {...props} />;
}

export function IconUpload(props: Props) {
  return <WrapIcon Icon={FiUploadCloud} {...props} />;
}
