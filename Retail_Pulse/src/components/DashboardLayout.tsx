import React, { useState, useEffect } from "react";

import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PeopleIcon from "@mui/icons-material/People";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Inventory as ProductIcon,
  Warehouse as WarehouseIcon,
  History as HistoryIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";

import AnalyticsIcon from "@mui/icons-material/Analytics";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import {
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";
import type { Notification } from "../services/notificationService";

const drawerWidth = 260;

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  // ============================================================
  // NOTIFICATION COUNT
  // ============================================================

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);

  const handleOpenNotifMenu = async (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
    try {
      const data = await getNotifications({ page: 1, limit: 5 });
      setRecentNotifs(data.items || []);
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error("Failed to load quick notifications", e);
    }
  };

  const handleCloseNotifMenu = () => {
    setNotifAnchorEl(null);
  };

  const handleQuickMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handleQuickClickNotif = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setRecentNotifs((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
      } catch (e) {
        console.error(e);
      }
    }
    handleCloseNotifMenu();
    navigate("/notifications");
  };

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [anchorEl, setAnchorEl] =
    useState<null | HTMLElement>(null);

  // ============================================================
  // CHECK LOGIN
  // ============================================================

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/");
    } else {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid user data:", error);

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/");
      }
    }
  }, [navigate]);

  // ============================================================
  // NOTIFICATION POLLING
  // ============================================================

  useEffect(() => {
  const loadUnreadCount = async () => {
    try {
      const count =
        await getUnreadNotificationCount();

      setUnreadCount(count);
    } catch (error) {
      console.error(
        "Failed to load notification count:",
        error
      );
    }
  };

  // Load immediately
  loadUnreadCount();

  // Refresh every 15 seconds
  const interval = setInterval(
    loadUnreadCount,
    15000
  );

  return () => {
    clearInterval(interval);
  };
}, []);

  // ============================================================
  // DRAWER
  // ============================================================

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // ============================================================
  // PROFILE MENU
  // ============================================================

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    handleMenuClose();

    navigate("/");
  };

  // ============================================================
  // SIDEBAR MENU
  // ============================================================

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },

    {
      text: "Categories",
      icon: <CategoryIcon />,
      path: "/categories",
    },

    {
      text: "Products",
      icon: <ProductIcon />,
      path: "/products",
    },

    {
      text: "Inventory",
      icon: <WarehouseIcon />,
      path: "/inventory",
    },

    {
      text: "Customers",
      icon: <PeopleIcon />,
      path: "/customers",
    },

    {
      text: "Sales",
      icon: <PointOfSaleIcon />,
      path: "/sales",
    },

    {
      text: "Analytics",
      icon: <AnalyticsIcon />,
      path: "/analytics",
    },

    {
      text: "Sales Analytics",
      icon: <TrendingUpIcon />,
      path: "/analytics/sales",
    },

    {
      text: "Demand Forecasting",
      icon: <AutoGraphIcon />,
      path: "/demand-forecasting",
    },

    {
      text: "Audit Logs",
      icon: <HistoryIcon />,
      path: "/audit-logs",
      adminOnly: true,
    },

    // ==========================================================
    // TASK 12 - DATA IMPORT
    // ==========================================================

    {
      text: "Data Import",
      icon: <CloudUploadIcon />,
      path: "/data-import",
      adminOnly: true,
    },

    // ==========================================================
    // TASK 14 - NOTIFICATION CENTER
    // ==========================================================

    {
      text: "Notifications",
      icon: (
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneIcon />
        </Badge>
      ),
      path: "/notifications",
    },
  ];

  // ============================================================
  // ADMIN CHECK
  // ============================================================

  const isAdmin = user
    ? [
        "company admin",
        "admin",
        "super admin",
      ].includes(
        (user.role || "").toLowerCase()
      )
    : false;

  const visibleMenuItems =
    menuItems.filter(
      (item) =>
        !item.adminOnly || isAdmin
    );

  // ============================================================
  // DRAWER CONTENT
  // ============================================================

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#1e293b",
        color: "#f8fafc",
        overflow: "hidden",
      }}
    >
      {/* ======================================================
          LOGO
      ====================================================== */}

      <Toolbar
        sx={{
          justifyContent: "center",
          py: 1.5,
          minHeight: "72px !important",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: "12px",
              background:
                "linear-gradient(135deg, #aa3bff, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 4px 12px rgba(168, 85, 247, 0.4)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              R
            </Typography>
          </Box>

          <Typography
            variant="h5"
            noWrap
            sx={{
              letterSpacing: 0.5,
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.35rem",
            }}
          >
            RetailPulse
          </Typography>
        </Box>
      </Toolbar>

      <Divider
        sx={{
          bgcolor: "rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      />

      {/* ======================================================
          MENU
      ====================================================== */}

      <List
        sx={{
          px: 1.5,
          py: 1.5,
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",

          scrollbarWidth: "thin",

          "&::-webkit-scrollbar": {
            width: "4px",
          },

          "&::-webkit-scrollbar-thumb": {
            backgroundColor:
              "rgba(148, 163, 184, 0.25)",
            borderRadius: "10px",
          },

          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
        }}
      >
        {visibleMenuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(
              `${item.path}/`
            );

          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{
                mb: 0.5,
              }}
            >
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  minHeight: 46,
                  height: 46,

                  borderRadius: "11px",

                  py: 0.75,
                  px: 1.5,

                  bgcolor: isActive
                    ? "rgba(168, 85, 247, 0.15)"
                    : "transparent",

                  color: isActive
                    ? "#c084fc"
                    : "#94a3b8",

                  transition:
                    "all 0.25s ease",

                  borderLeft: isActive
                    ? "4px solid #c084fc"
                    : "4px solid transparent",

                  "&:hover": {
                    bgcolor:
                      "rgba(255, 255, 255, 0.05)",

                    color: "#f8fafc",

                    "& .MuiListItemIcon-root": {
                      color: "#f8fafc",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    width: 40,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",

                    color: isActive
                      ? "#c084fc"
                      : "#94a3b8",

                    transition:
                      "color 0.25s ease",

                    "& svg": {
                      fontSize: 22,
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  sx={{
                    minWidth: 0,
                    m: 0,
                  }}
                  primaryTypographyProps={{
                    noWrap: true,

                    sx: {
                      fontWeight: isActive
                        ? 600
                        : 500,

                      fontSize: "0.93rem",

                      lineHeight: 1.2,

                      overflow: "hidden",

                      textOverflow:
                        "ellipsis",

                      whiteSpace:
                        "nowrap",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider
        sx={{
          bgcolor:
            "rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      />

      {/* ======================================================
          USER
      ====================================================== */}

      {user && (
        <Box
          sx={{
            p: 2,

            display: "flex",

            alignItems: "center",

            gap: 1.5,

            flexShrink: 0,

            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              bgcolor: "#aa3bff",

              width: 42,
              height: 42,

              flexShrink: 0,
            }}
          >
            {user.name
              .charAt(0)
              .toUpperCase()}
          </Avatar>

          <Box
            sx={{
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {user.name}
            </Typography>

            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "#94a3b8",
                display: "block",
              }}
            >
              {user.role}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  // ============================================================
  // MAIN LAYOUT
  // ============================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f8fafc",
      }}
    >
      {/* ======================================================
          TOP APP BAR
      ====================================================== */}

      <AppBar
        position="fixed"
        sx={{
          width: {
            md: `calc(100% - ${drawerWidth}px)`,
          },

          ml: {
            md: `${drawerWidth}px`,
          },

          bgcolor:
            "rgba(255, 255, 255, 0.8)",

          backdropFilter:
            "blur(12px)",

          boxShadow: "none",

          borderBottom:
            "1px solid #e2e8f0",

          zIndex: (theme) =>
            theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            justifyContent:
              "space-between",

            color: "#1e293b",
          }}
        >
          {/* ==================================================
              MOBILE MENU + PAGE TITLE
          ================================================== */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,

                display: {
                  md: "none",
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              sx={{
                color: "#0f172a",
                fontWeight: "bold",
              }}
            >
              {menuItems.find(
                (item) =>
                  location.pathname ===
                    item.path ||
                  location.pathname.startsWith(
                    `${item.path}/`
                  )
              )?.text ||
                "RetailPulse"}
            </Typography>
          </Box>

          {/* ==================================================
              NOTIFICATIONS + USER PROFILE
          ================================================== */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {user && (
              <>
                {/* ==================================================
                    TASK 14 - NOTIFICATION BELL
                ================================================== */}

                <Tooltip title="Notifications">
                  <IconButton
                    onClick={handleOpenNotifMenu}
                    sx={{
                      color: "#475569",
                      mr: 0.5,
                      "&:hover": {
                        bgcolor: "rgba(124, 58, 237, 0.08)",
                        color: "#7c3aed",
                      },
                    }}
                  >
                    <Badge
                      badgeContent={unreadCount}
                      color="error"
                      max={99}
                    >
                      <NotificationsNoneIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* ==================================================
                    NOTIFICATION QUICK DROPDOWN MENU
                ================================================== */}
                <Menu
                  anchorEl={notifAnchorEl}
                  open={Boolean(notifAnchorEl)}
                  onClose={handleCloseNotifMenu}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,
                        width: { xs: 320, sm: 380 },
                        maxHeight: 480,
                        borderRadius: 3,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        Notifications
                      </Typography>
                      {unreadCount > 0 && (
                        <Chip
                          size="small"
                          label={`${unreadCount} new`}
                          color="error"
                          sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                        />
                      )}
                    </Box>
                    {unreadCount > 0 && (
                      <Typography
                        variant="caption"
                        onClick={handleQuickMarkAll}
                        sx={{
                          cursor: "pointer",
                          color: "#7c3aed",
                          fontWeight: 600,
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        Mark all as read
                      </Typography>
                    )}
                  </Box>
                  <Divider />

                  {recentNotifs.length === 0 ? (
                    <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
                      <NotificationsNoneIcon sx={{ color: "#94a3b8", fontSize: 36, mb: 1 }} />
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        No notifications yet.
                      </Typography>
                    </Box>
                  ) : (
                    recentNotifs.map((n) => (
                      <MenuItem
                        key={n.id}
                        onClick={() => handleQuickClickNotif(n)}
                        sx={{
                          py: 1.2,
                          px: 2,
                          whiteSpace: "normal",
                          alignItems: "flex-start",
                          bgcolor: n.isRead ? "transparent" : "rgba(124, 58, 237, 0.04)",
                          borderLeft: n.isRead ? "none" : "3px solid #7c3aed",
                          "&:hover": {
                            bgcolor: "rgba(124, 58, 237, 0.08)",
                          },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                            <Typography sx={{ fontWeight: n.isRead ? 500 : 700, fontSize: "0.85rem", color: "#1e293b" }}>
                              {n.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={n.priority}
                              color={n.priority === "Critical" ? "error" : n.priority === "High" ? "warning" : "default"}
                              sx={{ height: 18, fontSize: 10 }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#64748b",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {n.message}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}

                  <Divider />
                  <Box sx={{ p: 1, textAlign: "center" }}>
                    <Button
                      fullWidth
                      size="small"
                      onClick={() => {
                        handleCloseNotifMenu();
                        navigate("/notifications");
                      }}
                      sx={{ textTransform: "none", fontWeight: 700, color: "#7c3aed" }}
                    >
                      View All in Notification Center
                    </Button>
                  </Box>
                </Menu>

                {/* ==================================================
                    PROFILE
                ================================================== */}

                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleMenuOpen}
                    size="small"
                    sx={{
                      ml: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor:
                          "#aa3bff",

                        width: 36,
                        height: 36,

                        fontSize:
                          "0.95rem",
                      }}
                    >
                      {user.name
                        .charAt(0)
                        .toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,

                        width: 220,

                        borderRadius:
                          "12px",

                        boxShadow:
                          "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      },
                    },
                  }}
                  transformOrigin={{
                    horizontal: "right",
                    vertical: "top",
                  }}
                  anchorOrigin={{
                    horizontal: "right",
                    vertical: "bottom",
                  }}
                >
                  <MenuItem
                    disabled
                    sx={{
                      opacity:
                        "1 !important",

                      py: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection:
                          "column",
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.primary"
                        noWrap
                        sx={{
                          fontWeight:
                            "bold",
                        }}
                      >
                        {user.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>

                  <Divider />

                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      py: 1.25,
                      color: "#ef4444",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color:
                          "#ef4444",
                      }}
                    >
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>

                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ======================================================
          DRAWERS
      ====================================================== */}

      <Box
        component="nav"
        sx={{
          width: {
            md: drawerWidth,
          },

          flexShrink: {
            md: 0,
          },
        }}
        aria-label="main navigation"
      >
        {/* ====================================================
            MOBILE DRAWER
        ==================================================== */}

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            "& .MuiDrawer-paper": {
              boxSizing: "border-box",

              width: drawerWidth,

              border: "none",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* ====================================================
            DESKTOP DRAWER
        ==================================================== */}

        <Drawer
          variant="permanent"
          sx={{
            display: {
              xs: "none",
              md: "block",
            },

            "& .MuiDrawer-paper": {
              boxSizing: "border-box",

              width: drawerWidth,

              border: "none",

              overflow: "hidden",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,

          width: {
            xs: "100%",
            md: `calc(100% - ${drawerWidth}px)`,
          },

          minHeight: "100vh",

          mt: "64px",

          px: {
            xs: 2,
            md: 4,
          },

          py: 3,

          bgcolor: "#f8fafc",

          overflowX: "hidden",

          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",

            maxWidth: "1400px",

            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;