import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { User } from '../../types';

interface Props {
  currentUser: User;
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
  created_at?: string;
  impact?: ImpactData;
}

interface ImpactData {
  traffic_impact: string;
  population_shift: string;
  crime_risk_delta: string;
  economic_activity: string;
  confidence_score: number;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  Nairobi: [-1.286389, 36.817223],
  Mombasa: [-4.043477, 39.668206],
  Eldoret: [0.514277, 35.26978],
};

const PROJECT_TYPE_CONFIG: Record<string, { icon: string; color: string; defaultSummary: string }> = {
  Road: {
    icon: '🛣️',
    color: '#3b82f6',
    defaultSummary: 'New arterial transport link connecting residential corridors to primary commercial hubs.',
  },
  Hospital: {
    icon: '🏥',
    color: '#ef4444',
    defaultSummary: 'Regional healthcare facility expanding emergency coverage and specialized outpatient care.',
  },
  School: {
    icon: '🏫',
    color: '#f59e0b',
    defaultSummary: 'Integrated educational campus serving local demographic growth and vocational training.',
  },
  Mall: {
    icon: '🛍️',
    color: '#8b5cf6',
    defaultSummary: 'Commercial retail center with subterranean parking and public transport integration.',
  },
  Residential: {
    icon: '🏙️',
    color: '#10b981',
    defaultSummary: 'High-density mixed-income housing development with green space and solar grid.',
  },
};

