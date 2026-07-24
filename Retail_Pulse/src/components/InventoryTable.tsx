import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Stack,
} from "@mui/material";

import type { Inventory } from "../types/inventory";

interface Props {
  data: Inventory[];

  onAdd: (item: Inventory) => void;

  onRemove: (item: Inventory) => void;

  onAdjust: (item: Inventory) => void;

  onHistory: (item: Inventory) => void;
}

const InventoryTable = ({
  data,
  onAdd,
  onRemove,
  onAdjust,
  onHistory,
}: Props) => {

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "success";

      case "Low Stock":
        return "warning";

      case "Out of Stock":
        return "error";

      default:
        return "default";
    }
  };

  return (
    <Paper sx={{ mt: 3 }}>
      <Table>

        <TableHead>
          <TableRow>

            <TableCell>
              Product
            </TableCell>

            <TableCell>
              SKU
            </TableCell>

            <TableCell>
              Category
            </TableCell>

            <TableCell>
              Brand
            </TableCell>

            <TableCell align="center">
              Current
            </TableCell>

            <TableCell align="center">
              Reserved
            </TableCell>

            <TableCell align="center">
              Available
            </TableCell>

            <TableCell align="center">
              Reorder
            </TableCell>

            <TableCell align="center">
              Status
            </TableCell>

            <TableCell align="center">
              Actions
            </TableCell>

          </TableRow>
        </TableHead>

        <TableBody>
  {data.map((item) => (
    <TableRow key={item.id} hover>
      <TableCell>{item.productName}</TableCell>

      <TableCell>{item.sku}</TableCell>

      <TableCell>{item.category}</TableCell>

      <TableCell>{item.brand}</TableCell>

      <TableCell align="center">
        {item.currentStock}
      </TableCell>

      <TableCell align="center">
        {item.reservedStock}
      </TableCell>

      <TableCell align="center">
        {item.availableStock}
      </TableCell>

      <TableCell align="center">
        {item.reorderLevel}
      </TableCell>

      <TableCell align="center">
        <Chip
          label={item.stockStatus}
          color={getStatusColor(item.stockStatus)}
          size="small"
        />
      </TableCell>

      <TableCell align="center">
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
        >
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => onAdd(item)}
          >
            Add
          </Button>

          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={() => onRemove(item)}
          >
            Remove
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => onAdjust(item)}
          >
            Adjust
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => onHistory(item)}
          >
            History
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
      </Table>
    </Paper>
  );
};

export default InventoryTable;