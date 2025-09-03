import Navbar from '../../../components/Navbar';

export default function ClientDashboard() {
  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
        <p>Welcome, Investor 👋</p>
        <ul className="list-disc ml-6 mt-4">
          <li>Browse & Hire Advisors</li>
          <li>Check SEBI IDs</li>
          <li>View Purchased Reports</li>
        </ul>
      </div>
    </div>
  );
}
