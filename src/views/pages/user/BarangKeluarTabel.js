import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, getDoc, deleteDoc, updateDoc } from '../../../firebase';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol } from '@coreui/react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { getAuth } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilArrowBottom, cilTrash, cilReload, cilCheckAlt } from '@coreui/icons';

const BarangKeluarTabel = () => {
  const [barangKeluarData, setBarangKeluarData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchData = async () => {
    if (user) {
      try {
        setLoading(true);
        setError(null);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.role === 'user') {
            console.log('Fetching from barang-keluar collection...');
            const querySnapshot = await getDocs(collection(db, 'barang-keluar'));
            console.log('Data received:', querySnapshot.docs);
            
            const data = querySnapshot.docs.map((docSnapshot) => {
              const docData = docSnapshot.data();
              
              return {
                id: docSnapshot.id,
                itemName: docData.itemName || '',
                quantity: docData.quantity || 0,
                notes: docData.notes || '',
                status: docData.status || 'pending',
                createdBy: docData.createdBy || '',
                createdAt: docData.createdAt || '',
              };
            });
            
            console.log('Cleaned data:', data);
            setBarangKeluarData(data);
          } else {
            setError('You do not have permission to view this data.');
          }
        } else {
          setError('User role not found.');
        }
      } catch (err) {
        console.error('Detailed error:', err);
        setError('Error fetching data: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError('You need to be logged in to access this data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="badge bg-success">{status}</span>;
      case 'rejected':
        return <span className="badge bg-danger">{status}</span>;
      case 'pending':
      default:
        return <span className="badge bg-warning text-dark">{status}</span>;
    }
  };

  const columns = [
    {
      name: 'Item Name',
      selector: (row) => row.itemName,
      sortable: true,
      width: '20%',
    },
    {
      name: 'Quantity',
      selector: (row) => row.quantity,
      sortable: true,
      width: '20%',
      cell: (row) => (
        <span className="badge bg-danger">{row.quantity}</span>
      ),
    },
    {
      name: 'Notes',
      selector: (row) => row.notes,
      sortable: true,
      width: '22%',
      cell: (row) => (
        <span className="small">{row.notes}</span>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      sortable: true,
      width: '20%',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: 'Date',
      selector: (row) => new Date(row.createdAt).toLocaleDateString('id-ID'),
      sortable: true,
      width: '15%',
      cell: (row) => (
        <span className="small text-muted">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID') : '-'}
        </span>
      ),
    },
  ];

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentData = barangKeluarData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-danger text-white">
        <CRow className="align-items-center">
          <CCol xs="auto">
            <h5 className="mb-0">
              <CIcon icon={cilArrowBottom} className="me-2" />
              Barang Keluar ({barangKeluarData.length})
            </h5>
          </CCol>
          <CCol className="text-end">
            <CButton
              color="light"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="d-flex align-items-center gap-2 ms-auto"
            >
              <CIcon icon={cilReload} />
              Refresh
            </CButton>
          </CCol>
        </CRow>
      </CCardHeader>
      <CCardBody>
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error!</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <CSpinner color="danger" />
              <p className="mt-3 text-muted">Loading data...</p>
            </div>
          </div>
        ) : barangKeluarData.length > 0 ? (
          <DataTable
            columns={columns}
            data={currentData}
            pagination
            paginationServer
            paginationPerPage={rowsPerPage}
            paginationTotalRows={barangKeluarData.length}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            responsive
            highlightOnHover
            striped
            dense
            customStyles={{
              headCells: {
                style: {
                  backgroundColor: '#f8f9fa',
                  fontWeight: 'bold',
                  color: '#333',
                },
              },
            }}
          />
        ) : (
          <div className="text-center py-5">
            <h6 className="text-muted">No records to display</h6>
            <p className="text-muted small">No barang keluar requests yet.</p>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default BarangKeluarTabel;