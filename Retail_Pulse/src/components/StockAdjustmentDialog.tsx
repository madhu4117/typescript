import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from "@mui/material";

import type { Inventory } from "../types/inventory";

import {
  addStock,
  removeStock,
  adjustStock,
} from "../services/inventoryService";

interface Props {
  open: boolean;

  onClose: () => void;

  inventory: Inventory | null;

  movementType: "add" | "remove" | "adjust";

  onSuccess: () => void;
}

const StockAdjustmentDialog = ({
  open,
  onClose,
  inventory,
  movementType,
  onSuccess,
}: Props) => {

  const [quantity, setQuantity] = useState("");

  const [reason, setReason] = useState("");

  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  if (!inventory) return;

  try {
    setLoading(true);

    const payload = {
      quantity: Number(quantity),
      reason,
      remarks,
    };

    if (movementType === "add") {
      await addStock(inventory.id, payload);
    } else if (movementType === "remove") {
      await removeStock(inventory.id, payload);
    } else {
      await adjustStock(inventory.id, payload);
    }

    setQuantity("");
    setReason("");
    setRemarks("");

    onSuccess();

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
return (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
  >
    <DialogTitle>
      {movementType === "add"
        ? "Add Stock"
        : movementType === "remove"
        ? "Remove Stock"
        : "Manual Stock Adjustment"}
    </DialogTitle>

    <DialogContent>

      <Stack spacing={2} sx={{ mt: 2 }}>

        <TextField
          label="Product"
          value={inventory?.productName || ""}
          fullWidth
          disabled
        />

        <TextField
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
          fullWidth
          required
        />

        <TextField
          label="Reason"
          value={reason}
          onChange={(e) =>
            setReason(e.target.value)
          }
          fullWidth
          required
        />

        <TextField
          label="Remarks"
          value={remarks}
          onChange={(e) =>
            setRemarks(e.target.value)
          }
          fullWidth
          multiline
          rows={3}
        />

      </Stack>

    </DialogContent>

    <DialogActions>

      <Button
        onClick={onClose}
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={
          loading ||
          !quantity ||
          !reason
        }
      >
        {loading
          ? "Saving..."
          : movementType === "add"
          ? "Add Stock"
          : movementType === "remove"
          ? "Remove Stock"
          : "Adjust Stock"}
      </Button>

    </DialogActions>
        
  </Dialog>
);

};

export default StockAdjustmentDialog;