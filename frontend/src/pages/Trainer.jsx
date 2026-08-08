import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Trophy, ArrowLeft, RefreshCw, Zap, Heart, DollarSign, 
  CheckCircle, ShieldAlert, Award, Star, BookOpen, ChevronRight,
  MessageSquare, User, AlertCircle, ShieldCheck, HelpCircle, Activity,
  Split, Play, BarChart2, Check, AlertTriangle
} from 'lucide-react';

const MISSIONS = [
  {
    id: 'mission_billing',
    name: 'Sarah: Billing Dispute Crisis',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    difficulty: 'Hard',
    clv: 12000,
    budget: 2500,
    targetSentiment: 80,
    objections: ['CC Double Charge Refund', 'Checkout Page Errors Fix'],
    description: 'Sarah is furious after checkout errors double-charged her credit card. Apologize and resolve it without blowing your budget.',
    turns: [
      {
        customerText: "I want to close my account today. I experienced three checkout page errors and your system has double charged my card! Support has ignored me.",
        options: [
          {
            label: "Acknowledge error and apologize immediately",
            text: "I am incredibly sorry for this experience, Sarah. I see the double billing on our side and want to resolve this for you right away. Let me look into this.",
            budgetCost: 0,
            sentimentBoost: 20,
            resolveObjection: null,
            coachComment: "Good! Apologizing first builds trust before discussing money."
          },
          {
            label: "Offer 30% discount code right away",
            text: "I understand you are upset. Here is a 30% discount coupon code (XENO30) to make up for the trouble.",
            budgetCost: 3600, // exceeds budget!
            sentimentBoost: 10,
            resolveObjection: null,
            coachComment: "Too aggressive! Apologizing is free; offering 30% immediately drained your budget."
          },
          {
            label: "Escalate tech engineering queue",
            text: "I have escalated the checkout bug to our engineering team so it won't happen again.",
            budgetCost: 0,
            sentimentBoost: 10,
            resolveObjection: 'Checkout Page Errors Fix',
            coachComment: "Good technical step, but Sarah is still waiting to hear about her stolen money!"
          },
          {
            label: "Deflect to terms of service agreement",
            text: "Please note billing processing errors are handled in our Terms of Service under section 4. Refund windows take 5-7 business days.",
            budgetCost: 0,
            sentimentBoost: -15,
            resolveObjection: null,
            coachComment: "Ouch! Quoting terms of service to a frustrated client makes them churn immediately."
          }
        ]
      },
      {
        customerText: "Okay, I appreciate the apology, but what about my double charge? I need my money refunded to my credit card.",
        options: [
          {
            label: "Trigger CC Double Refund",
            text: "I have triggered an immediate refund of the duplicate charge (₹1,000) back to your card. You will see it in 24 hours.",
            budgetCost: 1000,
            sentimentBoost: 30,
            resolveObjection: 'CC Double Charge Refund',
            coachComment: "Perfect! Addressing the core financial pain-point satisfies her complaint."
          },
          {
            label: "Offer 20% Discount Coupon",
            text: "I cannot refund the credit card directly, but I can add a 20% discount code to your next billing cycle.",
            budgetCost: 2400,
            sentimentBoost: 5,
            resolveObjection: null,
            coachComment: "Incorrect. The customer wants her cash refund, not future discounts."
          },
          {
            label: "Escalate tech engineering queue",
            text: "I have submitted a support ticket to verify the technical ledger lines on our billing gateway.",
            budgetCost: 0,
            sentimentBoost: 5,
            resolveObjection: 'Checkout Page Errors Fix',
            coachComment: "Useful, but she is still demanding her refund."
          },
          {
            label: "Ask customer to contact their bank",
            text: "You will need to contact your card-issuing bank and file a chargeback dispute for the duplicate charge.",
            budgetCost: 0,
            sentimentBoost: -10,
            resolveObjection: null,
            coachComment: "Telling the customer to open a bank dispute is a major failure and hurts credit relations."
          }
        ]
      },
      {
        customerText: "Excellent, the refund is sorted. But how do I know the checkout page is stable? I don't want to get double charged again next month.",
        options: [
          {
            label: "Confirm checkout bug resolution",
            text: "Our core engineering team has deployed a hotfix patch to the payment gateway. The duplicate charge loop is now permanently resolved.",
            budgetCost: 0,
            sentimentBoost: 25,
            resolveObjection: 'Checkout Page Errors Fix',
            coachComment: "Perfect closure! Providing reassurance guarantees retention."
          },
          {
            label: "Offer VIP Premium Upgrade (3mo)",
            text: "To restore your confidence, I've upgraded your account to VIP Premium features for the next 3 months at zero cost.",
            budgetCost: 600,
            sentimentBoost: 20,
            resolveObjection: null,
            coachComment: "Generous offer! High sentiment return, though it draws from your remaining budget."
          },
          {
            label: "Suggest using alternative payment methods",
            text: "We recommend using PayPal or bank transfers next time instead of credit cards to avoid checkout issues.",
            budgetCost: 0,
            sentimentBoost: -5,
            resolveObjection: null,
            coachComment: "Avoiding your own system flaws looks unprofessional."
          },
          {
            label: "Thank them and close the ticket",
            text: "Great! Glad to hear the refund resolved the issues. I'll close this support ticket now. Have a nice day!",
            budgetCost: 0,
            sentimentBoost: 5,
            resolveObjection: null,
            coachComment: "A bit abrupt, but the core objections are resolved."
          }
        ]
      }
    ]
  },
  {
    id: 'mission_competitor',
    name: 'David: Competitor Price Match',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    difficulty: 'Medium',
    clv: 8000,
    budget: 1200,
    targetSentiment: 80,
    objections: ['Competitive Price Matching', 'Lower Cost Pricing Tier Plan'],
    description: 'David wants to switch to ChurnGuard because they offer a cheaper plan. Keep him without giving away too much discount.',
    turns: [
      {
        customerText: "I am considering switching my team to ChurnGuard's competitor. Their base plan is cheaper than yours. Can you match their discount or should I terminate?",
        options: [
          {
            label: "Explain core unique value propositions",
            text: "While ChurnGuard is cheaper, they do not include real-time ML risk predictions and time-travel journey branching features like Xeno does.",
            budgetCost: 0,
            sentimentBoost: 15,
            resolveObjection: null,
            coachComment: "Excellent! Leading with value instead of discount protects margins."
          },
          {
            label: "Offer 25% discount immediately",
            text: "I can match their pricing by giving you a 25% discount coupon (code: XENO25) starting today.",
            budgetCost: 2000, // exceeds budget!
            sentimentBoost: 25,
            resolveObjection: 'Competitive Price Matching',
            coachComment: "Too expensive! You matched the price but depleted your resource pool."
          },
          {
            label: "Offer VIP Premium Upgrade (3mo)",
            text: "I want you to experience our full potential. I've upgraded your team to VIP features for the next 3 months free of charge.",
            budgetCost: 600,
            sentimentBoost: 15,
            resolveObjection: null,
            coachComment: "Excellent compromise. High value, low budget draw."
          },
          {
            label: "Tell them to go ahead and switch",
            text: "We do not offer price matching. You can cancel your subscription inside the billing profile anytime.",
            budgetCost: 0,
            sentimentBoost: -30,
            resolveObjection: null,
            coachComment: "Absolute failure! You let a high-value customer walk away without a fight."
          }
        ]
      },
      {
        customerText: "Xeno's AI tools are great, but my department budget is tight. ChurnGuard is still 15% cheaper. I need a discount or a lower plan to make this work.",
        options: [
          {
            label: "Recommend shifting to Lite tier + 10% coupon",
            text: "We can transition you to our Lite plan and apply a 10% discount coupon (code: XENO10), lowering your monthly cost by 20% overall.",
            budgetCost: 800,
            sentimentBoost: 25,
            resolveObjection: 'Lower Cost Pricing Tier Plan',
            coachComment: "Brilliant! Downtrading to a Lite tier satisfies their budget while retaining contract relationship."
          },
          {
            label: "Offer flat 15% discount",
            text: "I can offer you a 15% discount code (XENO15) to match their price line.",
            budgetCost: 1200,
            sentimentBoost: 20,
            resolveObjection: 'Competitive Price Matching',
            coachComment: "Solid. This is the maximum budget threshold for this account."
          },
          {
            label: "Insist on current package features",
            text: "I cannot lower our prices. Our standard packages are already optimized for maximum utility.",
            budgetCost: 0,
            sentimentBoost: -10,
            resolveObjection: null,
            coachComment: "Stonewalling a budget-constrained client will push them to cancel."
          },
          {
            label: "Offer free shipping/onboarding",
            text: "I can offer you free onboarding consults and waive setup fees.",
            budgetCost: 100,
            sentimentBoost: 5,
            resolveObjection: null,
            coachComment: "Not relevant. David is complaining about monthly subscription fees, not setup costs."
          }
        ]
      }
    ]
  }
];

