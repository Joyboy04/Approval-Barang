import React from 'react';
import BarangKeluarForm from './BarangKeluarForm';
import BarangKeluarTabel from './BarangKeluarTabel';

const BarangKeluar = () => {
  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Form Section */}
      <div className="mb-4">
        <BarangKeluarForm />
      </div>
      
      {/* Table Section */}
      <div>
        <BarangKeluarTabel />
      </div>
    </div>
  );
};

export default BarangKeluar;