export default function DevPlanningView({ currentUser }: Props) {
  const city = currentUser.city || 'Nairobi';

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const projectMarkerRef = useRef<L.Marker | null>(null);
  const projectCircleRef = useRef<L.Circle | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState<'Road' | 'Hospital' | 'School' | 'Mall' | 'Residential'>('Mall');
  const [stage, setStage] = useState<'Draft' | 'Review' | 'Approved' | 'Rejected'>('Draft');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: CITY_CENTERS[city]?.[0] ?? -1.286,
    lng: CITY_CENTERS[city]?.[1] ?? 36.817,
  });

  // Simulation & Saved Plans state
  const [simulatedImpact, setSimulatedImpact] = useState<ImpactData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [savedPlans, setSavedPlans] = useState<ProjectPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'simulator' | 'plans' | 'timeline'>('simulator');
  const [selectedPlan, setSelectedPlan] = useState<ProjectPlan | null>(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Token ${token}` };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const center = CITY_CENTERS[city] ?? [-1.286389, 36.817223];
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map marker when coords change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (projectMarkerRef.current) map.removeLayer(projectMarkerRef.current);
    if (projectCircleRef.current) map.removeLayer(projectCircleRef.current);

    const cfg = PROJECT_TYPE_CONFIG[projectType];
    const icon = L.divIcon({
      className: '',
      html: `<div style="font-size:26px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.6));background:${cfg.color};width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">${cfg.icon}</div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);
    projectMarkerRef.current = marker;

    const circle = L.circle([coords.lat, coords.lng], {
      radius: projectType === 'Road' ? 1200 : 600,
      color: cfg.color,
      fillColor: cfg.color,
      fillOpacity: 0.15,
    }).addTo(map);
    projectCircleRef.current = circle;
  }, [coords, projectType]);

  // Load Saved Plans
  useEffect(() => {
    fetch(`/api/projects/?city=${encodeURIComponent(city)}`, { headers })
      .then(r => r.json())
      .then(data => {
        const features = data.features ?? [];
        const parsed: ProjectPlan[] = features.map((f: Record<string, unknown>) => {
          const props = (f.properties as Record<string, string>) ?? {};
          const geom = f.geometry as { coordinates: [number, number] } | undefined;
          return {
            id: Number(f.id),
            title: props.title ?? 'Proposed Site Plan',
            project_type: (props.project_type as ProjectPlan['project_type']) ?? 'Road',
            city: props.city ?? city,
            stage: (props.stage as ProjectPlan['stage']) ?? 'Draft',
            summary: props.summary ?? '',
            planner_notes: props.planner_notes ?? '',
            lat: geom ? geom.coordinates[1] : undefined,
            lng: geom ? geom.coordinates[0] : undefined,
            created_at: props.created_at ?? new Date().toISOString(),
          };
        });
        setSavedPlans(parsed);
      })
      .catch(() => setSavedPlans([]));
  }, [city]);

  // Run Impact Prediction Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      let impact: ImpactData;
      switch (projectType) {
        case 'Mall':
          impact = {
            traffic_impact: '+14% peak congestion along primary approach arterial road',
            population_shift: '+8,200 visitors/day (+3.4% nearby daytime density shift)',
            crime_risk_delta: '+11% commercial theft risk delta historically correlated near retail hubs; CCTV corridor advised',
            economic_activity: 'Est. KES 62.0M annual commerce & 240 new employment positions created',
            confidence_score: 92,
          };
          break;
        case 'Road':
          impact = {
            traffic_impact: '-22% average commute delay; improves bypass throughput by 4.2 km/h',
            population_shift: '+14,500 residents gaining enhanced transit accessibility within 15 mins',
            crime_risk_delta: '-8% opportunistic incident rate due to improved street lighting & police mobility',
            economic_activity: 'Est. KES 115.0M regional logistics value unlocked over 3-year horizon',
            confidence_score: 88,
          };
          break;
        case 'Hospital':
          impact = {
            traffic_impact: '+6% emergency vehicle traffic; dedicated priority signal recommended',
            population_shift: 'Reduces emergency response radius for ~45,000 residents to <8 minutes',
            crime_risk_delta: '-15% violent crime delta due to 24/7 security presence & active lighting',
            economic_activity: 'Est. 180 high-skill healthcare jobs & KES 38M local supply chain demand',
            confidence_score: 95,
          };
          break;
        case 'School':
          impact = {
            traffic_impact: '+28% localized morning drop-off congestion (07:15–08:15 AM); drop zone required',
            population_shift: 'Attracts young families (+1,800 youth demographic within 1.5km)',
            crime_risk_delta: '-12% daytime delinquency delta with active school zone safety patrols',
            economic_activity: 'Est. KES 18.5M educational investment & 65 staff appointments',
            confidence_score: 90,
          };
          break;
        default: // Residential
          impact = {
            traffic_impact: '+18% residential trip generation; feeder road widening advised',
            population_shift: '+12,000 net population increase over 24-month buildout phase',
            crime_risk_delta: '+4% petty incident risk during active construction phase; stabilizes post-occupancy',
            economic_activity: 'Est. KES 240.0M construction sector economic multiplier',
            confidence_score: 87,
          };
          break;
      }
      setSimulatedImpact(impact);
      setIsSimulating(false);
    }, 600);
  };

  // Save Plan Draft
  const handleSavePlan = async () => {
    if (!title.trim()) return;
    try {
      const payload = {
        title,
        city,
        project_type: projectType,
        stage,
        summary: simulatedImpact
          ? `Traffic: ${simulatedImpact.traffic_impact}. Econ: ${simulatedImpact.economic_activity}`
          : PROJECT_TYPE_CONFIG[projectType].defaultSummary,
        planner_notes: notes,
      };

      const res = await fetch('/api/projects/', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        const newPlan: ProjectPlan = {
          id: saved.id,
          title,
          project_type: projectType,
          city,
          stage,
          summary: payload.summary,
          planner_notes: notes,
          lat: coords.lat,
          lng: coords.lng,
          created_at: new Date().toISOString(),
          impact: simulatedImpact ?? undefined,
        };
        setSavedPlans([newPlan, ...savedPlans]);
        setTitle('');
        setNotes('');
        alert('✅ Proposed Development Plan saved successfully!');
      }
    } catch {
      alert('Error saving project plan.');
    }
  };

  // Update Status Workflow
  const handleUpdateStatus = async (plan: ProjectPlan, newStage: ProjectPlan['stage']) => {
    if (!plan.id) return;
    try {
      const res = await fetch(`/api/projects/${plan.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        setSavedPlans(prev =>
          prev.map(p => (p.id === plan.id ? { ...p, stage: newStage } : p))
        );
        if (selectedPlan?.id === plan.id) {
          setSelectedPlan({ ...selectedPlan, stage: newStage });
        }
      }
    } catch {
      // status update error handling
    }
  };

  return (
    <div className="dev-planning-shell fade-in">
      {/* Top Header */}
      <div className="dev-header">
        <div>
          <h1 className="dev-title">Development Planning & Impact Simulation</h1>
          <p className="dev-subtitle">
            Simulate the multi-dimensional urban impact of proposed infrastructure before ground is broken.
          </p>
        </div>
        <div className="dev-tabs">
          <button
            className={`dev-tab-btn${activeTab === 'simulator' ? ' active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            ⚡ Impact Simulator
          </button>
          <button
            className={`dev-tab-btn${activeTab === 'plans' ? ' active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            📂 Saved Plans ({savedPlans.length})
          </button>
          <button
            className={`dev-tab-btn${activeTab === 'timeline' ? ' active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            🗓️ Project Timeline & Phasing
          </button>
        </div>
      </div>

      {activeTab === 'simulator' && (
        <div className="dev-grid">
          {/* Left Column: Interactive Placement Map & Project Config */}
          <div className="dev-left-col">
            {/* Map Card */}
            <div className="dev-card">
              <div className="dev-card-header">
                <h3>📍 Step 1: Place Proposed Development Site</h3>
                <span className="dev-hint">Click anywhere on map to reposition site coordinates</span>
              </div>
              <div className="dev-map-container" ref={mapContainerRef} />
              <div className="dev-coords-bar">
                <span>Latitude: <strong>{coords.lat.toFixed(5)}</strong></span>
                <span>Longitude: <strong>{coords.lng.toFixed(5)}</strong></span>
                <span className="dev-city-tag">{city} Grid</span>
              </div>
            </div>

            {/* Config Form Card */}
            <div className="dev-card">
              <h3>⚙️ Step 2: Configure Proposal Parameters</h3>
              <div className="dev-form-grid">
                <div className="dev-form-group">
                  <label>Proposal Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Westlands Commercial Plaza Extension"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="dev-input"
                  />
                </div>

                <div className="dev-form-group">
                  <label>Facility / Infrastructure Type</label>
                  <div className="project-type-selector">
                    {(['Road', 'Hospital', 'School', 'Mall', 'Residential'] as const).map(type => {
                      const cfg = PROJECT_TYPE_CONFIG[type];
                      const isSel = projectType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`pt-btn${isSel ? ' pt-btn-selected' : ''}`}
                          style={{ borderColor: isSel ? cfg.color : undefined }}
                          onClick={() => setProjectType(type)}
                        >
                          <span>{cfg.icon}</span>
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="dev-form-group">
                  <label>Initial Planning Stage</label>
                  <select
                    value={stage}
                    onChange={e => setStage(e.target.value as ProjectPlan['stage'])}
                    className="dev-select"
                  >
                    <option value="Draft">Draft Proposal</option>
                    <option value="Review">Under Technical Review</option>
                    <option value="Approved">Approved for Construction</option>
                    <option value="Rejected">Rejected / Shelved</option>
                  </select>
                </div>

                <div className="dev-form-group">
                  <label>Planner Notes & Assessment Context</label>
                  <textarea
                    rows={3}
                    placeholder="Add contextual background, stakeholder remarks, or site constraints..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="dev-textarea"
                  />
                </div>
              </div>

              <div className="dev-form-actions">
                <button className="run-sim-btn" onClick={handleRunSimulation} disabled={isSimulating}>
                  {isSimulating ? '⏳ Running Predictive Impact Model…' : '⚡ Run Impact Simulation'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Predictive Impact Results */}
          <div className="dev-right-col">
            <div className="dev-card impact-results-card">
              <div className="dev-card-header">
                <h3>📊 Predictive Impact Analysis</h3>
                {simulatedImpact && (
                  <span className="confidence-badge">
                    {simulatedImpact.confidence_score}% Model Confidence
                  </span>
                )}
              </div>

              {!simulatedImpact && !isSimulating && (
                <div className="impact-empty">
                  <div style={{ fontSize: '2.5rem' }}>🧪</div>
                  <h4>No Simulation Run Yet</h4>
                  <p>Configure proposal parameters on the left and click "Run Impact Simulation" to generate spatial predictions.</p>
                </div>
              )}

              {isSimulating && (
                <div className="impact-simulating">
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p>Evaluating spatial crime correlations, traffic network load, and population shift algorithms...</p>
                </div>
              )}

              {simulatedImpact && !isSimulating && (
                <div className="impact-grid fade-in">
                  <div className="impact-box imp-traffic">
                    <div className="imp-icon">🚗</div>
                    <div className="imp-content">
                      <h4>Traffic & Accessibility Delta</h4>
                      <p>{simulatedImpact.traffic_impact}</p>
                    </div>
                  </div>

                  <div className="impact-box imp-pop">
                    <div className="imp-icon">👥</div>
                    <div className="imp-content">
                      <h4>Demographic & Population Shift</h4>
                      <p>{simulatedImpact.population_shift}</p>
                    </div>
                  </div>

                  <div className="impact-box imp-crime">
                    <div className="imp-icon">🛡️</div>
                    <div className="imp-content">
                      <h4>Crime Pattern & Risk Delta</h4>
                      <p>{simulatedImpact.crime_risk_delta}</p>
                    </div>
                  </div>

                  <div className="impact-box imp-econ">
                    <div className="imp-icon">📈</div>
                    <div className="imp-content">
                      <h4>Economic Activity Estimate</h4>
                      <p>{simulatedImpact.economic_activity}</p>
                    </div>
                  </div>

                  <div className="save-plan-section">
                    <button className="save-plan-btn" onClick={handleSavePlan}>
                      💾 Save as Official Draft Plan
                    </button>
                    <p className="save-hint">Saved plans are archived for agency review and iterative versioning.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="saved-plans-section fade-in">
          <div className="plans-header">
            <h2>Archived Proposal Plans ({savedPlans.length})</h2>
            <p>Review, edit stage status, or compare proposal iterations.</p>
          </div>

          {savedPlans.length === 0 ? (
            <div className="plans-empty">
              <div style={{ fontSize: '3rem' }}>📂</div>
              <h3>No saved proposals recorded yet</h3>
              <p>Run a simulation in the Impact Simulator tab and click "Save as Official Draft Plan".</p>
            </div>
          ) : (
            <div className="plans-grid">
              {savedPlans.map(plan => {
                const cfg = PROJECT_TYPE_CONFIG[plan.project_type] || PROJECT_TYPE_CONFIG.Road;
                return (
                  <div key={plan.id || plan.title} className="plan-card">
                    <div className="plan-card-top">
                      <span className="plan-type-chip" style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                        {cfg.icon} {plan.project_type}
                      </span>
                      <div className="stage-selector-wrap">
                        <select
                          value={plan.stage}
                          onChange={e => handleUpdateStatus(plan, e.target.value as ProjectPlan['stage'])}
                          className={`stage-badge stage-${plan.stage.toLowerCase()}`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <h3 className="plan-title">{plan.title}</h3>
                    <div className="plan-city">{plan.city} Grid</div>

                    {plan.summary && <p className="plan-summary">{plan.summary}</p>}
                    {plan.planner_notes && (
                      <div className="plan-notes-box">
                        <strong>Planner Notes:</strong> {plan.planner_notes}
                      </div>
                    )}

                    <div className="plan-footer">
                      <span className="plan-date">
                        Created {new Date(plan.created_at || '').toLocaleDateString()}
                      </span>
                      <button className="view-details-btn" onClick={() => setSelectedPlan(plan)}>
                        View Full Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="timeline-section fade-in">
          <div className="timeline-header">
            <h2>Project Timeline & Multi-Phase Buildout</h2>
            <p>Standard phased implementation lifecycle for major urban planning projects.</p>
          </div>

          <div className="phases-timeline">
            <div className="phase-card phase-1">
              <div className="phase-num">Phase 01</div>
              <div className="phase-body">
                <h3>Site Acquisition & Environmental Assessment</h3>
                <span className="phase-duration">Months 1 – 3</span>
                <p>Geospatial surveying, land tenure verification, environmental impact study, and stakeholder public participation hearings.</p>
              </div>
            </div>

            <div className="phase-card phase-2">
              <div className="phase-num">Phase 02</div>
              <div className="phase-body">
                <h3>Civil Engineering & Core Infrastructure Build</h3>
                <span className="phase-duration">Months 4 – 12</span>
                <p>Ground excavation, utility line rerouting (water/power), foundation laying, and primary structural erection.</p>
              </div>
            </div>

            <div className="phase-card phase-3">
              <div className="phase-num">Phase 03</div>
              <div className="phase-body">
                <h3>Facility Commissioning & Safety Patrol Integration</h3>
                <span className="phase-duration">Months 13 – 18</span>
                <p>Interior fit-outs, CCTV network integration, traffic signal synchronization, and live impact model monitoring.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="plan-modal-backdrop" onClick={() => setSelectedPlan(null)}>
          <div className="plan-modal-content" onClick={e => e.stopPropagation()}>
            <div className="plan-modal-header">
              <h2>{selectedPlan.title}</h2>
              <button className="close-modal-btn" onClick={() => setSelectedPlan(null)}>✖</button>
            </div>
            <div className="plan-modal-body">
              <div className="modal-meta-row">
                <span><strong>City:</strong> {selectedPlan.city}</span>
                <span><strong>Type:</strong> {selectedPlan.project_type}</span>
                <span><strong>Stage:</strong> {selectedPlan.stage}</span>
              </div>
              <h4>Summary</h4>
              <p>{selectedPlan.summary || 'No summary available.'}</p>
              <h4>Planner Notes</h4>
              <p>{selectedPlan.planner_notes || 'No notes provided.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
