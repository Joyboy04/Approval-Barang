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
          
          if (userData.role === 'admin') {
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

  // Handle Approve
  const handleApprove = async (id) => {
    Swal.fire({
      title: 'Approve this item?',
      text: 'The item will be marked as approved and added to inventory.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'No, cancel',
      confirmButtonColor: '#28a745',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const docRef = doc(db, 'barang-masuk', id);
          await updateDoc(docRef, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'AdminUser',
          });
          
          setBarangMasukData(barangMasukData.map(item => 
            item.id === id ? { 
              ...item, 
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: 'AdminUser',
            } : item
          ));
          
          Swal.fire('Approved!', 'Item has been approved successfully.', 'success');
          console.log('Item approved:', id);
        } catch (err) {
          console.error('Error approving item:', err);
          Swal.fire('Error!', 'Failed to approve item: ' + err.message, 'error');
        }
      }
    });
  };

  // Handle Reject
  const handleReject = async (id) => {
    Swal.fire({
      title: 'Reject this item?',
      text: 'The item will be marked as rejected.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No, cancel',
      confirmButtonColor: '#dc3545',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const docRef = doc(db, 'barang-masuk', id);
          await updateDoc(docRef, {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'Joyboy04',
          });
          
          setBarangMasukData(barangMasukData.map(item => 
            item.id === id ? { ...item, status: 'rejected' } : item
          ));
          
          Swal.fire('Rejected!', 'Item has been rejected.', 'success');
          console.log('Item rejected:', id);
        } catch (err) {
          console.error('Error rejecting item:', err);
          Swal.fire('Error!', 'Failed to reject item: ' + err.message, 'error');
        }
      }
    });
  };

  // Handle Delete
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This item will be deleted permanently and cannot be recovered.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'barang-masuk', id));
          setBarangMasukData(barangMasukData.filter(item => item.id !== id));
          Swal.fire('Deleted!', 'Item has been successfully deleted.', 'success');
          console.log('Item deleted:', id);
        } catch (err) {
          console.error('Error deleting item:', err);
          Swal.fire('Error!', 'Failed to delete item: ' + err.message, 'error');
        }
      }
    });
  };

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
      width: '16%',
    },
    {
      name: 'Quantity',
      selector: (row) => row.quantity,
      sortable: true,
      width: '10%',
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
      width: '12%',
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
      width: '12%',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="d-flex gap-2 flex-wrap">
          {row.status === 'pending' && (
            <>
              <CButton 
                color="success" 
                size="sm"
                onClick={() => handleApprove(row.id)}
                title="Approve"
                className="d-flex align-items-center gap-1"
              >
                <CIcon icon={cilCheckAlt} size="sm" />
                Approve
              </CButton>
              <CButton 
                color="warning" 
                size="sm"
                onClick={() => handleReject(row.id)}
                title="Reject"
              >
                Reject
              </CButton>
            </>
          )}
          <CButton 
            color="danger" 
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="d-flex align-items-center gap-1"
          >
            <CIcon icon={cilTrash} size="sm" />
            Delete
          </CButton>
        </div>
      ),
      width: '20%',
      wrap: true,
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