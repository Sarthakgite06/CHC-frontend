import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

// Basic Health: 10, Disease: 5, Habit: 10
const QUESTIONS = [
  // Basic Health
  { id: 'b1', type: 'number', category: 'Basic', question: 'What is your height (in cm)?', key: 'height' },
  { id: 'b2', type: 'number', category: 'Basic', question: 'What is your weight (in kg)?', key: 'weight' },
  { id: 'b3', type: 'mcq', category: 'Basic', question: 'How would you describe your daily activity level?', options: ['Sedentary (Little to no exercise)', 'Lightly active', 'Moderately active', 'Very active'] },
  { id: 'b4', type: 'mcq', category: 'Basic', question: 'Do you consume alcohol?', options: ['Never', 'Rarely', 'Occasionally', 'Regularly'] },
  { id: 'b5', type: 'mcq', category: 'Basic', question: 'Do you smoke or use tobacco products?', options: ['Never', 'Used to, but quit', 'Occasionally', 'Daily'] },
  { id: 'b6', type: 'mcq', category: 'Basic', question: 'How much water do you drink daily?', options: ['Less than 1 liter', '1 - 2 liters', '2 - 3 liters', 'More than 3 liters'] },
  { id: 'b7', type: 'mcq', category: 'Basic', question: 'How often do you consume fast food or processed meals?', options: ['Never', '1-2 times a week', '3-4 times a week', 'Daily'] },
  { id: 'b8', type: 'mcq', category: 'Basic', question: 'How often do you experience high stress?', options: ['Rarely', 'Sometimes', 'Often', 'Constantly'] },
  { id: 'b9', type: 'mcq', category: 'Basic', question: 'Do you have regular medical check-ups?', options: ['Yes, annually', 'Every few years', 'Only when sick', 'Never'] },
  { id: 'b10', type: 'mcq', category: 'Basic', question: 'How would you rate your overall energy levels during the day?', options: ['High and consistent', 'Average, occasional dips', 'Often tired', 'Exhausted constantly'] },
  
  // Disease/Symptoms
  { id: 'd1', type: 'mcq', category: 'Disease', question: 'Do you have any known chronic conditions (e.g., Diabetes, Hypertension)?', options: ['None', 'One condition', 'Multiple conditions'] },
  { id: 'd2', type: 'mcq', category: 'Disease', question: 'How often do you experience unexplained headaches or dizziness?', options: ['Never', 'Rarely', 'Frequently', 'Constantly'] },
  { id: 'd3', type: 'mcq', category: 'Disease', question: 'Do you experience shortness of breath after mild exertion?', options: ['No', 'Rarely', 'Sometimes', 'Yes, frequently'] },
  { id: 'd4', type: 'mcq', category: 'Disease', question: 'Have you noticed any prolonged digestive issues (acid reflux, severe bloating)?', options: ['No', 'Rarely', 'Sometimes', 'Yes, frequently'] },
  { id: 'd5', type: 'mcq', category: 'Disease', question: 'Do you experience chronic joint or muscle pain?', options: ['No', 'Mild, occasionally', 'Moderate, often', 'Severe, constant'] },

  // Habits
  { id: 'h1', type: 'mcq', category: 'Habits', question: 'How many times do you brush your teeth a day?', options: ['Never', '1 time', '2 times', '3 or more times'] },
  { id: 'h2', type: 'mcq', category: 'Habits', question: 'What is your average sleep duration?', options: ['Less than 5 hours', '5 - 7 hours', '7 - 9 hours', 'More than 9 hours'] },
  { id: 'h3', type: 'mcq', category: 'Habits', question: 'Do you use screens (phone, PC) right before sleeping?', options: ['Never', 'Rarely', 'Often', 'Always'] },
  { id: 'h4', type: 'mcq', category: 'Habits', question: 'Do you stretch or do mobility exercises daily?', options: ['Yes, daily', 'A few times a week', 'Rarely', 'Never'] },
  { id: 'h5', type: 'mcq', category: 'Habits', question: 'How often do you consume sugary drinks (soda, energy drinks)?', options: ['Never', 'Rarely', 'A few times a week', 'Daily'] },
  { id: 'h6', type: 'mcq', category: 'Habits', question: 'Do you actively manage your posture while sitting?', options: ['Always', 'Usually', 'Rarely', 'Never'] },
  { id: 'h7', type: 'mcq', category: 'Habits', question: 'Do you take any daily vitamin supplements?', options: ['Yes, regularly', 'Sometimes', 'Rarely', 'No'] },
  { id: 'h8', type: 'mcq', category: 'Habits', question: 'How often do you practice mindfulness, meditation, or deep breathing?', options: ['Daily', 'Weekly', 'Rarely', 'Never'] },
  { id: 'h9', type: 'mcq', category: 'Habits', question: 'Do you wear sunscreen when outdoors?', options: ['Always', 'Usually', 'Rarely', 'Never'] },
  { id: 'h10', type: 'mcq', category: 'Habits', question: 'How often do you read or engage in brain-stimulating activities?', options: ['Daily', 'A few times a week', 'Rarely', 'Never'] }
];

