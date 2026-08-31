import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { estimatePrices } from './services/pricingService';

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
        const data = await estimatePrices({ cpu, gpu, ram });
        setPrices(data);
      } catch (err) {
        console.error('Pricing error:', err.message);
        const msg = err?.response?.data?.error || 'Failed to fetch live prices. Please make sure the Gemini API key is configured.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [cpu, gpu, ram]);

  const generatePDF = () => {
    if (!prices) return;

    // 1. Create a blank virtual A4 document canvas in the browser's memory
    const doc = new jsPDF();
    
    // 2. Draw the Header Text using specific X and Y coordinates (14 units from left, 22 units down)
    doc.setFontSize(22);
    doc.text('Project Aura - Quotation', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100); // Gray text for the date
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // 3. Calculate the total estimated price using the live Gemini AI data
    const cpuP = prices.cpuPriceLkr || 0;
    const gpuP = prices.gpuPriceLkr || 0;
    const ramP = prices.ramPriceLkr || 0;
    const total = cpuP + gpuP + ramP;

    // 4. Build the data arrays for the AutoTable plugin
    const tableColumn = ["Component", "Model", "Estimated Price (LKR)"];
    const tableRows = [
      ["Processor (CPU)", cpu, `Rs. ${cpuP.toLocaleString()}`],
      ["Graphics Card (GPU)", gpu, `Rs. ${gpuP.toLocaleString()}`],
      ["System Memory (RAM)", `${ram} GB`, `Rs. ${ramP.toLocaleString()}`],
    ];

    // 5. Use the autoTable plugin to automatically draw the grid, borders, and colored header
    autoTable(doc, {
      startY: 40, // Start drawing the table 40 units from the top
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] }, // Sky Blue header
      styles: { fontSize: 11, cellPadding: 5 }
    });

    // 6. Dynamically find the Y-coordinate where the table finished drawing
    // This ensures the Total text doesn't overlap the table if the table gets taller
    const finalY = doc.lastAutoTable?.finalY || 100;

    // 7. Draw the Final Total text perfectly below the dynamic table
    doc.setFontSize(14);
    doc.setTextColor(0); // Black text
    doc.text(`Estimated Total: Rs. ${total.toLocaleString()}`, 14, finalY + 15);
    
    // 8. Draw the disclaimer text below the total
    doc.setFontSize(10);
    doc.setTextColor(150); // Light gray
    doc.text('Disclaimer: This is a predicted price estimated by AI. This can be different from', 14, finalY + 25);
    doc.text('actual shop prices. This is only an average market price.', 14, finalY + 30);

    // 9. Compile the canvas into a real .pdf file and trigger the browser download
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
