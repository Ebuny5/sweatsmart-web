// src/components/auth/GoogleAuthSetup.tsx
import React, { useEffect, useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthApiService } from '../../services/AuthApiService';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

interface DecodedJwt {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Replaced with env variable

const GoogleAuthSetup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [authService] = useState(() => new AuthApiService());

  useEffect(() => {
    // Attempt to log in silently if a token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedJwt>(token);
        if (decodedToken.email && decodedToken.name) {
          login(decodedToken.email, decodedToken.name, decodedToken.picture || '', token);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to decode existing token:', error);
        localStorage.removeItem('token'); // Invalidate bad token
      }
    }
  }, [login, navigate]);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        const decoded = jwtDecode<DecodedJwt>(credentialResponse.credential);
        const user = {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          googleId: decoded.sub, // 'sub' is Google's unique user ID
        };

        const response = await authService.googleLogin(credentialResponse.credential);

        if (response.token && response.user) {
          localStorage.setItem('token', response.token);
          login(response.user.email, response.user.name, response.user.picture, response.token);
          toast.success('Login successful!');
          navigate('/dashboard');
        } else {
          toast.error('Google login failed: No token received.');
          console.error('Google login failed: No token received.', response);
        }
      } catch (error) {
        toast.error('Google login failed.');
        console.error('Google login error:', error);
      }
    }
  }

  const handleError = () => {
    toast.error('Google login failed.');
    console.error('Google Login Failed');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login with Google</h2>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
          />
        </GoogleOAuthProvider>
      </div>
    </div>
  );
};

export default GoogleAuthSetup;