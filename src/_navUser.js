import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilArrowThickFromBottom,
  cilArrowThickToBottom,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _navUser = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/user/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavTitle,
    name: 'Data Barang',
  },
  {
    component: CNavItem,
    name: 'Barang Masuk',
    to: '/user/barang-masuk',
    icon: <CIcon icon={cilArrowThickFromBottom} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Barang Keluar',
    to: '/user/barang-keluar',
    icon: <CIcon icon={cilArrowThickToBottom} customClassName="nav-icon" />,
  },
]

export default _navUser