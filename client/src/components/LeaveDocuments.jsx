import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiFileText, FiX } from 'react-icons/fi';
import api from '../api';
import './LeaveDocuments.css';

export default function LeaveDocuments({ leave }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const dialog = useRef(null);

  useEffect(() => {
    if (!preview) return;
    dialog.current.showModal();
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  const open = async (document) => {
    setLoadingId(document.id);
    setError('');
    try {
      const response = await api.get(`/leaves/${leave.id}/documents/${document.id}`, {
        responseType: 'blob',
      });
      setPreview({ ...document, url: URL.createObjectURL(response.data) });
    } catch {
      setError('Could not open the medical document. Please try again.');
    } finally {
      setLoadingId(null);
    }
  };

  if (!leave.medical_documents?.length) return null;

  return (
    <div className="leave-documents">
      <strong>Medical documents</strong>
      {leave.medical_documents.map((document) => (
        <button
          type="button"
          className="leave-document-link"
          key={document.id}
          onClick={() => open(document)}
          disabled={loadingId !== null}
          title={`View ${document.filename}`}
        >
          <FiFileText aria-hidden="true" />
          <span>{loadingId === document.id ? 'Opening...' : document.filename}</span>
        </button>
      ))}
      {error && <div className="leave-document-error" role="alert">{error}</div>}
      {preview && createPortal(
        <dialog
          className="leave-document-dialog"
          ref={dialog}
          aria-labelledby={`document-title-${leave.id}`}
          onClose={() => setPreview(null)}
        >
          <div className="leave-document-toolbar">
            <strong id={`document-title-${leave.id}`}>{preview.filename}</strong>
            <a href={preview.url} download={preview.filename}>Download</a>
            <button type="button" autoFocus aria-label="Close document" onClick={() => dialog.current.close()}>
              <FiX aria-hidden="true" />
            </button>
          </div>
          {preview.mime_type === 'application/pdf' ? (
            <iframe src={preview.url} title={preview.filename} className="leave-document-preview" />
          ) : (
            <img src={preview.url} alt={preview.filename} className="leave-document-preview" />
          )}
        </dialog>,
        document.body
      )}
    </div>
  );
}
