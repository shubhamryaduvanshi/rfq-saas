import { IRFQColumn } from "./RFQColumnConfig";

export function getDefaultRFQColumns(): IRFQColumn[] {
  return [
    {
      id: "productName",
      label: "Product Name",
      type: "text",
      enabled: true,
      order: 1,
      required: true,
    },
    {
      id: "image",
      label: "Image",
      type: "image",
      enabled: true,
      order: 2,
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      enabled: true,
      order: 3,
    },
    {
      id: "quantity",
      label: "Quantity",
      type: "number",
      enabled: true,
      order: 4,
      required: true,
    },
    {
      id: "unit",
      label: "Unit",
      type: "text",
      enabled: true,
      order: 5,
    },
    {
      id: "expectedPrice",
      label: "Expected Price",
      type: "number",
      enabled: true,
      order: 6,
    },
    {
      id: "remarks",
      label: "Remarks",
      type: "textarea",
      enabled: true,
      order: 7,
    },
    {
      id: "status",
      label: "Status",
      type: "dropdown",
      enabled: true,
      order: 8,
      options: ["Open", "In Review", "Closed"],
    },
    {
      id: "vendorFeedback",
      label: "Vendor Feedback",
      type: "textarea",
      enabled: true,
      order: 9,
    },
  ];
}

