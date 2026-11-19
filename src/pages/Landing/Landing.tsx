import { useNavigate } from 'react-router-dom'
import { FaCalendarCheck, FaUserClock, FaTachometerAlt, FaClock } from "react-icons/fa";
import { useServices } from '../../contexts/ServicesContext'
import './Landing.css'

const STEPS = [
  { title: 'Create an account', desc: 'Sign up with your name and email. It takes less than a minute.' },
  { title: 'Book a service', desc: 'Choose a service, pick an available date and time slot, and confirm.' },
  { title: 'Track your queue', desc: 'Get your queue number and watch your place in line update live.' },
]

const FAQS = [
  {
    q: 'Do I need an account to book?',
    a: 'Yes. An account lets us assign your queue number and lets you track and manage your appointments.',
  },
  {
    q: 'How is my queue number assigned?',
    a: 'Numbers are given in the order bookings are made for each time slot. The first person to book a slot is #1.',
  },
  {
    q: 'How do I know when it is my turn?',
    a: 'Open My Queue. It shows who is being served now, how many people are ahead of you, and an estimated wait. It updates automatically and alerts you when it is your turn.',
  },
  {
    q: 'Can I cancel an appointment?',
    a: 'Yes. Pending or confirmed appointments can be cancelled from My Queue. Your seat is released so someone else can book it.',
  },
]

function Landing() {
  const navigate = useNavigate()
  const { getActiveServices, loading } = useServices()
  const services = getActiveServices()

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-content">
          <h1 className="logo">AQMS</h1>
          <div className="header-buttons">
            <button className="login-button" onClick={() => navigate('/login')}>Login</button>
            <button className="signup-button" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-left">
          <div className="hero-text-content">
            <h2 className="hero-title">Appointment Queue Management System</h2>
            <p className="hero-description">Say goodbye to long waiting times and manual booking hassles.</p>
            <p className="hero-description">Manage patient flow efficiently — from online booking to real-time queue tracking.</p>
            <button className="hero-cta" onClick={() => navigate('/signup')}>Get Started</button>
          </div>
        </div>
        <div className="hero-right">
          <div className="envelope-icon">
            <img src="/AQMS.logo.png" alt="AQMS Logo" />
          </div>
        </div>
      </section>

      <section className="landing-features stagger">
        <div className="feature-card">
          <div className="feature-icon blue"><FaCalendarCheck size={28} /></div>
          <h3 className="feature-title">Easy Scheduling</h3>
          <p className="feature-desc">Book appointments online in just a few clicks. Choose your preferred service and time slot instantly.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon green"><FaUserClock size={28} /></div>
          <h3 className="feature-title">Real-Time Queue</h3>
          <p className="feature-desc">Track your position in the queue live. Get notified when it's your turn — no more waiting around.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon purple"><FaTachometerAlt size={28} /></div>
          <h3 className="feature-title">Admin Dashboard</h3>
          <p className="feature-desc">Powerful tools for administrators to manage services, time slots, appointments, and generate reports.</p>
        </div>
      </section>

      <section className="landing-section how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Three simple steps from booking to being served</p>
        <ol className="steps-grid stagger">
          {STEPS.map((step, i) => (
            <li key={step.title} className="step-card">
              <span className="step-number">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section services-preview">
        <h2 className="section-title">Available Services</h2>
        <p className="section-subtitle">Services you can book right now</p>
        {loading ? (
          <div className="services-preview-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
          </div>
        ) : services.length === 0 ? (
          <p className="section-subtitle">No services are available at the moment. Please check back later.</p>
        ) : (
          <div className="services-preview-grid stagger">
            {services.map(service => (
              <div key={service.id} className="service-preview-card">
                <h3>{service.name}</h3>
                {service.description && <p>{service.description}</p>}
                <span className="service-duration"><FaClock /> {service.duration} min</span>
              </div>
            ))}
          </div>
        )}
        <button className="hero-cta centered" onClick={() => navigate('/signup')}>Book an Appointment</button>
      </section>

      <section className="landing-section faq">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {FAQS.map(item => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span className="logo">AQMS</span>
        <span>Appointment Queue Management System © {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}

export default Landing
