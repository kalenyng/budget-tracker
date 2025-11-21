import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home since settings is now a modal
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}

