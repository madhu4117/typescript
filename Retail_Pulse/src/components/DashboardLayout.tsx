import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Inventory as ProductIcon,
  History as HistoryIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const drawerWidth = 260;

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    if (!storedUser || !token) {
      navigate("/");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Categories", icon: <CategoryIcon />, path: "/categories" },
    { text: "Products", icon: <ProductIcon />, path: "/products" },
    { text: "Audit Logs", icon: <HistoryIcon />, path: "/audit-logs" },
  ];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#1e293b", color: "#f8fafc" }}>
      <Toolbar sx={{ justifyContent: "center", py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #aa3bff, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(168, 85, 247, 0.4)",
            }}
          >
            <Typography variant="h6" sx={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
              R
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ letterSpacing: 0.5, color: "#fff", fontWeight: "bold" }}>
            RetailPulse
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: "12px",
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive ? "rgba(168, 85, 247, 0.15)" : "transparent",
                  color: isActive ? "#c084fc" : "#94a3b8",
                  transition: "all 0.3s ease",
                  borderLeft: isActive ? "4px solid #c084fc" : "4px solid transparent",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    color: "#f8fafc",
                    "& .MuiListItemIcon-root": {
                      color: "#f8fafc",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#c084fc" : "#94a3b8",
                    minWidth: 40,
                    transition: "color 0.3s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: isActive ? 600 : 500, fontSize: "0.95rem" }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
      {user && (
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#aa3bff", width: 44, height: 44 }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="body2" noWrap sx={{ color: "#fff", fontWeight: "bold" }}>
              {user.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: "#94a3b8", sx: { display: "block" } }}>
              {user.role}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          boxShadow: "none",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", color: "#1e293b" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: "bold" }}>
              {menuItems.find((item) => item.path === location.pathname)?.text || "RetailPulse"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {user && (
              <>
                <Tooltip title="Account settings">
                  <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
                    <Avatar sx={{ bgcolor: "#aa3bff", width: 36, height: 36, fontSize: "0.95rem" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,
                        width: 220,
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem disabled sx={{ opacity: "1 !important", py: 1.5 }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: "bold" }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: "#ef4444" }}>
                    <ListItemIcon sx={{ color: "#ef4444" }}>
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

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, border: "none" },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, border: "none" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          mt: "64px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
