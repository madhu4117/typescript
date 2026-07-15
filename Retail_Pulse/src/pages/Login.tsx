import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../sevices/api"

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", data);

      // Store JWT Token
      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      // Store User Details
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      alert("Login Successful!");

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#1976d2,#42a5f5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 5,
            borderRadius: 4,
          }}
        >
          <Box textAlign="center">
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mx: "auto",
                mb: 2,
                width: 60,
                height: 60,
              }}
            >
              <LockOutlined />
            </Avatar>

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              RetailPulse
            </Typography>

            <Typography
              color="text.secondary"
              mb={4}
            >
              Sign in to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value:
                    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Enter a valid email",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type={
                showPassword ? "text" : "password"
              }
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message:
                    "Minimum 8 characters required",
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                    >
                      {showPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: 16,
              }}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </Button>
          </form>

          <Typography
            align="center"
            color="text.secondary"
            mt={4}
            variant="body2"
          >
            © 2026 RetailPulse Analytics
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;