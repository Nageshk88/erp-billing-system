import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useUiStore from '../../store/uiStore'

export default function Header() {
  const { user, logout, isAdmin } = useAuthStore()
  const { toggleSidebar } = useUiStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-500">
          {isAdmin() ? (
            <span className="badge badge-purple">Admin</span>
          ) : (
            <span className="badge badge-blue">Staff</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 relative">
          <BellIcon className="w-5 h-5" />
        </button>

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
            <UserCircleIcon className="w-6 h-6 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </Menu.Button>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <Menu.Item>
                {({ active }) => (
                  <button onClick={handleLogout} className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-50 text-red-600' : 'text-gray-700'}`}>
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  )
}
