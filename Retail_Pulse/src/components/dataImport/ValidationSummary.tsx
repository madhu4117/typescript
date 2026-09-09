import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";

interface Props {
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
}

const ValidationSummary: React.FC<Props> = ({
  total,
  valid,
  invalid,
  duplicate,
}) => {
  const getPercentage = (count: number) => {
    if (total === 0) return "0%";
    return `${((count / total) * 100).toFixed(0)}%`;
  };

  const cards = [
    {
      title: "Total Records",
      value: total,
      subtext: "Found in uploaded CSV",
      icon: <ArticleOutlinedIcon sx={{ fontSize: 28, color: "#6366f1" }} />,
      bgColor: "#eef2ff",
      textColor: "#4338ca",
      borderColor: "#c7d2fe",
    },
    {
      title: "Valid Records",
      value: valid,
      subtext: `${getPercentage(valid)} eligible for import`,
      icon: <CheckCircleOutlinedIcon sx={{ fontSize: 28, color: "#10b981" }} />,
      bgColor: "#ecfdf5",
      textColor: "#047857",
      borderColor: "#a7f3d0",
    },
    {
      title: "Invalid Records",
      value: invalid,
      subtext: `${getPercentage(invalid)} failed validation`,
      icon: <HighlightOffOutlinedIcon sx={{ fontSize: 28, color: "#ef4444" }} />,
      bgColor: "#fef2f2",
      textColor: "#b91c1c",
      borderColor: "#fecaca",
    },
    {
      title: "Duplicate Records",
      value: duplicate,
      subtext: `${getPercentage(duplicate)} duplicate keys`,
      icon: <ContentCopyOutlinedIcon sx={{ fontSize: 28, color: "#f59e0b" }} />,
      bgColor: "#fffbeb",
      textColor: "#b45309",
      borderColor: "#fde68a",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2.5,
        mt: 3,
      }}
    >
      {cards.map((card) => (
        <Paper
          key={card.title}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: `1px solid ${card.borderColor}`,
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b" }}>
              {card.title}
            </Typography>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                backgroundColor: card.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.icon}
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: 32,
              fontWeight: 800,
              color: card.textColor,
              lineHeight: 1.2,
            }}
          >
            {card.value.toLocaleString()}
          </Typography>

          <Typography variant="caption" sx={{ color: "#94a3b8", mt: 0.5, display: "block" }}>
            {card.subtext}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default ValidationSummary;