import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('admin@erp.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-black text-primary-600">ERP</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ERP Billing System</h1>
          <p className="text-primary-300 mt-1">Trading Business Suite</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email address</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <p><span className="font-medium">Admin:</span> admin@erp.com / admin123</p>
            <p><span className="font-medium">Staff:</span> staff@erp.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
