import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { apiRequest } from '../utils/api'
import { saveCategories, saveOrders, saveProducts, saveUsers } from '../utils/storage'

const BackendDataContext = createContext({ revision: 0 })

export function BackendDataProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const userRole = user?.role
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      saveOrders([])
      saveUsers([])
      const requests = [
        apiRequest('/categories').then(saveCategories),
        apiRequest('/products').then(saveProducts),
      ]
      if (userId) requests.push(apiRequest('/orders').then(saveOrders))
      if (userRole === 'admin') requests.push(apiRequest('/users').then(saveUsers))
      await Promise.allSettled(requests)
      if (active) setRevision((value) => value + 1)
    }
    load()
    return () => { active = false }
  }, [userId, userRole])

  return <BackendDataContext.Provider value={{ revision }}>{children}</BackendDataContext.Provider>
}

export const useBackendData = () => useContext(BackendDataContext)