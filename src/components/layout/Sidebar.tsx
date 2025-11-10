import React from 'react';
const Sidebar: React.FC = () => {
  return (
    <nav>
      <h2>SweatSmart</h2>
      <ul>
        <li>
          <a href="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</a>
        </li>
        <li>
          <a href="/log-episode"><i className="fas fa-plus-circle"></i> Log Episode</a>
        </li>
        <li>
          <a href="/history"><i className="fas fa-history"></i> History</a>
        </li>
        <li>
          <a href="/insights"><i className="fas fa-chart-pie"></i> Insights</a>
        </li>
        <li>
          <a href="/palm-scanner"><i className="fas fa-fingerprint"></i> Palm Scanner</a>
        </li>
        <li>
          <a href="/climate-alert"><i className="fas fa-cloud-sun-rain"></i> Climate Alert</a>
        </li>
        <li>
          <a href="/community"><i className="fas fa-users"></i> Community</a>
        </li>
        <li>
          <a href="/feedback"><i className="fas fa-comment-dots"></i> Feedback</a>
        </li>
        <li>
          <a href="/settings"><i className="fas fa-cog"></i> Settings</a>
        </li>
      </ul>
    </nav>
  );
};
export default Sidebar;