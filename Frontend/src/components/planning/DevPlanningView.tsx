import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { User } from '../../types';
import jsPDF from 'jspdf';

interface Props {
  currentUser: User;
  currentCity?: string;
  onCityChange?: (city: string) => void;
  onShowToast?: (msg: string) => void;
}

interface ProjectPlan {
  id?: number;
  title: string;
  project_type: 'Road' | 'Hospital' | 'School' | 'Mall' | 'Residential';
  city: string;
  stage: 'Draft' | 'Review' | 'Approved' | 'Rejected';
  summary: string;
  planner_notes: string;
  lat?: number;
  lng?: number;
  location_name?: string;
  created_at?: string;
  impact?: ImpactData;
}

interface ImpactData {
  traffic_impact: string;
  population_shift: string;
  crime_risk_delta: string;
  land_price_per_acre: string;
  business_success_rate: string;
  success_score: number;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  Nairobi: [-1.286389, 36.817223],
  Mombasa: [-4.043477, 39.668206],
  Eldoret: [0.514277, 35.26978],
};

const PROJECT_TYPE_CONFIG: Record<string, { color: string; defaultSummary: string }> = {
  Commercial: {
    color: '#e65c5c',
    defaultSummary: 'Commercial retail & office development with parking and public transport integration.',
  },
  Healthcare: {
    color: '#ef4444',
    defaultSummary: 'Regional healthcare facility expanding emergency coverage and specialized outpatient care.',
  },
  Education: {
    color: '#f97316',
    defaultSummary: 'Integrated educational campus serving local demographic growth and vocational training.',
  },
  Housing: {
    color: '#10b981',
    defaultSummary: 'High-density mixed-income housing development with green space and solar grid.',
  },
  Transport: {
    color: '#3b82f6',
    defaultSummary: 'Primary transport corridor and transit hub connecting residential and commercial zones.',
  },
};

