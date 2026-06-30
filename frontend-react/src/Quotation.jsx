import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Simple Icons
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Quotation = ({ cpu, gpu, ram, onBack }) => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.post('http://localhost:4000/api/pricing/estimate', { cpu, gpu, ram });
        setPrices(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch live prices. Please make sure the Gemini API key is configured.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [cpu, gpu, ram]);

  const generatePDF = () => {
    if (!prices) return;

    // A standard A4 document without dark colors
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text('Project Aura - Quotation', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Total Price calculations
    const cpuP = prices.cpuPriceLkr || 0;
    const gpuP = prices.gpuPriceLkr || 0;
    const ramP = prices.ramPriceLkr || 0;
    const total = cpuP + gpuP + ramP;

    // Hardware Details Table
    const tableColumn = ["Component", "Model", "Estimated Price (LKR)"];
    const tableRows = [
      ["Processor (CPU)", cpu, `Rs. ${cpuP.toLocaleString()}`],
      ["Graphics Card (GPU)", gpu, `Rs. ${gpuP.toLocaleString()}`],
      ["System Memory (RAM)", `${ram} GB`, `Rs. ${ramP.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] },
      styles: { fontSize: 11, cellPadding: 5 }
    });

    // Total Price setup first for fallbacks
    const finalY = doc.lastAutoTable?.finalY || 100;

    // Total Price Text
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Estimated Total: Rs. ${total.toLocaleString()}`, 14, finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Disclaimer: This is a predicted price estimated by AI. This can be different from', 14, finalY + 25);
    doc.text('actual shop prices. This is only an average market price.', 14, finalY + 30);

    doc.save('Aura_Quotation.pdf');
  };

  return (
    <div className="quotation-page" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.5s ease both' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          <IconArrowLeft /> Back to Results
        </button>
      </div>

      <div className="analyzer-card">
        <h2 className="card-title">Live Pricing Quotation</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Real-time Sri Lankan market prices estimated by Google Gemini AI.
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--primary)' }}>
            <p>Fetching live prices from Gemini AI...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {prices && (
          <>
            <div style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', color: '#ff9800', fontSize: '0.85rem' }}>
              <strong>Hint:</strong> This is a predicted price and this can be different from shop prices. This is only an average market price.
            </div>

            <div style={{ background: 'rgba(5, 10, 22, 0.7)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Processor</div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>{cpu}</div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.1rem' }}>
                  Rs. {(prices.cpuPriceLkr || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', paddingTop: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Graphics Card</div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>{gpu}</div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.1rem' }}>
                  Rs. {(prices.gpuPriceLkr || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>System Memory</div>
                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>{ram} GB</div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.1rem' }}>
                  Rs. {(prices.ramPriceLkr || 0).toLocaleString()}
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Estimated Total</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', letterSpacing: '-1px' }}>
                  Rs. {((prices.cpuPriceLkr || 0) + (prices.gpuPriceLkr || 0) + (prices.ramPriceLkr || 0)).toLocaleString()}
                </div>
              </div>
              
              <button 
                onClick={generatePDF}
                className="action-btn"
                style={{ width: 'auto', padding: '0.8rem 1.5rem', marginTop: 0 }}
              >
                <IconDownload /> Download A4 PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Quotation;
