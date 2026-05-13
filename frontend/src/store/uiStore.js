import { create } from 'zustand'

const useUiStore = create((set) => ({
  sidebarOpen: true,
  crmDrawerOpen: false,
  crmCustomerId: null,

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  openCrmDrawer: (customerId) => set({ crmDrawerOpen: true, crmCustomerId: customerId }),
  closeCrmDrawer: () => set({ crmDrawerOpen: false, crmCustomerId: null }),
}))

export default useUiStore
