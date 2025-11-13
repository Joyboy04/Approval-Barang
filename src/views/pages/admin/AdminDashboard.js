import React, { useEffect, useState } from 'react'
import { db, getDocs, collection } from '../../../firebase'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CWidgetStatsF,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilArrowTop,
  cilArrowBottom,
  cilCheckAlt,
  cilX,
  cilClock,
} from '@coreui/icons'
import { CChartDoughnut, CChartLine, CChartBar } from '@coreui/react-chartjs'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBarangMasuk: 0,
    totalBarangKeluar: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [barangMasukData, setBarangMasukData] = useState([])
  const [barangKeluarData, setBarangKeluarData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch Users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnapshot.size

      // Fetch Barang Masuk
      const barangMasukSnapshot = await getDocs(collection(db, 'barang-masuk'))
      const barangMasukList = barangMasukSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      const totalBarangMasuk = barangMasukSnapshot.size

      // Fetch Barang Keluar
      const barangKeluarSnapshot = await getDocs(collection(db, 'barang-keluar'))
      const barangKeluarList = barangKeluarSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      const totalBarangKeluar = barangKeluarSnapshot.size

      // Count by status
      const pendingCount = barangKeluarList.filter(item => item.status === 'pending').length
      const approvedCount = barangKeluarList.filter(item => item.status === 'approved').length
      const rejectedCount = barangKeluarList.filter(item => item.status === 'rejected').length

      setStats({
        totalUsers,
        totalBarangMasuk,
        totalBarangKeluar,
        pendingCount,
        approvedCount,
        rejectedCount,
      })

      setBarangMasukData(barangMasukList)
      setBarangKeluarData(barangKeluarList)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <CRow className="mb-4">
        <CCol>
          <h2 className="mb-0">Dashboard Overview</h2>
          <p className="text-muted">Welcome to Admin Dashboard</p>
        </CCol>
      </CRow>

      {/* Stats Cards - Row 1 */}
      <CRow xs={{ gutter: 4 }} className="mb-4">
        <CCol xs={12} sm={6} xl={4}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilPeople} size="xl" />}
            title="Total Users"
            value={stats.totalUsers.toString()}
            color="primary"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={4}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilArrowTop} size="xl" />}
            title="Barang Masuk"
            value={stats.totalBarangMasuk.toString()}
            color="success"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={4}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilArrowBottom} size="xl" />}
            title="Barang Keluar"
            value={stats.totalBarangKeluar.toString()}
            color="danger"
          />
        </CCol>
      </CRow>

      {/* Status Cards - Row 2 */}
      <CRow xs={{ gutter: 4 }} className="mb-4">
        <CCol xs={12} sm={6} xl={4}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilClock} size="xl" />}
            title="Pending Requests"
            value={stats.pendingCount.toString()}
            color="warning"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={4}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilCheckAlt} size="xl" />}
            title="Approved"
            value={stats.approvedCount.toString()}
            color="success"
          />
        </CCol>
        <CCol xs={12} sm={6} xl={4}>
          <CWidgetStatsF
            icon={<CIcon width={24} icon={cilX} size="xl" />}
            title="Rejected"
            value={stats.rejectedCount.toString()}
            color="danger"
          />
        </CCol>
      </CRow>

      {/* Charts Row */}
      <CRow xs={{ gutter: 4 }}>
        {/* Pie Chart - Status Distribution */}
        <CCol xs={12} md={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Request Status Distribution</strong>
            </CCardHeader>
            <CCardBody>
              <CChartDoughnut
                data={{
                  labels: ['Pending', 'Approved', 'Rejected'],
                  datasets: [
                    {
                      backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
                      data: [stats.pendingCount, stats.approvedCount, stats.rejectedCount],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </CCardBody>
          </CCard>
        </CCol>

        {/* Bar Chart - Barang Masuk vs Keluar */}
        <CCol xs={12} md={6}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Inventory Overview</strong>
            </CCardHeader>
            <CCardBody>
              <CChartBar
                data={{
                  labels: ['Barang Masuk', 'Barang Keluar', 'Pending', 'Approved', 'Rejected'],
                  datasets: [
                    {
                      label: 'Count',
                      backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#28a745', '#dc3545'],
                      data: [
                        stats.totalBarangMasuk,
                        stats.totalBarangKeluar,
                        stats.pendingCount,
                        stats.approvedCount,
                        stats.rejectedCount,
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </CCardBody>
          </CCard>
        </CCol>

        {/* Line Chart - Top Items */}
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Stock Levels - Top 5 Items</strong>
            </CCardHeader>
            <CCardBody>
              <CChartLine
                data={{
                  labels: barangMasukData.slice(0, 5).map(item => item.name || 'Unknown'),
                  datasets: [
                    {
                      label: 'Quantity',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                      pointBorderColor: '#fff',
                      data: barangMasukData.slice(0, 5).map(item => item.quantity || 0),
                      fill: true,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default AdminDashboard