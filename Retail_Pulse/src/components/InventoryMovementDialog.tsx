import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";



interface Movement {
  id: number;
  movementType: string;
  previousQuantity: number;
  updatedQuantity: number;
  quantityChanged: number;
  reason: string;
  remarks?: string;
  performedBy: number;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  movements: Movement[];
}

const InventoryMovementDialog = ({
  open,
  onClose,
  movements,
}: Props) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>
        Stock Movement History
      </DialogTitle>

      <DialogContent>
        {movements.length === 0 ? (
          <Typography>No movement history found.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Previous</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Changed</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {movements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.movementType}
                    </TableCell>

                    <TableCell>
                      {item.previousQuantity}
                    </TableCell>

                    <TableCell>
                      {item.updatedQuantity}
                    </TableCell>

                    <TableCell>
                      {item.quantityChanged}
                    </TableCell>

                    <TableCell>
                      {item.reason}
                    </TableCell>

                    <TableCell>
                      {item.remarks || "-"}
                    </TableCell>

                    <TableCell>
                      {item.performedBy}
                    </TableCell>

                    <TableCell>
                      {new Date(
                        item.createdAt
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryMovementDialog;