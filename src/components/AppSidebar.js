import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'
import logo from 'src/assets/images/logo.png'
import { sygnet } from 'src/assets/brand/sygnet'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import navigationAdmin from '../_nav'
import navigationUser from '../_navUser'
import { selectUser } from '../redux/authSlice'

const AppSidebar = () => {
  const dispatch = useDispatch()
  
  const sidebarShow = useSelector((state) => state.ui.sidebarShow)
  const unfoldable = useSelector((state) => state.ui.sidebarUnfoldable || false)
  
  const user = useSelector(selectUser)
  const navigate = useNavigate()
  
  // Pilih navigasi berdasarkan role
  const navigation = user?.role === 'admin' ? navigationAdmin : navigationUser
  
  // Fungsi logout
  const handleLogout = async () => {
    try {
      await signOut(auth)
      dispatch({ 
        type: 'set', 
        payload: { sidebarShow: false } 
      })
      navigate('/login')
    } catch (err) {
      console.error('Logout gagal:', err)
    }
  }
  
  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ 
          type: 'set', 
          payload: { sidebarShow: visible } 
        })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <img src={logo} alt="Logo" height={32} className="sidebar-brand-full" />
          <img src={sygnet} alt="Sygnet" height={32} className="sidebar-brand-narrow" />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ 
            type: 'set', 
            payload: { sidebarShow: false } 
          })}
        />
      </CSidebarHeader>
      
      <AppSidebarNav items={navigation} />
      
      <CSidebarFooter className="border-top d-flex justify-content-center align-items-center py-3">
        <button
          type="button"
          className="btn btn-outline-danger btn-sm w-75"
          onClick={handleLogout}
        >
          Logout
        </button>
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)