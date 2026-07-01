import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { fetchWithTimeout } from '../lib/timeout'

export interface Profile {
  id: string
  full_name: string
  monthly_budget: number
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem('sb-vonqbibvkxmetyvzcqeo-auth-token')
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

const storedSession = getStoredSession()

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(storedSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(storedSession)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const fetchProfile = async (userId: string) => {
    console.time('fetchProfile')
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single(),
        10000,
        'fetchProfile'
      )

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('Profil tenant tidak ditemukan di tabel database.')
          setProfile(null)
        } else {
          console.error('Gagal mengambil data profil:', error.message)
        }
      } else {
        setProfile(data as Profile)
      }
    } catch (err) {
      console.error('Error saat mengambil data profil:', err)
      setProfile(null)
    } finally {
      console.timeEnd('fetchProfile')
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  useEffect(() => {
    console.time('authInit')
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      console.timeEnd('authInit')
    }).catch(() => { console.timeEnd('authInit') })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => { subscription.unsubscribe() }
  }, [])

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return context
}
