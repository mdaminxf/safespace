import Navbar from '../../../components/Navbar';

export default function AnalystDashboard() {
  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Analyst Dashboard</h1>
        <p>Welcome, Analyst 👋</p>
        <ul className="list-disc ml-6 mt-4">
          <li>Upload research reports</li>
          <li>Sell analysis to clients</li>
          <li>Respond to investor questions</li>
        </ul>
      </div>
    </div>
  );
}