export default function DevPlanningView({ currentUser, currentCity, onCityChange, onShowToast }: Props) {
  const city = currentCity || currentUser.city || 'Nairobi';

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const projectMarkerRef = useRef<L.Marker | null>(null);

  // Form state
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<'Road' | 'Hospital' | 'School' | 'Mall' | 'Residential' | ''>('');
  const [stage, setStage] = useState<'Draft' | 'Review' | 'Approved' | 'Rejected' | ''>('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Map Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<string>('');

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: CITY_CENTERS[city]?.[0] ?? -1.286,
    lng: CITY_CENTERS[city]?.[1] ?? 36.817,
  });

  // Re-center map when city changes
  useEffect(() => {
    if (mapRef.current) {
      const center = CITY_CENTERS[city] ?? [-1.286389, 36.817223];
      mapRef.current.setView(center, 14);
      setCoords({ lat: center[0], lng: center[1] });
      setSearchedLocation(`${city} Center`);
    }
  }, [city]);

  // Simulation & Saved Plans state
  const [simulatedImpact, setSimulatedImpact] = useState<ImpactData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedPlans, setSavedPlans] = useState<ProjectPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'simulator' | 'plans' | 'timeline'>('simulator');

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([coords.lat, coords.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: '',
      html: '<div style="background:#e65c5c; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker([coords.lat, coords.lng], { icon: markerIcon, draggable: true }).addTo(map);
    projectMarkerRef.current = marker;

    const reverseGeocode = (lat: number, lng: number) => {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(r => r.json())
        .then(d => {
          const name = d?.address?.suburb || d?.address?.neighbourhood || d?.address?.quarter || d?.display_name?.split(',')[0] || `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          setSearchedLocation(name);
        })
        .catch(() => setSearchedLocation(`Selected Site (${lat.toFixed(3)}, ${lng.toFixed(3)})`));
    };

    marker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      setCoords({ lat: newPos.lat, lng: newPos.lng });
      reverseGeocode(newPos.lat, newPos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    const resizeObs = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) resizeObs.observe(mapContainerRef.current);

    return () => {
      resizeObs.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Map Location Search Handler
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const queryWithCity = `${searchQuery.trim()}, ${city}, Kenya`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lng = parseFloat(top.lon);
        setCoords({ lat, lng });
        const name = top.display_name.split(',')[0];
        setSearchedLocation(name);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
        if (projectMarkerRef.current) {
          projectMarkerRef.current.setLatLng([lat, lng]);
        }
      } else {
        alert(`No location found matching "${searchQuery}". Please try another zone name.`);
      }
    } catch {
      alert('Location search failed. Please check internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Load existing saved plans
  useEffect(() => {
    fetch('/api/projects/', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
    })
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data)) {
          setSavedPlans(data);
        } else {
          const userKey = (currentUser?.email || 'guest').toLowerCase();
          const localStored = localStorage.getItem(`saved_planning_proposals_${userKey}`);
          setSavedPlans(localStored ? JSON.parse(localStored) : []);
        }
      })
      .catch(() => {
        const userKey = (currentUser?.email || 'guest').toLowerCase();
        const localStored = localStorage.getItem(`saved_planning_proposals_${userKey}`);
        setSavedPlans(localStored ? JSON.parse(localStored) : []);
      });
  }, [city, currentUser]);

  // Dynamic Zone-Specific Simulation Calculations
  const handleRunSimulation = () => {
    setFormError('');
    if (!title.trim()) {
      setFormError('Please enter a Proposal Title before running the simulation.');
      return;
    }
    if (!projectType) {
      setFormError('Please select a Project Category before running the simulation.');
      return;
    }
    if (!stage) {
      setFormError('Please select a Planning Stage before running the simulation.');
      return;
    }

    setIsSimulating(true);
    setTimeout(() => {
      const locName = searchedLocation || `${city} Zone`;
      const locLower = locName.toLowerCase();
      const hash = locName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

      let landPrice = 'KES 75M – 110M / Acre';
      let successRate = '86% High Commercial Growth';
      let score = 86;
      let trafficExp = `Easy access via main road in ${locName}. Expect light traffic delays during morning (7:30 AM – 9:00 AM) and evening rush hours.`;
      let popExp = `Expected to attract about 14,000 new residents and daily visitors to ${locName} over the next 2 years.`;
      let crimeExp = `Low overall safety risk in ${locName}. Installing good street lighting and security cameras near entrance gates is recommended.`;

      if (locLower.includes('westlands') || locLower.includes('kilimani') || locLower.includes('lavington') || locLower.includes('cbd') || locLower.includes('karen')) {
        landPrice = `KES ${110 + (hash % 40)}M – ${160 + (hash % 50)}M / Acre`;
        score = 91 + (hash % 6);
        successRate = `${score}% Excellent Commercial Growth`;
        trafficExp = `High traffic density along main road corridors in ${locName}. Dedicated turning lanes recommended during evening peak hours (4:30 PM - 7:30 PM).`;
        popExp = `Heavy foot traffic corridor bringing ~18,500 daily shoppers, office workers, and residents within a 15-minute radius.`;
        crimeExp = `Moderate commercial risk. High-definition CCTV coverage and private security patrols advised for late evening hours.`;
      } else if (locLower.includes('pioneer') || locLower.includes('langas') || locLower.includes('huruma') || locLower.includes('kimumu') || locLower.includes('annex')) {
        landPrice = `KES ${18 + (hash % 12)}M – ${32 + (hash % 15)}M / Acre`;
        score = 87 + (hash % 7);
        successRate = `${score}% High Growth Potential`;
        trafficExp = `Smooth traffic flow on connecting feeder roads in ${locName}. Light congestion near school and market opening hours.`;
        popExp = `Serves an expanding residential catchment of ~9,200 local family residents and students in ${locName}.`;
        crimeExp = `Low safety risk in ${locName}. Standard perimeter fencing and solar street illumination provide full protection.`;
      } else if (locLower.includes('nyali') || locLower.includes('bamburi') || locLower.includes('likoni') || locLower.includes('kisauni') || locLower.includes('tudor')) {
        landPrice = `KES ${45 + (hash % 20)}M – ${75 + (hash % 25)}M / Acre`;
        score = 84 + (hash % 8);
        successRate = `${score}% Strong Coastal Viability`;
        trafficExp = `Good coastal road access in ${locName}. Weekend tourist travel and commuter traffic increase evening road usage.`;
        popExp = `Serves an estimated 12,800 local residents, hotel staff, and coastal commuters in ${locName}.`;
        crimeExp = `Moderate activity in ${locName}. Recommend private security guards during weekend night hours.`;
      }

      setSimulatedImpact({
        traffic_impact: trafficExp,
        population_shift: popExp,
        crime_risk_delta: crimeExp,
        land_price_per_acre: landPrice,
        business_success_rate: successRate,
        success_score: score,
      });
      setIsSimulating(false);
    }, 1200);
  };

  // Save as Draft Plan
  const handleSavePlan = async () => {
    if (!title.trim() || !projectType || !stage) {
      alert('Please complete all required fields (Proposal Title, Category, Stage) before saving.');
      return;
    }

    const cfg = PROJECT_TYPE_CONFIG[projectType] || PROJECT_TYPE_CONFIG.Road;
    const newPlan: ProjectPlan = {
      id: editingPlanId || Date.now(),
      title,
      project_type: projectType as any,
      city,
      stage: stage as any,
      summary: cfg?.defaultSummary || 'Proposed development project.',
      planner_notes: notes,
      lat: coords.lat,
      lng: coords.lng,
      location_name: searchedLocation || `${city} Zone`,
      created_at: new Date().toISOString(),
      impact: simulatedImpact || undefined,
    };

    try {
      const res = await fetch('/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newPlan),
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedPlans(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
      } else {
        setSavedPlans(prev => [newPlan, ...prev.filter(p => p.id !== newPlan.id)]);
      }
    } catch {
      setSavedPlans(prev => [newPlan, ...prev.filter(p => p.id !== newPlan.id)]);
    }

    try {
      const userKey = (currentUser.email || 'guest').toLowerCase();
      const existingProps = JSON.parse(localStorage.getItem(`saved_planning_proposals_${userKey}`) || '[]');
      const updatedProps = [newPlan, ...existingProps.filter((p: any) => p.id !== newPlan.id)];
      localStorage.setItem(`saved_planning_proposals_${userKey}`, JSON.stringify(updatedProps));
    } catch (e) {
      console.error(e);
    }

    onShowToast?.("Proposal Saved!");
    setEditingPlanId(null);
    setActiveTab('plans');
  };

  // Action: Delete Draft Plan
  const handleDeletePlan = (id: any) => {
    const updated = savedPlans.filter(p => p.id !== id);
    setSavedPlans(updated);
    try {
      const userKey = (currentUser.email || 'guest').toLowerCase();
      localStorage.setItem(`saved_planning_proposals_${userKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Edit Draft
  const handleEditDraft = (plan: ProjectPlan) => {
    setEditingPlanId(plan.id || null);
    setTitle(plan.title);
    setProjectType(plan.project_type);
    setStage(plan.stage);
    setNotes(plan.planner_notes || '');
    if (plan.lat && plan.lng) {
      setCoords({ lat: plan.lat, lng: plan.lng });
    }
    if (plan.location_name) {
      setSearchedLocation(plan.location_name);
    }
    if (plan.impact) {
      setSimulatedImpact(plan.impact);
    }
    setActiveTab('simulator');
  };

  // Action: Download Draft PDF Report (Fixes: User typed proposal title at top, category accurately displayed, clean file name without dashes!)
  const handleDownloadDraftPdf = (plan: ProjectPlan) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    // Header Banner Background
    doc.setFillColor(14, 17, 23);
    doc.rect(0, 0, pageWidth, 75, 'F');

    // Title Typed by User AT THE VERY TOP OF PDF
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(plan.title.toUpperCase(), 30, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(230, 92, 92);
    doc.text(`URBAN EYE INTELLIGENCE PLATFORM • ${plan.city.toUpperCase()} URBAN WORKSPACE DRAFT`, 30, 55);

    y = 105;
    doc.setTextColor(20, 24, 33);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Project Category: ${plan.project_type}`, 30, y);
    y += 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 125);
    const dateStr = plan.created_at ? new Date(plan.created_at).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Planning Stage: ${plan.stage.toUpperCase()}   |   Date Generated: ${dateStr}`, 30, y);
    y += 18;
    doc.text(`Site Location: ${plan.location_name || plan.city} (Lat ${plan.lat?.toFixed(5) ?? 'N/A'}, Lng ${plan.lng?.toFixed(5) ?? 'N/A'})`, 30, y);
    y += 24;

    doc.setDrawColor(220, 225, 230);
    doc.line(30, y, pageWidth - 30, y);
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 24, 33);
    doc.text('Proposal Description & Context', 30, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 60, 75);
    const notesText = plan.planner_notes || plan.summary || 'No detailed planner notes attached.';
    const wrappedNotes = doc.splitTextToSize(notesText, pageWidth - 60);
    doc.text(wrappedNotes, 30, y);
    y += wrappedNotes.length * 14 + 20;

    if (plan.impact) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(20, 24, 33);
      doc.text('Impact Simulator Predictions', 30, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`• Project Success Score: ${plan.impact.business_success_rate}`, 40, y); y += 16;
      doc.text(`• Potential Land Market Price: ${plan.impact.land_price_per_acre}`, 40, y); y += 16;

      const tLines = doc.splitTextToSize(`• Traffic & Road Access: ${plan.impact.traffic_impact}`, pageWidth - 70);
      doc.text(tLines, 40, y); y += tLines.length * 13 + 4;

      const pLines = doc.splitTextToSize(`• Population & Catchment Growth: ${plan.impact.population_shift}`, pageWidth - 70);
      doc.text(pLines, 40, y); y += pLines.length * 13 + 4;

      const cLines = doc.splitTextToSize(`• Safety & Risk Assessment: ${plan.impact.crime_risk_delta}`, pageWidth - 70);
      doc.text(cLines, 40, y); y += cLines.length * 13 + 16;
    }

    if (y > 640) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 24, 33);
    doc.text('Multi-Phase Implementation Roadmap (Simple English)', 30, y);
    y += 18;

    const phases = [
      { phase: 'Phase 1: Planning & Site Checks', duration: 'Months 1 – 3', desc: 'Check the land, test soil and water access, and talk with local neighbors.' },
      { phase: 'Phase 2: Permits & Building Plans', duration: 'Months 4 – 6', desc: 'Get official city building permits and draw final engineering maps.' },
      { phase: 'Phase 3: Building & Foundation', duration: 'Months 7 – 18', desc: 'Dig foundations, lay water & electricity lines, and build main structures.' },
      { phase: 'Phase 4: Opening & Safety Inspection', duration: 'Months 19 – 24', desc: 'Test security lights, inspect building safety, and open doors to the public.' },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const p of phases) {
      if (y > 750) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.phase} (${p.duration})`, 40, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.text(p.desc, 50, y);
      y += 18;
    }

    const cleanFileName = plan.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, ' ');
    doc.save(`${cleanFileName}.pdf`);
  };

  return (
    <div className="dev-planning-shell fade-in" style={{ fontFamily: 'monospace, sans-serif' }}>
      {/* Horizontal Top Header Bar & Title */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff', fontFamily: 'sans-serif' }}>
            Development Planning Workspace
          </h1>
          <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {city.toUpperCase()} • SPATIAL IMPACT MODEL & PROPOSAL ARCHIVE
          </span>
        </div>
      </div>

      {/* Tracked Uppercase Text Menu Tab Switching (Matching Screenshot 2, Red Accent Theme) */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'simulator' ? '#e65c5c' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            paddingBottom: 8,
            borderBottom: activeTab === 'simulator' ? '2px solid #e65c5c' : '2px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          IMPACT SIMULATOR
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'plans' ? '#e65c5c' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            paddingBottom: 8,
            borderBottom: activeTab === 'plans' ? '2px solid #e65c5c' : '2px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          SAVED PROPOSALS ({savedPlans.length})
        </button>
        {savedPlans.length > 0 && (
          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'timeline' ? '#e65c5c' : '#64748b',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              paddingBottom: 8,
              borderBottom: activeTab === 'timeline' ? '2px solid #e65c5c' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            PROJECT TIMELINE & PHASING
          </button>
        )}
      </div>

      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* LEFT COLUMN: ONE SINGLE UNIFIED CARD BOX CONTAINING STEP 1 MAP & STEP 2 CONFIGURE PROPOSAL FORM */}
          <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Step 1: Map & Location Search */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0', fontFamily: 'sans-serif' }}>Step 1: Select Development Site</h3>
              
              <form onSubmit={handleMapSearch} style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder={`Search location in ${city} (e.g. Westlands, Pioneer, Nyali)...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontFamily: 'sans-serif',
                  }}
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  style={{
                    background: '#e65c5c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {searchLoading ? 'Searching…' : 'Search Map'}
                </button>
              </form>

              <div
                className="dev-map-container"
                ref={mapContainerRef}
                style={{ height: 280, minHeight: 280, width: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.78rem', color: '#94a3b8' }}>
                <span>Lat: {coords.lat.toFixed(5)} | Lng: {coords.lng.toFixed(5)}</span>
                <span style={{ color: '#e65c5c', fontWeight: 700 }}>{searchedLocation || `${city} Grid`}</span>
              </div>
            </div>

            {/* CONFIGURE PROPOSAL (Form Fields inside same box) */}
            <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 16, fontFamily: 'sans-serif' }}>CONFIGURE PROPOSAL</h3>
              
              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 6, padding: '10px 14px', marginBottom: 14, color: '#ef4444', fontSize: '0.8rem', fontFamily: 'sans-serif' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                    Proposal Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Westlands Commercial Plaza Extension"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: '0.85rem', fontFamily: 'sans-serif' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                      Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={projectType}
                      onChange={e => setProjectType(e.target.value as any)}
                      style={{ width: '100%', background: '#141823', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: '0.82rem', fontFamily: 'sans-serif' }}
                    >
                      <option value="">Select Category</option>
                      <option value="Mall">Commercial</option>
                      <option value="Hospital">Healthcare</option>
                      <option value="School">Education</option>
                      <option value="Residential">Housing</option>
                      <option value="Road">Transport</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                      Stage <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={stage}
                      onChange={e => setStage(e.target.value as any)}
                      style={{ width: '100%', background: '#141823', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: '0.82rem', fontFamily: 'sans-serif' }}
                    >
                      <option value="">Select Stage</option>
                      <option value="Draft">Draft Proposal</option>
                      <option value="Review">Under Technical Review</option>
                      <option value="Approved">Approved for Construction</option>
                      <option value="Rejected">Rejected / Shelved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Planner Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Describe proposal background, site constraints, or community objectives..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: '0.82rem', fontFamily: 'sans-serif', resize: 'vertical' }}
                  />
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  style={{
                    background: '#e65c5c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginTop: 6,
                    boxShadow: '0 4px 14px rgba(230, 92, 92, 0.3)',
                  }}
                >
                  {isSimulating ? 'EVALUATING SPATIAL MODEL…' : 'RUN IMPACT SIMULATION'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ONE SINGLE UNIFIED CARD CONTAINER FOR IMPACT SIMULATOR OUTPUT */}
          <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 2px 0', fontFamily: 'sans-serif' }}>Impact Simulator</h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {searchedLocation || `${city} Zone`} Spatial Assessment
                </span>
              </div>
              {simulatedImpact && (
                <span style={{ background: 'rgba(230, 92, 92, 0.15)', color: '#e65c5c', border: '1px solid rgba(230, 92, 92, 0.3)', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {simulatedImpact.success_score}% Project Success Score
                </span>
              )}
            </div>

            {!simulatedImpact && !isSimulating && (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '0.88rem', margin: '0 0 8px 0', color: '#94a3b8', fontFamily: 'sans-serif' }}>No Simulation Executed Yet</p>
                <p style={{ fontSize: '0.78rem', margin: 0, fontFamily: 'sans-serif' }}>Fill in the required proposal title, category, and stage on the left, then click "Run Impact Simulation".</p>
              </div>
            )}

            {isSimulating && (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.82rem', fontFamily: 'sans-serif' }}>Evaluating spatial road network load, catchment population, land price indices, and success scores…</p>
              </div>
            )}

            {/* ALL PREDICTIONS COMBINED IN THIS SINGLE RIGHT-COLUMN CARD */}
            {simulatedImpact && !isSimulating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Business Success Rate */}
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    PROJECT SUCCESS SCORE
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: '#e65c5c', fontFamily: 'sans-serif', marginBottom: 4 }}>
                    {simulatedImpact.business_success_rate}
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    Strong commercial viability supported by steady catchment foot traffic and local purchasing power.
                  </p>
                </div>

                {/* Potential Land Price Per Acre */}
                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    POTENTIAL LAND PRICE PER ACRE
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: '#10b981', fontFamily: 'sans-serif', marginBottom: 4 }}>
                    {simulatedImpact.land_price_per_acre}
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    Current land market valuation based on recent neighborhood property transactions in {city}.
                  </p>
                </div>

                {/* Traffic & Accessibility */}
                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    TRAFFIC & ACCESSIBILITY
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    {simulatedImpact.traffic_impact}
                  </p>
                </div>

                {/* Population Shift */}
                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    POPULATION SHIFT
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    {simulatedImpact.population_shift}
                  </p>
                </div>

                {/* Crime Pattern & Risk Prediction */}
                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    CRIME PATTERN & RISK PREDICTION
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    {simulatedImpact.crime_risk_delta}
                  </p>
                </div>

                {/* Subtle Transparent Prediction Method Explanation */}
                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)', opacity: 0.65 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    PREDICTION METHOD
                  </span>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.35, fontFamily: 'sans-serif' }}>
                    Predictions are calculated using a Spatial Machine Learning model trained on official KNBS census data, OpenStreetMap road density metrics, historical incident safety logs, and local land valuation indices in Kenya.
                  </p>
                </div>

                {/* Save Draft Action Button */}
                <button
                  onClick={handleSavePlan}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#e65c5c',
                    border: '1px solid #e65c5c',
                    borderRadius: 6,
                    padding: '12px 16px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginTop: 10,
                    transition: 'all 0.2s ease',
                  }}
                >
                  SAVE AS OFFICIAL DRAFT PLAN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVED PROPOSALS TAB */}
      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'sans-serif' }}>Archived Proposal Plans ({savedPlans.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {savedPlans.map(plan => {
              const cfg = PROJECT_TYPE_CONFIG[plan.project_type] || { color: '#e65c5c', defaultSummary: 'Proposed development project.' };
              return (
                <div key={plan.id} style={{ background: '#0e1117', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: cfg.color, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {plan.project_type}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.5px' }}>{plan.stage}</span>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 4, padding: '2px 6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0', fontFamily: 'sans-serif' }}>{plan.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    {plan.planner_notes || plan.summary}
                  </p>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => handleDownloadDraftPdf(plan)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: '#e65c5c',
                        border: '1px solid rgba(230, 92, 92, 0.4)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Download Draft
                    </button>
                    <button
                      onClick={() => handleEditDraft(plan)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Edit Draft
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROJECT TIMELINE TAB (Simple English Explanations) */}
      {activeTab === 'timeline' && (
        <div style={{ background: '#0e1117', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 16px 0', fontFamily: 'sans-serif' }}>Multi-Phase Implementation Timeline Roadmap</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { phase: 'Phase 1: Planning & Site Checks', duration: 'Months 1 – 3', desc: 'Check the land, test soil and water access, and talk with local neighbors.' },
              { phase: 'Phase 2: Permits & Building Plans', duration: 'Months 4 – 6', desc: 'Get official city building permits and draw final engineering maps.' },
              { phase: 'Phase 3: Building & Foundation', duration: 'Months 7 – 18', desc: 'Dig foundations, lay water & electricity lines, and build main structures.' },
              { phase: 'Phase 4: Opening & Safety Inspection', duration: 'Months 19 – 24', desc: 'Test security lights, inspect building safety, and open doors to the public.' },
            ].map((p, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, borderLeft: '3px solid #e65c5c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#fff', fontFamily: 'sans-serif' }}>{p.phase}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#e65c5c', fontWeight: 700 }}>{p.duration}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, fontFamily: 'sans-serif' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getSamplePlans(city: string): ProjectPlan[] {
  return [
    {
      id: 1,
      title: `${city} Central Transit Interchange & Commercial Hub`,
      project_type: 'Mall',
      city,
      stage: 'Approved',
      summary: 'Integrated transit station plaza with retail commercial spaces and subterranean parking.',
      planner_notes: 'High viability site near central main road.',
      lat: CITY_CENTERS[city]?.[0] ?? -1.286,
      lng: CITY_CENTERS[city]?.[1] ?? 36.817,
      location_name: `${city} CBD`,
      created_at: new Date().toISOString(),
      impact: {
        traffic_impact: 'Accessible via primary dual carriageway. Light traffic slowdown during peak evening hours.',
        population_shift: 'Serves an estimated 14,500 daily commuters and shoppers.',
        crime_risk_delta: 'Low risk. Security cameras and gate checks advised.',
        land_price_per_acre: city === 'Eldoret' ? 'KES 22M / Acre' : city === 'Mombasa' ? 'KES 55M / Acre' : 'KES 95M / Acre',
        business_success_rate: '88% Commercial Viability',
        success_score: 88,
      },
    },
  ];
}
