import {
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Stack,
  Typography,
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
    <Paper
      elevation={3}
      sx={{
        mt: 3,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <TableCell>Product</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Brand</TableCell>

              <TableCell align="center">Current</TableCell>
              <TableCell align="center">Reserved</TableCell>
              <TableCell align="center">Available</TableCell>
              <TableCell align="center">Reorder</TableCell>

              <TableCell align="center">Status</TableCell>

              <TableCell align="center" width={220}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography py={3}>
                    No inventory found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
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
                      direction="column"
                      spacing={1}
                      sx={{ minWidth: 140 }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        fullWidth
                        onClick={() => onAdd(item)}
                      >
                        Add
                      </Button>

                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        fullWidth
                        onClick={() => onRemove(item)}
                      >
                        Remove
                      </Button>

                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => onAdjust(item)}
                      >
                        Adjust
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => onHistory(item)}
                      >
                        History
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default InventoryTable;