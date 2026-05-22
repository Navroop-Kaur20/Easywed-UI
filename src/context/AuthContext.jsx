"use client"

import { createContext, useState, useContext, useEffect } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

const normalizeIndianPhone = (value) => {
  if (!value) return value
  const digits = value.replace(/\D/g, "")
  if (!digits) return value.trim()
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`
  if (value.trim().startsWith("+")) return `+${digits}`
  return value.trim()
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true,
  })

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true)
      try {
        let authChecked = false;
        
        // First try the vendor endpoint since we're focusing on vendor implementation
        try {
          const vendorResponse = await api.get("/vendor/check-auth")
          if (vendorResponse.data.user) {
            setUser(vendorResponse.data.user)
            authChecked = true;
          }
        } catch (vendorError) {
          // Vendor check failed, continue to other checks
        }
        
        // Then try user endpoint if vendor check failed
        if (!authChecked) {
          try {
            const userResponse = await api.get("/users/check-auth")
            if (userResponse.data.user) {
              setUser(userResponse.data.user)
              authChecked = true;
            }
          } catch (userError) {
            // User check failed, continue
          }
        }
        
        // Finally try admin endpoint
        if (!authChecked) {
          try {
            const adminResponse = await api.get("/admins/check-auth")
            if (adminResponse.data.user) {
              setUser(adminResponse.data.user)
              authChecked = true;
            }
          } catch (adminError) {
            // Admin check failed
          }
        }
        
        // If no auth was successful, ensure user is null
        if (!authChecked) {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error)
        // Don't clear user here to prevent unnecessary redirects
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const signIn = async (phone, password) => {
    if (!phone || !password) {
      toast.error("Input Error: Phone and password are required", { toastId: "signInInput" })
      return false
    }
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(phone)
      const res = await api.post("/users/sign-in", { phone: normalizedPhone, password })
      setUser(res.data.user)

      if (res.data.user.role === "vendor") {
        navigate("/vendor/dashboard", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }

      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign-in failed", { toastId: "signIn" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (full_name, phone, password) => {
    if (!full_name || !phone || !password) {
      toast.error("Input Error: Full name, phone, and password are required", { toastId: "signUpInput" })
      return false
    }
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(phone)
      const res = await api.post("/users/sign-up", { full_name, phone: normalizedPhone, password })
      setUser(res.data.user)
      navigate("/dashboard", { replace: true })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign-up failed", { toastId: "signUp" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const adminLogin = async (identifier, password) => {
    if (!identifier || !password) {
      toast.error("Input Error: Username/phone and password are required", { toastId: "adminLoginInput" })
      return false
    }
    setLoading(true)
    try {
      const res = await api.post("/admins/login", { identifier, password })
      setUser({ ...res.data.admin, role: res.data.admin.role })
      navigate("/admin/dashboard", { replace: true })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "Admin login failed", { toastId: "adminLogin" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const requestAdminOtp = async (phone) => {
    if (!phone) {
      toast.error("Input Error: Phone is required", { toastId: "adminOtpInput" })
      return false
    }
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(phone)
      await api.post("/admins/request-otp", { phone: normalizedPhone })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP request failed", { toastId: "adminOtpRequest" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifyAdminOtp = async (phone, otp) => {
    if (!otp) {
      toast.error("Input Error: OTP is required", { toastId: "adminOtpVerifyInput" })
      return false
    }
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(phone)
      await api.post("/admins/verify-otp", { phone: normalizedPhone, otp })
      navigate("/admin/reset-password", { replace: true })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed", { toastId: "adminOtpVerify" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetAdminPassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Input Error: Password must be at least 8 characters", { toastId: "adminResetInput" })
      return false
    }
    setLoading(true)
    try {
      await api.patch("/admins/reset-password", { newPassword })
      toast.success("Password reset successfully", { toastId: "adminResetSuccess" })
      setTimeout(() => navigate("/admin/login", { replace: true }), 1000)
      return true
    } catch (err) {
      console.error("Reset password error:", err.response?.data || err)
      toast.error(err.response?.data?.message || "Password reset failed", { toastId: "adminReset" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const checkResetToken = async () => {
    try {
      await api.get("/admins/check-reset-token")
      return true
    } catch (err) {
      console.error("Check reset token error:", err.response?.data || err)
      return false
    }
  }

  const vendorLogin = async (identifier, password) => {
    if (!identifier || !password) {
      toast.error("Input Error: Username/phone and password are required", { toastId: "vendorLoginInput" })
      return false
    }
    setLoading(true)
    try {
      const res = await api.post("/vendor/login", { identifier, password })
      setUser({ ...res.data.user, role: "vendor" })
      navigate("/vendor/dashboard", { replace: true })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "Vendor login failed", { toastId: "vendorLogin" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const requestVendorOtp = async (phone) => {
    if (!phone) {
      toast.error("Input Error: Phone is required", { toastId: "vendorOtpInput" })
      return false
    }
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(phone)
      await api.post("/vendor/request-otp", { phone: normalizedPhone })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP request failed", { toastId: "vendorOtpRequest" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifyVendorOtp = async (phone, otp) => {
    if (!otp) {
      toast.error("Input Error: OTP is required", { toastId: "vendorOtpVerifyInput" })
      return false
    }
    setLoading(true)
    try {
      const normalizedPhone = normalizeIndianPhone(phone)
      await api.post("/vendor/verify-otp", { phone: normalizedPhone, otp })
      navigate("/vendor/reset-password", { replace: true })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed", { toastId: "vendorOtpVerify" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetVendorPassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Input Error: Password must be at least 8 characters", { toastId: "vendorResetInput" })
      return false
    }
    setLoading(true)
    try {
      await api.patch("/vendor/reset-password", { newPassword })
      toast.success("Password reset successfully", { toastId: "vendorResetSuccess" })
      setTimeout(() => navigate("/vendor/login", { replace: true }), 1000)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed", { toastId: "vendorReset" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const checkVendorResetToken = async () => {
    try {
      await api.get("/vendor/check-reset-token")
      return true
    } catch (err) {
      console.error("Check vendor reset token error:", err.response?.data || err)
      return false
    }
  }

  const registerVendor = async ({ phone, password, brand_icon, vendorRequest, otp }) => {
    setLoading(true)
    try {
      const formData = new FormData()
      const normalizedPhone = normalizeIndianPhone(phone)
      formData.append("phone", normalizedPhone)
      formData.append("password", password)
      formData.append("brand_icon", brand_icon)
      Object.keys(vendorRequest).forEach((key) => {
        formData.append(`vendorRequest[${key}]`, vendorRequest[key])
      })
      if (otp) formData.append("otp", otp)

      const endpoint = otp ? "/users/verify-vendor-otp" : "/users/register-vendor"
      await api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } })
      if (otp) {
        toast.success("Vendor request submitted successfully, awaiting approval")
        navigate("/vendor/under-review", { state: { submissionSuccess: true }, replace: true })
      }
      return true
    } catch (err) {
      console.error("Vendor registration error:", err.response?.data || err)
      toast.error(err.response?.data?.message || "Vendor registration failed", { toastId: "vendorRegister" })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await api.post("/auth/logout")
      setUser(null)
      toast.success("Logged out successfully")
      navigate("/", { replace: true })
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || "Logout failed", { toastId: "logout" })
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoading,
        signIn,
        signUp,
        adminLogin,
        requestAdminOtp,
        verifyAdminOtp,
        resetAdminPassword,
        checkResetToken,
        vendorLogin,
        requestVendorOtp,
        verifyVendorOtp,
        resetVendorPassword,
        checkVendorResetToken,
        registerVendor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

