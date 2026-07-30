import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { downloadPdfReport, ReportData } from '../../utils/reportExporter';

interface Props {
  currentUser: User;
}

export default function ReportGeneratorView({ currentUser }: Props) {
  const [selectedCity, setSelectedCity] = useState(currentUser.city || 'Nairobi');
  const [downloading, setDownloading] = useState(false);

  const areaReportData: ReportData = {
    title: `${selectedCity} Area Intelligence & Security Assessment Report`,
    city: selectedCity,
    focus: 'Area Analysis',
    created_at: new Date().toISOString(),
    summary: `=== AREA INTELLIGENCE EXECUTIVE ASSESSMENT ===\nLocation: ${selectedCity} City Grid\nDate: ${new Date().toLocaleDateString()}\n\nKey Findings:\n- Real-time crime spatial analysis highlights primary incident clustering along transit hubs and main commercial intersections.\n- Incident breakdown: Theft (44.2%), Traffic & Mobility Disruptions (26.1%), Assault (15.8%), Burglary (13.9%).\n- Major physical infrastructure accessibility is verified active across all zones in ${selectedCity}.\n- Substation power grid and municipal water services are connected and operational.`,
    risk_score: selectedCity === 'Nairobi' ? 56 : selectedCity === 'Mombasa' ? 48 : 38,
    crime_breakdown: [
      { category: 'Theft', count: selectedCity === 'Nairobi' ? 1208 : selectedCity === 'Mombasa' ? 540 : 284 },
      { category: 'Traffic & Mobility Disruptions', count: selectedCity === 'Nairobi' ? 754 : selectedCity === 'Mombasa' ? 320 : 160 },
      { category: 'Assault', count: selectedCity === 'Nairobi' ? 396 : selectedCity === 'Mombasa' ? 190 : 85 },
      { category: 'Burglary', count: selectedCity === 'Nairobi' ? 374 : selectedCity === 'Mombasa' ? 140 : 62 },
    ],
    infrastructure_summary: [
      { infra_type: 'Hospitals', count: 6 },
      { infra_type: 'Schools', count: 14 },
      { infra_type: 'Railways & Stations', count: 2 },
      { infra_type: 'Major Roads & Highways', count: 8 },
      { infra_type: 'Churches & Places of Worship', count: 12 },
    ],
  };

  const devReportData: ReportData = {
    title: `${selectedCity} Development Planning & Spatial Impact Proposal`,
    city: selectedCity,
    focus: 'Development Planning',
    created_at: new Date().toISOString(),
    summary: `=== DEVELOPMENT PLANNING EXECUTIVE PROPOSAL ===\nLocation: ${selectedCity} Urban Zone\nDate: ${new Date().toLocaleDateString()}\n\nProposal Simulation Summary:\n- Project viability & success score is rated strong based on local purchasing power and population catchment.\n- Land valuation index in ${selectedCity} estimated between KES 25M to KES 140M per Acre depending on zone density.\n- Traffic flow impact indicates manageable road network load with light peak-hour congestion.\n- Multi-phase roadmap spans 24 months from site survey to official facility commissioning.`,
    risk_score: selectedCity === 'Nairobi' ? 88 : selectedCity === 'Mombasa' ? 84 : 89,
    infrastructure_summary: [
      { infra_type: 'Commercial Centers', count: 4 },
      { infra_type: 'Feeder Access Roads', count: 6 },
      { infra_type: 'Public Transit Hubs', count: 2 },
    ],
  };

  const handleDownloadAreaReport = () => {
    downloadPdfReport(areaReportData);
  };

  const handleDownloadDevReport = () => {
    downloadPdfReport(devReportData);
  };

  const handleDownloadBothReports = async () => {
    setDownloading(true);
    downloadPdfReport(areaReportData);
    setTimeout(() => {
      downloadPdfReport(devReportData);
      setDownloading(false);
    }, 1000);
  };

  return (
    <div className="reports-page-skyline fade-in" style={{ padding: '24px 32px', fontFamily: 'monospace, sans-serif' }}>
      {/* Horizontal Top Header Bar & Title */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff', fontFamily: 'sans-serif' }}>
            Report Generator
          </h1>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {selectedCity.toUpperCase()} • EXECUTIVE URBAN INTELLIGENCE & PLANNING REPORTS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Select City:</label>
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            style={{ padding: '8px 14px', background: '#0e1117', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: '0.85rem', fontFamily: 'sans-serif' }}
          >
            <option>Nairobi</option>
            <option>Mombasa</option>
            <option>Eldoret</option>
          </select>
        </div>
      </div>

      {/* Reports Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Card 1: Area Analysis Report */}
        <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#e65c5c', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              AREA ANALYSIS REPORT
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 10px 0', fontWeight: 700, fontFamily: 'sans-serif' }}>
              {selectedCity} Area Intelligence & Incident Report
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, margin: '0 0 16px 0', fontFamily: 'sans-serif' }}>
              Comprehensive real-time report containing risk scores, incident breakdown counts, severity feed, and major physical infrastructure summary.
            </p>
          </div>
          <button
            onClick={handleDownloadAreaReport}
            style={{
              width: '100%',
              background: '#e65c5c',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '12px 16px',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(230, 92, 92, 0.3)',
            }}
          >
            DOWNLOAD AREA ANALYSIS REPORT
          </button>
        </div>

        {/* Card 2: Development Planning Report */}
        <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              DEVELOPMENT PLANNING REPORT
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 10px 0', fontWeight: 700, fontFamily: 'sans-serif' }}>
              {selectedCity} Spatial Impact & Proposal Brief
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, margin: '0 0 16px 0', fontFamily: 'sans-serif' }}>
              Official proposal document detailing project success ratings, land market price per acre, traffic impact, catchment population shift, and project phasing.
            </p>
          </div>
          <button
            onClick={handleDownloadDevReport}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#e65c5c',
              border: '1px solid #e65c5c',
              borderRadius: 6,
              padding: '12px 16px',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            DOWNLOAD PLANNING REPORT
          </button>
        </div>

        {/* Card 3: Both Reports */}
        <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(230, 92, 92, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              COMBINED INTELLIGENCE PACKAGE
            </span>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 10px 0', fontWeight: 700, fontFamily: 'sans-serif' }}>
              Download Both Reports ({selectedCity})
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, margin: '0 0 16px 0', fontFamily: 'sans-serif' }}>
              Export both the Area Intelligence Assessment and Development Planning Proposal PDFs simultaneously for complete municipal records.
            </p>
          </div>
          <button
            onClick={handleDownloadBothReports}
            disabled={downloading}
            style={{
              width: '100%',
              background: '#e65c5c',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '12px 16px',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(230, 92, 92, 0.4)',
            }}
          >
            {downloading ? 'GENERATING BOTH PDFS…' : 'DOWNLOAD BOTH REPORTS'}
          </button>
        </div>
      </div>
    </div>
  );
}
