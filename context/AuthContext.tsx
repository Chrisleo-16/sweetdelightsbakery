"use client"
import { createContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const AuthContext =  createContext<AuthContextType>({
    token: null,
    setToken: () => {},
    logout: () => {},
});
export const AuthProvider = ({children}:{children: ReactNode}) =>{
    const [token, setTokenState] = useState<string | null>(null);

    useEffect(()=> {
        const t = localStorage.getItem('access_token');
        if (t) setTokenState(t);
    },[]);

    const setToken = ( t:string | null) => {
        if (t){
            localStorage.setItem('access_token', t);
            setTokenState(t);
        } else{
            localStorage.removeItem('access_token');
            setTokenState(null);
        }
    };

    const logout = () => {
        setToken(null);
    };

    return(
        <AuthContext.Provider value={{token, setToken, logout}}>
            {children}
        </AuthContext.Provider>
    )
}