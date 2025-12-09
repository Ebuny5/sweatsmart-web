import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Activity, BarChart3, Brain, Menu, X, Camera, Thermometer, Lightbulb, MessageSquare } from 'lucide-react';

// Dashboard Preview Component
function DashboardPreview() {
  const [selectedFrequency, setSelectedFrequency] = useState('weekly');

  const episodeData = [
    { date: 'Jul 13', count: 8, height: 100 },
    { date: 'Jul 20', count: 1, height: 12.5 },
    { date: 'Aug 10', count: 1, height: 12.5 },
    { date: 'Aug 17', count: 2, height: 25 },
    { date: 'Aug 24', count: 1, height: 12.5 },
    { date: 'Aug 31', count: 1, height: 12.5 }
  ];

  const triggers = [
    { name: 'Hot Temperature', count: 9, width: 100 },
    { name: 'Crowded Spaces', count: 8, width: 89 },
    { name: 'Bright Lights', count: 5, width: 56 }
  ];

  const bodyAreas = [
    { name: 'palms', episodes: 13, avg: 3.3, color: 'bg-blue-500' },
    { name: 'soles', episodes: 13, avg: 3.2, color: 'bg-blue-500' },
    { name: 'face', episodes: 9, avg: 3.5, color: 'bg-blue-400' }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-sky-200 rounded-lg shadow p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Trend Overview</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-600 mb-1 text-center">Episode Frequency</p>
            <div className="flex gap-1">
              <button onClick={() => setSelectedFrequency('weekly')} className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${selectedFrequency === 'weekly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Weekly</button>
              <button onClick={() => setSelectedFrequency('monthly')} className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${selectedFrequency === 'monthly' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>Monthly</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1 text-center">Severity Trends</p>
            <div className="flex gap-1">
              <button className="flex-1 px-2 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Weekly</button>
              <button className="flex-1 px-2 py-1.5 rounded text-xs font-medium bg-gray-800 text-white">Monthly</button>
            </div>
          </div>
        </div>
        <div className="h-40 flex items-end justify-around border-b-2 border-l-2 border-gray-300">
          {episodeData.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 mx-0.5">
              <div className="relative w-full flex items-end justify-center h-32">
                <div className="bg-blue-500 w-full rounded-t" style={{ height: `${item.height}%` }}></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">{item.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sky-200 rounded-lg shadow p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Your Top Triggers</h3>
        <div className="space-y-2">
          {triggers.map((trigger, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-24 text-xs text-gray-700 text-right font-medium">{trigger.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-6">
                <div className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${trigger.width}%` }}>
                  <span className="text-xs font-medium text-white">{trigger.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sky-200 rounded-lg shadow p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Affected Body Areas</h3>
        <div className="grid grid-cols-3 gap-2">
          {bodyAreas.map((area, idx) => (
            <div key={idx} className={`${area.color} rounded-lg p-3 text-white`}>
              <div className="font-bold text-sm capitalize">{area.name}</div>
              <div className="text-xs opacity-90 mt-1">{area.episodes} episodes</div>
              <div className="text-xs opacity-75">Avg: {area.avg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewIndex() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-sky-200">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Droplets className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">SweatSmart</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition">How It Works</a>
              <a href="#dashboard" className="text-gray-700 hover:text-blue-600 transition">Dashboard</a>
              <button onClick={handleGetStarted} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Get Started</button>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <a href="#features" className="block text-gray-700 hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-blue-600">How It Works</a>
              <a href="#dashboard" className="block text-gray-700 hover:text-blue-600">Dashboard</a>
              <button onClick={handleGetStarted} className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-sky-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <Droplets className="w-20 h-20 text-blue-600" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Take Control of Your <span className="text-blue-600">Hyperhidrosis</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI-powered tracking and insights to help you understand, manage, and overcome excessive sweating.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleGetStarted} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg">
                Start Free Trial
              </button>
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-sky-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Everything you need to manage hyperhidrosis</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <Activity className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Episode Tracking</h3>
              <p className="text-gray-600">Log sweating episodes with detailed information about triggers, severity, and affected areas.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Visual Analytics</h3>
              <p className="text-gray-600">See your patterns with beautiful charts and graphs that make understanding your condition easy.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <Brain className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Insights</h3>
              <p className="text-gray-600">Get personalized recommendations based on your unique patterns and triggers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="py-20 px-4 bg-sky-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">See Your Progress</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Track trends, identify triggers, and understand your patterns</p>
          <div className="max-w-3xl mx-auto">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* How SweatSmart Empowers You Section */}
      <section id="how-it-works" className="py-20 px-4 bg-sky-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">How SweatSmart Empowers You</h2>
          <p className="text-lg text-gray-600 text-center mb-12">Utilize cutting-edge tools designed to give you clarity and control over your condition.</p>
          
          <div className="max-w-2xl mx-auto space-y-6">
            {/* AI Palm Scanner */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-600 text-center mb-3">AI Palm Scanner</h3>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Early Detection:</span> Get objective moisture analysis for palms, hands, feet, and soles using AI vision.
              </p>
              <button onClick={() => navigate('/palm-scanner')} className="w-full mt-3 text-blue-600 font-medium hover:underline">Scan Your Palms</button>
            </div>

            {/* Detailed Episode Tracking */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Thermometer className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-600 text-center mb-3">Detailed Episode Tracking</h3>
              <p className="text-gray-700 mb-2">
                Log severity, affected body areas, and potential triggers for comprehensive data collection.
              </p>
              <button onClick={handleGetStarted} className="w-full mt-3 text-blue-600 font-medium hover:underline">Log an Episode</button>
            </div>

            {/* Personalized Insights & Recs */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-600 text-center mb-3">Personalized Insights & Recs</h3>
              <p className="text-gray-700 mb-2">
                Receive AI-driven recommendations and identify unique patterns in your hyperhidrosis.
              </p>
              <button onClick={handleGetStarted} className="w-full mt-3 text-blue-600 font-medium hover:underline">View My Insights</button>
            </div>

            {/* Supportive Community */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-600 text-center mb-3">Supportive <span className="text-purple-600">Community</span></h3>
              <p className="text-gray-700 mb-2">
                Connect with others, share experiences, and find real-time support from peers.
              </p>
              <button onClick={() => navigate('/community')} className="w-full mt-3 text-blue-600 font-medium hover:underline">Join Community</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-sky-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to take control of your hyperhidrosis?</h2>
          <p className="text-lg text-gray-700 mb-8">
            Join thousands of users who trust SweatSmart for comprehensive tracking, AI-powered insights, and a supportive community. It's time to find clarity and relief.
          </p>
          <button onClick={handleGetStarted} className="bg-purple-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition shadow-lg">
            Start Your Journey Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplets className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-bold">SweatSmart</span>
              </div>
              <p className="text-gray-400">AI-powered hyperhidrosis management for a better life.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#dashboard" className="hover:text-white transition">Dashboard</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition">Contact</button></li>
                <li><button onClick={() => navigate('/legal')} className="hover:text-white transition">Legal</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition">Terms of Service</button></li>
                <li><button onClick={() => navigate('/cookies')} className="hover:text-white transition">Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SweatSmart by Giftovate Therapeutics Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
