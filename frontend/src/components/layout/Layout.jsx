import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import CrmDrawer from '../crm/CrmDrawer'
import useUiStore from '../../store/uiStore'

export default function Layout() {
  const { sidebarOpen, crmDrawerOpen } = useUiStore()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${crmDrawerOpen ? 'mr-96' : ''}`}>
          <Outlet />
        </main>
      </div>
      <CrmDrawer />
    </div>
  )
}
