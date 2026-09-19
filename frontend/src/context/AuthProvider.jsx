import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [userCode, setUserCode] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      setEmail(res.data.email);
      setName(res.data.username);
      setUserCode(res.data.user_code);
    } catch {
      setEmail(null);
      setName(null);
      setUserCode(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        email,
        name,
        userCode,
        loading,
        setEmail,
        setName,
        setUserCode,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
