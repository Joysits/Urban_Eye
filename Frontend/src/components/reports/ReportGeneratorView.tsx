import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { downloadPdfReport, downloadComparisonPdfReport, ReportData, ComparisonReportData } from '../../utils/reportExporter';

interface Props {
  currentUser: User;
}

export default function ReportGeneratorView({ currentUser }: Props) {
  const [savedComparisons, setSavedComparisons] = useState<ComparisonReportData[]>([]);
  const [savedProposals, setSavedProposals] = useState<any[]>([]);

  const userKey = (currentUser.email || 'guest').toLowerCase();

  useEffect(() => {
    try {
      const storedComp = localStorage.getItem(`saved_zone_comparisons_${userKey}`);
      if (storedComp) setSavedComparisons(JSON.parse(storedComp));
      else setSavedComparisons([]);

      const storedProp = localStorage.getItem(`saved_planning_proposals_${userKey}`);
      if (storedProp) setSavedProposals(JSON.parse(storedProp));
      else setSavedProposals([]);
    } catch (e) {
      console.error(e);
    }
  }, [userKey]);

  const handleDeleteComparison = (id: string) => {
    const updated = savedComparisons.filter(c => c.id !== id);
    setSavedComparisons(updated);
    localStorage.setItem(`saved_zone_comparisons_${userKey}`, JSON.stringify(updated));
  };

  const handleDeleteProposal = (id: any) => {
    const updated = savedProposals.filter(p => p.id !== id);
    setSavedProposals(updated);
    localStorage.setItem(`saved_planning_proposals_${userKey}`, JSON.stringify(updated));
  };

  const handleClearAllSaved = () => {
    localStorage.removeItem(`saved_zone_comparisons_${userKey}`);
    localStorage.removeItem(`saved_planning_proposals_${userKey}`);
    setSavedComparisons([]);
    setSavedProposals([]);
  };

  const handleDownloadProposalPdf = (prop: any) => {
    const report: ReportData = {
      title: prop.title || 'Development Proposal Report',
      city: prop.city || currentUser.city || 'Nairobi',
      focus: prop.project_type || 'Development Proposal',
      created_at: prop.created_at,
      summary: prop.summary || prop.planner_notes || 'Official Development Planning Proposal Document.',
      risk_score: prop.impact?.success_score || prop.impact?.overallScore || 85,
    };
    downloadPdfReport(report);
  };

  const totalSaved = savedComparisons.length + savedProposals.length;

  return (
    <div className="reports-page-skyline fade-in" style={{ padding: '20px 24px', fontFamily: 'monospace, sans-serif' }}>
      {/* Horizontal Top Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 2px 0', color: '#fff', fontFamily: 'sans-serif' }}>
            Report Generator
          </h1>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            EXECUTIVE URBAN INTELLIGENCE &amp; SAVED PLANNING PROPOSALS
          </span>
        </div>
      </div>

      {/* SAVED PROPOSALS & REPORTS SECTION (100% Empty Default for New Users) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.15rem', color: '#fff', margin: 0, fontFamily: 'sans-serif', fontWeight: 700 }}>
            Saved Proposals &amp; Reports ({totalSaved})
          </h2>
          {totalSaved > 0 && (
            <button
              onClick={handleClearAllSaved}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 600 }}
            >
              Clear All Saved
            </button>
          )}
        </div>

        {totalSaved === 0 ? (
          <div style={{ background: '#0e1117', padding: '36px 24px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', color: '#94a3b8', fontFamily: 'sans-serif', fontSize: '0.88rem', lineHeight: 1.5 }}>
            No saved proposals or reports yet. When you save a draft proposal in <strong>Development Planning</strong> or save a comparison in <strong>Area Analysis</strong>, it will automatically appear here for instant PDF download and management.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {/* Render Saved Planning Proposals */}
            {savedProposals.map(prop => (
              <div key={prop.id} style={{ background: '#0e1117', padding: 16, borderRadius: 10, border: '1px solid rgba(230, 92, 92, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#e65c5c', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      SAVED DRAFT PROPOSAL ({prop.city})
                    </span>
                    <button
                      onClick={() => handleDeleteProposal(prop.id)}
                      title="Delete Saved Proposal"
                      style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                  <h4 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 6px 0', fontFamily: 'sans-serif', fontWeight: 700 }}>
                    {prop.title}
                  </h4>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4, marginBottom: 12, fontFamily: 'sans-serif' }}>
                    <div><strong>Category:</strong> {prop.project_type}</div>
                    <div><strong>Stage:</strong> {prop.stage}</div>
                    <div><strong>Location:</strong> {prop.location_name || prop.city}</div>
                    <small style={{ display: 'block', color: '#64748b', marginTop: 4 }}>Saved: {new Date(prop.created_at || Date.now()).toLocaleString()}</small>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadProposalPdf(prop)}
                  style={{
                    width: '100%',
                    background: '#a81c1c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(168, 28, 28, 0.3)',
                  }}
                >
                  DOWNLOAD PROPOSAL REPORT (PDF)
                </button>
              </div>
            ))}

            {/* Render Saved Zone Comparisons */}
            {savedComparisons.map(comp => (
              <div key={comp.id} style={{ background: '#0e1117', padding: 16, borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: '#3b82f6', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      ZONE COMPARATIVE REPORT ({comp.city})
                    </span>
                    <button
                      onClick={() => handleDeleteComparison(comp.id)}
                      title="Delete Saved Comparison"
                      style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                  <h4 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 6px 0', fontFamily: 'sans-serif', fontWeight: 700 }}>
                    {comp.zoneA_name} vs {comp.zoneB_name}
                  </h4>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4, marginBottom: 12, fontFamily: 'sans-serif' }}>
                    <div><strong>Risk Score Delta:</strong> {comp.risk_diff > 0 ? `+${comp.risk_diff}` : comp.risk_diff} pts</div>
                    <div><strong>Incidents Delta:</strong> {comp.incidents_diff > 0 ? `+${comp.incidents_diff}` : comp.incidents_diff} incidents</div>
                    <div><strong>Density Delta:</strong> {comp.density_diff > 0 ? `+${comp.density_diff}` : comp.density_diff} /km²</div>
                    <small style={{ display: 'block', color: '#64748b', marginTop: 4 }}>Saved: {new Date(comp.created_at).toLocaleString()}</small>
                  </div>
                </div>

                <button
                  onClick={() => downloadComparisonPdfReport(comp)}
                  style={{
                    width: '100%',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
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
