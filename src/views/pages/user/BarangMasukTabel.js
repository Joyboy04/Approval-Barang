import React, { useEffect, useState } from 'react';
import { db, getDocs, collection, doc, getDoc, deleteDoc, updateDoc } from '../../../firebase';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CRow, CCol } from '@coreui/react';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { getAuth } from 'firebase/auth';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilTrash, cilReload, cilArrowTop } from '@coreui/icons';

const BarangMasukTabel = () => {
  const [barangMasukData, setBarangMasukData] = useState([]);
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
            console.log('Fetching from barang-masuk collection...');
            const querySnapshot = await getDocs(collection(db, 'barang-masuk'));
            console.log('Data received:', querySnapshot.docs);
            
            const data = querySnapshot.docs.map((docSnapshot) => {
              const docData = docSnapshot.data();
              
              return {
                id: docSnapshot.id,
                name: docData.name || '',
                quantity: docData.quantity || 0,
                description: docData.description || '',
                image: docData.image || '',
                status: docData.status || 'pending',
                createdAt: docData.createdAt || '',
                approvedBy: docData.approvedBy || '',
                approvedAt: docData.approvedAt || '',
              };
            });
            
            console.log('Cleaned data:', data);
            setBarangMasukData(data);
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

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      case 'pending':
      default:
        return <span className="badge bg-warning text-dark">Pending</span>;
    }
  };

  const columns = [
    {
      name: 'Name',
      selector: (row) => row.name,
      sortable: true,
      width: '20%',
    },
    {
      name: 'Quantity',
      selector: (row) => row.quantity,
      sortable: true,
      width: '20%',
      cell: (row) => (
        <span className="badge bg-info">{row.quantity}</span>
      ),
    },
    {
      name: 'Description',
      selector: (row) => row.description,
      sortable: true,
      width: '20%',
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      sortable: true,
      width: '20%',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: 'Image',
      cell: (row) => (
        <div>
          {row.image ? (
            <img 
              src={row.image} 
              alt={row.name} 
              height="50" 
              className="rounded"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                Swal.fire({
                  title: row.name,
                  imageUrl: row.image,
                  imageWidth: 400,
                  imageHeight: 300,
                  imageAlt: row.name,
                  confirmButtonText: 'Close',
                });
              }}
            />
          ) : (
            <span className="text-muted small">No image</span>
          )}
        </div>
      ),
      width: '20%',
    },
  ];

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentData = barangMasukData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-primary text-white">
        <CRow className="align-items-center">
          <CCol xs="auto">
            <h5 className="mb-0">
              <CIcon icon={cilArrowTop} className="me-2" />
              Barang Masuk ({barangMasukData.length})
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
              <CSpinner color="primary" />
              <p className="mt-3 text-muted">Loading data...</p>
            </div>
          </div>
        ) : barangMasukData.length > 0 ? (
          <DataTable
            columns={columns}
            data={currentData}
            pagination
            paginationServer
            paginationPerPage={rowsPerPage}
            paginationTotalRows={barangMasukData.length}
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
            <p className="text-muted small">Start by adding a new item.</p>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default BarangMasukTabel;