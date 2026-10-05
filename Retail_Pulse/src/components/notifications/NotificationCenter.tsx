import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import InventoryIcon from "@mui/icons-material/Inventory";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationService";

import type {
  Notification,
} from "../../services/notificationService";

// =========================================================
// HELPER: RELATIVE TIME
// =========================================================

const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin === 1) return "1 minute ago";
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHr === 1) return "1 hour ago";
    if (diffHr < 24) return `${diffHr} hours ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

// =========================================================
// NOTIFICATION CENTER COMPONENT
// =========================================================

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const pageSize = 12;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusTab, setStatusTab] = useState<
    "all" | "unread" | "read"
  >("all");

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Details Modal
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  // Success message
  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null);

  // =======================================================
  // FETCH NOTIFICATIONS
  // =======================================================

  const loadNotifications = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setLoading(true);
        }

        setError(null);

        const data = await getNotifications({
          page,
          limit: pageSize,
          unread:
            statusTab === "unread"
              ? true
              : statusTab === "read"
              ? false
              : undefined,
          type:
            typeFilter !== "ALL"
              ? typeFilter
              : undefined,
          priority:
            priorityFilter !== "ALL"
              ? priorityFilter
              : undefined,
        });

        let filteredItems = data.items || [];

        // Search is handled on the frontend because
        // notificationService currently doesn't expose
        // a search parameter.
        if (searchTerm.trim()) {
          const search = searchTerm
            .trim()
            .toLowerCase();

          filteredItems = filteredItems.filter(
            (notification) =>
              notification.title
                ?.toLowerCase()
                .includes(search) ||
              notification.message
                ?.toLowerCase()
                .includes(search) ||
              notification.type
                ?.toLowerCase()
                .includes(search)
          );
        }

        setNotifications(filteredItems);

        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);

        // Get unread count separately.
        try {
          const count =
            await getUnreadNotificationCount();

          setUnreadCount(count);
        } catch (countError) {
          console.error(
            "Failed to load unread notification count:",
            countError
          );
        }
      } catch (err) {
        console.error(
          "Failed to load notifications:",
          err
        );

        setError(
          "Unable to load notifications. Please check your connection."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      statusTab,
      typeFilter,
      priorityFilter,
      searchTerm,
    ]
  );

  // =======================================================
  // INITIAL LOAD + POLLING
  // =======================================================

  useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(() => {
      loadNotifications(false);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  // =======================================================
  // MARK ONE AS READ
  // =======================================================

  const handleMarkOneRead = async (
    item: Notification,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    if (item.isRead) {
      return;
    }

    try {
      await markNotificationRead(item.id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );

      if (
        selectedNotification &&
        selectedNotification.id === item.id
      ) {
        setSelectedNotification({
          ...selectedNotification,
          isRead: true,
        });
      }
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err
      );
    }
  };

  // =======================================================
  // MARK ALL AS READ
  // =======================================================

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      setActionSuccess(
        "All notifications marked as read."
      );

      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );
    }
  };

  // =======================================================
  // OPEN DETAILS MODAL
  // =======================================================

  const handleOpenDetails = (
    notification: Notification
  ) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);

    if (!notification.isRead) {
      handleMarkOneRead(notification);
    }
  };

  // =======================================================
  // CLOSE DETAILS
  // =======================================================

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedNotification(null);
  };

  // =======================================================
  // NAVIGATION ACTIONS
  // =======================================================

  const handleNavigateResource = (
    notification: Notification
  ) => {
    handleCloseDetails();

    if (
      notification.resourceType === "Product"
    ) {
      navigate("/inventory");
    } else if (
      notification.resourceType ===
        "ImportHistory" ||
      notification.type.includes("Import")
    ) {
      navigate("/data-import");
    } else if (
      notification.resourceType === "Sale" ||
      notification.type.includes("Sales")
    ) {
      navigate("/sales");
    } else {
      navigate("/dashboard");
    }
  };

  // =======================================================
  // ICON MAPPING
  // =======================================================

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Stockout Risk":
        return (
          <ErrorIcon
            sx={{ color: "#ef4444" }}
          />
        );

      case "Low Stock":
        return (
          <WarningAmberIcon
            sx={{ color: "#f59e0b" }}
          />
        );

      case "Overstock":
        return (
          <InventoryIcon
            sx={{ color: "#3b82f6" }}
          />
        );

      case "Import Completed":
        return (
          <CheckCircleOutlineIcon
            sx={{ color: "#10b981" }}
          />
        );

      case "Import Failed":
        return (
          <CloudOffIcon
            sx={{ color: "#ef4444" }}
          />
        );

      case "Sales Alert":
        return (
          <TrendingUpIcon
            sx={{ color: "#8b5cf6" }}
          />
        );

      case "System Alert":
        return (
          <InfoOutlinedIcon
            sx={{ color: "#64748b" }}
          />
        );

      default:
        return (
          <InfoOutlinedIcon
            sx={{ color: "#64748b" }}
          />
        );
    }
  };

  // =======================================================
  // PRIORITY STYLE
  // =======================================================

  const getPriorityStyle = (
    priority: string
  ) => {
    switch (priority) {
      case "Critical":
        return {
          border: "#ef4444",
          chipColor: "error" as const,
          label: "Critical",
          bg: "#fef2f2",
        };

      case "High":
        return {
          border: "#f97316",
          chipColor: "warning" as const,
          label: "High",
          bg: "#fff7ed",
        };

      case "Medium":
        return {
          border: "#f59e0b",
          chipColor: "warning" as const,
          label: "Medium",
          bg: "#fffbeb",
        };

      default:
        return {
          border: "#3b82f6",
          chipColor: "info" as const,
          label: "Low",
          bg: "#eff6ff",
        };
    }
  };

  // =======================================================
  // KPI COUNTS
  // =======================================================

  const criticalHighCount =
    notifications.filter(
      (notification) =>
        notification.priority === "Critical" ||
        notification.priority === "High"
    ).length;

  const inventoryAlertsCount =
    notifications.filter((notification) =>
      [
        "Stockout Risk",
        "Low Stock",
        "Overstock",
      ].includes(notification.type)
    ).length;

  // =======================================================
  // RESET FILTERS
  // =======================================================

  const resetFilters = () => {
    setStatusTab("all");
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setSearchTerm("");
    setPage(1);
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
          >
            <NotificationsActiveIcon
              sx={{
                color: "#7c3aed",
                fontSize: 32,
              }}
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Notification Center
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              mt: 0.5,
            }}
          >
            Centralized alerts for stockouts, low
            inventory, imports, and system events
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<DoneAllIcon />}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          sx={{
            bgcolor: "#7c3aed",
            color: "#fff",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              bgcolor: "#6d28d9",
            },
          }}
        >
          Mark All as Read
        </Button>
      </Stack>

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {actionSuccess && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {actionSuccess}
        </Alert>
      )}

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {/* TOTAL */}

        <Card
          sx={{
            borderRadius: 2.5,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent
            sx={{
              p: 2,
              "&:last-child": {
                pb: 2,
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              TOTAL NOTIFICATIONS
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                mt: 0.5,
              }}
            >
              {totalCount}
            </Typography>
          </CardContent>
        </Card>

        {/* UNREAD */}

        <Card
          sx={{
            borderRadius: 2.5,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent
            sx={{
              p: 2,
              "&:last-child": {
                pb: 2,
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#7c3aed",
                  fontWeight: 600,
                }}
              >
                UNREAD ALERTS
              </Typography>

              {unreadCount > 0 && (
                <Chip
                  size="small"
                  label="Action required"
                  color="primary"
                  sx={{
                    height: 20,
                    fontSize: 11,
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#7c3aed",
                mt: 0.5,
              }}
            >
              {unreadCount}
            </Typography>
          </CardContent>
        </Card>

        {/* CRITICAL */}

        <Card
          sx={{
            borderRadius: 2.5,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent
            sx={{
              p: 2,
              "&:last-child": {
                pb: 2,
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#ef4444",
                fontWeight: 600,
              }}
            >
              CRITICAL / HIGH PRIORITY
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#ef4444",
                mt: 0.5,
              }}
            >
              {criticalHighCount}
            </Typography>
          </CardContent>
        </Card>

        {/* INVENTORY */}

        <Card
          sx={{
            borderRadius: 2.5,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent
            sx={{
              p: 2,
              "&:last-child": {
                pb: 2,
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#f59e0b",
                fontWeight: 600,
              }}
            >
              INVENTORY ALERTS
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#f59e0b",
                mt: 0.5,
              }}
            >
              {inventoryAlertsCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* =====================================================
          FILTER TOOLBAR
      ====================================================== */}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          justifyContent="space-between"
        >
          {/* STATUS TABS */}

          <Tabs
            value={statusTab}
            onChange={(_, value) => {
              setStatusTab(value);
              setPage(1);
            }}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                minHeight: 40,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
              },
            }}
          >
            <Tab
              label={`All (${totalCount})`}
              value="all"
            />

            <Tab
              label={
                <Stack
                  direction="row"
                  spacing={0.8}
                  alignItems="center"
                >
                  <span>Unread</span>

                  {unreadCount > 0 && (
                    <Chip
                      size="small"
                      label={unreadCount}
                      color="error"
                      sx={{
                        height: 18,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Stack>
              }
              value="unread"
            />

            <Tab
              label="Read"
              value="read"
            />
          </Tabs>

          {/* SEARCH + FILTERS */}

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
            alignItems="center"
          >
            {/* SEARCH */}

            <TextField
              size="small"
              placeholder="Search alerts or products..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(
                  event.target.value
                );
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: "#94a3b8",
                        fontSize: 20,
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: {
                  sm: 220,
                },
              }}
            />

            {/* TYPE */}

            <FormControl
              size="small"
              sx={{
                minWidth: 150,
              }}
            >
              <Select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">
                  All Types
                </MenuItem>

                <MenuItem value="Stockout Risk">
                  Stockout Risk
                </MenuItem>

                <MenuItem value="Low Stock">
                  Low Stock
                </MenuItem>

                <MenuItem value="Overstock">
                  Overstock
                </MenuItem>

                <MenuItem value="Import Completed">
                  Import Completed
                </MenuItem>

                <MenuItem value="Import Failed">
                  Import Failed
                </MenuItem>

                <MenuItem value="Sales Alert">
                  Sales Alert
                </MenuItem>

                <MenuItem value="System Alert">
                  System Alert
                </MenuItem>
              </Select>
            </FormControl>

            {/* PRIORITY */}

            <FormControl
              size="small"
              sx={{
                minWidth: 130,
              }}
            >
              <Select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">
                  All Priorities
                </MenuItem>

                <MenuItem value="Critical">
                  Critical
                </MenuItem>

                <MenuItem value="High">
                  High
                </MenuItem>

                <MenuItem value="Medium">
                  Medium
                </MenuItem>

                <MenuItem value="Low">
                  Low
                </MenuItem>
              </Select>
            </FormControl>

            {/* RESET */}

            {(typeFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              searchTerm ||
              statusTab !== "all") && (
              <Button
                size="small"
                onClick={resetFilters}
                sx={{
                  textTransform: "none",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && !loading && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                loadNotifications(true)
              }
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <Stack spacing={1.5}>
          {[1, 2, 3, 4, 5].map((key) => (
            <Card
              key={key}
              sx={{
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Skeleton
                  variant="circular"
                  width={40}
                  height={40}
                />

                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={24}
                  />

                  <Skeleton
                    variant="text"
                    width="70%"
                    height={18}
                  />
                </Box>

                <Skeleton
                  variant="rounded"
                  width={80}
                  height={28}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <Paper
            sx={{
              py: 8,
              px: 3,
              textAlign: "center",
              borderRadius: 3,
              bgcolor: "#fff",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor:
                  "rgba(124, 58, 237, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <NotificationsNoneIcon
                sx={{
                  fontSize: 38,
                  color: "#7c3aed",
                }}
              />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              You're all caught up!
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                mt: 0.5,
                maxWidth: 420,
                mx: "auto",
              }}
            >
              No notifications match your
              current filter criteria. Any new
              events will appear here.
            </Typography>

            {(typeFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              searchTerm ||
              statusTab !== "all") && (
              <Button
                variant="outlined"
                size="small"
                onClick={resetFilters}
                sx={{
                  mt: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Clear Filters
              </Button>
            )}
          </Paper>
        )}

      {/* =====================================================
          NOTIFICATION LIST
      ====================================================== */}

      {!loading &&
        notifications.length > 0 && (
          <Stack spacing={1.5}>
            {notifications.map(
              (notification) => {
                const priorityStyle =
                  getPriorityStyle(
                    notification.priority
                  );

                return (
                  <Card
                    key={notification.id}
                    onClick={() =>
                      handleOpenDetails(
                        notification
                      )
                    }
                    sx={{
                      borderRadius: 2.5,
                      cursor: "pointer",
                      position: "relative",
                      borderLeft: `5px solid ${priorityStyle.border}`,
                      bgcolor:
                        notification.isRead
                          ? "#ffffff"
                          : "rgba(124, 58, 237, 0.03)",
                      boxShadow:
                        notification.isRead
                          ? "0 1px 3px rgba(0,0,0,0.04)"
                          : "0 2px 6px rgba(124, 58, 237, 0.08)",
                      transition:
                        "all 0.2s ease-in-out",
                      "&:hover": {
                        transform:
                          "translateY(-1px)",
                        boxShadow:
                          "0 4px 12px rgba(0,0,0,0.08)",
                        bgcolor:
                          notification.isRead
                            ? "#fafafa"
                            : "rgba(124, 58, 237, 0.05)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 2,
                        "&:last-child": {
                          pb: 2,
                        },
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        spacing={2}
                        alignItems="flex-start"
                      >
                        {/* ICON */}

                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            bgcolor:
                              priorityStyle.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            flexShrink: 0,
                          }}
                        >
                          {getTypeIcon(
                            notification.type
                          )}
                        </Box>

                        {/* CONTENT */}

                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Stack
                            direction={{
                              xs: "column",
                              sm: "row",
                            }}
                            justifyContent="space-between"
                            alignItems={{
                              xs: "flex-start",
                              sm: "center",
                            }}
                            spacing={1}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight:
                                    notification.isRead
                                      ? 600
                                      : 800,
                                  color:
                                    notification.isRead
                                      ? "#1e293b"
                                      : "#0f172a",
                                }}
                              >
                                {notification.title}
                              </Typography>

                              {!notification.isRead && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius:
                                      "50%",
                                    bgcolor:
                                      "#7c3aed",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </Stack>

                            <Typography
                              variant="caption"
                              sx={{
                                color: "#94a3b8",
                                fontWeight: 500,
                              }}
                            >
                              {formatRelativeTime(
                                notification.createdAt
                              )}
                            </Typography>
                          </Stack>

                          {/* MESSAGE */}

                          <Typography
                            variant="body2"
                            sx={{
                              color: "#475569",
                              mt: 0.5,
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                              display:
                                "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient:
                                "vertical",
                            }}
                          >
                            {notification.message}
                          </Typography>

                          {/* META */}

                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mt: 1.5 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              sx={{
                                gap: 0.5,
                              }}
                            >
                              <Chip
                                size="small"
                                label={
                                  priorityStyle.label
                                }
                                color={
                                  priorityStyle.chipColor
                                }
                                sx={{
                                  height: 22,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              />

                              <Chip
                                size="small"
                                variant="outlined"
                                label={
                                  notification.type
                                }
                                sx={{
                                  height: 22,
                                  fontSize: 11,
                                  borderColor:
                                    "#cbd5e1",
                                }}
                              />

                              {notification.resourceType && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`${notification.resourceType}${
                                    notification.resourceId
                                      ? ` #${notification.resourceId}`
                                      : ""
                                  }`}
                                  sx={{
                                    height: 22,
                                    fontSize: 11,
                                    color:
                                      "#64748b",
                                    bgcolor:
                                      "#f1f5f9",
                                  }}
                                />
                              )}
                            </Stack>

                            {!notification.isRead && (
                              <Tooltip title="Mark as read">
                                <IconButton
                                  size="small"
                                  onClick={(event) =>
                                    handleMarkOneRead(
                                      notification,
                                      event
                                    )
                                  }
                                  sx={{
                                    color:
                                      "#7c3aed",
                                  }}
                                >
                                  <MarkEmailReadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </Stack>
        )}

      {/* =====================================================
          PAGINATION
      ====================================================== */}

      {!loading && totalPages > 1 && (
        <Stack
          direction="row"
          justifyContent="center"
          sx={{ mt: 4 }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) =>
              setPage(value)
            }
            color="primary"
            sx={{
              "& .Mui-selected": {
                bgcolor:
                  "#7c3aed !important",
                color: "#fff",
              },
            }}
          />
        </Stack>
      )}

      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        {selectedNotification && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    {getTypeIcon(
                      selectedNotification.type
                    )}

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {selectedNotification.title}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "#64748b",
                      mt: 0.5,
                      display: "block",
                    }}
                  >
                    Received:{" "}
                    {new Date(
                      selectedNotification.createdAt
                    ).toLocaleString()}
                  </Typography>
                </Box>

                <IconButton
                  onClick={handleCloseDetails}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 2.5 }}>
              {/* BADGES */}

              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <Chip
                  size="small"
                  label={`Priority: ${selectedNotification.priority}`}
                  color={
                    getPriorityStyle(
                      selectedNotification.priority
                    ).chipColor
                  }
                  sx={{
                    fontWeight: 700,
                  }}
                />

                <Chip
                  size="small"
                  variant="outlined"
                  label={
                    selectedNotification.type
                  }
                />

                <Chip
                  size="small"
                  variant="outlined"
                  label={
                    selectedNotification.isRead
                      ? "Read"
                      : "Unread"
                  }
                  color={
                    selectedNotification.isRead
                      ? "default"
                      : "primary"
                  }
                />
              </Stack>

              {/* MESSAGE */}

              <Typography
                variant="body1"
                sx={{
                  color: "#334155",
                  mb: 2.5,
                  lineHeight: 1.6,
                }}
              >
                {selectedNotification.message}
              </Typography>

              {/* RESOURCE DETAILS */}

              {selectedNotification.resourceType && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: "#1e293b",
                      mb: 1.5,
                    }}
                  >
                    Alert Details
                  </Typography>

                  <Stack spacing={1}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#475569",
                      }}
                    >
                      Resource Type:{" "}
                      <strong>
                        {
                          selectedNotification.resourceType
                        }
                      </strong>
                    </Typography>

                    {selectedNotification.resourceId && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#475569",
                        }}
                      >
                        Resource ID:{" "}
                        <strong>
                          {
                            selectedNotification.resourceId
                          }
                        </strong>
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              )}
            </DialogContent>

            <Divider />

            <DialogActions
              sx={{
                p: 2,
                justifyContent:
                  "space-between",
              }}
            >
              <Button
                onClick={handleCloseDetails}
                sx={{
                  textTransform: "none",
                  color: "#64748b",
                }}
              >
                Close
              </Button>

              {selectedNotification.resourceType && (
                <Button
                  variant="contained"
                  endIcon={<OpenInNewIcon />}
                  onClick={() =>
                    handleNavigateResource(
                      selectedNotification
                    )
                  }
                  sx={{
                    bgcolor: "#7c3aed",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "#6d28d9",
                    },
                  }}
                >
                  {selectedNotification.resourceType ===
                  "Product"
                    ? "View in Inventory"
                    : selectedNotification.resourceType ===
                      "ImportHistory"
                    ? "View Data Import"
                    : "View Resource"}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NotificationCenter;