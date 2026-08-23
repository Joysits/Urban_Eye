import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { downloadPdfReport, downloadComparisonPdfReport, ReportData, ComparisonReportData } from '../../utils/reportExporter';
import jsPDF from 'jspdf';

interface Props {
  currentUser: User;
}

export default function ReportGeneratorView({ currentUser }: Props) {
  const [savedComparisons, setSavedComparisons] = useState<ComparisonReportData[]>([]);
  const [savedProposals, setSavedProposals] = useState<any[]>([]);

  const userKey = (currentUser.email || 'guest').toLowerCase();

  // Unified load effect: user-scoped with fallback
  useEffect(() => {
    try {
      // 1. Zone Comparisons
      let comps: ComparisonReportData[] = [];
      const storedCompUser = localStorage.getItem(`saved_zone_comparisons_${userKey}`);
      const storedCompGlobal = localStorage.getItem('urban_eye_saved_comparisons');
      const storedCompGuest = localStorage.getItem('saved_zone_comparisons_guest');

      if (storedCompUser) {
        try { comps = JSON.parse(storedCompUser); } catch {}
      }
      if ((!comps || comps.length === 0) && storedCompGlobal) {
        try { comps = JSON.parse(storedCompGlobal); } catch {}
      }
      if ((!comps || comps.length === 0) && storedCompGuest) {
        try { comps = JSON.parse(storedCompGuest); } catch {}
      }
      setSavedComparisons(Array.isArray(comps) ? comps : []);

      // 2. Planning Proposals & Drafts
      let propsList: any[] = [];
      const storedPropUser = localStorage.getItem(`saved_planning_proposals_${userKey}`);
      const storedPropGlobal = localStorage.getItem('urban_eye_saved_plans');
      const storedPropLegacy = localStorage.getItem('smart_urban_saved_plans');
      const storedPropGuest = localStorage.getItem('saved_planning_proposals_guest');

      if (storedPropUser) {
        try { propsList = JSON.parse(storedPropUser); } catch {}
      }
      if ((!propsList || propsList.length === 0) && storedPropGlobal) {
        try { propsList = JSON.parse(storedPropGlobal); } catch {}
      }
      if ((!propsList || propsList.length === 0) && storedPropLegacy) {
        try { propsList = JSON.parse(storedPropLegacy); } catch {}
      }
      if ((!propsList || propsList.length === 0) && storedPropGuest) {
        try { propsList = JSON.parse(storedPropGuest); } catch {}
      }
      setSavedProposals(Array.isArray(propsList) ? propsList : []);
    } catch (e) {
      setSavedComparisons([]);
      setSavedProposals([]);
    }
  }, [userKey]);

  const handleDeleteComparison = (id: string) => {
    const updated = savedComparisons.filter(c => c.id !== id);
    setSavedComparisons(updated);
    localStorage.setItem(`saved_zone_comparisons_${userKey}`, JSON.stringify(updated));
    localStorage.setItem('urban_eye_saved_comparisons', JSON.stringify(updated));
  };

  const handleDeleteProposal = (id: any) => {
    const updated = savedProposals.filter(p => p.id !== id);
    setSavedProposals(updated);
    localStorage.setItem(`saved_planning_proposals_${userKey}`, JSON.stringify(updated));
    localStorage.setItem('urban_eye_saved_plans', JSON.stringify(updated));
    localStorage.setItem('smart_urban_saved_plans', JSON.stringify(updated));
  };

  const handleClearAllSaved = () => {
    localStorage.removeItem(`saved_zone_comparisons_${userKey}`);
    localStorage.removeItem(`saved_planning_proposals_${userKey}`);
    localStorage.removeItem('urban_eye_saved_comparisons');
    localStorage.removeItem('urban_eye_saved_plans');
    localStorage.removeItem('smart_urban_saved_plans');
    setSavedComparisons([]);
    setSavedProposals([]);
  };

  const handleDownloadProposalPdf = (prop: any) => {
    // Generate clean PDF for Development Planning Proposal without land price data
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    // Banner Header
    doc.setFillColor(124, 29, 36);
    doc.rect(0, 0, pageWidth, 70, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text((prop.title || 'Development Proposal Report').toUpperCase(), 30, 32);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('URBAN EYE — SMART URBAN PLANNING & SPATIAL INTELLIGENCE SYSTEM', 30, 52);

    y = 90;
    doc.setTextColor(28, 5, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Proposal Category: ${prop.project_type || 'Infrastructure'}`, 30, y); y += 16;
    doc.text(`Project Stage: ${prop.stage || 'Proposal'}`, 30, y); y += 16;
    doc.text(`Location: ${prop.location_name || prop.city || 'Nairobi'}`, 30, y); y += 22;

    doc.setDrawColor(220, 225, 230);
    doc.line(30, y, pageWidth - 30, y); y += 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Proposal Details & Context', 30, y); y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 60, 75);
    const summaryLines = doc.splitTextToSize(prop.planner_notes || prop.summary || 'Official urban development planning proposal.', pageWidth - 60);
    doc.text(summaryLines, 30, y);
    y += summaryLines.length * 14 + 18;

    if (prop.impact) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(28, 5, 7);
      doc.text('Impact Simulator Predictions', 30, y); y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(50, 60, 75);
      doc.text(`• Project Success Score: ${prop.impact.business_success_rate || '85%'}`, 40, y); y += 16;
      doc.text(`• Sub-County Road Infrastructure: ${prop.impact.subcounty_road_status || '50% Paved / 50% Unpaved Roads'}`, 40, y); y += 16;

      const tLines = doc.splitTextToSize(`• Traffic & Road Access: ${prop.impact.traffic_impact || 'Moderate congestion impact'}`, pageWidth - 70);
      doc.text(tLines, 40, y); y += tLines.length * 13 + 4;

      const pLines = doc.splitTextToSize(`• Population Growth: ${prop.impact.population_shift || '+3.2% annual growth'}`, pageWidth - 70);
      doc.text(pLines, 40, y); y += pLines.length * 13 + 4;

      const cLines = doc.splitTextToSize(`• Safety & Risk Delta: ${prop.impact.crime_risk_delta || '-4.5% overall risk'}`, pageWidth - 70);
      doc.text(cLines, 40, y); y += cLines.length * 13 + 16;
    }

    const cleanName = (prop.title || 'proposal_report').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    doc.save(`${cleanName}_report.pdf`);
  };

  const totalSaved = savedComparisons.length + savedProposals.length;

  return (
    <div className="reports-page-skyline fade-in" style={{ padding: '20px 24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(124, 29, 36, 0.12)' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 2px 0', color: '#1c0507', fontFamily: 'Outfit, sans-serif' }}>
            Report Generator
          </h1>
          <span style={{ fontSize: '0.78rem', color: '#7c1d24', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
            EXECUTIVE URBAN INTELLIGENCE &amp; SAVED PLANNING PROPOSALS
          </span>
        </div>
      </div>

      {/* SAVED PROPOSALS & REPORTS SECTION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.15rem', color: '#1c0507', margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
            Saved Proposals &amp; Reports ({totalSaved})
          </h2>
          {totalSaved > 0 && (
            <button
              onClick={handleClearAllSaved}
              style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
            >
              Clear All Saved
            </button>
          )}
        </div>

        {totalSaved === 0 ? (
          <div style={{ background: '#ffffff', padding: '36px 24px', borderRadius: 16, border: '1px dashed rgba(124, 29, 36, 0.3)', textAlign: 'center', color: '#7c1d24', fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', lineHeight: 1.5, boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
            No saved proposals or reports yet. When you click <strong>&quot;Save Proposal&quot;</strong> in <strong>Development Planning</strong> or click <strong>&quot;Save Comparison to Report&quot;</strong> in <strong>Area Analysis</strong>, your saved documents will instantly appear here for immediate PDF download.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {/* Render Saved Planning Proposals */}
            {savedProposals.map((prop, idx) => (
              <div key={prop.id || idx} style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid rgba(124, 29, 36, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#7c1d24', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
                      DEVELOPMENT PROPOSAL ({prop.city || 'NAIROBI'})
                    </span>
                    <button
                      onClick={() => handleDeleteProposal(prop.id)}
                      title="Delete Saved Proposal"
                      style={{ background: '#fee2e2', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#dc2626', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                    >
                      Delete
                    </button>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: '#1c0507', margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                    {prop.title || 'Untitled Proposal'}
                  </h4>
                  <div style={{ color: '#592328', fontSize: '0.78rem', lineHeight: 1.45, marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
                    <div><strong>Category:</strong> {prop.project_type || 'Infrastructure'}</div>
                    <div><strong>Stage:</strong> {prop.stage || 'Proposal'}</div>
                    <div><strong>Location:</strong> {prop.location_name || prop.city || 'Nairobi'}</div>
                    <small style={{ display: 'block', color: '#7a4d52', marginTop: 4 }}>Saved: {prop.created_at ? new Date(prop.created_at).toLocaleString() : 'Recently'}</small>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadProposalPdf(prop)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  DOWNLOAD PROPOSAL REPORT (PDF)
                </button>
              </div>
            ))}

            {/* Render Saved Zone Comparisons */}
            {savedComparisons.map((comp, idx) => (
              <div key={comp.id || idx} style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid rgba(124, 29, 36, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(124, 29, 36, 0.05)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#7c1d24', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
                      ZONE COMPARATIVE REPORT ({comp.city || 'NAIROBI'})
                    </span>
                    <button
                      onClick={() => handleDeleteComparison(comp.id)}
                      title="Delete Saved Comparison"
                      style={{ background: '#fee2e2', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#dc2626', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                    >
                      Delete
                    </button>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: '#1c0507', margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                    {comp.title || `${comp.zoneA_name || 'Zone A'} vs ${comp.zoneB_name || 'Zone B'}`}
                  </h4>
                  <div style={{ color: '#592328', fontSize: '0.78rem', lineHeight: 1.45, marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
                    <div><strong>Summary:</strong> {comp.summary || 'Side-by-side comparative spatial analysis'}</div>
                    <small style={{ display: 'block', color: '#7a4d52', marginTop: 4 }}>Saved: {comp.created_at ? new Date(comp.created_at).toLocaleString() : 'Recently'}</small>
                  </div>
                </div>

                <button
                  onClick={() => downloadComparisonPdfReport(comp)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #7c1d24, #a63a3a)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 29, 36, 0.25)',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  DOWNLOAD COMPARISON REPORT (PDF)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
