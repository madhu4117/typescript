import React from "react";
import {
  TableBody,
  TableCell,
  TableRow,
  Skeleton,
  Box,
} from "@mui/material";

interface AuditLogSkeletonProps {
  rows?: number;
}

export const AuditLogSkeleton: React.FC<AuditLogSkeletonProps> = ({ rows = 5 }) => {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          {/* User Info */}
          <TableCell sx={{ py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Skeleton variant="circular" width={34} height={34} />
              <Box sx={{ width: "100%" }}>
                <Skeleton variant="text" width="60%" height={18} />
                <Skeleton variant="text" width="40%" height={14} />
              </Box>
            </Box>
          </TableCell>

          {/* Action */}
          <TableCell>
            <Skeleton variant="rounded" width={85} height={26} sx={{ borderRadius: "12px" }} />
          </TableCell>

          {/* Resource & ID */}
          <TableCell>
            <Skeleton variant="text" width={70} height={18} />
            <Skeleton variant="text" width={40} height={14} />
          </TableCell>

          {/* Description */}
          <TableCell>
            <Skeleton variant="text" width="90%" height={18} />
          </TableCell>

          {/* IP Address */}
          <TableCell>
            <Skeleton variant="text" width={90} height={18} />
          </TableCell>

          {/* Timestamp */}
          <TableCell>
            <Skeleton variant="text" width={110} height={18} />
            <Skeleton variant="text" width={70} height={14} />
          </TableCell>

          {/* Status */}
          <TableCell>
            <Skeleton variant="rounded" width={65} height={24} sx={{ borderRadius: "8px" }} />
          </TableCell>

          {/* Actions */}
          <TableCell align="right">
            <Skeleton variant="circular" width={32} height={32} sx={{ ml: "auto" }} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

export default AuditLogSkeleton;
