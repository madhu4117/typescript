import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

interface Props {
  data: any[];
}

export default function OutOfStockTable({
  data,
}: Props) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>
        Out Of Stock Products
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Brand</TableCell>
            <TableCell>Stock</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.product}</TableCell>
              <TableCell>{item.brand}</TableCell>
              <TableCell>{item.stock}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}