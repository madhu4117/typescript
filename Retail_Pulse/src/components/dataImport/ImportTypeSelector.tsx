import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";

import type { ImportType } from "../../services/dataImportService";

interface Props {
  value: ImportType;
  onChange: (value: ImportType) => void;
}

const options: Array<{
  id: ImportType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    id: "products",
    title: "Products",
    subtitle: "Product Name, SKU, Category, Price, Stock",
    icon: <InventoryIcon sx={{ color: "#6366f1" }} />,
  },
  {
    id: "customers",
    title: "Customers",
    subtitle: "Name, Email, Phone, Address, Customer Type",
    icon: <PeopleIcon sx={{ color: "#10b981" }} />,
  },
  {
    id: "sales",
    title: "Sales Transactions",
    subtitle: "Customer, Product, Quantity, Unit Price, Date",
    icon: <PointOfSaleIcon sx={{ color: "#ec4899" }} />,
  },
];

const ImportTypeSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="import-type-label">Select Import Module</InputLabel>
      <Select
        labelId="import-type-label"
        value={value}
        label="Select Import Module"
        onChange={(e) => onChange(e.target.value as ImportType)}
        renderValue={(selected) => {
          const opt = options.find((o) => o.id === selected);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {opt?.icon}
              <Typography sx={{ fontWeight: 600 }}>{opt?.title}</Typography>
            </Box>
          );
        }}
        sx={{
          borderRadius: 2.5,
          backgroundColor: "#ffffff",
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id} sx={{ py: 1.5 }}>
            <ListItemIcon>{opt.icon}</ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {opt.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {opt.subtitle}
                </Typography>
              }
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ImportTypeSelector;