export default function Trainer() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'ab_testing'

  // Interactive Case Simulator States
  const [activeMission, setActiveMission] = useState(null);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [chatLogs, setChatLogs] = useState([]);
  const [sentiment, setSentiment] = useState(35);
  const [remainingBudget, setRemainingBudget] = useState(1000);
  const [resolvedObjections, setResolvedObjections] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null); 
  const [points, setPoints] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState("Select your first tactical choice to begin the simulation.");
  const [historyLogs, setHistoryLogs] = useState([]);

  // A/B Script Testing Lab States
  const [abScenario, setAbScenario] = useState('sarah');
  const [scriptA, setScriptA] = useState("I apologize for the billing checkout failure. I have submitted an immediate bank refund of ₹1,000 for the double charge and escalated the gateway bug to priority fix.");
  const [scriptB, setScriptB] = useState("I am sorry for the hassle. To compensate, I can generate a 30% discount coupon code (XENO30) to reduce your next billing payment cycles.");
  const [cohortSize, setCohortSize] = useState(50);
  const [abRunning, setAbRunning] = useState(false);
  const [abResults, setAbResults] = useState(null);
  const [abAudit, setAbAudit] = useState("");
  const [abProgress, setAbProgress] = useState(0);

  // Load local score history
  useEffect(() => {
    const cached = localStorage.getItem('xeno_trainer_history');
    if (cached) {
      setHistoryLogs(JSON.parse(cached));
    }
  }, []);

  const selectMission = (m) => {
    setActiveMission(m);
    setCurrentTurnIdx(0);
    setSentiment(35);
    setRemainingBudget(m.budget);
    setResolvedObjections([]);
    setGameOver(false);
    setGameResult(null);
    setPoints(0);
    setCoachFeedback("Select your first tactical choice to begin the simulation.");
    setChatLogs([
      {
        sender: 'customer',
        text: m.turns[0].customerText
      }
    ]);
  };

  const handleSelectOption = (opt) => {
    if (gameOver) return;

    const nextBudget = Math.max(0, remainingBudget - opt.budgetCost);
    const nextSentiment = Math.min(100, Math.max(0, sentiment + opt.sentimentBoost));
    setRemainingBudget(nextBudget);
    setSentiment(nextSentiment);
    setCoachFeedback(opt.coachComment);

    let nextResolved = [...resolvedObjections];
    if (opt.resolveObjection && !nextResolved.includes(opt.resolveObjection)) {
      nextResolved.push(opt.resolveObjection);
      setResolvedObjections(nextResolved);
      toast.success(`Objection Resolved: ${opt.resolveObjection}!`, { icon: '🎯' });
    }

    const newLogs = [
      ...chatLogs,
      { sender: 'agent', text: opt.text, label: opt.label }
    ];

    const nextTurnIdx = currentTurnIdx + 1;

    if (nextTurnIdx >= activeMission.turns.length) {
      const allResolved = activeMission.objections.every(o => nextResolved.includes(o));
      const budgetSuccess = nextBudget > 0;
      const sentimentSuccess = nextSentiment >= activeMission.targetSentiment;

      const won = allResolved && sentimentSuccess && budgetSuccess;
      setGameOver(true);
      setGameResult(won ? 'win' : 'lost');

      if (won) {
        const finalScore = Math.round(nextSentiment * 15 + (nextBudget / activeMission.budget) * 500 + 300);
        setPoints(finalScore);
        toast.success(`Mission Cleared! Score: ${finalScore} points!`, { icon: '🏆', duration: 4000 });
        
        const newRun = {
          missionId: activeMission.id,
          missionName: activeMission.name,
          score: finalScore,
          date: new Date().toLocaleDateString(),
          result: 'Cleared'
        };
        const updatedHistory = [newRun, ...historyLogs.slice(0, 9)];
        setHistoryLogs(updatedHistory);
        localStorage.setItem('xeno_trainer_history', JSON.stringify(updatedHistory));
      } else {
        toast.error('Mission Failed. Objections unresolved or budget depleted.', { duration: 4000 });
      }
      setChatLogs(newLogs);
    } else {
      setCurrentTurnIdx(nextTurnIdx);
      setChatLogs([
        ...newLogs,
        { sender: 'customer', text: activeMission.turns[nextTurnIdx].customerText }
      ]);
    }
  };

  // Run A/B Batch Simulation
  const handleRunAbTest = async () => {
    setAbRunning(true);
    setAbResults(null);
    setAbAudit("");
    setAbProgress(0);

    // Simulate progress load
    const interval = setInterval(() => {
      setAbProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 150);

    try {
      // Direct call to our new backend audit route
      const res = await api.post('/customers/audit-scripts', {
        scenarioId: abScenario,
        scriptA,
        scriptB
      });

      // Calculate simulated stats locally based on script composition
      setTimeout(() => {
        const scoreA = 35 + (/apolog|sorry/i.test(scriptA) ? 25 : 5) + (/refund|fix|escalat/i.test(scriptA) ? 35 : 10);
        const scoreB = 35 + (/apolog|sorry/i.test(scriptB) ? 25 : 5) + (/refund|fix|escalat/i.test(scriptB) ? 35 : 10);

        const spentA = (/refund/i.test(scriptA) ? 1000 : 0) + (/discount|code|promo/i.test(scriptA) ? 800 : 0);
        const spentB = (/refund/i.test(scriptB) ? 1000 : 0) + (/discount|code|promo/i.test(scriptB) ? 800 : 0);

        const savedA = Math.round(cohortSize * (scoreA / 100));
        const savedB = Math.round(cohortSize * (scoreB / 100));

        setAbResults({
          scriptA: {
            saved: savedA,
            spent: spentA * savedA,
            avgSentiment: Math.min(95, scoreA),
            retentionRate: Math.round((savedA / cohortSize) * 100)
          },
          scriptB: {
            saved: savedB,
            spent: spentB * savedB,
            avgSentiment: Math.min(95, scoreB),
            retentionRate: Math.round((savedB / cohortSize) * 100)
          }
        });

        if (res.data.success) {
          setAbAudit(res.data.data.audit);
        }
        setAbRunning(false);
        toast.success("A/B Batch Simulation Complete!", { icon: '📊' });
      }, 1600);

    } catch (err) {
      clearInterval(interval);
      setAbRunning(false);
      toast.error("Audit simulation request failed");
    }
  };

  const currentTurn = activeMission?.turns[currentTurnIdx];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page">
        <Navbar />

        {/* Tab Selection Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <button 
              type="button" 
              onClick={() => { setActiveTab('cases'); setActiveMission(null); }}
              style={{ padding: '12px 6px', background: 'transparent', border: 0, color: activeTab === 'cases' ? '#00f0ff' : 'var(--muted)', fontSize: 13, fontWeight: 'bold', borderBottom: activeTab === 'cases' ? '2px solid #00f0ff' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Activity size={14} className="icon-activity" /> Case study center
            </button>
            <button 
              type="button" 
              onClick={() => { setActiveTab('ab_testing'); setActiveMission(null); }}
              style={{ padding: '12px 6px', background: 'transparent', border: 0, color: activeTab === 'ab_testing' ? '#00f0ff' : 'var(--muted)', fontSize: 13, fontWeight: 'bold', borderBottom: activeTab === 'ab_testing' ? '2px solid #00f0ff' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Split size={14} className="icon-split" /> A/B Script Testing Lab
            </button>
          </div>
          {activeMission && (
            <button className="btn ghost-btn" onClick={() => setActiveMission(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11 }}>
              <ArrowLeft size={12} /> Leave Case
            </button>
          )}
        </div>

        {activeTab === 'cases' ? (
          /* TAB 1: INTERACTIVE CASE SIMULATOR */
          <>
            {!activeMission ? (
              /* Case Selection Screen */
              <div className="grid" style={{ gridTemplateColumns: '1fr 300px', gap: 24, marginTop: 4, alignItems: 'start' }}>
                
                {/* Missions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card glass-card" style={{ padding: 22 }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>Operational Scenarios Overview</h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                      Practice CS crisis management. Select a structured scenario to make branching choices. Address key objections and manage budgets to claim rewards.
                    </p>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    {MISSIONS.map(m => (
                      <div key={m.id} className="card glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: m.difficulty === 'Hard' ? 'rgba(255,107,107,0.1)' : 'rgba(255,184,77,0.1)', color: m.difficulty === 'Hard' ? '#ff6b6b' : '#ffb84d', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              {m.difficulty}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>LTV: ₹{m.clv.toLocaleString()}</span>
                          </div>
                          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: '#fff' }}>{m.name}</h3>
                          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
                            {m.description}
                          </p>
                          
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, marginBottom: 16 }}>
                            <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Key Objections:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {m.objections.map((o, idx) => (
                                <span key={idx} style={{ fontSize: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>
                                  {o}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button" 
                          className="btn" 
                          onClick={() => selectMission(m)}
                          style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #00f0ff, #72f1b8)', color: '#04111b', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          Launch Mission <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Ledger board */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card glass-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Award size={16} color="#ffb84d" />
                      <h3 style={{ margin: 0, fontSize: 14 }}>Score History Ledger</h3>
                    </div>
                    {historyLogs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {historyLogs.map((run, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
                            <div>
                              <strong style={{ display: 'block', color: '#fff' }}>{run.missionName.split(':')[0]}</strong>
                              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{run.date}</span>
                            </div>
                            <span style={{ fontWeight: 'bold', color: '#00f0ff' }}>{run.score} pts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, padding: '20px 0' }}>
                        No recorded training runs found. Clear missions to set record scores.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* Active Interactive Case Simulation Screen */
              <div className="grid" style={{ gridTemplateColumns: '290px 1fr 280px', gap: 20, marginTop: 4, alignItems: 'start' }}>
                
                {/* Left Column stats panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card glass-card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Target Account Profile</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <img src={activeMission.avatar} alt={activeMission.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: 13 }}>{activeMission.name.split(':')[0]}</strong>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Telemetry Level Case Study</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, display: 'grid', gap: 6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>LTV Valuation:</span>
                        <strong>₹{activeMission.clv.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Target Retention:</span>
                        <strong style={{ color: '#72f1b8' }}>{activeMission.targetSentiment}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="card glass-card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Simulation metrics</span>
                    
                    <div style={{ display: 'grid', gap: 14 }}>
                      {/* Budget tracker */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={10} /> Remaining Budget:</span>
                          <strong style={{ color: remainingBudget <= activeMission.budget * 0.2 ? '#ff6b6b' : '#ffb84d' }}>
                            ₹{remainingBudget.toLocaleString()}
                          </strong>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                          <div 
                            style={{ 
                              width: `${(remainingBudget / activeMission.budget) * 100}%`, 
                              height: '100%', 
                              background: remainingBudget <= activeMission.budget * 0.2 ? 'var(--danger)' : 'linear-gradient(90deg, #ffb84d, #72f1b8)',
                              borderRadius: 99,
                              transition: 'width 0.4s ease'
                            }} 
                          />
                        </div>
                      </div>

                      {/* Sentiment Dial */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={10} /> Client Sentiment:</span>
                          <strong style={{ color: sentiment >= activeMission.targetSentiment ? '#72f1b8' : '#ff6b6b' }}>
                            {sentiment}%
                          </strong>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                          <div 
                            style={{ 
                              width: `${sentiment}%`, 
                              height: '100%', 
                              background: sentiment >= activeMission.targetSentiment ? 'var(--accent)' : 'var(--danger)',
                              borderRadius: 99,
                              transition: 'width 0.4s ease'
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center interactive dialogue feeds */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Chat timeline logs */}
                  <div className="card glass-card" style={{ padding: 20, minHeight: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginBottom: 6 }}>
                      <span>CASE CONVERSATION TIMELINE</span>
                      <span>TURN {currentTurnIdx + 1} / {activeMission.turns.length}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {chatLogs.map((l, idx) => (
                        <div 
                          key={idx}
                          style={{
                            alignSelf: l.sender === 'agent' ? 'flex-end' : 'flex-start',
                            maxWidth: '90%',
                            padding: '12px 16px',
                            borderRadius: 14,
                            fontSize: 12,
                            lineHeight: 1.4,
                            background: l.sender === 'agent' ? 'rgba(0, 240, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                            border: l.sender === 'agent' ? '1px solid rgba(0, 240, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.04)',
                            color: '#fff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted)', marginBottom: 4, fontWeight: 'bold' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {l.sender === 'agent' ? <ShieldCheck size={10} color="#00f0ff" /> : <User size={10} />}
                              {l.sender === 'agent' ? 'TACTIC CHOSEN' : 'CLIENT'}
                            </span>
                            {l.label && <span style={{ color: '#00f0ff' }}>{l.label}</span>}
                          </div>
                          <p style={{ margin: 0 }}>{l.text}</p>
                        </div>
                      ))}
                    </div>

                    {gameOver && (
                      <div 
                        style={{ 
                          alignSelf: 'center', 
                          background: gameResult === 'win' ? 'rgba(114, 241, 184, 0.08)' : 'rgba(255, 107, 107, 0.08)', 
                          border: gameResult === 'win' ? '1px solid rgba(114, 241, 184, 0.25)' : '1px solid rgba(255, 107, 107, 0.25)',
                          padding: '24px',
                          borderRadius: 16,
                          textAlign: 'center',
                          marginTop: 20,
                          width: '100%',
                          maxWidth: 420
                        }}
                      >
                        {gameResult === 'win' ? (
                          <>
                            <Trophy size={42} color="#72f1b8" style={{ margin: '0 auto 10px', display: 'block', filter: 'drop-shadow(0 0 10px #72f1b8)' }} />
                            <h2 style={{ color: '#72f1b8', fontSize: 18, margin: '0 0 4px' }}>MISSION SUCCESS</h2>
                            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 14px' }}>Excellent client crisis handling and objection resolutions.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11, background: 'rgba(0,0,0,0.1)', padding: 10, borderRadius: 8, marginBottom: 14 }}>
                              <div>
                                <span style={{ color: 'var(--muted)', display: 'block' }}>Score:</span>
                                <strong style={{ fontSize: 14, color: '#00f0ff' }}>{points} pts</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--muted)', display: 'block' }}>Award:</span>
                                <strong style={{ fontSize: 11, color: '#ffb84d' }}>Retention Pro</strong>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={42} color="#ff6b6b" style={{ margin: '0 auto 10px', display: 'block', filter: 'drop-shadow(0 0 10px #ff6b6b)' }} />
                            <h2 style={{ color: '#ff6b6b', fontSize: 18, margin: '0 0 4px' }}>MISSION FAILED</h2>
                            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 14px' }}>The customer churned. Address all objection criteria and balance remaining budgets.</p>
                          </>
                        )}
                        <button 
                          type="button" 
                          className="btn" 
                          onClick={() => selectMission(activeMission)}
                          style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}
                        >
                          Retry Mission
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dialogue Selection Deck */}
                  {!gameOver && currentTurn && (
                    <div className="card glass-card" style={{ padding: 20 }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Choose Response Tactic</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {currentTurn.options.map((opt, i) => (
                          <button 
                            key={i}
                            type="button"
                            className="btn ghost-btn"
                            onClick={() => handleSelectOption(opt)}
                            style={{ 
                              textAlign: 'left',
                              padding: '12px 14px',
                              height: 'auto',
                              minHeight: '75px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              gap: 4,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 12
                            }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 'bold', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ChevronRight size={12} /> {opt.label}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                              "{opt.text}"
                            </span>
                            {opt.budgetCost > 0 && (
                              <span style={{ fontSize: 9, color: '#ffb84d', marginTop: 2 }}>Cost: ₹{opt.budgetCost}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column details panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Objections criteria list */}
                  <div className="card glass-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Activity size={14} color="#00f0ff" className="icon-activity" />
                      <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Crisis Objections</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeMission.objections.map((o, idx) => {
                        const resolved = resolvedObjections.includes(o);
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                            <span style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: resolved ? '#72f1b8' : '#ffb84d',
                              boxShadow: resolved ? '0 0 6px #72f1b8' : 'none'
                            }} />
                            <span style={{ color: resolved ? '#fff' : 'var(--muted)', textDecoration: resolved ? 'line-through' : 'none' }}>
                              {o}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Coaching Tips & Evaluation */}
                  <div className="card glass-card" style={{ padding: 18, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <HelpCircle size={14} color="#ffb84d" />
                      <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Coach Evaluation</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                      {coachFeedback}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </>
        ) : (
          /* TAB 2: A/B SCRIPT TESTING BATCH SIMULATOR */
          <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: 24, marginTop: 4, alignItems: 'start' }}>
            
            {/* Input Config & Matrix logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Script Inputs configurator */}
              <div className="card glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><Split size={16} color="#00f0ff" /> A/B Template Editor</h3>
                  
                  {/* Scenario selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Context Profile:</span>
                    <select 
                      value={abScenario} 
                      onChange={e => {
                        setAbScenario(e.target.value);
                        if (e.target.value === 'sarah') {
                          setScriptA("I apologize for the billing checkout failure. I have submitted an immediate bank refund of ₹1,000 for the double charge and escalated the gateway bug to priority fix.");
                          setScriptB("I am sorry for the hassle. To compensate, I can generate a 30% discount coupon code (XENO30) to reduce your next billing payment cycles.");
                        } else {
                          setScriptA("While ChurnGuard base plan pricing is slightly lower, they do not include real-time ML risk predictions and journey branching. I can waive your next monthly service fee.");
                          setScriptB("I can offer you a 20% discount coupon code (XENO20) on your current subscription plan to match their pricing lines.");
                        }
                      }}
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }}
                    >
                      <option value="sarah">Sarah (Billing Dispute)</option>
                      <option value="david">David (Competitor Threat)</option>
                    </select>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#00f0ff', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Script A Template (Empathy Focus)</label>
                    <textarea 
                      className="field" 
                      rows={4}
                      value={scriptA}
                      onChange={e => setScriptA(e.target.value)}
                      style={{ width: '100%', resize: 'none', fontSize: 11, background: 'rgba(0,240,255,0.02)' }}
                      placeholder="Type response Script A..."
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#ffb84d', fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Script B Template (Discount Focus)</label>
                    <textarea 
                      className="field" 
                      rows={4}
                      value={scriptB}
                      onChange={e => setScriptB(e.target.value)}
                      style={{ width: '100%', resize: 'none', fontSize: 11, background: 'rgba(255,184,77,0.02)' }}
                      placeholder="Type response Script B..."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Cohort Test Size:</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[25, 50, 100].map(s => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => setCohortSize(s)}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: 10, 
                            borderRadius: 6,
                            background: cohortSize === s ? '#00f0ff' : 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: cohortSize === s ? '#04111b' : '#fff',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {s} accounts
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    disabled={abRunning || !scriptA.trim() || !scriptB.trim()}
                    onClick={handleRunAbTest}
                    style={{ background: 'linear-gradient(135deg, #00f0ff, #72f1b8)', color: '#04111b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px' }}
                  >
                    <Play size={12} fill="#04111b" /> Run A/B Simulation
                  </button>
                </div>
              </div>

              {/* Simulation Progress & Virtual Matrix Monitor */}
              {abRunning && (
                <div className="card glass-card" style={{ padding: 22, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Simulating Parallel Cohort Trials</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 450, margin: '0 auto 16px' }}>
                    {Array.from({ length: 40 }).map((_, idx) => {
                      const isActive = (idx / 40) * 100 < abProgress;
                      const isSuccess = idx % 3 !== 0;
                      return (
                        <div 
                          key={idx}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: !isActive ? 'rgba(255,255,255,0.05)' : isSuccess ? '#72f1b8' : '#ff6b6b',
                            boxShadow: isActive ? `0 0 6px ${isSuccess ? '#72f1b8' : '#ff6b6b'}` : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 9, width: '100%', overflow: 'hidden' }}>
                    <div style={{ width: `${abProgress}%`, height: '100%', background: 'linear-gradient(90deg, #00f0ff, #72f1b8)', borderRadius: 9, transition: 'width 0.1s ease' }} />
                  </div>
                </div>
              )}

              {/* Simulation Result scorecard comparison */}
              {abResults && !abRunning && (
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Script A card */}
                  <div className="card glass-card" style={{ padding: 20, borderLeft: '4px solid #00f0ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#00f0ff', fontWeight: 'bold' }}>SCRIPT A (EMPATHY)</span>
                      <span style={{ fontSize: 10, background: 'rgba(114,241,184,0.1)', color: '#72f1b8', padding: '2px 6px', borderRadius: 4 }}>
                        {abResults.scriptA.retentionRate >= abResults.scriptB.retentionRate ? 'Winner' : 'Runner-up'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>Saved:</span>
                        <strong style={{ fontSize: 16, color: '#fff' }}>{abResults.scriptA.saved} / {cohortSize}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>Retention Rate:</span>
                        <strong style={{ fontSize: 16, color: '#72f1b8' }}>{abResults.scriptA.retentionRate}%</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'grid', gap: 4, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Avg Customer Sentiment:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{abResults.scriptA.avgSentiment}/100</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Simulated Budget Cost:</span>
                        <span style={{ color: '#ffb84d', fontWeight: 'bold' }}>₹{abResults.scriptA.spent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Script B card */}
                  <div className="card glass-card" style={{ padding: 20, borderLeft: '4px solid #ffb84d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#ffb84d', fontWeight: 'bold' }}>SCRIPT B (DISCOUNT)</span>
                      <span style={{ fontSize: 10, background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', padding: '2px 6px', borderRadius: 4 }}>
                        {abResults.scriptB.retentionRate > abResults.scriptA.retentionRate ? 'Winner' : 'Runner-up'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>Saved:</span>
                        <strong style={{ fontSize: 16, color: '#fff' }}>{abResults.scriptB.saved} / {cohortSize}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>Retention Rate:</span>
                        <strong style={{ fontSize: 16, color: '#72f1b8' }}>{abResults.scriptB.retentionRate}%</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'grid', gap: 4, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Avg Customer Sentiment:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{abResults.scriptB.avgSentiment}/100</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Simulated Budget Cost:</span>
                        <span style={{ color: '#ffb84d', fontWeight: 'bold' }}>₹{abResults.scriptB.spent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Visual Charts & AI Coach Audits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Graphic Comparison Chart */}
              <div className="card glass-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BarChart2 size={16} color="#00f0ff" />
                  <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Visual Conversion Comparison</span>
                </div>
                {abResults ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                        <span>Script A Conversion</span>
                        <strong>{abResults.scriptA.retentionRate}%</strong>
                      </div>
                      <div style={{ height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${abResults.scriptA.retentionRate}%`, height: '100%', background: '#00f0ff', borderRadius: 4 }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                        <span>Script B Conversion</span>
                        <strong>{abResults.scriptB.retentionRate}%</strong>
                      </div>
                      <div style={{ height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${abResults.scriptB.retentionRate}%`, height: '100%', background: '#ffb84d', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, padding: '20px 0' }}>
                    Run the simulation test above to load comparisons.
                  </div>
                )}
              </div>

              {/* AI Audit Report Markdown console */}
              <div className="card glass-card" style={{ padding: 18, background: 'rgba(4,10,20,0.5)', minHeight: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                  <ShieldCheck size={14} color="#72f1b8" />
                  <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>AI Audit Report Console</span>
                </div>
                
                {abAudit ? (
                  <div 
                    className="audit-console-markdown"
                    style={{ 
                      fontSize: 11, 
                      lineHeight: 1.5, 
                      maxHeight: 280, 
                      overflowY: 'auto', 
                      color: 'var(--text-muted)' 
                    }}
                  >
                    {/* Render simple markdown conversion or formatting */}
                    {abAudit.split('\n').map((line, i) => {
                      if (line.startsWith('####')) return <h5 key={i} style={{ color: '#00f0ff', margin: '8px 0 4px', fontSize: 11 }}>{line.replace('####', '').trim()}</h5>;
                      if (line.startsWith('###')) return <h4 key={i} style={{ color: '#fff', margin: '12px 0 6px', fontSize: 12 }}>{line.replace('###', '').trim()}</h4>;
                      if (line.startsWith('*')) return <p key={i} style={{ margin: '2px 0', paddingLeft: 8 }}>• {line.replace('*', '')}</p>;
                      if (line.includes('**')) {
                        // Bold parsing
                        const parts = line.split('**');
                        return (
                          <p key={i} style={{ margin: '6px 0' }}>
                            {parts[0]}<strong>{parts[1]}</strong>{parts[2]}
                          </p>
                        );
                      }
                      return <p key={i} style={{ margin: '6px 0' }}>{line}</p>;
                    })}
                  </div>
                ) : abRunning ? (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, padding: '30px 10px' }}>
                    Compiling audit feedback from Gemini...
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, padding: '30px 10px' }}>
                    Awaiting script input A/B configurations.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
