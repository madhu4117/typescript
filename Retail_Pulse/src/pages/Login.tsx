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
import api from "../services/api";

interface AuthFormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

const Login = () => {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        if (data.password !== data.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        await api.post("/auth/register", {
          name: data.name,
          email: data.email,
          password: data.password,
        });

        alert("Registration Successful");
        reset();
        setIsRegister(false);
      } else {
        const response = await api.post("/auth/login", {
          email: data.email,
          password: data.password,
        });

        // Store JWT Token
        localStorage.setItem(
          "token",
          response.data.access_token
        );

        // Store User Details
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        // Redirect
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Something went wrong"
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
      <Container maxWidth="md">
        <Paper
          elevation={10}
          sx={{
            width: 520,
            mx: "auto",
            p: 5,
            borderRadius: 4,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 70,
                height: 70,
                mx: "auto",
                mb: 2,
              }}
            >
              <LockOutlined fontSize="large" />
            </Avatar>

            <Typography variant="h3" fontWeight="bold">
              RetailPulse
            </Typography>

            <Typography sx={{ color: "text.secondary", mb: 3 }}>
              {isRegister
                ? "Create your account"
                : "Sign in to continue"}
            </Typography>
          </Box>

          <Box display="flex" gap={2} mb={3}>
            <Button
              fullWidth
              variant={!isRegister ? "contained" : "outlined"}
              onClick={() => {
                setIsRegister(false);
                reset();
                setError("");
              }}
            >
              LOGIN
            </Button>

            <Button
              fullWidth
              variant={isRegister ? "contained" : "outlined"}
              onClick={() => {
                setIsRegister(true);
                reset();
                setError("");
              }}
            >
              REGISTER
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {isRegister && (
              <TextField
                fullWidth
                label="Full Name"
                margin="normal"
                {...register("name", {
                  required: "Name is required",
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}

            <TextField
              fullWidth
              label="Email"
              margin="normal"
              {...register("email", {
                required: "Email is required",
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              label="Password"
              margin="normal"
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword(!showPassword)
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
                },
              }}
            />

            {isRegister && (
              <TextField
                fullWidth
                label="Confirm Password"
                margin="normal"
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Confirm Password is required",
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            )}

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                fontWeight: "bold",
              }}
            >
              {loading
                ? isRegister
                  ? "Registering..."
                  : "Logging in..."
                : isRegister
                ? "Register"
                : "Login"}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;