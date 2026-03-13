export type RFQStatus = "draft" | "sent" | "responded" | "closed";

export type RFQColumnType =
  | "text"
  | "number"
  | "image"
  | "dropdown"
  | "textarea";

export interface RFQColumnConfig {
  id: string;
  label: string;
  type: RFQColumnType;
  enabled: boolean;
  order: number;
  required?: boolean;
  width?: string;
  options?: string[];
}

export interface RFQItemValueMap {
  [columnId: string]: string | number | string[] | null;
}

export interface RFQListItem {
  id: string;
  title: string;
  number: string;
  date: string;
  vendorName: string;
  status: RFQStatus;
  templateId: string;
}

