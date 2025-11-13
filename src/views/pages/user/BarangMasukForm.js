import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { db, addDoc, collection } from '../../../firebase';
import emailjs from '@emailjs/browser';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CFormFeedback,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilFile, cilCheckAlt, cilX } from '@coreui/icons';

const BarangMasukForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!quantity || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!image) {
      newErrors.image = 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'File too large!',
          text: 'Image size must be less than 5MB',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Invalid file!',
          text: 'Please upload an image file',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
        setErrors({ ...errors, image: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Send Telegram Notification
  const sendTelegramNotification = async (barangData) => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

      const message = `
🔔 <b>NOTIFIKASI BARANG MASUK - PERLU APPROVAL</b>

📦 <b>Nama Item:</b> ${barangData.name}
📝 <b>Deskripsi:</b> ${barangData.description}
📊 <b>Quantity:</b> ${barangData.quantity}
👤 <b>Input By:</b> ${barangData.createdBy}
⏰ <b>Waktu:</b> ${new Date(barangData.createdAt).toLocaleString('id-ID')}
🆔 <b>ID:</b> <code>${barangData.id}</code>

<i>Silakan cek sistem untuk approval</i>
      `;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Telegram notification failed');
      }

      console.log('✅ Telegram notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Telegram notification error:', error);
      throw error;
    }
  };

  // Send Email Notification
  const sendEmailNotification = async (barangData) => {
    try {
      const templateParams = {
        to_email: import.meta.env.VITE_NOTIFICATION_EMAIL,
        item_name: barangData.name,
        item_description: barangData.description,
        item_quantity: barangData.quantity,
        created_by: barangData.createdBy,
        created_at: new Date(barangData.createdAt).toLocaleString('id-ID'),
        item_id: barangData.id,
        dashboard_link: `${window.location.origin}/admin/barang-masuk`,
      };

      const response = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('✅ Email notification sent successfully:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Email notification error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error!',
        text: 'Please fill in all required fields correctly',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {
      setLoading(true);

      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'barang-masuk'), {
        name: name.trim(),
        description: description.trim(),
        quantity: parseInt(quantity),
        image: image,
        createdAt: new Date().toISOString(),
        createdBy: '',
        status: 'pending',
      });

      console.log('✅ Document added with ID:', docRef.id);

      const barangData = {
        id: docRef.id,
        name: name.trim(),
        description: description.trim(),
        quantity: parseInt(quantity),
        createdBy: '',
        createdAt: new Date().toISOString(),
      };

      // Send both notifications
      let notificationsSent = {
        telegram: false,
        email: false,
      };

      // Try sending Telegram
      try {
        await sendTelegramNotification(barangData);
        notificationsSent.telegram = true;
      } catch (telegramError) {
        console.error('Telegram failed:', telegramError);
      }

      // Try sending Email
      try {
        await sendEmailNotification(barangData);
        notificationsSent.email = true;
      } catch (emailError) {
        console.error('Email failed:', emailError);
      }

      // Show success message
      let successMessage = 'Barang Masuk added successfully!';
      if (notificationsSent.telegram && notificationsSent.email) {
        successMessage += '\n✅ Notifications sent to Telegram & Email';
      } else if (notificationsSent.telegram) {
        successMessage += '\n✅ Notification sent to Telegram\n⚠️ Email failed';
      } else if (notificationsSent.email) {
        successMessage += '\n✅ Notification sent to Email\n⚠️ Telegram failed';
      } else {
        successMessage += '\n⚠️ Notifications could not be sent (check configuration)';
      }

      Swal.fire({
        title: 'Success!',
        text: successMessage,
        icon: 'success',
        confirmButtonText: 'OK',
      });

      // Clear form after submission
      setName('');
      setDescription('');
      setQuantity('');
      setImage(null);
      setImagePreview(null);
      setErrors({});
    } catch (err) {
      console.error('❌ Error adding document:', err);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to add Barang Masuk: ' + err.message,
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="bg-primary text-white">
        <h5 className="mb-0">
          <CIcon icon={cilFile} className="me-2" />
          Add New Barang Masuk
        </h5>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          {/* Name and Quantity Row */}
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="name" className="fw-bold">
                Name <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="name"
                type="text"
                placeholder="Enter item name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({ ...errors, name: '' });
                }}
                isInvalid={!!errors.name}
                disabled={loading}
              />
              {errors.name && (
                <CFormFeedback invalid>{errors.name}</CFormFeedback>
              )}
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="quantity" className="fw-bold">
                Quantity <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrors({ ...errors, quantity: '' });
                }}
                isInvalid={!!errors.quantity}
                disabled={loading}
                min="1"
              />
              {errors.quantity && (
                <CFormFeedback invalid>{errors.quantity}</CFormFeedback>
              )}
            </CCol>
          </CRow>

          {/* Description Row */}
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="description" className="fw-bold">
                Description <span className="text-danger">*</span>
              </CFormLabel>
              <CFormInput
                id="description"
                type="text"
                placeholder="Enter item description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors({ ...errors, description: '' });
                }}
                isInvalid={!!errors.description}
                disabled={loading}
              />
              {errors.description && (
                <CFormFeedback invalid>{errors.description}</CFormFeedback>
              )}
            </CCol>
          </CRow>

          {/* Image Upload Row */}
          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="image" className="fw-bold">
                Upload Image <span className="text-danger">*</span>
              </CFormLabel>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilFile} />
                </CInputGroupText>
                <CFormInput
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  isInvalid={!!errors.image}
                  disabled={loading}
                />
              </CInputGroup>
              {errors.image && (
                <CFormFeedback invalid style={{ display: 'block' }}>
                  {errors.image}
                </CFormFeedback>
              )}
              <CFormText className="d-block mt-2">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </CFormText>
            </CCol>
          </CRow>

          {/* Image Preview */}
          {imagePreview && (
            <CRow className="mb-3">
              <CCol md={12}>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Image Preview</h6>
                    <CButton
                      color="danger"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={loading}
                    >
                      <CIcon icon={cilX} className="me-1" />
                      Remove
                    </CButton>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-fluid rounded"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              </CCol>
            </CRow>
          )}

          {/* Submit Button Row */}
          <CRow>
            <CCol md={12}>
              <CButton
                color="primary"
                type="submit"
                disabled={loading}
                className="w-100 fw-bold"
              >
                {loading ? (
                  <>
                    <CSpinner
                      component="span"
                      size="sm"
                      className="me-2"
                      aria-hidden="true"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CIcon icon={cilCheckAlt} className="me-2" />
                    Submit
                  </>
                )}
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

export default BarangMasukForm;