export default function HealthcareTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (user?.userName) {
      const savedState = localStorage.getItem(`chc_health_test_${user.userName}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.completed) {
          setCompleted(true);
          setResults(parsed.results);
        } else {
          setAnswers(parsed.answers || {});
          setCurrentIndex(parsed.currentIndex || 0);
        }
      }
    }
  }, [user]);

  const saveProgress = (newAnswers, newIndex) => {
    if (!user?.userName) return;
    localStorage.setItem(`chc_health_test_${user.userName}`, JSON.stringify({
      answers: newAnswers,
      currentIndex: newIndex,
      completed: false
    }));
  };

  const handleAnswer = (value) => {
    const question = QUESTIONS[currentIndex];
    const newAnswers = { ...answers, [question.id]: value };
    if (question.key) {
      newAnswers[question.key] = value;
    }
    setAnswers(newAnswers);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      saveProgress(newAnswers, currentIndex + 1);
    } else {
      finishTest(newAnswers);
    }
  };

  const finishTest = (finalAnswers) => {
    // Calculate BMI
    const h = parseFloat(finalAnswers['height']) / 100;
    const w = parseFloat(finalAnswers['weight']);
    let bmi = 0;
    let bmiStatus = 'N/A';
    if (h > 0 && w > 0) {
      bmi = (w / (h * h)).toFixed(1);
      if (bmi < 18.5) bmiStatus = 'Underweight';
      else if (bmi < 24.9) bmiStatus = 'Healthy Weight';
      else if (bmi < 29.9) bmiStatus = 'Overweight';
      else bmiStatus = 'Obese';
    }

    // Dummy scoring based on some arbitrary rules for MCQs to get overall status
    let score = 100;
    // Just an example arbitrary deduction for "bad" answers (last options usually)
    Object.values(finalAnswers).forEach(val => {
      if (val === 'Never' || val === 'Daily' || val === 'Constantly' || val === 'Always' || val === 'Severe, constant') {
        score -= 2; 
      }
    });

    let overallStatus = 'Average';
    if (score > 85) overallStatus = 'Very Good';
    else if (score > 70) overallStatus = 'Good';
    else if (score > 50) overallStatus = 'Average';
    else if (score > 30) overallStatus = 'Bad';
    else overallStatus = 'Very Bad';

    const testResults = {
      bmi,
      bmiStatus,
      score,
      overallStatus,
      bloodPressure: { sys: 120, dia: 80, status: 'Normal' }, // mock based on standard
      heartRate: { value: 72, status: 'Resting' },
      spO2: { value: 98, status: 'Optimal' },
      completedAt: new Date().toISOString()
    };

    setResults(testResults);
    setCompleted(true);
    localStorage.setItem(`chc_health_test_${user.userName}`, JSON.stringify({
      completed: true,
      results: testResults
    }));
  };

  const reapplyTest = () => {
    setAnswers({});
    setCurrentIndex(0);
    setCompleted(false);
    setResults(null);
    localStorage.removeItem(`chc_health_test_${user.userName}`);
  };

  const q = QUESTIONS[currentIndex];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <motion.div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '600px', position: 'relative', overflow: 'hidden' }}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            
            {!completed ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-primary">{q.category} Assessment</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>{currentIndex + 1} / {QUESTIONS.length}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${((currentIndex) / QUESTIONS.length) * 100}%` }} 
                      style={{ height: '100%', background: 'var(--gradient-primary)' }} 
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', lineHeight: 1.4 }}>{q.question}</h2>

                    {q.type === 'mcq' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {q.options.map((opt, i) => (
                          <button key={i} onClick={() => handleAnswer(opt)}
                            style={{ padding: '16px 20px', textAlign: 'left', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.target.style.borderColor = '#00e6d9'; e.target.style.background = '#00e6d910'; }}
                            onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.background = 'var(--bg-tertiary)'; }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="number" id={`input-${q.id}`}
                          style={{ flex: 1, padding: '16px 20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '1.1rem', outline: 'none' }}
                          placeholder="Enter value..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) handleAnswer(e.target.value);
                          }}
                        />
                        <button onClick={() => {
                          const val = document.getElementById(`input-${q.id}`).value;
                          if (val) handleAnswer(val);
                        }} className="btn btn-primary" style={{ padding: '0 24px' }}>Next</button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                {currentIndex > 0 && (
                  <button onClick={() => setCurrentIndex(currentIndex - 1)} style={{ marginTop: '24px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontWeight: 600 }}>
                    ← Previous Question
                  </button>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Assessment Complete!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your health profile has been updated successfully.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Overall Status</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{results.overallStatus}</p>
                  </div>
                  <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>BMI ({results.bmi})</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{results.bmiStatus}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ padding: '14px 28px' }}>
                    View Profile
                  </button>
                  <button onClick={reapplyTest} style={{ padding: '14px 28px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
                    Reapply Test
                  </button>
                </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
