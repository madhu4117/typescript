import React from "react";
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Step,
  Stepper,
  StepLabel,
} from "@mui/material";

interface Props {
  loading: boolean;
  message?: string;
  activeStep?: number; // 0: Upload, 1: Validate, 2: Process, 3: Completed
}

const steps = [
  "Upload CSV File",
  "Preview & Validate",
  "Process & Insert",
  "Import Completed",
];

const ImportProgress: React.FC<Props> = ({
  loading,
  message = "Processing import...",
  activeStep = 1,
}) => {
  if (!loading) {
    return null;
  }

  return (
    <Paper
      sx={{
        mt: 3,
        p: 3,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    fontSize: 12,
                    fontWeight: 600,
                  },
                  "& .Mui-active": {
                    color: "#7c3aed !important",
                  },
                  "& .Mui-completed": {
                    color: "#10b981 !important",
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
          {message}
        </Typography>
        <Typography variant="caption" sx={{ color: "#7c3aed", fontWeight: 600 }}>
          Please do not close this window
        </Typography>
      </Box>

      <LinearProgress
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "#e2e8f0",
          "& .MuiLinearProgress-bar": {
            backgroundColor: "#7c3aed",
            borderRadius: 4,
          },
        }}
      />
    </Paper>
  );
};

export default ImportProgress;