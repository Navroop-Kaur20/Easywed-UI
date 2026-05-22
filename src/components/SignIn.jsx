
"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "react-bootstrap"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import inFlag from "../assets/images/in-flag.svg"
import onboardingImg from "../assets/images/onboarding.png"
import "../styles/admin-auth.css"

const SignIn = () => {
  const [phone, setPhone] = useState("+91")
  const [password, setPassword] = useState("")
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    await signIn(phone, password)
  }

  return (
    <>
      <div className="main-container">
        <div className="logo-onbaording" style={{ backgroundImage: `url(${onboardingImg})` }}>
          <h1 className="logo">EazyWed</h1>
        </div>
        <div className="sign-in-form col-6">
          <h4>Welcome to EazyWed</h4>
          <form id="signin-form" onSubmit={handlePhoneSubmit}>
            <h5>Login</h5>
            <label htmlFor="phone">Contact Number *</label>
            <div className="phone-area">
              <img src={inFlag || "/placeholder.svg"} alt="India Flag" />
              <input
                type="text"
                name="phone"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <label htmlFor="password">Password *</label>
            <div className="name-area">
              <input
                type="password"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="redirect-to-sign-up pt-3">
              <Link to="/signup">Want to register?</Link>
            </div>
            <div className="back-forth-buttons">
              <div className="back-button">
                <Button type="button" onClick={() => navigate("/")}>
                  Back
                </Button>
              </div>
              <div className="submit--continue-button">
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  )
}

export default SignIn