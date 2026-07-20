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
import api from "../sevices/api";

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

        localStorage.setItem(
          "access_token",
          response.data.access_token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        navigate("/dashboard");
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

            <Typography variant="h3" sx={{ fontWeight: "bold" }}>
              RetailPulse
            </Typography>

            <Typography sx={{ color: "text.secondary", mb: 3 }}>
              {isRegister
                ? "Create your account"
                : "Sign in to continue"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
            }}
          >
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
              label="Password"
              margin="normal"
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters required",
                },
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
                  required:
                    "Confirm Password is required",
                  validate: (value, formValues) =>
                    value === formValues.password ||
                    "Passwords do not match",
                })}
                error={!!errors.confirmPassword}
                helperText={
                  errors.confirmPassword?.message
                }
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
                borderRadius: 2,
                fontWeight: "bold",
                fontSize: 16,
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
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}

              <Button
                size="small"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                  reset();
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  ml: 1,
                }}
              >
                {isRegister ? "Login" : "Register"}
              </Button>
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ textAlign: "center", mt: 3 }}
          >
            © 2026 RetailPulse Analytics
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;