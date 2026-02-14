import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('EMP-001');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(employeeId, pin);
      navigate('/');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePinClick = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>POS System</h1>
          <p>Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="employee-input"
              placeholder="Enter Employee ID"
            />
          </div>

          <div className="pin-display">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                className="pin-button"
                onClick={() => handlePinClick(num.toString())}
              >
                {num}
              </button>
            ))}
            <button type="button" className="pin-button clear" onClick={handleClear}>
              Clear
            </button>
            <button
              type="button"
              className="pin-button"
              onClick={() => handlePinClick('0')}
            >
              0
            </button>
            <button
              type="submit"
              className="pin-button enter"
              disabled={pin.length === 0 || loading}
            >
              {loading ? '...' : 'Enter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
