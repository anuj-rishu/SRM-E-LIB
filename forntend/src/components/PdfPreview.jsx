import { useState, useEffect } from 'react';
import { fileAPI } from '../services/api';

export default function PdfPreview({ fileId, fileName, onClose, csrfToken, user }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchPdfPreview = async () => {
      try {
        setLoading(true);
        const response = await fileAPI.previewFile(fileId, user.regNumber, csrfToken);
        const blobUrl = URL.createObjectURL(response);
        setPdfUrl(blobUrl);
      } catch (err) {
        setError('Failed to load PDF preview');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPdfPreview();
    
    // Cleanup function to revoke object URL
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileId, csrfToken, user.regNumber]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">{fileName}</h3>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-grow overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-6">{error}</div>
          ) : (
            <iframe 
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={fileName}
            />
          )}
        </div>
      </div>
    </div>
  );
}